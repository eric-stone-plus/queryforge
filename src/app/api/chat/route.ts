import { NextResponse } from "next/server";
import { type AgentContextTurn, runAgent, runConversationalAnswer } from "@/lib/agent";
import { queryDb } from "@/lib/db";
import { CACHED_RESULTS } from "@/lib/demo-cache";
import { getPublicSettings, updateProviderConnectionStatus } from "@/lib/local-settings";

type CachedResult = {
  sql: string;
  thinking: string;
  intent: string;
  chartConfig: object;
  explanation: string;
};

function cleanContext(value: unknown): AgentContextTurn[] {
  if (!Array.isArray(value)) return [];

  return value.slice(-4).flatMap((turn) => {
    if (!turn || typeof turn !== "object") return [];
    const record = turn as Record<string, unknown>;
    if (typeof record.question !== "string" || !record.question.trim()) return [];

    return [{
      question: record.question.slice(0, 500),
      intent: typeof record.intent === "string" ? record.intent.slice(0, 240) : undefined,
      sql: typeof record.sql === "string" ? record.sql.slice(0, 1200) : undefined,
      chartTitle: typeof record.chartTitle === "string" ? record.chartTitle.slice(0, 180) : undefined,
      dataSample: Array.isArray(record.dataSample)
        ? record.dataSample.slice(0, 8).flatMap((row) => (row && typeof row === "object" ? [row as Record<string, unknown>] : []))
        : undefined,
      explanation: typeof record.explanation === "string" ? record.explanation.slice(0, 700) : undefined,
    }];
  });
}

function cachedResultFor(message: string) {
  const cached = CACHED_RESULTS[message] as CachedResult | undefined;
  if (!cached) return null;

  try {
    return { ...cached, data: queryDb(cached.sql), _cached: true };
  } catch {
    return { ...cached, data: [], _cached: true };
  }
}

function userFacingError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("timeout") || lower.includes("aborted")) {
    return "这次分析耗时偏长，请稍后重试，或把问题拆成更具体的地区、品类、渠道再问。";
  }
  if (lower.includes("budget") || lower.includes("token budget")) {
    return "本月 token 预算已触顶。可以在 Settings 里提高预算或重置本地用量。";
  }
  if (
    lower.includes("json") ||
    lower.includes("model response") ||
    lower.includes("unexpected") ||
    lower.includes("parse")
  ) {
    return "这次模型输出没有稳定形成可执行分析。请直接接着追问，我会保留上下文重新组织查询和解释。";
  }
  if (lower.includes("ai provider") || lower.includes("api key") || lower.includes("401") || lower.includes("403")) {
    return "模型服务还没有可用配置。请打开 Settings，检查 API URL、key/token 和 model；凭证只保存在本机。";
  }

  return "这次分析没有成功。请换个角度追问，或指定要拆解的地区、品类、渠道。";
}

function compactProviderError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  return raw
    .replace(/sk-[A-Za-z0-9_-]+/g, "sk-***")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer ***")
    .slice(0, 240);
}

function fallbackAnswer(message: string, context: AgentContextTurn[], mode: "web-demo" | "desktop", reason?: string) {
  const lower = message.toLowerCase();
  const prior = context.at(-1);
  const priorText = `${prior?.question ?? ""} ${prior?.chartTitle ?? ""} ${prior?.explanation ?? ""}`.toLowerCase();
  const text = `${lower} ${priorText}`;

  const desktopPrefix = reason
    ? "模型服务这次没有跑通，我先用本地 Olist 案例和当前上下文给出可执行分析。"
    : "当前还没有连接模型服务，我先用本地 Olist 案例和当前上下文给出可执行分析。";
  const webPrefix = "这个扫码页面是公开演示环境，我先基于 Olist 案例和当前上下文给出稳定解读。";
  const prefix = mode === "desktop" ? desktopPrefix : webPrefix;

  let explanation = `${prefix}QueryForge 的核心不是替代模型，而是把模型服务、schema、只读 SQL、查询结果和 token 预算放进一个可控的经营分析工作台。配置 API URL 和 key/token 后，本地桌面端会继续做实时查数和连续追问。`;

  if (/家具|家居|furniture|bed_bath|housewares/.test(text)) {
    explanation = `${prefix}家具/家居可以看成一个关联品类簇：furniture_decor 与 bed_bath_table 的复购跨品类路径最强，说明用户完成一次家居布置后，后续容易继续购买床品、收纳和家用品。业务上更适合做组合推荐、场景包和复购触达，而不是只看单品销量。`;
  } else if (/地区|region|sudeste|nordeste|sul|centro|norte/.test(text)) {
    explanation = `${prefix}地区分析要分开看规模和价值：Sudeste 是订单与营收规模核心，Nordeste 的客单价更高但订单量较小。运营动作不应一刀切，Sudeste 更适合做转化和复购效率，Nordeste 更适合测试高价值品类、免邮门槛和组合包。`;
  } else if (/渠道|支付|channel|boleto|cart/.test(text)) {
    explanation = `${prefix}渠道表现不能只看订单量，还要同时看客单价、完成率和付款周期。Olist 案例里信用卡是主渠道，Boleto 规模也不小，但运营重点不同：信用卡适合优化高价值品类转化，Boleto 更适合到账提醒和付款激励。`;
  } else if (/roi|成本|token|预算|价格|值不值/.test(text)) {
    explanation = `${prefix}QueryForge 的 ROI 不靠替代模型本身，而是把商业分析流程变成可控的本地 harness：减少反复取数和解释口径的人力时间，把每次模型调用纳入 token plan，并把有效查询沉淀成可复用指标。个人用户或小团队可以用自己的模型服务 key，本地衡量 token 成本与节省工时。`;
  } else if (/是什么|意义|为什么不用|直接问/.test(text)) {
    explanation = `${prefix}直接问模型的问题在于：模型默认没有数据库执行权、没有统一指标口径，也不会自动保留 SQL 审计和 token 预算。QueryForge 的价值是把模型服务放进受控分析运行层：看 schema、生成 SELECT、执行查询、用结果回填解释，并把凭证和预算留在本地。`;
  }

  return {
    thinking: "",
    intent: mode === "desktop" ? "本地样例兜底分析" : "公开扫码演示追问",
    explanation,
    conversational: true,
    _cached: true,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { message?: unknown; context?: unknown };
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const context = cleanContext(body.context);
    const settings = getPublicSettings();

    if (!message) {
      return NextResponse.json({ error: "Request body must include a non-empty message" }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function send(data: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        }

        try {
          const cached = !context.length ? cachedResultFor(message) : null;
          if (cached) {
            send({ type: "progress", step: "executing", message: "正在加载预设分析..." });
            send({ type: "result", ...cached });
            controller.close();
            return;
          }

          if (settings.mode === "web-demo") {
            throw new Error("web demo uses cached answers");
          }
          if (settings.mode === "desktop" && !settings.provider.configured) {
            send({ type: "result", ...fallbackAnswer(message, context, "desktop") });
            controller.close();
            return;
          }

          const result = await runAgent(message, context, (progress) => {
            send({ type: "progress", ...progress });
          });
          if (settings.mode === "desktop") {
            updateProviderConnectionStatus("ok", `连接可用：${settings.provider.model}`);
          }
          send({ type: "result", ...result });
        } catch (apiError) {
          const cached = !context.length ? cachedResultFor(message) : null;
          if (cached) {
            send({ type: "result", ...cached });
          } else {
            if (settings.mode === "web-demo") {
              send({ type: "result", ...fallbackAnswer(message, context, "web-demo") });
              controller.close();
              return;
            }

            if (settings.mode === "desktop" && !settings.provider.configured) {
              send({ type: "result", ...fallbackAnswer(message, context, "desktop", userFacingError(apiError)) });
              controller.close();
              return;
            }

            try {
              const answer = await runConversationalAnswer(message, context, (progress) => {
                send({ type: "progress", ...progress });
              });
              if (settings.mode === "desktop") {
                updateProviderConnectionStatus("ok", `连接可用：${settings.provider.model}`);
              }
              send({ type: "result", ...answer });
            } catch (fallbackError) {
              if (settings.mode === "desktop" && settings.provider.ready) {
                const lower = compactProviderError(fallbackError).toLowerCase();
                if (!lower.includes("budget") && !lower.includes("token budget")) {
                  updateProviderConnectionStatus("error", compactProviderError(fallbackError));
                }
              }
              send({ type: "result", ...fallbackAnswer(message, context, settings.mode, userFacingError(fallbackError)) });
            }
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: userFacingError(error) }, { status: 500 });
  }
}

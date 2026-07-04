import { NextResponse } from "next/server";
import { type AgentContextTurn, runAgent, runConversationalAnswer } from "@/lib/agent";
import { queryDb } from "@/lib/db";
import { CACHED_RESULTS } from "@/lib/demo-cache";
import { getPublicSettings } from "@/lib/local-settings";

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

function userFacingError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("timeout") || lower.includes("aborted")) {
    return "这次分析耗时偏长，请稍后重试，或把问题拆成更具体的地区、品类、渠道再问。";
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
    return "模型供应商还没有可用配置。请打开 Settings，检查 endpoint、model 和 API key；凭证只保存在本机。";
  }

  return "这次分析没有成功。请换个角度追问，或指定要拆解的地区、品类、渠道。";
}

function webDemoAnswer(message: string, context: AgentContextTurn[]) {
  const lower = message.toLowerCase();
  const prior = context.at(-1);
  const priorText = `${prior?.question ?? ""} ${prior?.chartTitle ?? ""} ${prior?.explanation ?? ""}`.toLowerCase();
  const text = `${lower} ${priorText}`;

  let explanation = "这个扫码页面是公开演示环境，重点展示 QueryForge 的交互形态和 Olist 案例看板。随机追问会基于当前上下文给出稳定解读；真实模型调用、API key、本地 token plan 和完整 SQL 约束链路在桌面端运行。";

  if (/家具|家居|furniture|bed_bath|housewares/.test(text)) {
    explanation = "可以把家具/家居看成一个关联品类簇：furniture_decor 与 bed_bath_table 的复购跨品类路径最强，说明用户完成一次家居布置后，后续容易继续购买床品、收纳和家用品。业务上更适合做组合推荐、场景包和复购触达，而不是只看单品销量。公开演示页只给稳定解读，桌面端会继续调用模型查数并生成受控 SQL。";
  } else if (/地区|region|sudeste|nordeste|sul|centro|norte/.test(text)) {
    explanation = "地区分析要分开看规模和价值：Sudeste 是订单与营收规模核心，Nordeste 的客单价更高但订单量较小。运营动作不应一刀切，Sudeste 更适合做转化和复购效率，Nordeste 更适合测试高价值品类、免邮门槛和组合包。扫码页采用稳定答案；桌面端会按你的追问实时查库。";
  } else if (/渠道|支付|channel|boleto|cart/.test(text)) {
    explanation = "渠道表现不能只看订单量，还要同时看客单价、完成率和付款周期。Olist 案例里信用卡是主渠道，Boleto 规模也不小，但运营重点不同：信用卡适合优化高价值品类转化，Boleto 更适合到账提醒和付款激励。真实的渠道拆解和追问在本地桌面端由模型调用和 SQL 执行完成。";
  } else if (/roi|成本|token|预算|价格|值不值/.test(text)) {
    explanation = "QueryForge 的 ROI 不靠替代模型本身，而是把商业分析流程变成可控的本地 harness：减少反复取数和解释口径的人力时间，把每次模型调用纳入 token plan，并把有效查询沉淀成可复用指标。个人用户或小团队可以用自己的 provider key，本地衡量 token 成本与节省工时。";
  } else if (/是什么|意义|为什么不用|直接问/.test(text)) {
    explanation = "直接问模型的问题在于：模型默认没有数据库执行权、没有统一指标口径，也不会自动保留 SQL 审计和 token 预算。QueryForge 的价值是把外部模型放进受控分析运行层：它能看 schema、生成 SELECT、执行查询、用结果回填解释，并把凭证和预算留在本地。";
  }

  return {
    thinking: "",
    intent: "公开扫码演示追问",
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
          if (settings.mode === "web-demo") {
            throw new Error("web demo uses cached answers");
          }
          if (settings.mode === "desktop" && !settings.provider.configured) {
            throw new Error("AI provider is not fully configured");
          }

          const result = await runAgent(message, context, (progress) => {
            send({ type: "progress", ...progress });
          });
          send({ type: "result", ...result });
        } catch (apiError) {
          const cached = settings.mode === "web-demo" && !context.length
            ? CACHED_RESULTS[message] as { sql: string; thinking: string; intent: string; chartConfig: object; explanation: string } | undefined
            : undefined;
          if (cached) {
            try {
              const data = queryDb(cached.sql);
              send({ type: "result", ...cached, data, _cached: true });
            } catch {
              send({ type: "result", ...cached, data: [], _cached: true });
            }
          } else {
            if (settings.mode === "web-demo") {
              send({ type: "result", ...webDemoAnswer(message, context) });
              controller.close();
              return;
            }

            if (settings.mode === "desktop" && !settings.provider.configured) {
              send({ type: "error", error: userFacingError(apiError) });
              controller.close();
              return;
            }

            try {
              const answer = await runConversationalAnswer(message, context, (progress) => {
                send({ type: "progress", ...progress });
              });
              send({ type: "result", ...answer });
            } catch {
              send({ type: "error", error: userFacingError(apiError) });
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

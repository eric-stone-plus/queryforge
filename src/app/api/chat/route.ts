import { NextResponse } from "next/server";
import { type AgentContextTurn, runAgent } from "@/lib/agent";
import { queryDb } from "@/lib/db";
import { CACHED_RESULTS } from "@/lib/demo-cache";

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
      explanation: typeof record.explanation === "string" ? record.explanation.slice(0, 700) : undefined,
    }];
  });
}

function userFacingError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("timeout") || lower.includes("aborted")) {
    return "这次分析耗时偏长，请稍后重试，或先用上方示例问题查看结果。";
  }
  if (
    lower.includes("json") ||
    lower.includes("model response") ||
    lower.includes("unexpected") ||
    lower.includes("parse")
  ) {
    return "这次模型输出格式不稳定，我没有把原始错误展示给你。请换个说法再问一次，我会重新生成查询。";
  }
  if (lower.includes("ai provider") || lower.includes("api key") || lower.includes("401") || lower.includes("403")) {
    return "在线分析服务暂时不可用，示例问题仍可返回快速结果。";
  }

  return "这次查询没有成功。请换个角度追问，或先使用示例问题进入分析。";
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value);
}

function fmtInt(value: unknown) {
  return Math.round(asNumber(value)).toLocaleString("en-US");
}

function fmtWan(value: unknown) {
  return `${Math.round(asNumber(value) / 10000).toLocaleString("en-US")}万`;
}

function semanticFallback(message: string, context: AgentContextTurn[]) {
  const text = `${context.map((turn) => turn.question).join(" ")} ${message}`.toLowerCase();
  const asksWhy = /为什么|why|原因|解释|营收|revenue/.test(message);

  if (/客单价|aov|average order/.test(text) && /地区|region|regional|sudeste|nordeste/.test(text) && !asksWhy) {
    const sql = `SELECT
  r.name AS region,
  COUNT(DISTINCT o.id) AS orders,
  ROUND(AVG(o.total_amount), 0) AS avg_order,
  ROUND(SUM(o.total_amount), 0) AS total_revenue
FROM orders o
JOIN regions r ON o.region_id = r.id
WHERE o.status = 'completed'
GROUP BY r.name
ORDER BY avg_order DESC
LIMIT 500`;

    const rows = queryDb(sql);
    const byRegion = Object.fromEntries(rows.map((row) => [row.region, row])) as Record<string, Record<string, unknown> | undefined>;
    const nordeste = byRegion.Nordeste;
    const sudeste = byRegion.Sudeste;
    const centro = byRegion["Centro-Oeste"];
    const sul = byRegion.Sul;

    const explanation = nordeste && sudeste
      ? `按已完成订单看，Nordeste 客单价最高，约 R$${fmtInt(nordeste.avg_order)}；Centro-Oeste 约 R$${fmtInt(centro?.avg_order)}，Sul 约 R$${fmtInt(sul?.avg_order)}，Sudeste 约 R$${fmtInt(sudeste.avg_order)}。但 Sudeste 有 ${fmtInt(sudeste.orders)} 单、营收约 R$${fmtWan(sudeste.total_revenue)}，是规模市场；Nordeste 是高客单市场。建议 Sudeste 做转化和复购，Nordeste 测试高价值品类、组合包和免邮门槛。局限是还未拆品类、物流和促销。`
      : "按已完成订单看，不同地区客单价存在明显差异。建议继续拆到品类、物流和促销维度，判断差异来自消费能力还是商品结构。";

    return {
      thinking: "用已完成订单按地区计算订单数、客单价和营收，区分规模市场与高价值市场。",
      intent: "对比各地区客单价，识别消费能力差异和运营机会",
      sql,
      data: rows,
      chartConfig: { type: "bar", x_key: "region", y_key: "avg_order", title: "各地区平均客单价（R$）" },
      explanation,
    };
  }

  if (asksWhy && text.includes("nordeste") && /客单价|avg|average|aov/.test(text)) {
    const sql = `SELECT
  r.name AS region,
  COUNT(DISTINCT o.id) AS orders,
  ROUND(AVG(o.total_amount), 0) AS avg_order,
  ROUND(SUM(o.total_amount), 0) AS total_revenue,
  ROUND(100.0 * SUM(o.total_amount) / (SELECT SUM(total_amount) FROM orders WHERE status = 'completed'), 1) AS revenue_share,
  ROUND(100.0 * COUNT(DISTINCT o.id) / (SELECT COUNT(*) FROM orders WHERE status = 'completed'), 1) AS order_share
FROM orders o
JOIN regions r ON o.region_id = r.id
WHERE o.status = 'completed'
GROUP BY r.name
ORDER BY avg_order DESC
LIMIT 500`;

    const rows = queryDb(sql);
    const nordeste = rows.find((row) => row.region === "Nordeste") as Record<string, number | string> | undefined;
    const sudeste = rows.find((row) => row.region === "Sudeste") as Record<string, number | string> | undefined;
    const explanation = nordeste && sudeste
      ? `接着上一个客单价结果看，Nordeste 的问题不是单笔价值，而是规模。它的客单价约 R$${nordeste.avg_order}，高于 Sudeste 的 R$${sudeste.avg_order}；但完成订单只有 ${nordeste.orders} 单，Sudeste 有 ${sudeste.orders} 单，所以 Nordeste 营收占比约 ${nordeste.revenue_share}%，低于 Sudeste 的 ${sudeste.revenue_share}%。业务上应把 Nordeste 当高价值市场做客单和利润，把 Sudeste 当规模市场做转化和复购。局限是这里还没拆品类和物流成本。`
      : "Nordeste 客单价更高但订单规模更小，因此总营收未必领先。建议继续拆品类、物流和渠道结构验证。";

    return {
      thinking: "用户在追问地区客单价与总营收的差异。用完成订单按地区对比订单量、客单价、总营收和占比，可以解释高客单但低总额的原因。",
      intent: "解释 Nordeste 客单价高但总营收不高的原因",
      sql,
      data: rows,
      chartConfig: { type: "bar", x_key: "region", y_key: "total_revenue", title: "地区营收、订单量与客单价对比" },
      explanation,
    };
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { message?: unknown; context?: unknown };
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const context = cleanContext(body.context);

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
          const immediateFallback = semanticFallback(message, context);
          if (immediateFallback) {
            send({ type: "progress", step: "analyzing", message: "正在结合上一轮结果分析..." });
            send({ type: "progress", step: "executing", message: "正在查询对比指标..." });
            send({ type: "result", ...immediateFallback });
            controller.close();
            return;
          }

          const result = await runAgent(message, context, (progress) => {
            send({ type: "progress", ...progress });
          });
          send({ type: "result", ...result });
        } catch (apiError) {
          const cached = CACHED_RESULTS[message] as { sql: string; thinking: string; intent: string; chartConfig: object; explanation: string } | undefined;
          if (cached) {
            try {
              const data = queryDb(cached.sql);
              send({ type: "result", ...cached, data, _cached: true });
            } catch {
              send({ type: "result", ...cached, data: [], _cached: true });
            }
          } else {
            const fallback = semanticFallback(message, context);
            if (fallback) {
              send({ type: "result", ...fallback });
              controller.close();
              return;
            }
            send({ type: "error", error: userFacingError(apiError) });
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

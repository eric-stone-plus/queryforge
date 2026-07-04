import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { Parser } from "node-sql-parser";
import { getDb, queryDb } from "./db";

const AI_API_KEY = process.env.KIMI_API_KEY || process.env.AI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "kimi-for-coding";
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || "60000");
const AI_TEMPERATURE = Number(process.env.AI_TEMPERATURE || "1");

const llm = createOpenAICompatible({
  name: process.env.AI_PROVIDER_NAME || "openai-compatible",
  baseURL: process.env.AI_BASE_URL || "https://api.kimi.com/coding/v1",
  apiKey: AI_API_KEY,
});

export type AgentResult = {
  thinking: string;
  intent: string;
  sql: string;
  data: Record<string, unknown>[];
  chartConfig: { type: string; x_key: string; y_key: string; title: string };
  explanation: string;
  corrected?: boolean;
  correctionNote?: string;
};

export type AgentProgress = {
  step: "analyzing" | "generating_sql" | "executing" | "correcting" | "done" | "error";
  message: string;
};

const systemPrompt = `You are QueryForge, a senior ecommerce data analyst for Brazilian marketplace data (Olist, 99K orders).

Your job is to answer the user's business question, not merely generate SQL. Be direct, conversational, and decision-oriented.

Respond with a single valid JSON object only. No markdown, no fences.

JSON fields:
{
  "thinking": "your reasoning about the business question",
  "intent": "one-sentence summary of what the user wants to know",
  "sql": "a single valid SQLite SELECT query",
  "chart_config": { "type": "bar|line|pie|area", "x_key": "column", "y_key": "column", "title": "descriptive title" },
  "explanation": "一段完整的分析报告（150-250字），包含：1)数据结论：用数字说话，给出关键指标 2)趋势/对比：与什么比较，是高是低 3)业务建议：基于数据给出1-2条可执行建议 4)数据局限性：说明任何需要注意的数据特点"
}

Rules:
- Revenue = SUM(o.total_amount) from orders table. Or SUM(oi.unit_price) from order_items.
- SELECT only. SQLite syntax.
- Time series: strftime('%Y-%m', date_column).
- Prefer ASCII column aliases.
- Product names are in English (e.g. "health_beauty", "watches_gifts").
- Region names: Sudeste, Sul, Nordeste, Centro-Oeste, Norte.
- Channel mapping: Cartão de Crédito=credit_card, Boleto=boleto, Voucher=voucher, Cartão de Débito=debit_card.
- Never invent numbers. Only discuss numbers you can derive from the schema.
- If the question is ambiguous, make a conservative assumption and state it.

Schema:
regions(id, name, country)
categories(id, name, parent_id)
products(id, name, category_id, sku, unit_cost, unit_price, created_at)
users(id, name, email, region_id, segment, registered_at)
orders(id, user_id, region_id, order_date, status, total_amount, channel)
order_items(id, order_id, product_id, quantity, unit_price, discount)

Joins: orders.user_id=users.id, orders.region_id=regions.id, order_items.order_id=orders.id, order_items.product_id=products.id, products.category_id=categories.id`;

const parser = new Parser();

function validateSelectOnly(sql: string): string {
  const ast = parser.astify(sql, { database: "sqlite" });
  const stmts = Array.isArray(ast) ? ast : [ast];
  if (stmts.length !== 1 || stmts[0].type !== "select") {
    throw new Error("Only a single SELECT statement is allowed.");
  }
  if (!sql.toUpperCase().includes("LIMIT")) {
    return sql.replace(/;?\s*$/, " LIMIT 500");
  }
  return sql;
}

function extractJson(text: string): Record<string, unknown> {
  try { return JSON.parse(text); } catch { /* continue */ }
  const start = text.indexOf("{");
  if (start === -1) throw new Error("No JSON in response");
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    if (text[i] === "}") depth--;
    if (depth === 0) {
      try { return JSON.parse(text.slice(start, i + 1)); } catch { /* next */ }
    }
  }
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("No JSON in response");
  return JSON.parse(m[0]);
}

function tryExecute(sql: string): { success: boolean; data?: Record<string, unknown>[]; error?: string } {
  try {
    const safeSql = validateSelectOnly(sql);
    const data = queryDb(safeSql);
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function runAgent(
  query: string,
  onProgress?: (p: AgentProgress) => void,
): Promise<AgentResult> {
  getDb();

  if (!AI_API_KEY) {
    throw new Error("AI API key not configured");
  }

  onProgress?.({ step: "analyzing", message: "AI 正在分析您的问题..." });

  const { text } = await generateText({
    model: llm(AI_MODEL),
    system: systemPrompt,
    prompt: query,
    temperature: AI_TEMPERATURE,
    maxOutputTokens: 2000,
    abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });

  onProgress?.({ step: "generating_sql", message: "正在解析 SQL 查询..." });

  const obj = extractJson(text);
  const sql = obj.sql as string;

  onProgress?.({ step: "executing", message: "正在执行数据库查询..." });

  const result = tryExecute(sql);

  if (result.success) {
    onProgress?.({ step: "done", message: "查询完成" });
    return {
      thinking: (obj.thinking as string) ?? "",
      intent: (obj.intent as string) ?? "",
      sql,
      data: result.data!,
      chartConfig: (obj.chart_config as AgentResult["chartConfig"]) ?? { type: "bar", x_key: "", y_key: "", title: "" },
      explanation: (obj.explanation as string) ?? "",
    };
  }

  // Self-correction loop
  onProgress?.({ step: "correcting", message: `SQL 报错，正在自动修正: ${result.error?.slice(0, 60)}...` });

  const fixPrompt = `The previous SQL query failed. Fix it and respond with the same JSON format.

Original SQL: ${sql}
Error: ${result.error}

Respond with corrected JSON only:`;

  const { text: fixText } = await generateText({
    model: llm(AI_MODEL),
    system: systemPrompt,
    prompt: fixPrompt,
    temperature: AI_TEMPERATURE,
    maxOutputTokens: 2000,
    abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });

  const fixObj = extractJson(fixText);
  const fixedSql = fixObj.sql as string;

  onProgress?.({ step: "executing", message: "正在执行修正后的查询..." });

  const fixResult = tryExecute(fixedSql);

  if (fixResult.success) {
    onProgress?.({ step: "done", message: "修正成功" });
    return {
      thinking: (fixObj.thinking as string) ?? "",
      intent: (fixObj.intent as string) ?? "",
      sql: fixedSql,
      data: fixResult.data!,
      chartConfig: (fixObj.chart_config as AgentResult["chartConfig"]) ?? { type: "bar", x_key: "", y_key: "", title: "" },
      explanation: (fixObj.explanation as string) ?? "",
      corrected: true,
      correctionNote: `SQL 已自动修正（原始错误: ${result.error?.slice(0, 80)}）`,
    };
  }

  onProgress?.({ step: "error", message: `修正失败: ${fixResult.error}` });
  throw new Error(`SQL 执行失败（已尝试修正）: ${result.error}`);
}

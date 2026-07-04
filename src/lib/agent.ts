import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { Parser } from "node-sql-parser";
import { getDb, queryDb } from "./db";

const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_BASE_URL = process.env.AI_BASE_URL || "https://example.invalid/v1";
const AI_MODEL = process.env.AI_MODEL || "configured-model";
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || "60000");
const AI_TEMPERATURE = Number(process.env.AI_TEMPERATURE || "1");

const llm = createOpenAICompatible({
  name: process.env.AI_PROVIDER_NAME || "openai-compatible",
  baseURL: AI_BASE_URL,
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

export type AgentContextTurn = {
  question: string;
  intent?: string;
  sql?: string;
  explanation?: string;
};

const systemPrompt = `You are QueryForge, a senior business analysis agent. In this demo, you are connected to the Kaggle Olist Brazilian ecommerce dataset (99K orders), so every numeric answer must come from that dataset.

Your job is to answer the user's business question, not merely generate SQL. Be direct, conversational, and decision-oriented, like a domain expert who remembers the current conversation. For broader business questions, explain the analytical frame, then use the available Olist fields as the demo evidence.

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
- If the user asks a follow-up such as "为什么", "那这个呢", "展开说", "和上一个比", use the conversation context to resolve what "this/that/it" refers to.
- For why/explain/follow-up questions, still return a SQL query. The query should retrieve diagnostic metrics needed for the explanation, such as orders, total_revenue, avg_order, revenue_share, order_share, category_mix, or channel_mix.
- Do not answer with prose only. The application must execute SQL before giving the final business explanation.
- If the question is ambiguous even after using context, make a conservative assumption and state it.

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
  if (start === -1) throw new Error("Model response did not contain a JSON object");
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    if (text[i] === "}") depth--;
    if (depth === 0) {
      try { return JSON.parse(text.slice(start, i + 1)); } catch { /* next */ }
    }
  }
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("Model response did not contain a JSON object");
  return JSON.parse(m[0]);
}

function normalizeAgentObject(obj: Record<string, unknown>): Record<string, unknown> {
  if (typeof obj.sql !== "string" || obj.sql.trim().length === 0) {
    throw new Error("Model response did not include a usable SQL query");
  }

  const chartConfig = obj.chart_config ?? obj.chartConfig;
  if (!chartConfig || typeof chartConfig !== "object") {
    obj.chart_config = { type: "bar", x_key: "", y_key: "", title: "数据分析结果" };
  }

  return obj;
}

async function parseOrRepairJson(rawText: string, originalPrompt: string): Promise<Record<string, unknown>> {
  try {
    return normalizeAgentObject(extractJson(rawText));
  } catch {
    const repairPrompt = `Convert the assistant output below into one valid JSON object that matches the required QueryForge schema.

Rules:
- Return JSON only. No markdown, no comments, no code fences.
- Preserve the original SQL and business meaning when possible.
- If the SQL is missing, infer a conservative SQLite SELECT query from the original user prompt and the schema in the system message.

Original user prompt:
${originalPrompt}

Assistant output:
${rawText}`;

    const { text: repairedText } = await generateText({
      model: llm(AI_MODEL),
      system: systemPrompt,
      prompt: repairPrompt,
      temperature: 0,
      maxOutputTokens: 2000,
      abortSignal: AbortSignal.timeout(Math.min(AI_TIMEOUT_MS, 30000)),
    });

    try {
      return normalizeAgentObject(extractJson(repairedText));
    } catch (error) {
      throw new Error("Model response could not be converted into the required JSON format", { cause: error });
    }
  }
}

function buildPrompt(query: string, context: AgentContextTurn[] = []): string {
  const recent = context.slice(-4).map((turn, index) => {
    const parts = [
      `Turn ${index + 1}`,
      `User question: ${turn.question}`,
      turn.intent ? `Assistant intent: ${turn.intent}` : "",
      turn.sql ? `SQL used: ${turn.sql}` : "",
      turn.explanation ? `Prior explanation: ${turn.explanation.slice(0, 360)}` : "",
    ].filter(Boolean);
    return parts.join("\n");
  }).join("\n\n");

  return `${recent ? `Conversation context:\n${recent}\n\n` : ""}Current user question:\n${query}\n\nAnswer the current question. If it is a follow-up, explicitly connect it to the previous result in the explanation and generate SQL for the metrics needed to explain the follow-up. Return JSON only.`;
}

function buildResultPrompt(query: string, context: AgentContextTurn[], sql: string, data: Record<string, unknown>[]) {
  const recent = context.slice(-3).map((turn) => ({
    question: turn.question,
    intent: turn.intent,
    explanation: turn.explanation?.slice(0, 260),
  }));
  const rows = data.slice(0, 80);

  return `Write the final QueryForge business analysis in Chinese using only the executed query result.

Current user question:
${query}

Recent conversation context:
${JSON.stringify(recent, null, 2)}

Executed SQL:
${sql}

Query result rows:
${JSON.stringify(rows, null, 2)}

Requirements:
- 150-250 Chinese characters.
- Be conversational and specific, not generic.
- Use actual numbers from the rows. Do not invent numbers.
- Prefer Chinese business terms. Avoid exposing raw SQL column names such as order_share_pct unless necessary.
- If this is a follow-up, connect directly to the previous result.
- Cover: data conclusion, contrast/trend, business action, and data limitation.
- Return plain text only, no markdown.`;
}

async function explainFromResult(
  query: string,
  context: AgentContextTurn[],
  sql: string,
  data: Record<string, unknown>[],
  fallback: string,
) {
  if (!data.length) return fallback || "本次查询没有返回可分析的数据。建议调整筛选条件或扩大时间范围后再看。";

  try {
    const { text } = await generateText({
      model: llm(AI_MODEL),
      system: "You write concise, evidence-based Chinese business analysis. Use only supplied query results.",
      prompt: buildResultPrompt(query, context, sql, data),
      temperature: 0.4,
      maxOutputTokens: 700,
      abortSignal: AbortSignal.timeout(Math.min(AI_TIMEOUT_MS, 20000)),
    });
    return text.trim() || fallback;
  } catch {
    return fallback;
  }
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
  context: AgentContextTurn[] = [],
  onProgress?: (p: AgentProgress) => void,
): Promise<AgentResult> {
  getDb();

  if (!AI_API_KEY || !process.env.AI_BASE_URL || !process.env.AI_MODEL) {
    throw new Error("AI provider is not fully configured");
  }

  onProgress?.({ step: "analyzing", message: "AI 正在分析您的问题..." });
  const prompt = buildPrompt(query, context);

  const { text } = await generateText({
    model: llm(AI_MODEL),
    system: systemPrompt,
    prompt,
    temperature: AI_TEMPERATURE,
    maxOutputTokens: 2000,
    abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });

  onProgress?.({ step: "generating_sql", message: "正在解析 SQL 查询..." });

  const obj = await parseOrRepairJson(text, prompt);
  const sql = obj.sql as string;

  onProgress?.({ step: "executing", message: "正在执行数据库查询..." });

  const result = tryExecute(sql);

  if (result.success) {
    const explanation = await explainFromResult(query, context, sql, result.data!, (obj.explanation as string) ?? "");
    onProgress?.({ step: "done", message: "查询完成" });
    return {
      thinking: (obj.thinking as string) ?? "",
      intent: (obj.intent as string) ?? "",
      sql,
      data: result.data!,
      chartConfig: (obj.chart_config as AgentResult["chartConfig"]) ?? { type: "bar", x_key: "", y_key: "", title: "" },
      explanation,
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

  const fixObj = await parseOrRepairJson(fixText, fixPrompt);
  const fixedSql = fixObj.sql as string;

  onProgress?.({ step: "executing", message: "正在执行修正后的查询..." });

  const fixResult = tryExecute(fixedSql);

  if (fixResult.success) {
    const explanation = await explainFromResult(query, context, fixedSql, fixResult.data!, (fixObj.explanation as string) ?? "");
    onProgress?.({ step: "done", message: "修正成功" });
    return {
      thinking: (fixObj.thinking as string) ?? "",
      intent: (fixObj.intent as string) ?? "",
      sql: fixedSql,
      data: fixResult.data!,
      chartConfig: (fixObj.chart_config as AgentResult["chartConfig"]) ?? { type: "bar", x_key: "", y_key: "", title: "" },
      explanation,
      corrected: true,
      correctionNote: `SQL 已自动修正（原始错误: ${result.error?.slice(0, 80)}）`,
    };
  }

  onProgress?.({ step: "error", message: `修正失败: ${fixResult.error}` });
  throw new Error(`SQL 执行失败（已尝试修正）: ${result.error}`);
}

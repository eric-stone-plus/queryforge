import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { Parser } from "node-sql-parser";
import { getDb, queryDb } from "./db";

const mimo = createOpenAICompatible({
  name: "mimo",
  baseURL: process.env.MIMO_BASE_URL || "https://token-plan-cn.xiaomimimo.com/v1",
  apiKey: process.env.MIMO_API_KEY || "",
});

export type AgentResult = {
  thinking: string;
  intent: string;
  sql: string;
  data: Record<string, unknown>[];
  chartConfig: { type: string; x_key: string; y_key: string; title: string };
  explanation: string;
};

const systemPrompt = `You are a data analyst agent for a SQLite ecommerce database.

Respond with a single valid JSON object only. No markdown, no fences.

JSON fields:
{
  "thinking": "your reasoning",
  "intent": "what the user wants",
  "sql": "a single valid SQLite SELECT query",
  "chart_config": { "type": "bar|line|pie|area", "x_key": "column", "y_key": "column", "title": "Chinese title" },
  "explanation": "brief Chinese explanation"
}

Rules:
- Revenue = SUM(oi.quantity*oi.unit_price*(1-oi.discount)). NEVER use orders.total_amount.
- SELECT only. SQLite syntax.
- Time series: strftime('%Y-%m', date_column).

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
  // Auto-add LIMIT if missing to prevent browser freeze
  if (!sql.toUpperCase().includes("LIMIT")) {
    return sql.replace(/;?\s*$/, " LIMIT 500");
  }
  return sql;
}

function extractJson(text: string): Record<string, unknown> {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch { /* continue */ }

  // Find outermost { } with balanced brace counting
  const start = text.indexOf("{");
  if (start === -1) throw new Error("No JSON in response");

  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    if (text[i] === "}") depth--;
    if (depth === 0) {
      const candidate = text.slice(start, i + 1);
      try {
        return JSON.parse(candidate);
      } catch { /* try next candidate - find next { */ }
    }
  }

  // Fallback: regex (original behavior)
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("No JSON in response");
  return JSON.parse(m[0]);
}

export async function runAgent(query: string): Promise<AgentResult> {
  getDb();

  const { text } = await generateText({
    model: mimo("mimo-v2.5-pro"),
    system: systemPrompt,
    prompt: query,
    abortSignal: AbortSignal.timeout(30000),
  });

  const obj = extractJson(text);
  const sql = obj.sql as string;
  const safeSql = validateSelectOnly(sql);
  const data = queryDb(safeSql);

  return {
    thinking: (obj.thinking as string) ?? "",
    intent: (obj.intent as string) ?? "",
    sql,
    data,
    chartConfig: (obj.chart_config as AgentResult["chartConfig"]) ?? { type: "bar", x_key: "", y_key: "", title: "" },
    explanation: (obj.explanation as string) ?? "",
  };
}

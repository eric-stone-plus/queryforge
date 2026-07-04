TASK: Create API route files for a Next.js 14 App Router project at ~/Public/data-agent.

FILE 1: src/lib/agent.ts
The AI agent pipeline. Export an async function `runAgent(query: string)` that:
- Imports generateObject from 'ai' and openai from '@ai-sdk/openai'
- Makes a SINGLE gpt-4o call with a Zod schema returning: { thinking: string, intent: string, sql: string, chart_config: { type: string, x_key: string, y_key: string, title: string }, explanation: string }
- System prompt MUST include: "ALWAYS compute revenue as SUM(oi.quantity * oi.unit_price * (1 - oi.discount)). NEVER use orders.total_amount."
- System prompt MUST include the full DB schema (regions, categories, products, users, orders, order_items)
- After getting SQL, validate with node-sql-parser: only SELECT allowed
- If SQL invalid, retry once with error context
- Deterministic chart override: if data has date column → line, categorical+numeric → bar, ≤5 categories with percentage → pie
- Execute validated SQL against better-sqlite3 at ./data/ecommerce.db
- Return { thinking, sql, data, chartConfig, explanation }

FILE 2: src/app/api/chat/route.ts
- POST handler, accepts { message: string }
- Calls runAgent(message)
- Returns JSON response with the agent result
- Handle errors gracefully

FILE 3: src/app/api/schema/route.ts
- GET handler
- Returns the DB schema as JSON (table names + columns)

Write all three files as working TypeScript.

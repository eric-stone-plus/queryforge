# QueryForge Final Direction Review - Codex

Perspective: Principal Product Engineer reviewing QueryForge as a hackathon product that needs to demo reliably tomorrow, while telling a credible story about how it becomes a real B2B SaaS data product.

## Executive Position

QueryForge is currently a strong hackathon demo: one Next.js app, a real Olist SQLite database, a Kimi-powered text-to-SQL loop, read-only database access, chart rendering, and a cached fallback path. The product story is credible because it attacks a real pain: business teams wait on analysts for repeatable questions, while analysts spend too much time writing commodity SQL.

The production product should not be positioned as "LLM writes SQL." That is too easy to copy and too risky for enterprise buyers. The stronger position is:

> QueryForge is a governed conversational analytics layer: it translates business questions into policy-checked SQL against trusted metric definitions, executes read-only queries in the customer's data environment, and returns analyst-quality explanations with full auditability.

The biggest current gap is chat quality. In `src/lib/agent.ts`, Kimi returns `thinking`, `sql`, `chart_config`, and `explanation` before the SQL is executed. That means the "analysis" cannot actually be grounded in the returned numbers. For the demo, the app needs to feel like a data analyst, not a SQL/chart generator.

Local verification note: `npm run build` passes on this review.

## 1. Architecture Review

### Current Implementation

The backend is intentionally compact:

- `src/lib/agent.ts` owns provider setup, the system prompt, SQL generation, JSON extraction, SELECT-only validation, execution, and one self-correction retry.
- `src/lib/db.ts` opens a single global `better-sqlite3` connection to `data/ecommerce.db` in read-only mode.
- `src/app/api/chat/route.ts` streams progress events, calls `runAgent`, and falls back to exact-match cached demo results.
- `src/app/api/query/route.ts` accepts SQL from the frontend, validates that it is a single SELECT, appends a `LIMIT 500`, and executes it.

This is fine for Demo Day. It is not the production architecture. The production version needs hard boundaries between conversation orchestration, semantic modeling, policy enforcement, query execution, and audit.

### Production Redesign

I would split the system into seven layers:

1. **Workspace and tenant layer**
   - Organizations, users, roles, workspaces, data sources, saved metrics, dashboards, conversations.
   - App metadata in Postgres, not SQLite.
   - Tenant-scoped encryption keys and data-source credentials in a secrets vault.

2. **Semantic catalog**
   - Business metrics, table descriptions, join graph, dimensions, allowed filters, freshness, owners, examples, and certified definitions.
   - This is the moat. The model should not infer metric definitions from raw table names every time.
   - Example: `Revenue = SUM(orders.total_amount) WHERE status = 'completed'`, with owner, caveats, and allowed dimensions.

3. **Agent orchestration**
   - Step 1: classify intent and ambiguity.
   - Step 2: retrieve relevant schema/metric context.
   - Step 3: generate a query plan.
   - Step 4: generate SQL.
   - Step 5: validate and rewrite SQL through policy.
   - Step 6: execute with limits.
   - Step 7: synthesize a result-aware analyst response.
   - Step 8: suggest follow-up questions or save as metric/dashboard.

4. **Policy and SQL safety engine**
   - SELECT-only parsing is necessary but insufficient.
   - Add table/column allowlists, tenant filters, row-level filters, PII masking, max rows, max execution time, cost limits, and blocked SQL features.
   - Use database-level read-only credentials as the final safety net, not the only safety mechanism.

5. **Query execution service**
   - Run queries against the customer's warehouse or replica: Postgres, BigQuery, Snowflake, Redshift, ClickHouse.
   - Use read-only roles, statement timeouts, cancellation, async jobs for slow queries, result caching, and warehouse-native query IDs.
   - SQLite remains the local/demo adapter.

6. **Result analysis layer**
   - The LLM should see the user question, SQL, metric definitions, row count, a bounded result sample, and summary statistics.
   - It should produce a direct answer, key takeaways, caveats, business implications, and follow-up suggestions.
   - This must happen after execution, not before.

7. **Observability and evaluation**
   - Log prompt, retrieved schema, generated SQL, validation decision, execution metadata, answer, user feedback, and correction path.
   - Maintain a golden set of natural-language questions with expected SQL/result properties.
   - Track query success rate, correction rate, answer usefulness, latency, and unsafe-query blocks.

### Critical Path From SQLite Demo To SaaS

**Phase 0: Tomorrow's demo**

- Keep SQLite.
- Ensure Railway deploy is live with the current database and environment variables.
- Add smoke tests for the four demo prompts.
- Improve chat response quality.
- Keep cached fallbacks, but make the cache keys match visible demo chips.

**Phase 1: Sellable MVP**

- Add real auth and workspaces.
- Add app metadata DB in Postgres.
- Add one production data-source connector, preferably Postgres first.
- Build a semantic layer for certified metrics and joins.
- Replace frontend-submitted arbitrary SQL with saved metric IDs or server-generated SQL only.
- Add audit logging and basic RBAC.
- Add result-aware answer synthesis.

**Phase 2: Enterprise pilot**

- Add SSO/SAML, SCIM later if needed, workspace roles, table/column permissions, row-level filters, PII classification, and admin policy controls.
- Store customer credentials in a vault.
- Add query cost controls, cancellation, warehouse query IDs, and immutable audit export.
- Add an evaluation harness before shipping prompt/model changes.

**Phase 3: Scaled analytics product**

- Support Snowflake/BigQuery/Redshift/ClickHouse.
- Add dbt/semantic-layer ingestion.
- Add lineage, metric ownership, metric certification, scheduled reports, anomaly detection, and human approval workflows.
- Add enterprise deployment options: VPC/private link, bring-your-own-model, and customer-managed keys.

## 2. Chat Quality

The current prompt makes the agent feel like a SQL generator because the contract is SQL-first:

```json
{
  "thinking": "...",
  "intent": "...",
  "sql": "...",
  "chart_config": "...",
  "explanation": "brief Chinese explanation"
}
```

There are three problems:

- The model writes `explanation` before seeing query results.
- The UI exposes `thinking`, which is not the right product surface. Users need assumptions and reasoning summary, not hidden chain-of-thought style content.
- The response has no explicit fields for direct answer, takeaways, caveats, business implication, or follow-up questions.

### Recommended Agent Contract

Use a two-pass contract.

**Pass A: query planning**

```json
{
  "intent": "user-facing summary of the business question",
  "needs_clarification": false,
  "clarifying_question": "",
  "metric_definition": "Revenue = SUM(orders.total_amount)",
  "sql": "single SQLite SELECT query",
  "chart_config": {
    "type": "bar|line|pie|area",
    "x_key": "column",
    "y_key": "column",
    "title": "Chinese title"
  },
  "assumptions": ["..."]
}
```

**Pass B: answer synthesis after SQL execution**

```json
{
  "answer": "自然、直接的中文回答，先说结论，再说证据。",
  "key_takeaways": ["...", "...", "..."],
  "business_implication": "这对运营/销售/财务意味着什么。",
  "caveats": ["口径、时间范围、数据限制"],
  "next_questions": ["可以继续追问的问题 1", "可以继续追问的问题 2"],
  "confidence": "high|medium|low"
}
```

Then merge those fields into the final streamed result.

### Prompt Direction

The system prompt should sound like a senior business analyst, not a SQL compiler:

```text
You are QueryForge, a senior ecommerce data analyst for Chinese business users.

Your job is to answer the user's business question, not merely generate SQL.
Be direct, conversational, and decision-oriented.
Use the available schema and metric definitions exactly.
If the question is ambiguous, either make a conservative assumption and state it, or ask one clarifying question.
Never invent numbers. Only discuss numbers present in the SQL result.
Do not expose hidden chain-of-thought. Provide a concise reasoning summary through assumptions and caveats.

When writing the final answer:
- Start with the answer in one sentence.
- Mention the exact metric definition and time range when relevant.
- Highlight 2-3 patterns, outliers, or rankings from the result.
- Explain what it means for the business.
- Suggest one useful next analysis.
- Keep the tone like a helpful analyst in a meeting.
```

For tomorrow, the fastest high-impact implementation is:

- Add `answer`, `key_takeaways`, `business_implication`, `caveats`, and `next_questions` to `AgentResult`.
- After `tryExecute` succeeds, call Kimi a second time with the user query, SQL, chart config, row count, and first 50 rows.
- Render `answer` above the chart, render SQL collapsed by default, and hide `thinking`.
- Update `CACHED_RESULTS` with the same richer fields so the offline path still feels polished.

This single change directly satisfies the user's requirement: "The chat must give proper conversational responses with text analysis, not just charts."

## 3. Data Compliance

The minimum viable enterprise compliance story should be:

> QueryForge does not give the LLM direct database access. The model proposes a query from schema and metric metadata. A policy engine validates and rewrites the query. Execution uses read-only customer-scoped credentials. Every question, query, result access, and model response is audited.

### Minimum Viable Compliance Controls

1. **Read-only execution**
   - Warehouse credentials are read-only.
   - SQL parser enforces a single SELECT.
   - Database session uses statement timeouts and row limits.
   - No writes, DDL, exports, attachment, or multi-statement execution.

2. **Schema-only LLM exposure by default**
   - The model receives table names, column names, descriptions, metric definitions, and masked sample values.
   - It does not receive raw tables.
   - For answer synthesis, send only bounded aggregate result rows that the user is authorized to see.

3. **RBAC and data permissions**
   - Workspace roles: admin, analyst, business viewer.
   - Data-source permissions: table, column, metric, and dashboard level.
   - Row-level policies for region, department, account, or customer scope.
   - Sensitive columns require explicit permission or masking.

4. **Audit logging**
   - Log user, org, prompt, generated SQL, policy decision, executed SQL, row count, execution time, data source, model, answer, and errors.
   - Make logs immutable enough for enterprise review and exportable to SIEM.

5. **PII and sensitive data controls**
   - Classify columns as public, internal, confidential, PII, or restricted.
   - Mask emails, phone numbers, names, addresses, and IDs unless explicitly authorized.
   - Block "list all customers/emails" style prompts for most roles.

6. **Tenant isolation and secrets**
   - Separate tenant metadata and credentials logically, with encryption at rest and in transit.
   - Store data-source credentials in a managed secrets system.
   - Never write raw customer result sets into generic application logs.

7. **Model governance**
   - Vendor DPA, retention controls, no training on customer data where available.
   - Prompt/version tracking.
   - Evaluation suite for unsafe queries and answer hallucination.

For a buyer, the key phrasing is: **the LLM is not the security boundary; the policy and execution layers are.**

## 4. PPT Technical Narrative

Do not emphasize generic features like "natural language query" or "charts." VCs and enterprise buyers have seen that. Emphasize architectural decisions that make QueryForge believable as a real product.

### Technical Point 1: Governed Semantic Layer

Message:

> QueryForge translates business language through certified metric definitions, not raw table guessing.

Why it matters:

- Prevents inconsistent metrics across departments.
- Gives analysts control over definitions and joins.
- Creates enterprise trust and differentiation against generic chat-to-SQL demos.

Slide proof:

- Show `Business Question -> Metric Catalog -> Join Graph -> SQL`.
- Use revenue as example: one certified definition, reused everywhere.

### Technical Point 2: Verified Agent Loop

Message:

> The agent is not allowed to simply answer. It must generate SQL, pass validation, execute read-only, inspect results, and only then produce analysis.

Why it matters:

- Reduces hallucination.
- Makes the answer auditable.
- Allows self-correction and regression testing.

Slide proof:

- Show flow: `Intent -> SQL -> AST validation -> execution -> result-aware narrative -> audit log`.
- Mention Kimi K2.7 as the reasoning layer, not the authority.

### Technical Point 3: Enterprise Data Plane

Message:

> Customer data stays governed: read-only credentials, schema-limited model context, RBAC, masking, and audit logs.

Why it matters:

- This is what enterprise buyers ask before they ask about charts.
- It makes the product feasible for real business data, not just demo datasets.

Slide proof:

- Show architecture: `Next.js UI -> Agent Orchestrator -> Policy Engine -> Query Executor -> Customer Warehouse`.
- Show side rails: `RBAC`, `PII Masking`, `Audit`, `Cost Limits`.

## 5. Critical Path For Tomorrow

Ranking:

1. **(a) Build verification + Railway deploy**
2. **(b) Chat quality improvement**
3. **(c) PPT update**
4. **(d) Remaining `page.tsx` fixes**

The single most impactful thing is **(a) build verification + Railway deploy**.

Reason: the largest scoring bucket is `Demo现场可用` at 25 points. If the live demo fails, the product story does not matter. The app currently builds locally, but the demo needs a deployed, smoke-tested Railway URL with the right environment variables, current SQLite database, and cached fallback path.

After deploy is verified, immediately do **(b) chat quality**. It is the most visible product improvement and directly addresses the user's strongest requirement. The current UI can render a chart, but the answer needs to sound like a data analyst: conclusion first, evidence, caveat, business meaning, next question.

Recommended 8-hour allocation:

- 2 hours: Railway deploy, environment variables, database presence, smoke tests for the four demo prompts.
- 2 hours: result-aware chat answer or, at minimum, richer `answer/key_takeaways/caveats/next_questions` fields plus cache updates.
- 2 hours: PPT update around architecture, compliance, production feasibility.
- 1 hour: only fix `page.tsx` issues that are visible in the live demo.
- 1 hour: rehearsal and failure-path testing, including API timeout/cache behavior.

Do not spend the day chasing broad UI polish. The judges will forgive a slightly imperfect dashboard. They will not forgive a broken live demo or a chat response that looks like a SQL parser with a chart attached.


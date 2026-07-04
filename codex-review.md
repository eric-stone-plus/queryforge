# QueryForge Code Review

Reviewed scope: all files under `src/`, plus package/scoring context needed for security and hackathon-readiness findings.

Verification run:

- `npm run lint` passes.
- `npm run build` passes.
- `npm audit --omit=dev` reports 2 dependency advisories: high severity for `next` and moderate severity for bundled `postcss`.

## Executive Summary

QueryForge has a solid demoable core: Next.js builds cleanly, the agent flow is understandable, SQL is parsed before execution in the main agent path, the SQLite database is opened read-only, and the UI gives immediate value with natural-language queries plus charts.

The main risks are not syntax-level quality issues. They are product and security gaps that will matter in a live demo or deployed setting:

- The public `/api/query` endpoint allows arbitrary unauthenticated `SELECT` queries against the bundled database, including PII such as `users.email`, with no row cap or cost guard.
- SQL execution and validation are duplicated across `src/lib/agent.ts`, `src/lib/db.ts`, and `src/app/api/query/route.ts`, so the safer agent behavior is not consistently applied.
- The dashboard presents hard-coded KPI values even though the page loads live KPI data, which makes the demo brittle and weakens trust.
- Several hackathon-scoring claims in the criteria notes, especially audit logs, robust demo fallback, and complete business workflows, are not implemented in `src/`.
- The UI is desktop-first with fixed-width sidebars and an eight-column KPI row, so small screens and projector layouts are likely to overflow.

## Findings

### High: `/api/query` Exposes Arbitrary Read Access And PII

`src/app/api/query/route.ts:36` accepts unauthenticated POST requests with caller-provided SQL, validates only that it is a single `SELECT`, then executes it directly at `src/app/api/query/route.ts:72`. The schema includes `users.email` at `src/app/api/schema/route.ts:38`, and the schema endpoint publicly advertises that column.

Impact:

- Any browser user or localStorage-tampered saved metric can read names, emails, and all transactional data.
- Expensive `SELECT`s can tie up the Node process because `better-sqlite3` is synchronous.
- This creates a direct conflict with any enterprise analytics / SaaS story in the pitch.

Recommended fix:

- If this is only an internal dashboard, remove `/api/query` from the browser path and expose named metric endpoints instead.
- If ad hoc SQL must remain, add authentication, table/column allowlists, deny PII columns by default, enforce a server-side `LIMIT`, add query timeout/cost controls, and centralize validation in one shared helper.

### High: SQL Safety Is Inconsistent Between Agent And Public Query Routes

`src/lib/agent.ts:58` parses SQL and appends `LIMIT 500` when the SQL text does not contain `LIMIT`. The public query route independently validates only `SELECT` at `src/app/api/query/route.ts:25` and executes without adding a limit at `src/app/api/query/route.ts:72`. `src/lib/db.ts:14` is a raw execution helper with no safety contract.

Impact:

- Agent-generated queries are capped, but saved metrics and dashboard SQL through `/api/query` are not.
- Future code can call `queryDb()` unsafely because the function name does not signal that callers must validate first.
- The string check for `LIMIT` in `src/lib/agent.ts:64` is brittle because it is not based on the parsed AST.

Recommended fix:

- Replace `queryDb(sql)` with a single `executeSafeSelect(sql, options)` helper that validates, normalizes, caps rows, blocks sensitive columns, and is used by both API routes and cached demos.
- Use parsed SQL structure rather than `sql.toUpperCase().includes("LIMIT")`.

### High: Known Vulnerable Dependencies

`package.json:19` pins `next` to `^14.2.35`. `npm audit --omit=dev` reports high-severity Next.js advisories and a moderate PostCSS advisory through Next's dependency tree. The suggested automated fix is `npm audit fix --force`, which would upgrade to Next 16 and may be breaking.

Impact:

- This is a deployability and security-review blocker if the project is exposed beyond local demo.

Recommended fix:

- Upgrade Next.js to a patched version compatible with the app, then rerun `npm run build` and smoke-test the API routes.
- If the hackathon demo must stay pinned, document that the demo is local-only and do not expose it publicly.

### Medium: Chat Endpoint Lacks Input Validation, Rate Limiting, And Error Hygiene

`src/app/api/chat/route.ts:8` casts JSON directly to `{ message: string }`. The route then calls the model at `src/app/api/chat/route.ts:18`, and returns raw error text at `src/app/api/chat/route.ts:32`. There is no body schema, message-length cap, auth, rate limit, or per-client concurrency limit.

Impact:

- A malformed request can produce noisy runtime errors.
- Anyone with access to the app can spend model tokens.
- Backend and provider errors can leak implementation details into the UI.

Recommended fix:

- Validate with `zod` or a small explicit guard: string, trimmed, max length.
- Add a demo-friendly rate limit and generic client-facing errors.
- Log detailed errors server-side only.

### Medium: LLM Output Is Trusted Without Runtime Schema Validation

`src/lib/agent.ts:114` parses arbitrary model text, then casts fields at `src/lib/agent.ts:115` and `src/lib/agent.ts:128`. The correction path repeats the same pattern at `src/lib/agent.ts:150`.

Impact:

- Missing or malformed `sql`, `chart_config`, or explanation fields fail late and produce inconsistent UI behavior.
- Chart config can point to nonexistent columns, forcing fallback guesses in `ChatPanel`.
- The project already depends on `zod` in `package.json:27`, but does not use it here.

Recommended fix:

- Add an `AgentResponseSchema` with strict field validation and safe defaults.
- Validate cached demo results with the same schema.
- Rename the displayed `thinking` field to a concise analysis summary; do not prompt for or display chain-of-thought style reasoning.

### Medium: Dashboard KPI Values Are Hard-Coded Despite Live Data Loading

`src/app/page.tsx:57` defines KPI state and `src/app/page.tsx:65` loads live KPI values from the database, but the cards shown at `src/app/page.tsx:137` through `src/app/page.tsx:145` are hard-coded strings.

The current hard-coded values happen to match the bundled database for several metrics, but the UI will silently become wrong if the seed data changes or the app is pointed at another database.

Impact:

- Judges may ask whether the dashboard is actually data-driven.
- This weakens the "business intelligence" story because headline numbers are not reactive.

Recommended fix:

- Render all KPI cards from the loaded `kpi` state.
- Add loading and error states for initial metric queries.
- Keep the demo script values stable by seeding the database, not by hard-coding the UI.

### Medium: Query Errors Are Silently Swallowed In The Dashboard

`src/app/page.tsx:46` catches all query helper failures and returns `[]`. `handleRunMetric` at `src/app/page.tsx:108` also does nothing if the saved metric returns no rows.

Impact:

- If `/api/query` fails during a live demo, the UI degrades into empty charts with no explanation.
- It is hard to distinguish "valid query with no rows" from "backend failure."

Recommended fix:

- Return `{ rows, error }` from the query helper.
- Show a compact error banner in the analytics sidebar and saved-metric rerun flow.

### Medium: Saved Metrics Are Client-Only And Weakly Modeled

Metrics are stored in localStorage from inline code at `src/components/ChatPanel.tsx:250`. `MetricSidebar` parses the JSON without schema validation at `src/components/MetricSidebar.tsx:11`, and deletes by metric name at `src/components/MetricSidebar.tsx:31`, which deletes all duplicate names.

Impact:

- Saved metrics vanish across browsers/devices and cannot support team workflows.
- localStorage tampering can feed arbitrary SQL into `/api/query`.
- Duplicate saved metric names behave unpredictably.

Recommended fix:

- Add an `id`, `createdAt`, and validated shape for saved metrics.
- Store only metric definitions that have passed server-side validation.
- For hackathon scope, at least validate localStorage shape and delete by id.

### Low: Duplicate Chart Rendering And An Unused `Dashboard` Component

`src/components/ChatPanel.tsx:42` implements chart rendering for chat results. `src/components/Dashboard.tsx:61` implements another chart renderer with different styling and key-selection behavior. `Dashboard` is not imported by any `src/` file.

Impact:

- Bugs and design fixes must be duplicated.
- The unused component makes the codebase look less focused during review.

Recommended fix:

- Extract one shared `ChartRenderer` component.
- Delete `Dashboard.tsx` if it is no longer part of the product surface.

### Low: ChatPanel Is Doing Too Much

`src/components/ChatPanel.tsx` handles SSE parsing, chat history, chart rendering, SQL display, localStorage writes, progress rendering, and form behavior in one component. There is duplicated result rendering between history items at `src/components/ChatPanel.tsx:213` and the external result block at `src/components/ChatPanel.tsx:263`.

Impact:

- Small UI changes are harder than necessary.
- The external saved-metric result path lacks the same "save metric" affordance as normal chat results.

Recommended fix:

- Split into `useChatStream`, `ResultCard`, `ChartRenderer`, and `SaveMetricButton`.
- Reuse `ResultCard` for history and saved-metric reruns.

## Per-File Notes For `src/`

### `src/lib/db.ts`

Good:

- Uses a singleton connection and opens the SQLite database in read-only mode at `src/lib/db.ts:9`.

Needs work:

- `queryDb(sql)` at `src/lib/db.ts:14` is unsafe as a shared helper because it runs whatever SQL it receives.
- Database path is fixed to `process.cwd()/data/ecommerce.db`, which is fine for the demo but not configurable for a product story.

### `src/lib/agent.ts`

Good:

- Clear system prompt, explicit revenue rule, SQLite schema context, parser-based `SELECT` validation, and one self-correction attempt.
- `AbortSignal.timeout(30000)` at `src/lib/agent.ts:109` prevents endless model calls.

Needs work:

- Model output should be schema-validated.
- SQL limit handling should be AST-aware and shared with `/api/query`.
- The correction prompt at `src/lib/agent.ts:136` includes raw SQL and raw error text; acceptable locally, but sanitize/log carefully in production.
- The `MIMO_API_KEY || ""` fallback at `src/lib/agent.ts:9` makes missing configuration fail at runtime instead of producing a clear startup/demo readiness error.

### `src/lib/demo-cache.ts`

Good:

- Useful fallback for exact demo questions.

Needs work:

- Cache keys require exact string matches.
- Type is `Record<string, object>` at `src/lib/demo-cache.ts:2`, so TypeScript cannot protect the shape.
- Cached SQL is executed through `queryDb()` in `src/app/api/chat/route.ts:26`; it should pass through the same safe execution path as model SQL.

### `src/app/api/chat/route.ts`

Good:

- Streaming progress messages make the agent feel active during demos.
- Cached fallback protects the four scripted prompts when the model fails.

Needs work:

- Add request validation, auth/rate limiting, and safer errors.
- Consider sending a final SSE event type or `event:` fields rather than custom `data.type` only.
- The route does not check for client disconnects or cancel the model call when the user navigates away.

### `src/app/api/query/route.ts`

Good:

- Uses `node-sql-parser` and read-only SQLite.

Needs work:

- This is the largest security risk in the repo because it exposes arbitrary `SELECT`.
- Opens a new database connection for every request at `src/app/api/query/route.ts:19`; use the shared DB module or a safe query service.
- Does not enforce server-side `LIMIT`, cost controls, or column/table allowlists.

### `src/app/api/schema/route.ts`

Good:

- Simple static schema helps the frontend or demo docs understand the database.

Needs work:

- Hard-coded schema can drift from the actual SQLite file.
- It exposes `users.email`, which should not be advertised to unauthenticated clients.

### `src/components/ChatPanel.tsx`

Good:

- The empty state, demo chips, progress steps, SQL details, and chart output create a complete natural-language analysis loop.
- React text rendering avoids obvious DOM XSS from SQL/explanation strings.

Needs work:

- Check `res.ok` and `res.body` before parsing the SSE stream at `src/components/ChatPanel.tsx:126`.
- Add a cancel/stop control for long-running analysis.
- Avoid inline hover style handlers; use classes for maintainability.
- Replace emoji status icons with the existing `lucide-react` dependency for a more polished tool UI.
- Bound chat history or virtualize if long sessions are expected.

### `src/components/MetricSidebar.tsx`

Good:

- Saved metrics are a useful step toward persistent dashboards.

Needs work:

- Add ids, schema validation, duplicate handling, and visible feedback after delete/rerun.
- The sidebar is hidden below `lg` at `src/components/MetricSidebar.tsx:39`, but the main analytics sidebar in `page.tsx` is not.

### `src/components/Dashboard.tsx`

Good:

- Cleanly separated chart-card component.

Needs work:

- It appears unused.
- Its chart behavior and visual system differ from `ChatPanel`, increasing maintenance cost.

### `src/app/page.tsx`

Good:

- Loads real aggregate data for the analytics sidebar.
- The layout communicates the product quickly: chat-driven analysis plus business data context.

Needs work:

- Render live KPI state instead of hard-coded KPI cards.
- Surface errors from dashboard queries.
- The fixed `w-[420px]` analytics sidebar at `src/app/page.tsx:153`, `h-screen` root at `src/app/page.tsx:119`, and `grid-cols-8` KPI row at `src/app/page.tsx:137` are fragile on small screens and projectors.
- `history` state at `src/app/page.tsx:56` is appended to but not displayed, so it is either dead state or an unfinished feature.

### `src/app/layout.tsx`

Good:

- Metadata and `lang="zh-CN"` are appropriate.

Needs work:

- Add structured metadata/Open Graph only if this is meant to be shared publicly.

### `src/app/globals.css`

Good:

- Simple theme tokens make the UI consistent.

Needs work:

- `.transition-default` uses `transition: all` at `src/app/globals.css:46`; prefer targeted properties to avoid accidental layout/paint costs.
- Add visible focus styles for keyboard users instead of relying mainly on inline focus handlers in individual components.

## Hackathon Scoring Gaps

### Demo / Completeness

Current strengths:

- The app builds, lint passes, the core flow is usable, and four exact demo prompts have cached fallbacks.

Missing or weak:

- No one-click demo readiness indicator for database present, model key configured, and cached fallback available.
- Fallback is exact-match only; small wording changes miss the cache.
- Empty/error states are too quiet in the analytics sidebar and saved metrics flow.
- No reset/demo seed command exposed in the UI or README.

Highest-impact additions:

- Add a `/api/health` or in-app status popover showing DB, model, and demo cache readiness.
- Add fuzzy matching for demo prompts or a visible "demo mode" selector.
- Replace silent empty charts with clear error and retry states.

### User Value / PMF

Current strengths:

- The target pain point is clear: business users ask questions without waiting for analysts to write SQL.

Missing or weak:

- No way to connect a user's own database or upload CSV.
- No semantic layer for business-safe metrics, dimensions, synonyms, or governance.
- Saved metrics are local-only and not collaborative.
- No export/share flow for charts, SQL, or dashboards.

Highest-impact additions:

- Add CSV upload or database connection mock flow.
- Add a metric dictionary: revenue, margin, completion rate, refund rate, repeat purchase.
- Add export to PNG/CSV and shareable saved dashboard links.

### Technical Implementation

Current strengths:

- Real model call, SQL generation, parser validation, correction loop, SQLite execution, and chart rendering are real functionality rather than decorative AI.

Missing or weak:

- The scoring notes mention "audit logs", but no audit log exists in `src/`.
- No automated tests for SQL validation, agent JSON parsing, cached fallback, or API error handling.
- No observability for latency, model failures, correction rate, or query success rate.
- No centralized query execution policy.

Highest-impact additions:

- Add an in-memory or SQLite `query_audit` log for prompt, generated SQL, execution status, latency, and row count.
- Add unit tests around SQL validation and LLM response parsing.
- Add visible demo metrics: response time, corrected SQL badge, cached fallback badge.

### Innovation

Current strengths:

- Natural-language-to-SQL plus visualization is useful and easy to understand.

Missing or weak:

- Natural-language analytics is a crowded pattern; the differentiator needs to be sharper.
- Current "agent" mostly performs one generation and one correction attempt.

Highest-impact additions:

- Add proactive insight generation: "why did revenue drop?", anomaly callouts, or recommended next questions.
- Add a governed metric layer so the agent composes trusted business metrics rather than arbitrary SQL.
- Add follow-up refinement: "filter to South China", "compare with last quarter", "save this as KPI".

### Business Potential

Current strengths:

- Enterprise analytics and self-serve BI are credible markets.

Missing or weak:

- No auth, teams, permissions, data-source management, or deployment story.
- README is still the default Next.js template and does not explain the product, setup, demo script, or limitations.

Highest-impact additions:

- Rewrite README with product positioning, setup, environment variables, demo prompts, architecture, and security limitations.
- Add a pricing/use-case slide or in-app workspace concept for analysts/business teams.

### Pitch / Roadshow

Current strengths:

- The first screen communicates the product quickly.
- The sidebar gives judges visual business context while the chat runs.

Missing or weak:

- No in-app narrative path for the "from days to seconds" story.
- No visible comparison against old workflow.
- No proof of reliability beyond the happy path.

Highest-impact additions:

- Add a compact "demo scenario" selector with four workflows: regional trend, category margin, top products, repeat customers.
- Show before/after timing or "analyst wait time saved" as a demo metric.
- Keep cached fallback badge visible but frame it as demo resilience, not fake output.

## UI/UX Recommendations

1. Make the dashboard responsive.
   - Collapse the analytics sidebar below desktop widths.
   - Change the KPI row from `grid-cols-8` to responsive columns.
   - Ensure the header status text wraps or hides gracefully.

2. Use real loaded metrics in KPI cards.
   - Format `kpi.revenue`, `kpi.avgOrder`, `kpi.completionRate`, and derived fields.
   - Add skeletons while metrics load.

3. Improve chart readability.
   - Rotate or truncate long x-axis labels.
   - Add units to tooltips and axes.
   - For multi-series queries like "各地区月度销售额趋势", either split by region or render multiple lines. The current `ChartResult` chooses one `yKey` and one `xKey`, so grouped rows do not become grouped series.

4. Improve chat ergonomics.
   - Add stop/retry actions.
   - Preserve the user's message on failure.
   - Show `res.ok` errors clearly.
   - Add copy buttons for SQL and export buttons for data/chart.

5. Improve saved metrics.
   - Let users rename metrics.
   - Show the chart immediately after rerun, including save/export actions.
   - Add duplicate detection and delete confirmation for destructive actions.

6. Replace emoji icons with consistent icons.
   - The project already includes `lucide-react`.
   - Use icons for send, save, delete, retry, SQL, chart, loading, and status.

## Suggested Priority Plan

Before the next live demo:

1. Centralize safe SQL execution and lock down `/api/query`.
2. Render KPI cards from live state and add dashboard error states.
3. Make the layout responsive enough for laptop, projector, and mobile widths.
4. Add demo readiness/status and fuzzy cached prompt fallback.
5. Rewrite README with exact setup and demo instructions.

After the demo:

1. Add audit logging and basic tests.
2. Add a semantic metric layer.
3. Add CSV/database onboarding.
4. Persist saved dashboards server-side.
5. Upgrade vulnerable dependencies and document deployment constraints.

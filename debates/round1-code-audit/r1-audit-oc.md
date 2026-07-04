# QueryForge R1 Audit — ClawHunt Builder Camp 2026

Auditor: OpenCode (opencode-oc)
Date: 2026-07-04

---

## Summary

QueryForge is a well-structured Next.js data analysis agent that converts natural language to SQL queries with chart visualization. The core loop works: user asks a question → MiMo generates SQL → SQL executes against SQLite → results render as Recharts. Architecture is clean (~1500 lines across 10 files). However, several features are half-built or missing, creating real risk for live demo scoring.

**Overall readiness: 70/100 — functional core, incomplete polish.**

---

## 1. Gaps (Points at Risk)

### Critical (will lose points in demo)

| # | Gap | File | Impact |
|---|-----|------|--------|
| G1 | **No "Save Metric" button in UI.** MetricSidebar has delete/run but no save action. Users cannot persist queries. The sidebar will always show "暂无保存的指标". | `MetricSidebar.tsx:64-68`, `ChatPanel.tsx` (missing) | Demo (25): sidebar is dead weight. Innovation (15): no persistence story. |
| G2 | **`/api/schema` is unused.** The endpoint exists but no frontend code fetches it. The system prompt hardcodes the schema in `agent.ts`. If schema changes, agent.ts and route.ts drift apart silently. | `schema/route.ts` (entire file), `agent.ts:39-47` | Tech (20): shows incomplete architecture. |
| G3 | **Chart title is wrong for history items.** `chartTitle` is a single useMemo at `ChatPanel.tsx:109-112` that doesn't vary per history entry. All history chart cards display the same title (typically "数据可视化"). | `ChatPanel.tsx:109-112` | Demo (25): visible bug during multi-query demos. |
| G4 | **MetricSidebar hidden on mobile.** `hidden lg:flex` at line 39 means the entire sidebar disappears below 1024px. No mobile alternative exists. | `MetricSidebar.tsx:39` | Demo (25): if demo screen is small, sidebar vanishes. |

### Moderate (points lost on close inspection)

| # | Gap | File | Impact |
|---|-----|------|--------|
| G5 | **No conversation memory.** Each query is stateless — no follow-up capability ("now break that down by region"). History is display-only, not fed back to the LLM. | `agent.ts:65-86` | PMF (20): single-turn limits real analyst value. |
| G6 | **No streaming response.** `generateText` blocks until full completion. For complex queries, user sees nothing for 3-10 seconds. | `agent.ts:68-72` | Demo (25): sluggish feel vs. competitors with streaming. |
| G7 | **Hardcoded stats bar.** "10,000+ 订单", "500 商品", etc. are strings in `page.tsx:7-12`, not derived from the DB. If seed data changes, stats lie. | `page.tsx:7-12` | Demo (25): inaccurate if judges verify. |
| G8 | **Empty catch in handleRunMetric.** Errors are silently swallowed. | `page.tsx:33` | Demo (25): metric rerun failures are invisible. |
| G9 | **No export capability.** No CSV/JSON download for query results. | — | PMF (20): analysts expect export. |

---

## 2. Conflicts

| # | Conflict | Details |
|---|----------|---------|
| C1 | **Two different DB connection patterns.** `db.ts` uses a singleton (`getDb()` returns cached instance). `query/route.ts:19-23` creates a **new Database per request** via `require("better-sqlite3")`. This wastes resources and could hit file descriptor limits under load. | `db.ts:6-12` vs `query/route.ts:19-23` |
| C2 | **Inconsistent API response shape.** `/api/chat` returns the agent result at the top level (`NextResponse.json(result)`). `/api/query` wraps it in `{ rows, error }`. ChatPanel handles both with `payload.result ?? payload`, but this is fragile. | `chat/route.ts:8` vs `query/route.ts:74` |
| C3 | **Chart config key mismatch.** Agent returns `chart_config` (snake_case). ChatPanel.tsx type defines `chartConfig` (camelCase) AND `chart_config`. Every access must check both: `result.chartConfig ?? result.chart_config`. One missed check = bug. | `agent.ts:84`, `ChatPanel.tsx:11-12,45,110` |
| C4 | **SQL validation duplicated.** `agent.ts:51-57` and `query/route.ts:25-30` both parse SQL with node-sql-parser for SELECT-only validation. Different implementations of the same check. | `agent.ts:51-57` vs `query/route.ts:25-30` |

---

## 3. Scoring Compliance Analysis

### Demo 现场可用 (25 pts) — Est: 18/25

**Strengths:** 4 demo chips work, chat→SQL→chart loop complete, error states shown.
**Weaknesses:** MetricSidebar is non-functional (no save), chart title bug on history, no loading skeleton. Risk: LLM returns unexpected JSON → `extractJson` throws → generic error shown.

### 用户价值/PMF (20 pts) — Est: 14/20

**Strengths:** Clear pain point (business users can't write SQL), targeted at e-commerce analysts.
**Weaknesses:** No multi-turn conversation, no export, no dashboard view. Single-turn Q&A is a toy, not a tool. Missing auth means no real deployment story.

### 技术实现 (20 pts) — Est: 15/20

**Strengths:** SQL injection prevention via AST parsing, proper use of Vercel AI SDK, Recharts integration with 4 chart types, readonly DB access.
**Weaknesses:** No streaming, duplicated DB/validation logic, unused schema endpoint, no caching, no retry logic for LLM calls.

### 创新性 (15 pts) — Est: 10/15

**Strengths:** Natural language → SQL with automatic visualization is a strong demo. Thinking process visibility (expandable) is nice.
**Weaknesses:** This pattern is well-known (Chat2SQL). No unique differentiator like multi-table join reasoning, anomaly detection, or proactive insights.

### 商业潜力 (10 pts) — Est: 6/10

**Strengths:** E-commerce analytics SaaS is a real market. SQLite portability is good for SMBs.
**Weaknesses:** No auth, no multi-tenancy, no pricing model discussed. Hardcoded schema limits to one database shape.

### 路演表达 (10 pts) — Est: 7/10

**Strengths:** Clean UI with professional color scheme. Demo chips provide guided flow.
**Weaknesses:** No fallback plan if MiMo API is down. No prepared demo script visible in code.

**Estimated Total: 70/100** (before bonus)

---

## 4. Stability Risks (Demo Breakers)

| Risk | Severity | Mitigation |
|------|----------|------------|
| **MiMo API unavailable or slow** | HIGH | No fallback. Consider caching 4 pre-computed demo results as JSON fallback. |
| **LLM returns malformed JSON** | MEDIUM | `extractJson` uses regex `/{[\s\S]*}/` — greedy match. If LLM returns `{"a":1} some text {"b":2}`, it matches the outermost braces incorrectly. Add try/catch + retry. |
| **node-sql-parser fails on valid SQL** | MEDIUM | Some SQLite syntax (e.g., window functions, CTEs) may not parse. Parser throws uncaught in `query/route.ts:26`. |
| **Chart renders empty for edge cases** | LOW | 1-row results, NULL values, or non-numeric y_keys could produce blank charts. `getChartKeys` fallback logic is decent but not bulletproof. |
| **localStorage cleared during demo** | LOW | MetricSidebar data disappears. Not critical since sidebar is non-functional anyway. |

---

## 5. Differentiation vs. Single-HTML Approach

| Dimension | QueryForge (Next.js) | Single-HTML Competitor |
|-----------|---------------------|----------------------|
| Architecture | API routes, separation of concerns, reusable DB layer | All-in-one, no server |
| Persistence | SQLite + localStorage | Likely in-memory or none |
| Security | SQL AST validation, readonly DB | Likely raw SQL execution |
| Charts | 4 types (bar, line, area, pie) with Recharts | Probably Chart.js or none |
| UI | Professional sidebar + chat + stats bar | Single page, basic styling |
| Deployment | Vercel-ready, env-based API key | Static file, runs anywhere |
| Risk | Higher (multi-file, API dependency) | Lower (self-contained) |

**Verdict:** QueryForge has stronger engineering but higher demo risk. The single-HTML approach is more reliable on stage. To win on tech points, QueryForge must demo smoothly and showcase the architecture advantages (security, chart variety, persistence).

---

## 6. Prioritized Fix Recommendations

### P0 — Fix before demo (30 min total)

1. **Fix chart title bug** — Make `chartTitle` derive from the currently displayed result, not a global memo.
2. **Add save metric button** — After a query completes, show a "保存指标" button that writes to localStorage.
3. **Use db.ts singleton in query/route.ts** — Import `queryDb` from `@/lib/db` instead of creating new connections.

### P1 — Fix if time allows (1 hr total)

4. **Pre-cache demo results** — Save the 4 demo chip responses as JSON. If API fails, show cached results.
5. **Normalize chart_config keys** — Pick one convention (camelCase) and convert at the API boundary.
6. **Add streaming** — Switch to `streamText` from Vercel AI SDK for perceived speed.

### P2 — Nice to have

7. Fetch schema from `/api/schema` instead of hardcoding in system prompt.
8. Add CSV export button on chart cards.
9. Add error toast for failed metric reruns.
10. Multi-turn context (pass last 3 queries as history to LLM).

---

## File-by-File Notes

| File | Lines | Issues |
|------|-------|--------|
| `src/lib/agent.ts` | 87 | No retry/timeout. Greedy JSON regex. Hardcoded schema. No streaming. |
| `src/lib/db.ts` | 16 | Clean. No issues. |
| `src/app/page.tsx` | 100 | Hardcoded stats. Empty catch. No mobile layout. |
| `src/components/ChatPanel.tsx` | 324 | Chart title bug (L109-112). Dual key pattern (camelCase/snake_case). Good chart type coverage. |
| `src/components/MetricSidebar.tsx` | 72 | No save button. Hidden on mobile. Otherwise clean. |
| `src/app/api/chat/route.ts` | 17 | Thin wrapper. Clean. |
| `src/app/api/query/route.ts` | 81 | Duplicated DB logic. Duplicated validation. Good error handling. |
| `src/app/api/schema/route.ts` | 72 | Dead code — unused by any consumer. |
| `criteria/hackathon-rules.md` | 175 | Rules reference. Key: "能跑的 Demo > PPT". |

---

*End of audit.*

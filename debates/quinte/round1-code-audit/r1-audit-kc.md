# QueryForge R1 Audit — ClawHunt Builder Camp 2026

Auditor: Kilo Code (kc)
Date: 2026-07-04
Scope: 10 source files, package.json, globals.css, layout.tsx, hackathon-rules.md

---

## Executive Summary

QueryForge is a well-structured Next.js 14 text-to-SQL agent with chart visualization. The architecture is clean and the component separation is solid. However, there are **critical functional gaps** that will cost points during live demo, and several **stability risks** that could cause embarrassing failures on stage. The biggest concern: **the "save metric" action is entirely missing from the UI** — the sidebar exists but nothing populates it.

---

## 1. Gaps — Missing Features That Lose Points

### Critical (will visibly fail during demo)

| Gap | Impact | File |
|-----|--------|------|
| **No "save metric" button anywhere** | MetricSidebar reads from `localStorage` but no component writes to it. The sidebar will permanently show "暂无保存的指标". This eliminates the sidebar's entire demo value. | `ChatPanel.tsx`, `MetricSidebar.tsx` |
| **Metric rerun loses thinking + explanation** | `handleRunMetric` in `page.tsx:17-33` constructs a `ChatResult` with only `sql`, `data`, `chartConfig` — drops `thinking` and `explanation`. Rerun results display blank explanation text. | `page.tsx:26-30` |
| **chartTitle shared across all history items** | `chartTitle` is a single `useMemo` on `displayResult` (line 109-112) but is rendered inside every history item loop (line 228). All history charts show the *latest* title, not their own. | `ChatPanel.tsx:109-112, 228` |
| **External result hidden after first chat** | `displayResult && history.length === 0` guard at line 242 means metric sidebar reruns are invisible once the user has sent any chat message. | `ChatPanel.tsx:242` |

### Moderate (degraded experience)

| Gap | Impact | File |
|-----|--------|------|
| No data table view | Only charts — no tabular display for detail rows. Judges may ask "show me the raw data". | `ChatPanel.tsx` |
| No streaming response | `generateText` (not `streamText`) — user sees spinner then instant result. Feels slow for complex queries. | `agent.ts:68` |
| No error recovery / retry | If LLM returns invalid JSON or bad SQL, the user must manually rephrase. No automatic retry loop. | `agent.ts` |
| No conversation memory | Each query is stateless — no follow-up context ("now break it down by month"). | `agent.ts`, `route.ts` |
| No export (CSV/image) | Cannot download query results or chart images. | — |

---

## 2. Conflicts — Contradictions Between Components

| Conflict | Details |
|----------|---------|
| **DB connection pattern mismatch** | `db.ts` uses a singleton (`let db: Database | null = null`). `api/query/route.ts:19-23` creates a **new connection per request** via `require("better-sqlite3")`. Two different patterns for the same purpose. |
| **Field naming inconsistency** | LLM returns `chart_config` (snake_case). Code uses `chartConfig` (camelCase). `ChatPanel.tsx:11` defines both `x_key`/`xKey` and `y_key`/`yKey` as optional to compensate. This works but is fragile — any new consumer must know to check both. |
| **Schema drift risk** | `agent.ts:39-46` has a hardcoded schema string. `api/schema/route.ts` has a separate hardcoded JSON schema. If the DB schema changes, both must be updated independently. The `/api/schema` endpoint is never consumed by any component — it's dead code. |
| **Unused dependencies** | `package.json` includes `@faker-js/faker`, `sql.js`, `openai`, `zod`, `lucide-react`, `clsx`, `tailwind-merge` — none are imported anywhere in the 10 source files. Adds build weight and suggests incomplete cleanup. |

---

## 3. Scoring Compliance — Per-Dimension Analysis

### 3.1 Demo 现场可用 (25分) — Estimated: 15-18/25

**Strengths:**
- 4 demo chips provide one-click entry points
- Full loop: question → SQL → chart → display
- Error states handled with UI feedback

**Weaknesses:**
- Metric sidebar is completely non-functional (no save action)
- Metric rerun breaks after first chat (history guard)
- chartTitle bug affects multi-query demos
- No fallback if Kimi API is slow/down

### 3.2 用户价值/PMF (20分) — Estimated: 12-14/20

**Strengths:**
- Real pain point: business users can't write SQL
- Clear target: ecommerce data analysts / ops teams
- Natural language → SQL is a proven category

**Weaknesses:**
- No persistence — refresh loses everything
- No sharing or collaboration
- No indication of who would pay for this vs. using ChatGPT directly

### 3.3 技术实现 (20分) — Estimated: 14-16/20

**Strengths:**
- SQL parser validation (`node-sql-parser`) — prevents injection
- Proper SELECT-only enforcement
- Clean API layer with error handling
- TypeScript throughout

**Weaknesses:**
- Single LLM call, no agent loop (despite the name "agent")
- No streaming
- `api/query/route.ts:20` uses `require()` — not ESM-compatible, will break in some Next.js edge configs
- Unused deps suggest rushed assembly

### 3.4 创新性 (15分) — Estimated: 7-9/15

**Strengths:**
- Thinking/reasoning panel shows transparency
- Chart type auto-selection (bar/line/pie/area)

**Weaknesses:**
- Text-to-SQL + chart is a well-worn pattern (many existing products)
- No multi-step reasoning or self-correction
- No unique data processing pipeline
- Differentiation from "ask ChatGPT to write SQL" is thin

### 3.5 商业潜力 (10分) — Estimated: 5-6/10

**Strengths:**
- Clear market: BI tools are a $30B+ market
- Could extend to multiple DB backends

**Weaknesses:**
- No auth, no multi-tenancy, no pricing model
- SQLite-only — not enterprise-ready
- No data connector abstraction

### 3.6 路演表达 (10分) — N/A (presentation-dependent)

---

## 4. Stability Risks — What Could Break During Live Demo

### 🔴 High Risk (demo-ending)

| Risk | Trigger | Mitigation |
|------|---------|------------|
| **Kimi API down or slow** | Network issues, rate limits, provider outage | Zero fallback. No retry. No cached results. Demo dies. **Add:** pre-cached results for the 4 demo chips as hardcoded fallback. |
| **API key expired** | `.env.local` key invalid | No key rotation mechanism. Entire app becomes non-functional. |
| **LLM returns non-JSON** | Model hallucination, temperature issues | `extractJson` at `agent.ts:59-63` will throw. User sees generic error. **Add:** retry with stricter prompt. |
| **LLM returns invalid SQL** | Schema confusion, syntax errors | `validateSelectOnly` at `agent.ts:51-57` catches parse errors, but `queryDb` at line 77 could still fail on runtime SQL errors. Error is caught by API but user sees raw SQLite error. |

### 🟡 Medium Risk (ugly but recoverable)

| Risk | Trigger | Mitigation |
|------|---------|------------|
| Chart crashes on bad data | LLM returns `x_key`/`y_key` that don't exist in result set | `getChartKeys` at `ChatPanel.tsx:31-41` has fallback logic, but if data is empty or all-null, chart shows "暂无数据" — acceptable. |
| Pie chart with 50+ slices | "Top 50 products" query | Pie chart becomes unreadable. No row limit in SQL prompt guidance. |
| Large result set (240 rows) | Demo query returns max rows | Recharts renders all 240 bars — performance may stutter. No pagination or limit hint. |

### 🟢 Low Risk

| Risk | Notes |
|------|-------|
| SQLite file missing | `fileMustExist: true` will throw — caught by API error handler |
| localStorage unavailable | `MetricSidebar.tsx:11` has try/catch — graceful degradation |
| CSS variables missing | All inline styles use CSS vars with hardcoded fallbacks in `globals.css` |

---

## 5. Differentiation vs. Single-HTML Approach

| Dimension | QueryForge (Next.js) | Single-HTML Competitor |
|-----------|----------------------|------------------------|
| **Architecture** | Proper separation: API routes, lib, components | Everything in one file |
| **Security** | SQL parser validation, server-side execution | Likely client-side SQL or no validation |
| **Extensibility** | Can add auth, new APIs, middleware easily | Hard to extend |
| **Demo polish** | Professional UI with sidebar, stats bar, chat history | May look simpler |
| **Deploy complexity** | Needs Node.js server, SQLite file on disk | Opens in any browser |
| **Weakness** | More moving parts = more failure points | Simpler = fewer things to break |
| **Perceived value** | Looks like a real product | Looks like a prototype |

**Key selling point for judges:** "This is a production-architected application, not a demo script. The API layer validates SQL, the component system is reusable, and it's ready for auth/multi-tenant/data-connector extensions."

---

## 6. Priority Fix List (Ranked by Point Impact)

1. **[P0] Add "save metric" button to ChatPanel** — After a successful query, show a "保存指标" button that writes to `localStorage` under `queryforge-metrics`. Without this, the entire sidebar feature is dead weight. ~15 lines of code.

2. **[P0] Fix metric rerun visibility** — Remove `history.length === 0` guard from the external result display block at `ChatPanel.tsx:242`, or better: append external results to history. ~5 lines.

3. **[P0] Pre-cache demo chip results** — Hardcode fallback results for the 4 demo queries in case Kimi API is slow/unavailable during demo. ~30 lines.

4. **[P1] Fix chartTitle per-item** — Move chartTitle computation inside the history map, deriving from each item's own `chart_config`. ~3 lines.

5. **[P1] Pass thinking + explanation through metric rerun** — Store these in `SavedMetric` or re-fetch from the original query. ~10 lines.

6. **[P1] Add data table fallback** — Show a simple `<table>` below the chart for detail inspection. ~20 lines.

7. **[P2] Add streaming** — Switch from `generateText` to `streamText` for perceived performance. ~30 lines.

8. **[P2] Clean unused deps** — Remove `@faker-js/faker`, `sql.js`, `openai`, `zod`, `lucide-react`, `clsx`, `tailwind-merge` from `package.json`. Reduces build size and looks cleaner.

9. **[P2] Unify DB connection pattern** — Use the singleton from `db.ts` in `api/query/route.ts` instead of creating a new connection per request. ~5 lines.

10. **[P3] Add SQL row limit hint** — Add "LIMIT 200" guidance to system prompt to prevent huge result sets during demo. ~1 line.

---

## 7. Verdict

The project has a solid foundation — clean TypeScript, proper security validation, good UI design. But it has **4 critical bugs** (save metric missing, rerun visibility, chartTitle, metric data loss) that will be immediately apparent during live demo. Fix P0 items before anything else.

**Estimated score without fixes: 58-68/100**
**Estimated score with P0+P1 fixes: 72-82/100**
**Estimated score with all fixes: 78-88/100**

The ceiling is limited by innovation (text-to-SQL is not novel) and business potential (no auth/multi-tenant). To score 85+, the pitch must emphasize the production architecture and extensibility story convincingly.

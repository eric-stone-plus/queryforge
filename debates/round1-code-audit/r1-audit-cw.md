# QueryForge — R1 Audit Report

**Project:** QueryForge — AI Data Analysis Automation Agent
**Auditor:** CodeWhale (cw)
**Date:** 2026-07-04
**Scope:** 12 source files reviewed against scoring criteria + stability + differentiation

---

## Executive Summary

QueryForge is a well-structured Next.js 14 + SQLite + Kimi v2.5 Pro data analysis agent with a clean UI, solid seed data, and a real AI pipeline. The core loop (natural language → SQL → chart) works. However, there are concrete stability risks for live demo, some dead code, and a few architectural shortcuts that would lose points under close technical review.

**Estimated Score Ceiling:** ~78–88 / 105 (before presentation polish)

---

## 1. Stability Risks (Demo Could Break)

### 🔴 CRITICAL

**1.1 No API timeout or retry.** `agent.ts` calls `generateText()` with no timeout. If the Kimi API hangs or returns slowly, the UI spins indefinitely with no user feedback beyond "AI 正在分析数据...". A single slow response could kill the 3-minute demo window.

- **Fix:** Add `maxDuration` or `abortSignal` with a 10-second timeout. Return a user-friendly timeout error.

**1.2 No demo/offline fallback.** The entire app depends on a live Kimi API call (`https://api.kimi.com/coding/v1`). If the API is down, rate-limited, or the network blinks during the demo, the app is completely non-functional.

- **Fix:** Cache the 4 demo query results as static JSON. If the API call fails within 3 seconds, fall back to pre-cached results with a "离线演示" badge. Judges will see a working product regardless.

**1.3 `extractJson` greedy regex is fragile.** The pattern `/\{[\s\S]*\}/` matches the *first* `{` to the *last* `}` in the entire response. If the LLM wraps its answer in markdown fences, explanatory text, or emits multiple JSON objects, parsing breaks silently.

- **Fix:** Use a non-greedy match or a proper JSON extraction that finds the outermost balanced braces. Example: scan for `{` at depth 0, track brace nesting until it returns to 0.

### 🟡 WARNING

**1.4 `orders.total_amount` vs computed revenue divergence.** The seed script computes `total_amount` as the sum of `line_items` at insert time. The system prompt instructs the LLM to compute `SUM(oi.quantity*oi.unit_price*(1-oi.discount))` and explicitly says "NEVER use orders.total_amount." This is correct for accuracy, but if the LLM ignores the instruction and uses `total_amount`, results will be *close but not identical* — a subtle bug that's hard to catch live.

- **Mitigation:** The instruction is clear and prominent. Consider adding a post-query sanity check: if SQL references `orders.total_amount`, reject and retry.

**1.5 `node-sql-parser` may reject valid SQLite.** The parser is configured for `"sqlite"` mode, but some SQLite-specific syntax (window functions, CTEs with `WITH`, `JSON_EXTRACT`, etc.) may not parse correctly. If the LLM generates a valid but complex query, the validator could reject it.

- **Risk level:** Low for the 4 demo queries. Medium if judges ask ad-hoc questions.

**1.6 No input sanitization on chat messages.** The `message` field from the user goes directly to the LLM as the prompt. No length limit, no injection guard. A very long message or prompt injection could produce unexpected behavior.

- **Fix:** Truncate to ~500 chars client-side. Strip control characters.

---

## 2. Gaps (Points Likely Lost)

### 2.1 Demo / 现场可用 (25 pts) — Risk: -3 to -5

- **No error recovery UI.** If the API returns an error, it shows a red box but no retry button, no fallback, no guidance.
- **No loading timeout.** Spinner can run forever.
- **No pre-demo warm-up.** First request is cold (model loading, DB open). Consider a health-check endpoint that pre-loads the DB.

### 2.2 用户价值/PMF (20 pts) — Risk: -2 to -4

- **No metric saving flow visible in the UI.** The `MetricSidebar` reads from localStorage, but there's no "save" button in `ChatPanel` or anywhere else. The sidebar will always show "暂无保存的指标" unless code is added to write to it. This is a **dead feature** — the panel exists but is never populated.
- **No multi-turn conversation.** Each query is stateless — the LLM has no memory of prior questions. This limits the "analyst workflow" story.
- **`Dashboard.tsx` is unused.** It's imported nowhere in the app. Dead code.

### 2.3 技术实现 (20 pts) — Risk: -2 to -3

- **`/api/query` creates a new DB connection per request.** Unlike `agent.ts` which uses the singleton from `db.ts`, the query route does `new Database(dbPath, ...)` on every call. This is inefficient and could cause WAL lock contention under concurrent requests.
- **No streaming.** The chat API waits for the full LLM response before returning. Streaming would show the thinking process in real-time, which is more impressive for demo and technically more sophisticated.
- **Schema API is fully static.** `/api/schema` returns hardcoded JSON. It doesn't introspect the actual database. Minor, but shows no dynamic capability.
- **`Dashboard.tsx` is a duplicate of chart logic in `ChatPanel.tsx`.** Two independent chart renderers with different color schemes and configurations. Indicates incomplete refactoring.

### 2.4 创新性 (15 pts) — Risk: -2 to -3

- **Single LLM call, no agent loop.** The "agent" is a single prompt → single response. No tool use, no multi-step reasoning, no self-correction. Compared to a true agent (e.g., text2sql with retry on error, or a planning step), this is a thin wrapper.
- **Chart type selection is LLM-determined but not validated.** If the LLM says "pie" for 200 rows of time-series data, it renders a terrible pie chart. No fallback logic to suggest a better chart type.
- **No data exploration or follow-up suggestions.** After showing a result, the UI doesn't suggest next questions like "想看按月趋势?" or "要按品类细分吗?"

### 2.5 商业潜力 (10 pts) — Risk: -1 to -2

- **No auth, no multi-tenancy, no data source abstraction.** The pitch mentions "SaaS potential" but the implementation is single-DB, single-user, no config.
- **The seed data is synthetic.** Real data integration story is absent.

### 2.6 路演表达 (10 pts) — No code risk

This is presentation-dependent. The code supports 4 demo scenarios via chips. The narrative ("从天到秒") is clear from the scoring-criteria.md strategy doc.

---

## 3. Conflicts Between Components

| # | Conflict | Location | Impact |
|---|----------|----------|--------|
| 1 | `Dashboard.tsx` exists but is never imported | `src/components/Dashboard.tsx` vs `page.tsx` | Dead code, confuses reviewers |
| 2 | Two chart rendering paths with different styles | `ChatPanel.tsx:ChartResult` vs `Dashboard.tsx:ChartCard` | Inconsistent colors (#0969da vs #2563eb), different axis props |
| 3 | `/api/query` duplicates DB logic | `src/app/api/query/route.ts` vs `src/lib/db.ts` | New connection per request instead of singleton |
| 4 | MetricSidebar has no save trigger | `MetricSidebar.tsx` reads localStorage, nothing writes to it | Feature appears broken |
| 5 | `orders.total_amount` exists but LLM told to ignore it | `seed.ts:328` vs `agent.ts:systemPrompt` | Correct but confusing; judges may question it |

---

## 4. Scoring Compliance Matrix

| Dimension | Max | Est. | Notes |
|-----------|-----|------|-------|
| Demo 现场可用 | 25 | 18–20 | Core loop works. No timeout/fallback = risk of -5 if API hiccups |
| 用户价值/PMF | 20 | 14–16 | Good pain point story. Dead metric save + no multi-turn hurt |
| 技术实现 | 20 | 14–16 | Clean architecture. No streaming, no agent loop, duplicate code |
| 创新性 | 15 | 9–11 | Single-call "agent" is thin. Chart type selection is basic |
| 商业潜力 | 10 | 6–7 | Good market pitch, thin implementation |
| 路演表达 | 10 | 7–8 | Code supports 4 demo scenarios. Depends on presenter |
| **Subtotal** | **100** | **68–78** | |
| ClawHunt 上架 | +3 | +3 | If done |
| 游园展示 | +2 | +2 | If done |
| **Total** | **105** | **73–83** | |

---

## 5. Differentiation vs Single-HTML Approach

**Advantages:**
- Full-stack architecture (API routes, DB layer, component hierarchy) shows engineering maturity
- Real SQLite with 10K+ rows — not a toy dataset
- SQL injection protection via AST parsing — serious security posture
- Recharts visualization with 4 chart types — visual polish
- Kimi v2.5 Pro integration with structured output — real AI usage
- MetricSidebar concept (if completed) enables reusable analysis

**Risks:**
- A single-HTML competitor with a pre-scripted demo and hardcoded beautiful charts could *look* equally impressive in 3 minutes
- The multi-file architecture is invisible to judges — they only see the UI
- If the API call fails during the demo, the entire project fails. A single-HTML app with hardcoded data never fails.

---

## 6. Recommended Fixes (Priority Order)

1. **Add demo fallback** — Cache the 4 demo query results as static JSON. If API fails, serve cached data with a badge. 30 minutes of work, saves the demo.

2. **Add API timeout** — Set `maxDuration: 10` on `generateText()` or wrap in `Promise.race` with a timeout. 10 minutes.

3. **Fix MetricSidebar save flow** — Add a "保存指标" button in `ChatPanel` that writes `{ name, sql, chartConfig }` to localStorage. 20 minutes. Unlocks a dead feature.

4. **Delete or integrate Dashboard.tsx** — Either use it as the main chart component or delete it. Dead code confuses reviewers. 5 minutes to delete.

5. **Fix `/api/query` to use db.ts singleton** — Replace the inline `new Database()` with `import { queryDb } from "@/lib/db"`. 5 minutes.

6. **Add loading timeout + retry button** — After 8 seconds of loading, show a "重试" button. 10 minutes.

7. **Fix `extractJson` regex** — Use balanced-brace extraction instead of greedy match. 15 minutes.

8. **Add streaming** — Use `streamText` instead of `generateText` for real-time thinking display. 1 hour. High impact for demo impression.

---

## 7. Positive Findings

- **Clean code architecture.** Separation of concerns (agent, db, api, components) is textbook.
- **SQL injection protection.** AST-based SELECT-only validation via `node-sql-parser` is robust.
- **Realistic seed data.** Chinese brand names, 20 categories with subcategories, price distributions, date ranges. This sells the demo.
- **System prompt engineering.** The revenue formula instruction (`SUM(oi.quantity*oi.unit_price*(1-oi.discount))`) prevents the #1 text2sql mistake.
- **CSS design system.** CSS custom properties with GitHub-inspired palette. Professional look without heavy UI framework.
- **Proper SQLite indexing.** 7 indexes on foreign keys and date columns. Queries will be fast.
- **Readonly DB access.** `better-sqlite3` opened in readonly mode. Safe.

---

## 8. File-by-File Notes

| File | Lines | Status | Notes |
|------|-------|--------|-------|
| `src/lib/agent.ts` | 76 | ⚠️ | Core pipeline. Needs timeout + better JSON extraction |
| `src/lib/db.ts` | 16 | ✅ | Clean singleton. Underused (query route bypasses it) |
| `src/app/page.tsx` | 107 | ✅ | Clean layout. Good stats bar |
| `src/components/ChatPanel.tsx` | 324 | ⚠️ | Largest file. No save-metric button. Duplicate chart logic |
| `src/components/MetricSidebar.tsx` | 66 | ⚠️ | Dead feature — nothing writes to localStorage |
| `src/app/api/chat/route.ts` | 16 | ✅ | Thin wrapper. Fine |
| `src/app/api/query/route.ts` | 80 | ⚠️ | Duplicates DB logic. Should use db.ts singleton |
| `src/app/api/schema/route.ts` | 79 | ✅ | Static but functional |
| `src/components/Dashboard.tsx` | 214 | ❌ | Dead code — never imported |
| `src/app/layout.tsx` | 18 | ✅ | Clean |
| `scripts/seed.ts` | 373 | ✅ | Excellent seed generator |
| `src/app/globals.css` | 44 | ✅ | Clean design tokens |
| `package.json` | — | ✅ | Dependencies are reasonable. `sql.js` and `openai` are unused imports |

---

## 9. Unused Dependencies

These packages in `package.json` are never imported in source code:

- `sql.js` — was likely considered before `better-sqlite3`. Dead dependency.
- `openai` — the project uses `@ai-sdk/openai-compatible`, not the OpenAI SDK directly. Dead dependency.
- `@ai-sdk/openai` — not used; `@ai-sdk/openai-compatible` is used instead. Dead dependency.
- `clsx`, `tailwind-merge`, `lucide-react`, `zod` — utility packages that appear unused in any source file.

Removing these reduces `node_modules` size and signals clean engineering.

---

*End of audit.*

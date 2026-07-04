# QueryForge R1 Audit — MiMo v2.5 Pro Agent

**Auditor**: MiMo Code Agent
**Date**: 2026-07-04
**Files reviewed**: 10 source files + package.json, globals.css, layout.tsx, tailwind.config.ts

---

## 1. Scoring Compliance (100 + 5)

### (1) Demo 现场可用 — 25 pts → **18/25**

| Item | Status | Detail |
|------|--------|--------|
| Core loop (NL → SQL → chart) | ✅ Works | 4 demo queries confirmed |
| Error handling | ⚠️ Partial | `chat/route.ts:9-15` catches errors; `ChatPanel.tsx:136-138` shows error state |
| JSON parsing robustness | ❌ Risk | `agent.ts:60-63` — regex `/{[\s\S]*\}/` is fragile; LLM wrapping text or nested braces will break |
| LLM timeout/retry | ❌ Missing | No timeout on `generateText`; one bad response = user sees error |
| Query row limit | ❌ Missing | No `LIMIT` enforcement; LLM could return 10K rows crashing the chart |
| `MetricSidebar` save flow | ❌ Broken | No "save" button anywhere; sidebar always shows "暂无保存的指标" |
| `@faker-js/faker` in deps | ⚠️ Unused | Dead weight in package.json |
| `sql.js` in deps | ⚠️ Unused | DB uses `better-sqlite3` only |

### (2) 用户价值/PMF — 20 pts → **12/20**

| Item | Status | Detail |
|------|--------|--------|
| Real pain point | ✅ Valid | Business users can't write SQL |
| Target user defined | ⚠️ Weak | No explicit persona in UI or pitch |
| Product-market fit signal | ❌ Missing | No user feedback, no iterative loop, no "who else would use this" |

### (3) 技术实现 — 20 pts → **16/20**

| Item | Status | Detail |
|------|--------|--------|
| LLM integration | ✅ Real | MiMo v2.5 Pro via OpenAI-compatible SDK |
| SQL safety | ✅ Good | `node-sql-parser` AST validation in both `agent.ts:51-57` and `query/route.ts:25-30` |
| Schema endpoint | ✅ Present | `schema/route.ts` — but hardcoded, not dynamic |
| Streaming | ❌ Missing | `generateText` not `streamText`; user waits with no feedback |
| Multi-turn memory | ❌ Missing | Each query is stateless; no conversation context carried forward |
| Architecture | ✅ Clean | Separated lib/db, lib/agent, API routes, components |

### (4) 创新性 — 15 pts → **8/15**

| Item | Status | Detail |
|------|--------|--------|
| Differentiation | ⚠️ Low | Text-to-SQL + chart is a well-known pattern |
| "Agent" depth | ⚠️ Shallow | Single LLM call → single SQL; no multi-step reasoning, no tool use, no planning |
| Metric saving | ❌ Skeleton | Feature exists in UI but is completely non-functional |

### (5) 商业潜力 — 10 pts → **6/10**

| Item | Status | Detail |
|------|--------|--------|
| Market fit | ✅ Plausible | BI natural-language query is a proven market (ThoughtSpot, etc.) |
| Business model | ❌ Not articulated | No pricing, no go-to-market, no competitive positioning |
| Scalability path | ⚠️ Unclear | SQLite is single-file; no multi-tenant or cloud path |

### (6) 路演表达 — 10 pts → **5/10**

| Item | Status | Detail |
|------|--------|--------|
| Storytelling | ⚠️ Unknown | No pitch deck or script provided for review |
| Chinese UI consistency | ✅ Good | All UI text in Chinese, consistent tone |
| Demo flow | ⚠️ Risky | 4 hardcoded chips; freeform input may fail on edge cases |

### Bonus → **0/5**

| Item | Status | Detail |
|------|--------|--------|
| ClawHunt 上架 | ❌ No evidence | — |
| 游园展示 | ❌ No evidence | — |

---

## 2. Gaps (Ranked by Impact)

### Critical (Demo-breaking)

1. **JSON extraction is fragile** (`agent.ts:60-63`): The regex `/{[\s\S]*\}/` greedily matches the first `{` to the last `}`. If MiMo returns markdown fences, extra braces in thinking text, or malformed output, parsing fails silently. **Fix**: Use a structured output mode or parse with `JSON.parse` after stripping markdown fences, with fallback.

2. **No LLM timeout**: `generateText` at `agent.ts:68-72` has no `maxTokens`, no `abortSignal`, no timeout. A slow or hung response blocks the entire demo. **Fix**: Add `maxTokens: 2048` and wrap with `AbortSignal.timeout(30_000)`.

3. **No query row limit**: `queryDb` at `db.ts:14-16` returns all rows. An LLM-generated `SELECT *` on 500 products is fine, but `SELECT * FROM order_items` (25K rows) will freeze the chart. **Fix**: Inject `LIMIT 500` into generated SQL or cap in `queryDb`.

### High (Score-losing)

4. **MetricSidebar save is broken**: `MetricSidebar.tsx` has `readMetrics`/`writeMetrics` but no save trigger anywhere. The "已保存指标" sidebar will always be empty. **Fix**: Add a "保存指标" button in `ChatPanel` that writes current result to localStorage.

5. **No streaming**: `generateText` returns only after the full response. During a 5-15s LLM call, the user sees only "AI 正在分析数据..." with no progress. **Fix**: Switch to `streamText` and show partial output.

6. **Schema API is hardcoded**: `schema/route.ts` duplicates the schema that's already in `agent.ts:39-47`. If tables change, both must be updated manually. **Fix**: Read schema from SQLite `PRAGMA table_info()` or define once and import.

### Medium (Polish)

7. **`@faker-js/faker` and `sql.js` in package.json** are unused dependencies. They add install time and may confuse reviewers. Remove them.

8. **Chart title in history is stale**: `ChatPanel.tsx:109-112` — `chartTitle` is derived from `displayResult`, but in the history loop (line 227), it uses the same `chartTitle` for every history item. Each item should show its own title.

9. **No conversation memory**: Each chat message is independent. The agent can't handle "now break that down by region" or "show me the top 5 from that list".

10. **`page.tsx:33` `.catch(() => {})`** silently swallows errors from the `/api/query` rerun. User gets no feedback when a metric rerun fails.

---

## 3. Conflicts

| Conflict | Files | Detail |
|----------|-------|--------|
| Duplicate schema | `agent.ts:39-47` vs `schema/route.ts:3-68` | Same tables defined in two places; drift risk |
| Duplicate DB pattern | `db.ts` singleton vs `query/route.ts:19-23` creates new instance each request | `query/route.ts` does `new Database()` on every POST; wastes resources and bypasses the singleton |
| `@ai-sdk/openai` installed but unused | `package.json` vs `agent.ts` | `agent.ts` uses `@ai-sdk/openai-compatible`, not `@ai-sdk/openai` |
| Revenue formula hardcoding | `agent.ts:35` | Correct (`SUM(oi.quantity*oi.unit_price*(1-oi.discount))`), but relies entirely on LLM compliance; no SQL post-validation checks the formula |

---

## 4. Stability Risks (Live Demo)

| Risk | Severity | Mitigation |
|------|----------|------------|
| MiMo returns non-JSON | **High** | Add JSON parse fallback + retry once with "respond with JSON only" |
| MiMo slow/hung | **High** | Add 30s timeout; show "taking longer than expected" |
| LLM generates bad SQL | **Medium** | Already validated by parser; add error message with suggestion |
| `LIMIT` missing → chart crash | **Medium** | Cap at 500 rows in `queryDb` |
| Browser localStorage cleared | **Low** | Metric sidebar empty; not critical for demo |
| SQLite file missing | **Low** | `fileMustExist: true` will throw; caught by error handler |

---

## 5. Differentiation vs Colleague's Single-HTML Approach

| Dimension | QueryForge | Single-HTML |
|-----------|------------|-------------|
| Architecture | Full Next.js stack, API routes, separated concerns | Single file, zero build |
| Visual quality | Tailwind + CSS variables, polished design system | Likely basic |
| Chart library | Recharts with 4 chart types | Likely inline canvas/SVG |
| SQL safety | AST-validated SELECT-only | Likely string matching |
| Demo reliability | More moving parts = more failure points | Fewer moving parts = more resilient |
| Impressive factor | "Real app" feeling | "Built in one file" wow factor |
| Agent depth | Single LLM call (shallow) | Same or less |

**Verdict**: QueryForge looks more professional but is more fragile. The colleague's single-HTML approach may demo more reliably. To differentiate further, QueryForge should lean into its **agent pipeline depth** (add multi-step reasoning, follow-up suggestions, auto-insight extraction) rather than just visual polish.

---

## 6. Recommended Priority Fixes (Before Demo)

| Priority | Fix | Effort |
|----------|-----|--------|
| P0 | Add JSON parse fallback + retry in `agent.ts` | 15 min |
| P0 | Add `maxTokens` + timeout to `generateText` | 5 min |
| P0 | Add `LIMIT 500` cap in `queryDb` or agent prompt | 10 min |
| P1 | Fix MetricSidebar save (add save button in ChatPanel) | 30 min |
| P1 | Fix chart title per-history-item bug | 10 min |
| P1 | Unify DB singleton (query/route.ts should use db.ts) | 10 min |
| P2 | Remove unused deps (`@faker-js/faker`, `sql.js`, `@ai-sdk/openai`) | 5 min |
| P2 | Add error feedback in `page.tsx:33` catch block | 5 min |

---

## Summary

QueryForge is a solid hackathon prototype with clean architecture, real LLM integration, and polished UI. Its biggest risks are **LLM response fragility** (JSON parsing, no timeout) and **incomplete features** (metric saving is dead code). The 4 demo chips work, but freeform queries need more resilience. With ~2 hours of P0/P1 fixes, this project can confidently score **75-80/105** and present well on stage.

**Estimated score after fixes**: Demo 22 + PMF 14 + Tech 18 + Innovation 10 + Business 7 + Pitch 7 + Bonus 0 = **78/105**

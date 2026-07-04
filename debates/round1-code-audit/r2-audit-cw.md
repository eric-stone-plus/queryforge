# QueryForge — R2 Cross-Examination

**Cross-Examiner:** CodeWhale (cw)
**Date:** 2026-07-04
**Inputs Reviewed:**
- r1-audit-cw.md (Auditor A — CodeWhale)
- r1-audit-oc.md (Auditor B — OpenCode)
- r1-audit-kc.md (Auditor C — Kilo Code)
- r1-audit-mimo.md (Auditor D — MiMo)
- r1-audit.md (Auditor E — unnamed)

---

## 1. UNANIMOUS AGREEMENTS — All Auditors Concur

These findings appear in every single R1 report. There is zero disagreement. Fix them first — they are the project's load-bearing defects.

### 1.1 🔴 MetricSidebar save flow is dead (5/5)

Every auditor independently discovered that `MetricSidebar.tsx` reads from localStorage but **no component ever writes to it**. The sidebar permanently displays "暂无保存的指标". This is a visible, obvious dead feature during live demo.

| Auditor | Quote |
|---------|-------|
| CW | "No 'save' button in ChatPanel or anywhere else. Dead feature." |
| OC | "No 'Save Metric' button in UI. Users cannot persist queries." |
| KC | "No 'save metric' button anywhere — sidebar will permanently show '暂无保存的指标'." |
| MiMo | "MetricSidebar save is broken — no save trigger anywhere." |
| E | "The sidebar exists but nothing populates it." |

**Verdict:** This is the single most agreed-upon bug. ~15 lines of code to fix. Add a "保存指标" button in `ChatPanel.tsx` that writes `{ name, sql, chartConfig }` to localStorage after a successful query.

### 1.2 🔴 No LLM timeout (5/5)

All auditors flagged that `generateText()` in `agent.ts` has no timeout. If MiMo hangs, the UI spins indefinitely.

| Auditor | Severity |
|---------|----------|
| CW | CRITICAL — "Could kill the 3-minute demo window" |
| OC | HIGH — "No fallback. Consider caching pre-computed results" |
| KC | HIGH — "One bad response = user sees error" |
| MiMo | HIGH — "No maxTokens, no abortSignal, no timeout" |
| E | 🔴 High — "A 30s+ hang during live demo = dead screen" |

**Verdict:** Add `maxDuration: 15` or `AbortSignal.timeout(15_000)` to the `generateText()` call. Return a user-friendly "分析超时，请重试" message.

### 1.3 🔴 No demo/offline fallback (5/5)

All auditors agree: if MiMo API is down, the entire app is non-functional. This is a single point of failure in a live demo environment.

**Verdict:** Pre-cache the 4 demo chip responses as static JSON. If API fails within 3 seconds, serve cached data with a "离线演示" badge. This is insurance — costs nothing if the API works, saves the demo if it doesn't.

### 1.4 🟡 Greedy `extractJson` regex is fragile (5/5)

The pattern `/{[\s\S]*\}/` matches from the first `{` to the last `}` in the entire LLM response. If MiMo wraps JSON in markdown fences, adds commentary, or emits multiple JSON objects, parsing breaks.

**Verdict:** Use balanced-brace extraction or `generateObject()` with Zod schema (eliminates JSON parsing entirely).

### 1.5 🟡 Dead dependencies in package.json (5/5)

All auditors flagged unused packages: `@faker-js/faker`, `sql.js`, `openai`, `@ai-sdk/openai`, `zod`, `lucide-react`, `clsx`, `tailwind-merge`. These add build weight and signal incomplete cleanup to technical judges.

**Verdict:** Remove them. 5 minutes of work. `npm uninstall` the unused packages.

### 1.6 🟡 `api/query/route.ts` bypasses db.ts singleton (5/5)

`db.ts` defines a singleton `getDb()`. The query route creates a **new Database instance per request** via `require("better-sqlite3")`. All auditors flagged this independently.

**Verdict:** Import `queryDb` from `@/lib/db`. 5 lines of code.

---

## 2. STRONG CONSENSUS (4/5 or 3/5)

### 2.1 No streaming response (4/5)

CW, OC, KC, MiMo all noted `generateText` blocks until completion. User sees a spinner with no feedback for 3-10 seconds.

**Verdict:** Switch to `streamText` from Vercel AI SDK. Shows thinking in real-time — both a technical upgrade and a demo impression boost. ~30 lines of change.

### 2.2 Chart title bug in history items (3/5)

KC, MiMo, and OC independently found that `chartTitle` (line 109-112 in `ChatPanel.tsx`) is a single `useMemo` derived from `displayResult`, but rendered inside every history item loop. All history charts show the *latest* title, not their own.

**Verdict:** Move title computation inside the history `map()`, deriving from each item's own `chartConfig`. ~3 lines of code.

### 2.3 Metric rerun breaks after first chat (3/5)

KC found `displayResult && history.length === 0` guard at line 242 hides the external result once the user sends any chat message. MiMo confirmed `.catch(() => {})` at `page.tsx:33` silently swallows errors. E also flagged the empty catch.

**Verdict:** Remove the `history.length === 0` guard or append external results to history. Add error toast in the catch block.

### 2.4 Metric rerun loses thinking + explanation (2/5)

KC and MiMo noted `handleRunMetric` constructs a `ChatResult` with only `sql`, `data`, `chartConfig` — drops `thinking` and `explanation`. Rerun results display blank explanation text.

**Verdict:** Store `thinking` and `explanation` in the saved metric, or re-fetch from the original query on rerun.

### 2.5 `chart_config` vs `chartConfig` naming inconsistency (3/5)

OC, KC, and E all flagged the LLM returns `chart_config` (snake_case) while TypeScript uses `chartConfig` (camelCase). Code handles both but requires dual-key checks everywhere.

**Verdict:** Normalize at the API boundary — convert to camelCase once in the response handler, stop checking both.

### 2.6 Schema duplicated in two places (3/5)

CW, OC, and MiMo noted the DB schema is hardcoded in both `agent.ts:39-47` and `api/schema/route.ts`. If tables change, both must be updated. The `/api/schema` endpoint is unused by any frontend component.

**Verdict:** Either (a) delete `/api/schema` as dead code, or (b) make `agent.ts` fetch from it. For a hackathon, option (a) is simpler.

### 2.7 No conversation memory (3/5)

OC, KC, and MiMo noted each query is stateless — the LLM has no memory of prior questions. Users can't say "now break that down by region."

**Verdict:** This is a design limitation, not a bug fix. For the demo, the 4 chips cover the use case. If time permits, send last 2-3 exchanges as conversation history.

---

## 3. SOLO FINDINGS — Unique to One Auditor

These were flagged by only one auditor. Some are real; some are overcautious.

| Finding | Auditor | Assessment |
|---------|---------|------------|
| `orders.total_amount` vs computed revenue divergence | CW | **Valid concern.** The instruction says "NEVER use orders.total_amount" but the LLM might comply. A post-query check would catch it. Low risk for 4 demo queries. |
| `node-sql-parser` rejects valid SQLite (CTEs, window functions) | CW, MiMo | **Valid for ad-hoc queries.** Low risk for rehearsed demo chips. Could bite if judges go off-script. |
| No input sanitization / length limit | CW, E | **Valid.** Truncate to 500 chars client-side. 5-minute fix. |
| Mobile sidebar visibility (`hidden lg:flex`) | OC | **Depends on demo screen.** If demo machine is ≥1024px, not an issue. If using a tablet, sidebar vanishes. |
| Hardcoded stats bar ("10,000+ 订单") | OC | **Valid but low-risk.** Judges unlikely to verify exact numbers. If seed data changes, stats lie. |
| `@ai-sdk/openai` installed but unused | MiMo | **Correct.** Part of the dead-deps finding. |
| Pie chart with 50+ slices | KC | **Edge case.** Unlikely with demo chips. Add `LIMIT 20` hint in system prompt for safety. |
| Large result set (240 rows) performance | KC | **Low risk.** Recharts handles 240 bars fine. |
| `api/schema/route.ts` uses `require()` not ESM | KC | **Correct.** Minor, but `require()` in a Next.js route is non-standard. |

---

## 4. DISAGREEMENTS — Where Auditors Conflict

### 4.1 Score ceiling estimates diverge significantly

| Auditor | Estimate | Notes |
|---------|----------|-------|
| CW | 78–88 / 105 | Before presentation polish |
| OC | 70 / 100 | "Functional core, incomplete polish" |
| KC | 58–68 / 100 (unfixed) → 78–88 / 100 (all fixes) | Largest range |
| MiMo | 78 / 105 | After P0+P1 fixes |
| E | 57–71 / 100 (unfixed) → 75–85 / 105 | After improvements |

**Analysis:** The spread (57–88) reflects different assumptions. CW and MiMo assume fixes will be applied; OC and E score the current state. KC provides both. **The consensus "after fixes" ceiling is ~78–85/105.** The consensus "as-is" floor is ~57–70/100.

### 4.2 What's the biggest risk?

| Auditor | Top Risk |
|---------|----------|
| CW | No API timeout — "Could kill the demo window" |
| OC | No offline fallback — "Demo dies" |
| KC | Missing save metric — "Sidebar is dead weight" |
| MiMo | JSON fragility — "Parsing fails silently" |
| E | No timeout + no fallback — "Dead screen" |

**Resolution:** These are all real and all related. The *most visible* risk is the dead sidebar (judges will notice). The *most catastrophic* risk is API failure with no fallback (demo dies). The *most likely* risk is JSON parsing failure (nondeterministic LLM). Fix all three — they're each under 30 minutes of work.

### 4.3 Streaming: must-have or nice-to-have?

CW and OC list it as P1 (should-do). KC and MiMo list it as P2 (nice-to-have). E lists it as should-do.

**Verdict:** It's a **demo impression** upgrade, not a stability fix. If you have 1 hour left after fixing P0 items, do it. If not, skip it. The 4 demo chips already work without streaming.

---

## 5. GAPS — What All Auditors Missed

### 5.1 No health-check / warm-up endpoint

None of the auditors noted that the first request is cold — model loading, DB open, connection setup. The first demo chip click will be noticeably slower than subsequent ones. A simple `/api/health` endpoint that pre-loads the DB and warms the model would make the first demo chip feel instant.

### 5.2 No demo script / rehearsed flow

All auditors analyzed the code but none checked whether there's a rehearsed demo script (timing, transitions, talking points). For a 3-minute hackathon demo, the *presentation flow* matters as much as the code. The project should have a `DEMO.md` with timed steps.

### 5.3 No accessibility / keyboard navigation

`ChatPanel.tsx` doesn't handle Enter-to-send (or if it does, none of the auditors verified it). For a polished demo, keyboard interaction matters.

### 5.4 No analytics / usage tracking

No event logging for which demo chips are clicked, how many queries are run, or error rates. This would help post-demo iteration and shows product thinking to judges.

### 5.5 No competitive analysis in pitch

All auditors compared QueryForge to a hypothetical single-HTML competitor, but none checked whether the pitch deck actually articulates this differentiation to judges. The tech advantage exists in code but may not exist in the presentation.

---

## 6. PRIORITIZATION — What Must Be Fixed Tonight

### P0 — Fix before demo (non-negotiable, ~1 hour total)

1. **Add "保存指标" button in ChatPanel** — Unlocks the MetricSidebar. All 5 auditors flagged this. 15 min.
2. **Add API timeout + retry** — 15s timeout, 1 retry on JSON parse failure. All 5 auditors flagged this. 15 min.
3. **Pre-cache 4 demo chip results as JSON fallback** — Insurance against API failure. All 5 auditors flagged this. 20 min.
4. **Clean dead dependencies** — `npm uninstall @faker-js/faker sql.js openai @ai-sdk/openai zod lucide-react clsx tailwind-merge`. 5 min.
5. **Use db.ts singleton in query route** — Import from `@/lib/db` instead of `require()`. 5 min.

### P1 — Fix if time allows (~45 min total)

6. **Fix chart title per-history-item bug** — Move computation inside `map()`. 3 min.
7. **Fix metric rerun visibility** — Remove `history.length === 0` guard. 5 min.
8. **Fix metric rerun data loss** — Preserve `thinking` and `explanation`. 10 min.
9. **Fix `extractJson` regex** — Use balanced-brace or `generateObject()`. 15 min.
10. **Add error toast in `page.tsx:33` catch** — Replace silent swallow. 5 min.
11. **Normalize `chart_config` → `chartConfig` at API boundary** — Stop dual-key checks. 10 min.

### P2 — Nice to have (~30 min total)

12. **Switch to `streamText`** — Real-time thinking display. 30 min.
13. **Add input length limit** — Truncate to 500 chars client-side. 5 min.
14. **Add "warm-up" health check** — Pre-load DB on app mount. 10 min.

---

## 7. SCORING IMPACT — Estimated Score With/Without Fixes

| Dimension | Max | As-Is (est.) | After P0 | After P0+P1 | After All |
|-----------|-----|-------------|----------|-------------|-----------|
| Demo 现场可用 | 25 | 15–18 | 20–22 | 22–24 | 23–25 |
| 用户价值/PMF | 20 | 12–14 | 14–15 | 15–17 | 16–18 |
| 技术实现 | 20 | 14–16 | 16–17 | 17–18 | 18–19 |
| 创新性 | 15 | 7–10 | 8–10 | 9–11 | 10–12 |
| 商业潜力 | 10 | 5–6 | 5–6 | 6–7 | 6–7 |
| 路演表达 | 10 | ? | ? | ? | ? |
| Bonus | +5 | 0 | 0 | 0 | 0–5 |
| **Total** | **105** | **53–64** | **63–70** | **69–77** | **73–86** |

**Key insight:** The difference between "as-is" and "after P0" is ~10–15 points. That's the gap between bottom-third and middle-of-pack. P0 fixes cost ~1 hour of work for a massive score uplift. There is no reason to skip them.

---

## 8. VERDICT

QueryForge has solid bones: clean architecture, real LLM integration, polished UI, good seed data, SQL injection protection. The engineering is competent. But it has **4 unanimous defects** that all 5 auditors independently identified — a dead sidebar, no timeout, no fallback, and fragile JSON parsing. These are not edge cases; they are the first things any reviewer sees.

**The P0 fixes take approximately 1 hour and move the project from "broken demo" to "reliable demo."** The P1 fixes take another 45 minutes and move from "reliable demo" to "polished product." Combined, ~2 hours of work closes the gap to the 78–85 score ceiling.

The biggest strategic risk is not technical — it's **looking like every other Text2SQL demo**. The thinking trace and NL flexibility are the differentiators. Make sure the judges see a novel question that a single-HTML competitor can't handle.

---

*End of cross-examination.*

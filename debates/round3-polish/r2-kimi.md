# QUINTE R2 Cross-Examination: QueryForge Final Polish — Kimi

**Agent:** Kimi (kimi)
**Date:** 2026-07-04
**Inputs:** task-r2-polish.md, task-polish.md, r1-cw.md, r1-oc.md, r1-kc.md, r1-kimi.md, r1-omp.md

**Methodology:** Read all 5 R1 artifacts line-by-line. For each Q1-Q6, analyzed unanimous findings, key disagreements, blind gaps, and constructed a prioritized action list integrating the strongest evidence from each auditor.

---

## Q1: Score Maximization Strategy

### 1. Unanimous Findings (5/5)

| Finding | Confidence |
|---------|-----------|
| **Wire Dashboard.tsx into page.tsx** — highest single-impact action, all 5 rank it top 1-3 | HIGHEST |
| **Fix remaining tech debt** (DB singleton in query/route.ts, API key, dead deps) — all 5 agree | HIGHEST |
| **Deploy to Railway** — all 5 agree it's worth doing, with localhost as fallback | HIGHEST |
| **Rehearse demo with stopwatch** — all 5 agree this is high-ROI for 路演表达 | HIGHEST |
| **Dead dep cleanup** — all 5 list it, trivial effort (5-15min), universal signal of polish | HIGHEST |
| **Current score baseline: 65-85/105** — range is wide but all agree the ceiling is 85-98 | HIGH |

### 2. Key Disagreements

| Disagreement | Positions | My Assessment |
|---|---|---|
| **Current baseline score** | CW: 62-72 (most conservative), KC: 64-74, OC: 75-85, Kimi (R1): 75-85, OMP: 57-71 current / 75-85 after fixes | **CW is right.** He actually verified the code and found the DB singleton fix was incomplete (`query/route.ts` still creates `new Database()` per request) and timeout wasn't reduced. Others estimated from PROJECT-MEMO's "completed" list, not from reading the actual code. Adjusted baseline: **62-75/105.** |
| **#1 priority action** | CW: Fix P0 gaps (15min), OC: Wire Dashboard (2h), KC: Fix metric rerun bug (30min), Kimi: Wire Dashboard (2h), OMP: ClawHunt listing (30min) | **KC's metric rerun fix should be #1.** It's a demo-breaking bug (invisible results after first chat), takes only 30min, and blocks the core demo flow. Dashboard wiring is #2. |
| **Timeout: 30s vs 15s** | CW: MUST reduce to 15s. Others: don't mention it as a priority. | **CW is right.** A 25-second spinner during a live demo is catastrophic. 15s is aggressive but correct for demo context. However, the real fix is the cached fallback (already works), so this is secondary. |
| **Innovation approach** | CW: Self-correction + narrative framing, OC: AI Insight (2nd LLM call), KC: Self-Healing Agent, Kimi: Self-Correction + multi-view, OMP: "Metrics-as-Code" framing | **KC + Kimi's self-correction is the strongest.** OC's AI Insight adds latency. OMP's Metrics-as-Code is a narrative, not a feature. Self-correction is both. |
| **Demo opening** | CW: Problem statement first (no app), OC: Dashboard landing, KC: Problem statement, Kimi: Dashboard landing, OMP: Dashboard landing | **OC/Kimi/OMP are right for 赛区预选** — judges see 6 teams, 3 min each. Visual impact first. **CW/KC are right for Demo Day** — 5 min allows narrative arc. Use different openers for different contexts. |
| **Deployment timing** | CW: Night before as Plan B, OC: After UI work, KC: After bug fixes, Kimi: After bugs + UI, OMP: Hour 4-6 | **OC/KC timing is right.** Deploy after MUST fixes and Dashboard wiring, but before rehearsal. Time-box to 2h. If it fails by then, abandon and go localhost. |

### 3. Gaps All Auditors Missed

| Gap | Impact | Evidence |
|-----|--------|----------|
| **`extractJson` greedy regex is a demo risk** | HIGH — if Kimi returns markdown fences or multi-JSON, parse fails silently. CW flags it as MUST fix (#4), OMP mentions it, but KC says "CAN ignore" and OC/Kimi don't prioritize it. | `agent.ts:64` — `/{[\s\S]*\}/` matches outermost braces. For a demo, this needs to be robust. |
| **No client-side timeout on API calls** | MEDIUM — `AbortSignal.timeout(30000)` is server-side only. If the server hangs without returning a timeout error, the client spinner runs forever. OMP flags this (#5 loading can hang) but nobody else does. | Need client-side `AbortController` in `ChatPanel.tsx` handleSubmit. |
| **Metric rerun loses thinking + explanation** | MEDIUM — KC flags this explicitly (page.tsx:26-30 only passes sql/data/chartConfig). OC also flags it. CW/Kimi/OMP miss it. The rerun shows a chart but the "推理过程" panel is empty — looks broken. | `page.tsx:26-30` — `handleRunMetric` constructs ChatResult with minimal fields. |
| **Dashboard.tsx color mismatch detail** | LOW-MEDIUM — CW, KC, Kimi all mention it but nobody specifies the exact scope. Dashboard uses `text-slate-900`, `border-slate-200` while app uses CSS vars (`var(--text)`, `var(--border)`). If wired without fixing, it'll look like two different apps stitched together. | `Dashboard.tsx` vs `globals.css` |
| **No warm-up script** | LOW — all auditors mention "pre-warm before demo" but nobody specifies how. A simple script that hits `/api/chat` with a trivial query 2 min before demo would prevent cold-start embarrassment. | Need a one-liner or npm script. |
| **The "judge types a query" risk** | MEDIUM — KC and CW both include "type a freeform query" in the demo flow. But if the judge picks an adversarial query (e.g., "delete all data"), the SQL validator blocks it and the demo looks broken. Need a pre-tested set of safe fallback queries. | `node-sql-parser` will reject non-SELECT, but the error message may confuse. |

### 4. Prioritized Action List (Integrated from All R1 Evidence)

| # | Action | Effort | Score Impact | Source |
|---|--------|--------|-------------|--------|
| 1 | **Fix metric rerun visibility** — remove `history.length === 0` guard at ChatPanel.tsx:262, append external results to history | 15min | +3-5 (Demo) | KC #1, OC #10, Kimi #2 |
| 2 | **Fix metric rerun data passthrough** — include thinking/explanation in handleRunMetric | 15min | +2-3 (Demo) | KC #2, OC #9 |
| 3 | **Fix DB singleton in query/route.ts** — import getDb from db.ts | 10min | +2 (Demo/Tech) | CW #1, KC #4, OC #2, Kimi #3, OMP #5 |
| 4 | **Move API key to env var** | 10min | +1 (Tech) | CW #3, KC #3, OC #1, Kimi #4, OMP #6 |
| 5 | **Add ErrorBoundary around ChartResult** | 30min | +2 (Demo safety) | CW #5, KC #7, OMP #4 |
| 6 | **Add client-side timeout (35s) + retry button** | 30min | +1-2 (Demo safety) | OMP #5 |
| 7 | **Fix extractJson regex** — use balanced-brace or non-greedy | 15min | +1 (Demo reliability) | CW #4, OMP #7 |
| 8 | **Wire Dashboard.tsx** as landing view with view toggle | 2h | +4-6 (Demo+PMF) | ALL 5 agree |
| 9 | **Dynamic KPI stats from DB** | 30min | +1-2 (Demo/Tech) | CW #4, OC #3, KC #6, Kimi #5, OMP #3 |
| 10 | **Remove 7 dead dependencies** | 10min | +1 (Tech signal) | ALL 5 agree |
| 11 | **Add data table below chart** | 1h | +2-3 (Demo+PMF) | CW, OC, KC, Kimi, OMP |
| 12 | **Deploy to Railway** (time-boxed 2h) | 2h | +3-5 (Demo+Bonus) | ALL 5 agree |
| 13 | **Self-correction loop** in agent.ts | 2h | +3-5 (Innovation) | KC, Kimi, CW, OC |
| 14 | **Rehearse 3-min flow × 5, 5-min flow × 3** | 4h | +3-5 (Pitch+Demo) | ALL 5 agree |
| 15 | **PPT / slides** | 2h | +2-3 (Pitch) | KC, OMP, OC |
| 16 | **ClawHunt listing + 游园展示** | 1h | +3-5 (Bonus) | ALL 5 agree |

**Total estimated gain: +28-42 points → 88-98/105 achievable.**

---

## Q2: Innovation Narrative

### 1. Unanimous Findings

| Finding | Confidence |
|---------|-----------|
| **创新性 is the weakest dimension** (8-10/15 currently) — ALL 5 agree | HIGHEST |
| **Text2SQL is commodity** — ALL 5 cite Vanna.ai, ChatGPT, Dataherald, Julius AI as competitors | HIGHEST |
| **Need to push to 12-14/15** — ALL 5 agree on the target range | HIGHEST |
| **Revenue formula intelligence is already a differentiator** — CW, KC, Kimi, OMP all note the `SUM(oi.quantity*oi.unit_price*(1-oi.discount))` system prompt as domain knowledge | HIGH |

### 2. Key Disagreements

| Disagreement | Positions | My Assessment |
|---|---|---|
| **Primary innovation feature** | CW: Self-correction + "AI 数据分析师" framing, OC: AI Insight (2nd LLM call), KC: Self-Healing Agent, Kimi: Self-Correction + multi-view, OMP: "Metrics-as-Code" narrative | **KC's Self-Healing Agent is the strongest single feature.** It's technically impressive, visible in 3 minutes, and directly proves "agent, not translator." OC's AI Insight is a good second layer but adds latency. OMP's Metrics-as-Code is a framing, not a feature — it's the narrative wrapper, not the wow moment. |
| **Should innovation be code or narrative?** | CW: Mostly narrative (0h code, just framing), OC: Code (3h AI Insight), KC: Code (2h self-healing), Kimi: Both, OMP: Mostly narrative (2h framing) | **Both.** The self-correction loop is the code feature. The "指标即代码" framing is the narrative wrapper. They're complementary, not competing. |
| **How to demo innovation?** | CW: Show thinking trace + revenue formula in SQL, KC: Trigger SQL error → show self-correction, Kimi: Self-correction + multi-view dashboard, OMP: Show MetricSidebar save/replay flow | **KC's approach is best for live demo.** A visible error→correction loop is the clearest "wow" moment. CW's approach is the fallback if self-correction isn't implemented. |

### 3. Gaps All Auditors Missed

| Gap | Impact |
|-----|--------|
| **No auditor tested whether Kimi can actually self-correct SQL errors.** Everyone proposes the feature but nobody verified that Kimi v2.5 Pro reliably fixes SQL when given error context. If it can't, the demo backfires. | HIGH — need to test this before committing 2h to implementation |
| **The "wow moment" query selection is fragile.** KC suggests "哪些产品的退货率最高？" (no returns table). But if the agent generates a reasonable approximation (e.g., using review scores as proxy), there's no error to self-correct. Need a query that *reliably* fails first attempt. | MEDIUM — need to identify a reliable failure query |
| **Nobody addressed the "why not ChatGPT?" question's innovation angle.** All auditors prepare an answer, but none frame it as an innovation scoring opportunity. The answer should directly support the 创新性 dimension. | LOW-MEDIUM |

### 4. Prioritized Action List

| # | Action | Effort | Innovation Impact |
|---|--------|--------|-------------------|
| 1 | **Test Kimi's self-correction capability** — send a failing SQL + error to Kimi, see if it fixes reliably | 30min (test only) | Gate for all self-correction work |
| 2 | **Implement self-correction loop** in agent.ts (if test passes) | 2h | +3-5 pts |
| 3 | **Frame existing features as innovation** — "指标即代码" narrative for MetricSidebar, "domain knowledge" for revenue formula | 1h (narrative only) | +1-2 pts |
| 4 | **Pre-cache a "self-healing" demo result** as fallback | 30min | Insurance |
| 5 | **Prepare "why not ChatGPT?" answer** that scores innovation points | 30min | Q&A insurance |

---

## Q3: UI Overhaul Priorities

### 1. Unanimous Findings

| Finding | Confidence |
|---------|-----------|
| **Wire Dashboard.tsx into page.tsx** — ALL 5 agree this is the #1 UI action | HIGHEST |
| **Dashboard.tsx has color mismatch** (hardcoded slate vs CSS vars) — CW, KC, Kimi, OMP all flag this | HIGH |
| **Replace hardcoded STATS with real DB data** — ALL 5 agree | HIGH |
| **Add data table below chart** — ALL 5 agree | HIGH |
| **Don't rebuild from scratch** — ALL 5 agree current foundation is solid | HIGH |

### 2. Key Disagreements

| Disagreement | Positions | My Assessment |
|---|---|---|
| **Dashboard integration pattern** | CW: View toggle ("对话" / "看板"), KC: Tab navigation (Chat / Dashboard / Metrics), OC: Tab navigation, Kimi: Landing page + tabs, OMP: Landing page + tabs | **Landing page + view toggle is best.** Show Dashboard on load (first impression), toggle to Chat for queries. KC's 3-tab (Chat/Dashboard/Metrics) adds complexity without scoring benefit. 2 views suffice. |
| **Data table implementation** | CW: Collapsible `details` element, OC: Sortable table, KC: New DataTable.tsx component, Kimi: Collapsible table, OMP: Collapsible table | **Collapsible `details` is correct.** Quick to implement, doesn't clutter UI. Sortable is overkill for demo. |
| **Chart type toggle** | CW: Include (Tier 2), OC: Include (#9), KC: Don't list it, Kimi: Include, OMP: Include (#6) | **Skip it.** Nice-to-have but adds complexity. The demo shows one chart type per query — toggle is for product, not demo. |
| **KPI cards** | OC: Add KPI cards above dashboard, KC: Replace stats with KPI cards, Kimi: KPI Cards Row, OMP: Dynamic KPI cards, CW: Replace hardcoded stats | **All agree, but keep it simple.** 4 cards (orders, products, regions, users) from a single DB query. Don't over-engineer. |

### 3. Gaps All Auditors Missed

| Gap | Impact |
|-----|--------|
| **No auditor specified the Dashboard.tsx data source.** Dashboard.tsx expects `ChartConfig[]` and `data[]` props. Where does the data come from? Need a new `/api/dashboard` endpoint that runs all 4 cached queries and returns results, or import from demo-cache.ts directly. | HIGH — blocks Dashboard wiring |
| **Nobody addressed the MetricSidebar ↔ Dashboard interaction.** If Dashboard is the landing page and MetricSidebar is in the chat view, how do saved metrics appear on the Dashboard? Or do they only live in the chat view? Need to decide the UX. | MEDIUM |
| **Loading state for Dashboard initial load.** If Dashboard queries run on mount, there's a loading period. Need skeleton/shimmer for the 4 chart cards. | LOW-MEDIUM |

### 4. Prioritized Action List

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1 | **Create `/api/dashboard` endpoint** — runs 4 cached queries, returns results | 30min | Unblocks Dashboard |
| 2 | **Wire Dashboard.tsx as landing view** in page.tsx with "对话/看板" toggle | 1.5h | +4-6 (Demo+PMF) |
| 3 | **Fix Dashboard.tsx colors** — replace slate classes with CSS vars | 20min | Consistency |
| 4 | **Dynamic KPI stats** from DB (single query) | 30min | +1-2 (Demo) |
| 5 | **Data table below chart** (collapsible) | 1h | +2-3 (Demo+PMF) |
| 6 | **Loading skeleton** for chart area | 30min | Perceived quality |

---

## Q4: Demo Flow Design

### 1. Unanimous Findings

| Finding | Confidence |
|---------|-----------|
| **Use chips first, typed queries last** — chips are cached/guaranteed, typed queries are risky | HIGHEST |
| **Have a fallback plan for Kimi API** — all 5 prepare cached result fallback | HIGHEST |
| **Rehearse with stopwatch** — all 5 emphasize this | HIGHEST |
| **Show the SQL / thinking trace** — all 5 include expanding the reasoning panel | HIGH |
| **3-min flow for 赛区预选, 5-min flow for Demo Day** — all 5 agree on split | HIGH |

### 2. Key Disagreements

| Disagreement | Positions | My Assessment |
|---|---|---|
| **3-min opening** | CW: Problem statement (no app), OC: Dashboard landing, KC: Problem statement, Kimi: Dashboard landing, OMP: Dashboard landing | **Dashboard landing for 赛区预选** (3/5 agree). Judges see 6 teams — visual impact in first 5 seconds wins. Save narrative for Demo Day. |
| **Demo Day opening** | CW: Problem statement, OC: Problem statement, KC: Problem statement with mock Slack, Kimi: Expanded pain point, OMP: Market context | **CW/KC approach.** Problem statement → solution → depth → value. KC's "mock Slack conversation" idea is creative but risky (extra prep). Keep it simple. |
| **When to show self-correction** | CW: Not in 3-min flow, KC: 5-min flow at 3:00-3:30, Kimi: 5-min flow at 2:00-2:40, OMP: Not in either flow, OC: 3-min flow at 2:20-2:50 | **5-min flow only.** Self-correction is too risky for 3-min. In 5-min, place it after the core demos (minute 3-3:30) as the "wow" moment. |
| **Typed live query** | CW: "复购率最高的用户是谁？" at 1:15-1:50, KC: Freeform (judge picks) at 1:20-1:50, Kimi: "复购率最高的用户是谁？" at 2:00-2:30, OMP: "复购率最高的用户是谁？" at 1:20-1:50 | **Use a pre-tested query, not judge's choice.** KC's "judge picks" is high-risk. "复购率" is good — tests multi-table join understanding. But have a cached fallback ready. |

### 3. Gaps All Auditors Missed

| Gap | Impact |
|-----|--------|
| **No auditor specified the exact pre-demo warm-up sequence.** All mention "warm up" but nobody gives a concrete checklist with timing. | MEDIUM — a cold start during demo is embarrassing |
| **Nobody addressed the "what if the chart looks wrong?" scenario.** If the AI generates a chart that looks off (wrong aggregation, missing data), the presenter needs a graceful pivot strategy. | MEDIUM |
| **No auditor prepared for the Q&A "show me the code" scenario.** If a technical judge asks to see agent.ts, the hardcoded API key is visible. This is a MUST fix before demo, not just a SHOULD. | MEDIUM — ties to Q5 |

### 4. Prioritized Action List

| # | Action | Effort |
|---|--------|--------|
| 1 | **Write concrete 3-min script** with exact timing, talking points, and fallback triggers | 1h |
| 2 | **Write concrete 5-min script** with narrative arc | 1h |
| 3 | **Rehearse 3-min × 5** with stopwatch | 2.5h |
| 4 | **Rehearse 5-min × 3** with stopwatch | 2.5h |
| 5 | **Pre-test all typed queries** — verify "复购率" works, have cached fallback | 30min |
| 6 | **Create warm-up script** — hit /api/chat with trivial query 2 min before demo | 15min |
| 7 | **Prepare Q&A answers** for top 5 expected questions | 30min |

---

## Q5: Technical Debt Triage

### 1. Unanimous Findings

| Finding | Confidence |
|---------|-----------|
| **DB singleton in query/route.ts MUST be fixed** — ALL 5 agree | HIGHEST |
| **API key hardcoded SHOULD/MUST be fixed** — ALL 5 agree (CW: MUST, others: SHOULD) | HIGHEST |
| **Dead dependencies SHOULD be removed** — ALL 5 agree | HIGH |
| **`extractJson` regex is fragile** — CW (MUST), OC (MUST), OMP (SHOULD). KC says CAN ignore. Kimi doesn't prioritize. | HIGH (3/5 say MUST/SHOULD) |
| **No conversation memory, no streaming, no dark mode — CAN ignore** — ALL 5 agree | HIGH |

### 2. Key Disagreements

| Disagreement | Positions | My Assessment |
|---|---|---|
| **Metric rerun bug severity** | KC: MUST fix (demo-breaking), OC: SHOULD fix (#9, #10), Kimi: MUST fix (#2), OMP: not mentioned, CW: not mentioned | **KC and Kimi are right — it's MUST fix.** If the presenter saves a metric, then chats, then tries to rerun the metric — nothing happens. This breaks the core demo flow (save → rerun). |
| **LLM timeout: 30s vs 15s** | CW: MUST reduce to 15s. All others: don't flag it. | **CW is partially right.** 30s is too long for a spinner, but the cached fallback already handles this — if the API takes >10s, the cache kicks in. The timeout is a secondary concern. Reduce to 15s only if it's a 2-min change. |
| **Error boundary priority** | CW: MUST (#5), KC: SHOULD (#7), OC: not in MUST, Kimi: not in MUST, OMP: MUST (#4) | **It's SHOULD, not MUST.** Charts render fine for the 4 cached queries. Error boundary is insurance for unexpected data shapes. Worth 30min but not blocking. |
| **`/api/schema` endpoint** | CW: CAN ignore, KC: CAN ignore (#13), OC: SHOULD delete (#7), Kimi: CAN ignore, OMP: CAN ignore | **Leave it.** Dead but harmless. Deleting it is a code change that could introduce import errors. Not worth the risk. |
| **chart_config vs chartConfig naming** | OC: SHOULD fix (#6), OMP: SHOULD fix (#7), Kimi: SHOULD fix, CW: SHOULD fix (#11), KC: not mentioned | **Fix it if time permits (15min).** Normalize to camelCase at the API boundary. Low priority but clean. |

### 3. Gaps All Auditors Missed

| Gap | Impact |
|-----|--------|
| **`handleRunMetric` error swallowing** — KC flags `page.tsx:33` `.catch(() => {})`. OC also flags it. But CW, Kimi, OMP don't mention it. If metric rerun fails silently, the demo looks frozen. | MEDIUM — add error toast |
| **Metric rerun `history.length === 0` guard** — KC flags this as the specific line (ChatPanel.tsx:262). This is the root cause of the "metric rerun invisible" bug. Only KC and Kimi identify the exact line. | HIGH — this is the specific fix needed |
| **No input validation on /api/chat message** — Kimi flags this (MUST #4). Empty input crashes agent. Nobody else mentions it. | LOW — trivial fix (5min), prevents edge case |
| **node-sql-parser rejects some SQLite syntax** — OC flags this (#19 CAN ignore). If a judge types a query with CTEs or window functions, the validator rejects it. Low risk for rehearsed demo but could bite if judges go off-script. | LOW |

### 4. Prioritized Action List (MUST → SHOULD → CAN IGNORE)

**MUST Fix (1.5h total):**
| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| 1 | Metric rerun invisible (ChatPanel.tsx:262) | Remove `history.length === 0` guard | 15min |
| 2 | Metric rerun drops thinking/explanation | Pass full result in handleRunMetric | 15min |
| 3 | DB singleton in query/route.ts | Import getDb from db.ts | 10min |
| 4 | API key hardcoded | Move to process.env.KIMI_API_KEY | 10min |
| 5 | extractJson greedy regex | Balanced-brace extraction | 15min |
| 6 | Client-side timeout (35s) + retry | AbortController in handleSubmit | 30min |

**SHOULD Fix (1.5h total):**
| # | Issue | Fix | Effort |
|---|-------|-----|--------|
| 7 | Dead dependencies (7 packages) | npm uninstall | 10min |
| 8 | Error boundary on ChartResult | React ErrorBoundary | 30min |
| 9 | Hardcoded stats bar | Query real DB counts | 30min |
| 10 | handleRunMetric error swallowing | Add error state/toast | 10min |
| 11 | chart_config normalization | camelCase at API boundary | 15min |

**CAN IGNORE:**
No conversation memory, no streaming, no dark mode, no tests, /api/schema unused, no mobile responsive, no input length limit.

---

## Q6: Deployment Decision

### 1. Unanimous Findings

| Finding | Confidence |
|---------|-----------|
| **Railway is the correct platform** (not Vercel — better-sqlite3 incompatible) — ALL 5 agree | HIGHEST |
| **Keep localhost as fallback** — ALL 5 agree | HIGHEST |
| **ClawHunt bonus (+3) requires a public URL** — ALL 5 agree | HIGH |
| **Deploy the night before, not demo day** — ALL 5 agree | HIGH |

### 2. Key Disagreements

| Disagreement | Positions | My Assessment |
|---|---|---|
| **Deployment timing in 30h budget** | CW: Night before (Plan B), OC: After UI work (hour 10-13), KC: After bug fixes (Block 3), Kimi: After bugs + UI (hour 4-6), OMP: Hour 4-6 | **Deploy after MUST fixes + Dashboard wiring, before rehearsal.** Roughly hour 6-8. This gives time to debug if it fails, and doesn't block the highest-impact code work. |
| **Time estimate** | CW: 1.5h, OC: 2-3h, KC: 1.5h (1h + 30min contingency), Kimi: 2-3h, OMP: 2-3h | **1.5-2h with Dockerfile, 30min without.** If better-sqlite3 compiles cleanly on Railway, it's fast. If not, Dockerfile adds 30-60min. |
| **Vercel+Turso as alternative** | OC: Lists it as Option C (4-6h), others: don't consider it | **OC is right to list it, but wrong to consider it.** 4-6h migration is too expensive for the same +3 pts Railway gives in 2h. Only if Railway completely fails. |
| **Localtunnel as primary** | Nobody recommends it as primary, but CW suggests it as emergency fallback for ClawHunt | **CW is right.** If Railway fails, `npx localtunnel --port 3456` gets a public URL for ClawHunt submission, even if it's ugly. |

### 3. Gaps All Auditors Missed

| Gap | Impact |
|-----|--------|
| **Nobody specified the Dockerfile content.** CW provides a Dockerfile snippet but nobody else does. If better-sqlite3 fails on Railway's default buildpack, the Dockerfile is the fix. Should be prepared in advance, not debugged on demo eve. | MEDIUM |
| **Nobody addressed the SQLite data persistence on Railway.** Railway's ephemeral filesystem means `data/ecommerce.db` resets on every deploy. Need to either: (a) commit the DB file to the repo, or (b) run seed script on deploy, or (c) use a Railway volume. | HIGH — if DB is empty on Railway, demo fails |
| **Nobody mentioned testing Railway from a different network.** If the demo machine is on venue WiFi, need to verify Railway is accessible from that network. | LOW-MEDIUM |

### 4. Prioritized Action List

| # | Action | Effort |
|---|--------|--------|
| 1 | **Commit `data/ecommerce.db` to repo** (verify .gitignore doesn't exclude it) | 5min |
| 2 | **Prepare Dockerfile** with build tools for better-sqlite3 | 15min |
| 3 | **Deploy to Railway** — connect repo, set env vars | 30min |
| 4 | **Test all 4 cached queries on Railway URL** | 30min |
| 5 | **Register on ClawHunt** with public URL | 15min |
| 6 | **Set up localtunnel as emergency backup** | 10min |
| 7 | **Time-box: if not working by 2h, abandon and go localhost** | — |

---

## Cross-Examination Summary

### What Changed My Mind

`CHANGED: Current baseline score estimate from 75-85 to 62-75 BECAUSE CW verified the DB singleton fix was incomplete (query/route.ts still creates new Database() per request) and timeout wasn't reduced. Other auditors (including my R1) estimated from PROJECT-MEMO's "completed" list, not from reading the actual code.`

`CHANGED: Metric rerun bug priority from SHOULD to MUST BECAUSE KC identified the exact line (ChatPanel.tsx:262) and explained the demo-breaking scenario: save metric → chat → try to rerun metric → nothing happens. This breaks the core "save → rerun" demo flow.`

`CHANGED: Demo opening strategy — now recommend Dashboard landing for 赛区预选 (not problem statement) BECAUSE OC, Kimi, and OMP all argue that with 6 teams × 3 minutes each, judges need visual impact in the first 5 seconds. Problem statement is for Demo Day's 5-minute flow.`

### Highest-Confidence Recommendations

1. **Fix metric rerun bug first** (30min) — it's the cheapest demo-breaking fix
2. **Wire Dashboard.tsx second** (2h) — biggest visual transformation
3. **Test self-correction feasibility** (30min) — gate for all innovation work
4. **Deploy to Railway** (2h, time-boxed) — +3 bonus points for ClawHunt
5. **Rehearse relentlessly** (5h) — the difference between 75 and 90 is rehearsal, not code

### Final Score Projection

| Scenario | Score |
|----------|-------|
| Current state (verified) | 62-75 |
| + MUST fixes (Q5) | 68-80 |
| + Dashboard + KPI + data table (Q3) | 76-88 |
| + Self-correction narrative (Q2) | 80-92 |
| + Railway + ClawHunt (Q6) | 83-95 |
| + Rehearsed demo + PPT (Q4) | 88-98 |

**Ceiling: ~98/105.** The remaining 7 points require real user traction or a fundamentally novel feature beyond self-correction — neither feasible in 30 hours.

---

*Cross-examination complete. Written by Kimi — 2026-07-04.*

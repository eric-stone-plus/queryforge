# R2 Cross-Examination: QueryForge Final Polish

**Reviewer:** OMP (mimo-v2.5-pro)
**Date:** 2026-07-04
**Inputs:** 5 R1 artifacts (CW, OC, KC, MiMo, OMP), task.md, 10 source files

---

## Participant Legend

| ID | Auditor | Key Strength |
|----|---------|-------------|
| A | CodeWhale (CW) | Line-by-line code verification, caught P0 gaps others missed |
| B | OpenCode (OC) | Balanced scoring, practical effort estimates |
| C | Kilo Code (KC) | Conservative/reliability-first, strong demo script |
| D | MiMo | Clean prioritization tables, risk-aware |
| E | OMP (self) | "指标即代码" narrative, implementation detail |

---

## Q1: Score Maximization Strategy

### 1. Unanimous Findings (5/5 or 4/5 agree)

| Finding | Agreement | Confidence |
|---------|-----------|------------|
| Wire Dashboard.tsx into page.tsx is the #1 or #2 highest-ROI action | **5/5** | HIGHEST |
| 创新性 (15pts) is the weakest dimension, biggest upside | **5/5** | HIGHEST |
| ClawHunt + 游园展示 = guaranteed +5 bonus points | **4/5** (KC ranks it lower at #15, OC ranks it #5) | HIGH |
| Dead dependency cleanup is a quick win (~10min) | **5/5** | HIGH |
| Demo rehearsal is high-ROI for 路演表达 (10pts) | **5/5** | HIGH |
| Current score estimate: 72-85/105 as-is | **5/5** (range varies: CW says 72-78, others say 75-85) | HIGH |

### 2. Key Disagreements

**A. Current score baseline: 72-78 vs 75-85**

- **CW (A)** says 72-78, citing the incomplete DB singleton fix and 30s timeout as evidence others missed
- **All others** say 75-85, treating P0 as "mostly done"

**My assessment:** CW is more rigorous here. The `query/route.ts` DB singleton gap is a real bug that could cause SQLite locks under demo load. The 30s timeout is less critical — 15s vs 30s matters for UX but won't crash the demo. I'll adopt **73-82** as the corrected baseline, splitting the difference with CW's evidence weighted more heavily.

`CHANGED: 75-85 baseline BECAUSE CW (Participant A) verified in actual source code that query/route.ts still creates new DB instances per request, and the R3 verdict specified 15s timeout not 30s.`

**B. Innovation feature priority: Self-correction vs AI Insight vs "指标即代码" narrative**

| Auditor | Recommended Innovation Approach | Effort |
|---------|-------------------------------|--------|
| CW (A) | Self-correction loop + revenue formula narration | 3h |
| OC (B) | AI Insight (2nd LLM call) + Self-correction | 5h |
| KC (C) | Self-Healing Agent (Strategy A) + Domain Reasoning (B) | 4h |
| MiMo (D) | Self-Correction + Multi-view (Dashboard) | 2h+ |
| OMP (E) | "指标即代码" narrative framing + reasoning chain | 2h |

**My assessment:** There's a convergence on **self-correction** as the best "code-level" innovation. But the auditors split on whether to *build* a feature or *narrate* existing ones. CW's "alternative if time is tight" — zero-code narration of the existing reasoning chain + revenue formula — is the highest-confidence path. OC's "AI Insight Layer" (2nd LLM call) is the most ambitious but adds latency and failure modes.

**Recommended synthesis:** Build the self-correction loop (2h, low risk since it only triggers on failure) + use OMP's "指标即代码" framing for the pitch. Skip the 2nd LLM call — it adds latency without guaranteed demo payoff.

**C. Time allocation: conservative (KC) vs aggressive (OC/MiMo)**

- **KC** allocates 11h to sleep/break and 6.2h buffer — extremely conservative, only 12.8h of actual work
- **OC** allocates 9.5h buffer but still plans ~20.5h of work
- **MiMo** plans 18h of work across 4 phases
- **CW** plans ~18.5h of work + 11h sleep
- **OMP** plans 15h of work across 6 phases

**My assessment:** KC's conservatism is admirable but wasteful — 11h sleep is reasonable but 6.2h debug buffer is excessive for a demo with 4 cached fallbacks. CW's allocation (including explicit sleep time) is the most realistic. OMP's plan is tight but achievable if nothing breaks.

### 3. Gaps All Auditors Missed

1. **No one verified the seed data matches the hardcoded stats.** The `STATS` array claims "10,000+ 订单" — does `scripts/seed.ts` actually create 10,000 orders? If it creates 5,000, the hardcoded stats are a lie judges could catch. **Action: verify seed.ts row counts.**

2. **No one addressed the `require()` in query/route.ts:20 as a separate issue from DB singleton.** OC caught it but folded it into the DB singleton fix. The `require()` call is a CJS import in an ESM Next.js route — it works but signals poor engineering if judges read the code.

3. **No one discussed the demo laptop setup.** What browser? What resolution? What if the projector has a different aspect ratio? The sidebar is `hidden lg:flex` — on a 1024px projector it might be cut off. **Action: test on the actual demo screen resolution.**

4. **No one counted the total LLM calls per demo.** If self-correction is added, one failed query = 2 LLM calls. With MiMo rate limits, running 5 demo queries (some failing) could hit throttling. **Action: verify MiMo rate limits before demo.**

### 4. Prioritized Action List (Q1 consolidated)

| # | Action | Effort | Score Impact | Source |
|---|--------|--------|-------------|--------|
| 1 | Fix query/route.ts DB singleton + timeout 30→15s + API key → env | 15min | +2-3 (Demo safety) | CW (A) |
| 2 | Wire Dashboard.tsx as landing view with tab toggle | 2h | +4-6 (Demo+PMF) | 5/5 unanimous |
| 3 | ClawHunt 上架 + 游园展示 | 30min | +5 (bonus) | 4/5 |
| 4 | Dynamic KPI stats from DB | 1h | +1-2 (Demo) | 4/5 |
| 5 | ErrorBoundary + loading timeout | 1h | +2 (Demo safety) | CW, OC, OMP |
| 6 | Self-correction loop in agent.ts | 2h | +3-4 (Innovation) | CW, OC, KC, MiMo |
| 7 | "指标即代码" narrative + demo script | 2h | +2-3 (Pitch+Innovation) | OMP |
| 8 | Dead dep cleanup + chart_config normalization | 20min | +1 (Tech signal) | 5/5 |
| 9 | Rehearse 3-min × 5, 5-min × 3 | 4h | +3-4 (Demo+Pitch) | 5/5 |
| 10 | PPT / slides | 2h | +1-2 (Pitch) | OC, KC, OMP |
| 11 | Deploy to Railway | 1.5h | +2 (Demo+Business) | 4/5 |

**Total: ~16.5h of work + 4h rehearsal + 2h PPT = ~22.5h.** Fits in 30h with buffer.

---

## Q2: Innovation Narrative

### 1. Unanimous Findings

| Finding | Agreement |
|---------|-----------|
| Text2SQL is commodity — 创新性 is the ceiling-limiter | **5/5** |
| Current 创新性 estimate: 7-10/15 | **5/5** |
| Need to reach 12-14/15 to be competitive | **5/5** |
| The existing thinking trace (reasoning chain) is underutilized in demos | **4/5** |
| Revenue formula intelligence (SUM not total_amount) is a real differentiator | **4/5** |

### 2. Key Disagreements

**A. OMP's "指标即代码" vs everyone else's "Self-Correction"**

OMP (me) proposed "指标即代码" (Metrics-as-Code) as the primary innovation narrative. The other 4 auditors all converged on self-correction as the primary code feature.

**My revised position:** The other auditors are right that **self-correction is more technically impressive in a 3-minute demo.** "指标即代码" is a better *product* narrative but requires more explanation. The synthesis is:

- **Demo wow moment:** Self-correction loop (visible, dramatic, 2h to build)
- **Pitch narrative:** "指标即代码" (conceptual, differentiating, 0h to implement)
- **Both work together:** "It's an agent that fixes its own mistakes AND builds a reusable metric knowledge base."

**B. KC's "Domain-Aware Reasoning" (zero-cost) vs OC's "AI Insight Layer" (3h)**

KC argues the revenue formula intelligence is already built — just narrate it. OC argues for a 2nd LLM call to generate business insights.

**My assessment:** KC is right. The 2nd LLM call adds 3-5s latency per query, needs caching for demo, and risks producing generic/low-quality output under time pressure. The revenue formula narration is free and already works. **However**, OC's insight layer is a stronger *product* feature for Demo Day's 5-minute flow where there's more time.

**Compromise:** Skip the 2nd LLM call for 赛区预选 (3min). Consider it for Demo Day (5min) only if self-correction is already working.

**C. MiMo's "Metric Memory" (Option B) — unloved but interesting**

MiMo proposed injecting saved metrics into the system prompt so the agent "remembers" previous queries. None of the other auditors picked this up.

**My assessment:** This is actually a clever, low-effort innovation (~1.5h) that directly supports the "指标即代码" narrative. If the agent can say "您之前保存过类似指标" when a user asks a related question, it's a genuine differentiator. **But** it requires multi-turn context awareness that doesn't exist yet. Deprioritize for 赛区预选; consider for Demo Day.

### 3. Gaps All Auditors Missed

1. **No one discussed the judges' likely technical background.** Are they VCs who care about market size? Engineers who'll inspect the code? Product managers who care about UX? The innovation pitch should be tailored to the actual audience. **Action: find out who the judges are.**

2. **No one proposed a "fail gracefully" innovation narrative.** If the self-correction loop fails to fix the SQL, what happens? The demo looks *worse* than without it. Every auditor assumes the retry succeeds. **Action: pre-cache a self-correction demo result as insurance.**

3. **No one connected the innovation narrative to the 商业潜力 (10pts) dimension.** "指标即代码" directly supports the business pitch: "Teams build metric libraries → institutional knowledge → SaaS stickiness." This cross-dimensional scoring is high-leverage.

### 4. Prioritized Action List (Q2 consolidated)

| # | Action | Effort | Innovation Δ | Confidence |
|---|--------|--------|-------------|------------|
| 1 | Build self-correction loop (SQL fail → retry with error) | 2h | +3-4 pts | HIGH |
| 2 | Pre-cache a self-correction demo result as fallback | 30min | Insurance | HIGH |
| 3 | Adopt "指标即代码" as the pitch narrative | 0h (framing only) | +1-2 pts | HIGH |
| 4 | Emphasize revenue formula intelligence in demo narration | 0h | +1-2 pts | HIGH |
| 5 | Consider AI Insight Layer for Demo Day only | 3h | +2-3 pts | MEDIUM |

---

## Q3: UI Overhaul Priorities

### 1. Unanimous Findings

| Finding | Agreement |
|---------|-----------|
| Wire Dashboard.tsx is the #1 UI change | **5/5** |
| Dashboard.tsx color mismatch (hardcoded slate vs CSS vars) needs fixing | **5/5** |
| Hardcoded STATS bar must become dynamic or be removed | **5/5** |
| Data table below chart is a valuable addition | **4/5** |
| Do NOT add dark mode toggle | **4/5** (OC lists it as low priority, others say skip) |
| Do NOT rebuild UI from scratch | **5/5** |
| Do NOT add auth/multi-user | **5/5** |

### 2. Key Disagreements

**A. Dashboard as landing page vs tab toggle**

- **OC, MiMo, OMP:** Dashboard should be the **landing page** (first impression = dashboard)
- **CW, KC:** Dashboard should be a **tab toggle** (Chat / Dashboard)

**My assessment:** Landing page is better for the 3-minute demo — judges see 4 charts immediately, no explanation needed. Tab toggle is better for the 5-minute Demo Day where you want to show the chat→dashboard progression. **Solution:** Default to dashboard landing, toggle to chat when typing a query.

**B. Tab navigation (KC) vs view toggle (CW)**

KC proposes a 3-tab layout (Chat / Dashboard / Metrics). CW proposes a 2-button toggle (对话 / 看板).

**My assessment:** 2 tabs is enough. A "Metrics" tab duplicates the sidebar. Don't over-engineer the navigation for a demo.

**C. Chart type toggle priority**

- **OC, CW, OMP:** Include it (interactive, shows flexibility)
- **KC, MiMo:** Don't prioritize it (time sink, marginal demo value)

**My assessment:** Skip it for 赛区预选. The 5-minute Demo Day flow has time to show chart switching, but it's not worth building until the core is solid. If it takes 1h as estimated, it's a Phase 3 nice-to-have.

### 3. Gaps All Auditors Missed

1. **No one specified the exact Dashboard.tsx data source.** Where do the 4 chart datasets come from? OC suggests a new `/api/dashboard` endpoint. OMP suggests the same. But no one verified whether the 4 cached demo queries in `demo-cache.ts` can be reused directly, avoiding a new API call entirely. **Action: check if demo-cache data is compatible with Dashboard.tsx's ChartConfig format.**

2. **No one addressed the ChartConfig type conflict.** CW flagged it: Dashboard.tsx has `nameKey`, `valueKey` fields that ChatPanel's ChartConfig doesn't. This needs resolution before wiring. **Effort: 15-30min to unify types.**

3. **No one discussed the sidebar collapse behavior on the dashboard view.** If the dashboard is full-width, the MetricSidebar takes 25% of the screen. Should it collapse? Auto-hide? **Action: hide sidebar when dashboard is active, show when in chat mode.**

### 4. Prioritized Action List (Q3 consolidated)

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1 | Unify ChartConfig type (resolve Dashboard vs ChatPanel conflict) | 15min | Prerequisite |
| 2 | Wire Dashboard.tsx as landing page with 4 pre-cached charts | 2h | HIGH |
| 3 | Replace hardcoded STATS with real DB counts via /api/stats | 1h | HIGH |
| 4 | Data table below chart (collapsible `<details>`) | 1h | MEDIUM |
| 5 | Loading skeleton for chart area | 30min | MEDIUM |
| 6 | ErrorBoundary around ChartResult | 15min | HIGH (safety) |
| 7 | CSV export button | 20min | LOW |
| 8 | Dark mode toggle | 30min | LOW (skip if tight) |

---

## Q4: Demo Flow Design

### 1. Unanimous Findings

| Finding | Agreement |
|---------|-----------|
| Chips first, typed query last (risk management) | **5/5** |
| Pre-cache all demo queries as fallback | **5/5** |
| Rehearse with a stopwatch | **5/5** |
| Show the thinking trace / reasoning chain | **5/5** |
| Never apologize for API slowness — use cache and move on | **4/5** (CW explicitly says "Never apologize") |
| Phone hotspot as WiFi backup | **3/5** |

### 2. Key Disagreements

**A. 3-minute flow structure: hook-first vs app-first**

- **CW, KC:** Speak first (15-20s hook), then open app
- **OC, OMP:** Open app with dashboard pre-loaded (show, don't tell)
- **MiMo:** Brief hook (20s), then intro, then demo

**My assessment:** CW and KC are right — a 15-second spoken hook before showing the app creates narrative tension. Opening with a pre-loaded dashboard is impressive but doesn't establish *why* the audience should care. **Sequence: Hook (15s) → Dashboard reveal (15s) → First chip query.**

**B. Freeform query position in 3-minute flow**

- **CW:** Position 4 of 6 (1:15-1:50) — middle of demo
- **KC:** Position 3 of 7 (1:20-1:50) — middle
- **OC:** Position 3 of 7 (1:20-1:50) — middle
- **MiMo:** Position 4 of 5 (2:00-2:30) — late
- **OMP:** Position 3 of 6 (1:20-1:50) — middle

**Consensus:** Place the freeform query in the middle, not at the end. If it fails, there's time to recover with saved metrics and dashboard view.

**C. Self-correction in the 3-minute flow**

- **OC:** Include it as the "wow moment" (2:20-2:50)
- **MiMo:** Include it in 5-min flow only, not 3-min
- **CW, KC, OMP:** Don't include it in 3-min flow (too risky)

**My assessment:** Don't include live self-correction in the 3-minute flow. The risk of it failing (or taking 30s) is too high. Save it for the 5-minute Demo Day where there's buffer time. For 赛区预选, show the thinking trace as the "wow moment" instead.

### 3. Gaps All Auditors Missed

1. **No one specified the exact typed query for the freeform demo.** "复购率最高的用户是谁？" is proposed by multiple auditors, but no one verified it works with the current schema. **Action: test this exact query against the SQLite database before demo.**

2. **No one discussed Q&A preparation.** The 赛区预选 has Q&A after the 3-minute demo. What questions will judges ask? Common ones: "Why not ChatGPT?", "How do you handle SQL injection?", "What's your business model?" **Action: prepare 10 Q&A answers.**

3. **No one discussed the demo environment.** Is it a projector? A TV screen? The presenter's laptop? Resolution affects whether the sidebar is visible. **Action: confirm demo setup and test at the actual resolution.**

4. **No one addressed the "pre-warm" timing.** CW suggests hitting `/api/chat` 30s before demo. But if MiMo cold-starts, the first call could take 15-30s. **Action: pre-warm 2-3 minutes before, not 30 seconds.**

### 4. Prioritized Action List (Q4 consolidated)

| # | Action | Effort |
|---|--------|--------|
| 1 | Test "复购率最高的用户是谁？" against actual DB | 5min |
| 2 | Write 3-min and 5-min demo scripts with exact timings | 1h |
| 3 | Prepare 10 Q&A answers | 1h |
| 4 | Rehearse 3-min flow × 5 with stopwatch | 2.5h |
| 5 | Rehearse 5-min flow × 3 with stopwatch | 2.5h |
| 6 | Pre-warm MiMo API 2-3 min before demo | 0h |
| 7 | Confirm demo environment (projector, resolution) | 0h |

---

## Q5: Technical Debt Triage

### 1. Unanimous Findings

| Finding | Agreement |
|---------|-----------|
| `/api/query` DB singleton must be fixed (new Database per request) | **5/5** |
| API key hardcoded in agent.ts must move to env var | **5/5** |
| Dead dependencies must be removed (~7 packages) | **5/5** |
| Metric rerun `history.length === 0` guard is a demo-breaking bug | **4/5** (OC, KC, MiMo, OMP; CW lists it under SHOULD) |
| No streaming response can be ignored | **5/5** |
| No conversation memory can be ignored | **5/5** |
| No dark mode toggle can be ignored | **5/5** |
| No test suite can be ignored | **5/5** |

### 2. Key Disagreements

**A. Metric rerun visibility: MUST or SHOULD?**

- **OC, KC, MiMo, OMP:** MUST fix — demo-breaking
- **CW:** SHOULD fix — listed under "Visible Quality Signal"

**My assessment:** It's MUST. If the presenter saves a metric, then runs a query, then clicks the saved metric — and nothing happens — the demo flow is broken. CW may have classified it lower because the demo script can be designed to avoid this scenario (save metric → rerun before any other query), but that's fragile. Fix it.

**B. Timeout: 30s acceptable or must reduce to 15s?**

- **CW:** MUST reduce to 15s (30s is catastrophic for live demo)
- **OC, KC, MiMo, OMP:** 30s is acceptable (not listed as MUST)

**My assessment:** 30s is acceptable if the cached fallback is working. The cache triggers on API error, and a timeout *is* an error — so the fallback kicks in. The real risk is the 25-30s dead time before the fallback activates. A 15s timeout + fallback is better UX. **But** reducing to 15s could cause premature timeouts on slow API responses. **Compromise: 20s.** Not a MUST fix — SHOULD.

**C. `extractJson` greedy regex: MUST or CAN IGNORE?**

- **CW, OC:** MUST fix — parsing breaks with markdown fences
- **KC:** CAN IGNORE — works for all 4 demo queries
- **MiMo, OMP:** SHOULD fix

**My assessment:** KC is right for the 3-minute demo — the 4 cached queries all work. But for the freeform typed query, the regex is a real risk. If the self-correction loop is added, the retry prompt might produce different JSON formatting. **Fix it if implementing self-correction; ignore otherwise.**

**D. ErrorBoundary: MUST or SHOULD?**

- **CW, OMP:** MUST (chart crash = white screen)
- **OC, KC, MiMo:** SHOULD or not mentioned

**My assessment:** MUST. A white screen during a live demo is unrecoverable. Even if the chart never crashes in testing, a React ErrorBoundary is 15 minutes of insurance. Non-negotiable.

### 3. Gaps All Auditors Missed

1. **No one checked if `npm uninstall` breaks the build.** Some "dead" packages might be transitive dependencies. OC lists `tailwind-merge` as dead but CW correctly notes it's imported in components. **Action: uninstall one at a time, verify build after each.**

2. **No one discussed the `node-sql-parser` CTE/window function limitation.** OC mentions it in CAN IGNORE. But if a judge asks "show me year-over-year growth" — a window function query — the parser rejects it. **Action: know this limitation and have a canned response.**

3. **No one addressed the `require("better-sqlite3")` in query/route.ts as an ESM violation.** It works but is technically incorrect in a Next.js App Router context. It's not demo-breaking but signals poor engineering. **Fix as part of the DB singleton fix (import from db.ts).**

### 4. Prioritized Action List (Q5 consolidated)

| # | Issue | Category | Effort | All Agree? |
|---|-------|----------|--------|------------|
| 1 | Fix query/route.ts DB singleton (→ import from db.ts) | MUST | 5min | 5/5 |
| 2 | Fix metric rerun `history.length === 0` guard | MUST | 10min | 4/5 |
| 3 | Add ErrorBoundary around ChartResult | MUST | 15min | 2/5 (CW, OMP) |
| 4 | Move API key to process.env | MUST | 5min | 5/5 |
| 5 | Add error handling for metric rerun (empty catch) | MUST | 5min | 3/5 |
| 6 | Remove 7 dead dependencies | SHOULD | 10min | 5/5 |
| 7 | Fix extractJson regex (if adding self-correction) | SHOULD | 10min | 3/5 |
| 8 | Normalize chart_config vs chartConfig | SHOULD | 15min | 3/5 |
| 9 | Remove or wire /api/schema | SHOULD/CAN | 2min | 3/5 |

**Total MUST: ~40min. Total SHOULD: ~50min. Total: ~1.5h.**

---

## Q6: Deployment Decision

### 1. Unanimous Findings

| Finding | Agreement |
|---------|-----------|
| Railway is the correct choice (not Vercel) due to better-sqlite3 native module | **5/5** |
| Vercel + Turso migration is too risky in 30h | **5/5** |
| Localtunnel is the fallback, not the plan | **5/5** |
| ClawHunt bonus (+3pts) requires a public URL | **4/5** |
| Deploy the night before, not the morning of | **4/5** (CW says "night before as backup") |

### 2. Key Disagreements

**A. Deployment timing: Phase 1 (early) vs Phase 5 (late)**

- **OMP:** Deploy in Phase 5 (hours 11-13) — after features and rehearsal
- **CW:** Deploy "the night before, as backup"
- **OC:** Deploy in hours 4-6 (attempt early)
- **MiMo:** Deploy in hours 4-6

**My assessment:** OC and MiMo are right — **deploy early.** If Railway fails on `better-sqlite3`, you need time to pivot. Deploying at hour 4 means 26h of buffer. Deploying the night before means 0h buffer. The argument for deploying late is "don't waste time on deployment if the code isn't ready" — but the code works locally, and deployment is independent of feature development.

`CHANGED: Deploy at hour 4-6, not hour 11-13 BECAUSE OC and MiMo correctly identified that early deployment gives maximum pivot time if better-sqlite3 fails on Railway.`

**B. Railway effort estimate: 1.5h vs 2-3h**

- **CW, KC:** 1.5h
- **OC, MiMo:** 2-3h
- **OMP:** 2h

**My assessment:** 2h is realistic. The `better-sqlite3` native module is the wildcard — if it works out of the box, 1h. If it needs Nixpacks configuration, 3h. Budget 2h and have a hard cutoff: if not working by hour 6, fall back to localtunnel.

### 3. Gaps All Auditors Missed

1. **No one discussed Railway's SQLite persistence model.** Railway containers are ephemeral — the SQLite file resets on every redeploy. Options: (a) Railway persistent volume ($), (b) re-seed on every deploy via `railway run npm run seed`, (c) bundle the DB file in the image. **Action: research Railway volumes before deploying.**

2. **No one mentioned the MiMo API key on Railway.** The key needs to be set as a Railway environment variable. If the `.env.local` issue (mentioned in PROJECT-MEMO) persists, the Railway deploy will fail silently. **Action: verify env var works in production mode before deploying.**

3. **No one discussed the port configuration.** The app runs on port 3456 locally. Railway assigns a dynamic `$PORT`. The `next.config.js` or start command needs to respect `$PORT`. **Action: add `-p $PORT` to the start command or configure next.config.js.**

### 4. Prioritized Action List (Q6 consolidated)

| # | Action | Effort |
|---|--------|--------|
| 1 | Research Railway persistent volumes for SQLite | 15min |
| 2 | Attempt Railway deploy at hour 4 | 1-2h |
| 3 | If Railway fails: fall back to localtunnel | 15min |
| 4 | Set MiMo API key as Railway env var | 5min |
| 5 | Configure port binding for Railway ($PORT) | 5min |
| 6 | Test deployed URL end-to-end | 15min |

---

## Cross-Cutting Observations

### What Changed My Position

1. **Baseline score revised down** from 75-85 to 73-82. CW's code-level verification of the DB singleton gap is more credible than the other auditors' PROJECT-MEMO-based assessments.

2. **Innovation strategy revised.** I now recommend self-correction as the primary code feature (not "指标即代码" alone). The other 4 auditors' convergence on self-correction is strong evidence. My "指标即代码" framing is better as the *pitch narrative*, not the *technical feature*.

3. **Deployment timing moved earlier.** OC and MiMo convinced me that deploying at hour 4 is better than hour 11. The pivot-time argument is decisive.

### The "Do These 5 Things" Summary

If the team can only do 5 things before the demo:

| # | What | Time | Points |
|---|------|------|--------|
| 1 | Fix DB singleton + API key + ErrorBoundary + metric rerun bug | 35min | +3-4 (Demo safety) |
| 2 | Wire Dashboard.tsx as landing page | 2h | +4-6 (Demo+PMF) |
| 3 | Build self-correction loop + pre-cache result | 2.5h | +3-4 (Innovation) |
| 4 | ClawHunt 上架 | 30min | +5 (bonus) |
| 5 | Rehearse 3-min demo × 5 | 2.5h | +3-4 (Demo+Pitch) |

**Total: ~8h of work, +18-23 points.** From 73-82 baseline → **91-105 potential.**

### Confidence Summary

| Question | Confidence | Key Risk |
|----------|------------|----------|
| Q1: Score Strategy | HIGH | Underestimating UI polish time |
| Q2: Innovation | MEDIUM | Self-correction might not work reliably with MiMo |
| Q3: UI Overhaul | HIGH | Dashboard.tsx type conflict |
| Q4: Demo Flow | HIGH | Freeform query quality |
| Q5: Tech Debt | HIGH | Dead dep removal breaking build |
| Q6: Deployment | MEDIUM | better-sqlite3 on Railway |

---

*Cross-examination complete. Written by OMP — 2026-07-04.*

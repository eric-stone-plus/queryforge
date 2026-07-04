# R2 Cross-Examination — Competitive Analysis & Data Source Decision
**Agent:** Oh My Pi (OMP)  
**Date:** 2026-07-04  
**Inputs:** R1 analyses from CW, OC, KC, MIMO, OMP

---

## 1. CONSENSUS FINDINGS (All 5 Agree — Highest Confidence)

These findings appear in every R1 analysis and are beyond dispute:

### C1: Hardcoded KPIs Are the #1 Defect
**Unanimous.** All 5 agents flag `page.tsx:154-161` as critical. The "100% repurchase rate" and "人均10单" are direct artifacts of `seed.ts:293` (`faker.number.int({ min: 1, max: 1000 })` — uniform distribution over 1000 users × 10000 orders = exactly 10 orders/user). Any judge who asks "is this real?" immediately loses confidence. **This is the single highest-impact defect in the codebase.**

### C2: Dashboard.tsx Is Dead Code
**Unanimous.** `src/components/Dashboard.tsx` (175-214 lines, depending on who counted) is a fully implemented chart renderer never imported in `page.tsx`. The page reimplements charts inline with static data. This signals unfinished refactoring.

### C3: Static Dashboard Data Is a Show-Stopper
**Unanimous.** `page.tsx:56-88` — six hardcoded arrays (`REGION_STATIC`, `CATEGORY_STATIC`, `CHANNEL_STATIC`, `SEGMENT_STATIC`, `MONTHLY_STATIC`, `TOP_PRODUCTS`) power the entire dashboard except one chart (`monthlyData`). If a judge asks "show me just Q4 data," the dashboard can't respond. This undermines the core value proposition.

### C4: Option E (Better Faker) Is the Right Data Strategy
**Unanimous.** All 5 agents independently conclude Option E beats Option B (Olist) for Demo Day. The reasoning converges:
- Olist requires 4-6h of schema translation with high breakage risk
- Option E preserves the existing schema (zero changes to agent.ts, demo-cache.ts, MetricSidebar)
- The real problem isn't "fake data" — it's "obviously fake KPIs"

### C5: Self-Correction Loop Is a Genuine Differentiator
**Unanimous.** `agent.ts:145-186` — the retry-on-error pattern (feed SQL error back to LLM, get corrected query) is real engineering that competitors lack. All 5 agents identify this as the strongest technical differentiator.

### C6: "Analyst-Defined Metrics" Is a Feature, Not a Moat
**Unanimous.** MetricSidebar stores metrics in localStorage, has no sharing/versioning/RBAC, and any competitor could replicate it in a sprint. All 5 agree: it's a nice UX touch, not a defensible competitive advantage.

### C7: No Error Boundaries or Client-Side Timeout
**Unanimous.** Zero `ErrorBoundary` components. No `AbortController` on the fetch call. A malformed AI response or network stall crashes the entire page or leaves it spinning forever. All 5 flag this as a demo risk.

### C8: System Prompt Leaks Full Schema
**Unanimous.** `agent.ts:33-60` includes the complete schema. Acceptable for demo, noted for production.

### C9: Text-to-SQL Is Commoditized
**Unanimous.** Vanna.ai (12K+ stars), BlazeSQL, Wren AI, SQL Chat, AskYourDatabase all do it. The innovation angle must come from something beyond basic NL→SQL→chart.

### C10: Current Score Is Mid-Pack (~60-75/105)
**Unanimous.** All 5 project similar ranges: CW: 75, OC: 60, KC: 62-73, MIMO: 53-67, OMP: 60-71. Central tendency: **~65/105**.

---

## 2. DISAGREEMENTS (With Resolution)

### D1: Score Projections Vary — Who Is Most Accurate?

| Agent | Current | After Fixes | Delta |
|-------|---------|-------------|-------|
| CW | 75 | 93 | +18 |
| OC | 60 | 79 | +19 |
| KC | 62-73 | 81-93 | +20 |
| MIMO | 53-67 | 74-86 | +21 |
| OMP | 60-71 | 80-92 | +20 |

**Resolution:** CW's current estimate (75) is the **outlier** — too optimistic. The other 4 cluster around 60-67, which is more credible given the severity of hardcoded data and fake KPIs. KC's range (81-93 post-fix) is the widest and most uncertain. The realistic post-fix target is **~80/105** — achievable with Option E + KPI fixes + innovation framing, but not the 93 CW projects (which assumes all innovation pushes land perfectly).

**Verdict:** OC and OMP have the tightest, most realistic projections. Target: **78-82/105** after fixes.

### D2: Innovation Narrative — Which Framing Is Strongest?

| Agent | Framing | Core Claim |
|-------|---------|------------|
| CW | "Analyst-as-Trainer" | Analysts train the AI via metric presets |
| OC | "Analyst-Augmented AI" | AI amplifies analysts, doesn't replace them |
| KC | "Metric-as-Code" | Metrics are first-class, portable, versionable |
| MIMO | "Transparent AI Analyst" | Trust through visible reasoning + self-correction |
| OMP | "Self-Correcting Agent with Transparent Reasoning" | Agent behavior + transparency |

**Resolution:** These aren't mutually exclusive — they're layers of the same story. But for a 5-minute demo pitch, **one framing must lead**.

**KC's "Metric-as-Code" is the strongest lead** because:
1. It's the most concrete and demo-able (show the MetricSidebar, show saving a query, show re-running it)
2. It maps to a real product vision (not just a feature)
3. It's the most differentiated — no competitor uses this framing
4. It naturally incorporates the transparency angle (analysts see the SQL, business users see the chart)

However, **MIMO's "Transparent AI Analyst" is the best backup** if the MetricSidebar demo falls flat — it's simpler to explain and doesn't require the metric library to work perfectly.

**Recommended pitch structure:**
- **Lead:** "Metric-as-Code — analysts define metrics once, the whole team runs them forever"
- **Support:** "Self-correcting agent that shows its reasoning" (transparency)
- **Proof:** Live demo of MetricSidebar + self-correction loop

### D3: Should We Even Bother With Option E Faker, or Just Fix Hardcoded KPIs?

This is the critical question none of the R1 analyses fully addressed. There are two sub-options:

- **E1: Fix seed.ts only** (2h) — better data distribution, but KPIs in page.tsx remain hardcoded strings
- **E2: Fix seed.ts + make KPIs dynamic from DB** (3h) — better data AND live-computed KPIs

**Resolution: E2 is mandatory, not optional.** Here's why:

If we only fix seed.ts (E1), the KPI cards still show "100% repurchase rate" as a hardcoded string — even if the underlying data now produces 40%. The judge sees "100%" on screen, asks "show me," and the DB says 40%. **That's worse than the current state** because it reveals the dashboard is disconnected from the data.

E2 (fix seed.ts + wire KPIs to DB) adds only 1 hour to E1 and eliminates the disconnect entirely. The KPI cards query the DB on mount and display real numbers.

**Verdict: Commit to E2. No debate.**

---

## 3. MISSED GAPS (Things All 5 R1 Analyses Missed)

### G1: The Self-Correction Demo Is Risky to Run Live

None of the 5 agents assessed the **risk of the self-correction demo failing**. The plan is: "deliberately ask a question that triggers a SQL error, show the auto-correction." But:

- What if the LLM generates valid SQL on the first try? (No error to correct)
- What if the correction also fails? (Double failure looks worse than no demo)
- What if the correction produces different data than expected? (Confusing)

**Mitigation:** Prepare a **scripted demo path**. Use a question known to fail on first try (e.g., querying a non-existent column). Test it 5 times before the demo. Have a cached fallback ready. Don't improvise.

### G2: temperature=1 Is Unstable

`agent.ts:9` sets `temperature=1` for data queries. This means every call produces different SQL for the same question. During a live demo, re-asking the same question could produce different charts. This is **embarrassing, not impressive**.

**Fix:** Set `temperature=0` for data queries. 5 minutes. Zero risk.

### G3: Demo Chips Require Exact String Match

`demo-cache.ts` uses exact string matching (`CACHED_RESULTS[message]`). The 4 demo chips in `ChatPanel.tsx:18-23` must produce byte-identical strings. If a presenter paraphrases ("各地区销售额趋势" vs "各地区月度销售额趋势"), the cache misses and falls through to the API. If the API is down, the demo fails.

**Fix:** Add fuzzy matching or normalize keys. 15 minutes.

### G4: Nobody Considered the "活跃买家" Problem

All 5 agents recommend adding inactive users (0 orders) to make the faker more realistic. But `page.tsx` shows "活跃买家 1,000" — if we add 200 inactive users, this number either stays at 1,000 (wrong) or drops to 800 (requires a DB query). If we go with E1 (fix seed only, keep hardcoded KPIs), this becomes another lie.

**This is another argument for E2** (dynamic KPIs from DB).

### G5: No Demo Rehearsal Plan

None of the 5 agents included time for **demo rehearsal** in their action lists. Rehearsing the demo flow, timing each segment, and practicing the Q&A answers is essential. A well-rehearsed 5-minute demo beats a poorly-rehearsed 8-minute demo.

**Fix:** Allocate 30 minutes for full demo run-through after all code changes.

### G6: The "Analyst-as-Trainer" Innovation Push Requires System Prompt Changes

CW recommends injecting saved metrics as few-shot examples into the system prompt (`agent.ts`). This is a 1-2 hour task that none of the other 4 agents picked up. It's high-impact for the innovation score but not strictly necessary for Demo Day.

**Assessment:** Nice-to-have. If E2 + defect fixes land in 3 hours, spend the remaining time on this. Otherwise, skip.

### G7: No One Checked if `extractJson` Handles Edge Cases Under Stress

`agent.ts:76-91` has three fallback strategies for JSON extraction. Under `temperature=1`, the LLM might return markdown fences, multiple JSON objects, or partial JSON. The regex fallback (`/\{[\s\S]*\}/`) is greedy. With `temperature=0`, this risk drops significantly.

**Assessment:** Low priority if we fix temperature to 0.

---

## 4. PRIORITIZED ACTION LIST (Top 10 — Next 12 Hours)

| # | Action | Time | Score Impact | Risk if Skipped |
|---|--------|------|-------------|-----------------|
| **1** | **Fix seed.ts**: power-law user distribution, realistic status weights, seasonal order patterns, regional variance | 2h | +8 pts (Demo + PMF) | "100% repurchase" embarrasses the entire demo |
| **2** | **Replace hardcoded KPIs in page.tsx with DB queries on mount** | 1h | +5 pts (Demo) | KPIs show stale/wrong numbers; disconnect from data |
| **3** | **Replace static chart arrays with DB queries** (REGION_STATIC, etc.) | 1.5h | +4 pts (Demo + Technical) | Dashboard is a static infographic, not a live product |
| **4** | **Set temperature=0 in agent.ts** | 5 min | +1 pt (consistency) | Same question produces different charts live |
| **5** | **Wire Dashboard.tsx into page.tsx or delete it** | 30 min | +2 pts (Technical) | Dead code signals unfinished work |
| **6** | **Add React ErrorBoundary wrapper** | 30 min | +2 pts (Demo safety) | One bad AI response = white screen = demo death |
| **7** | **Update PPT with real computed numbers** | 30 min | +2 pts (路演表达) | PPT numbers contradict what's on screen |
| **8** | **Add AbortController + 90s client timeout + retry button** | 30 min | +1 pt (defensive) | API hang = infinite spinner with no escape |
| **9** | **Prep "Metric-as-Code" innovation narrative + rehearse demo** | 1h | +3 pts (创新性) | Weak innovation story = lose 5+ points vs competitors |
| **10** | **Prepare scripted self-correction demo path** (test 5x, cache fallback) | 30 min | +2 pts (创新性) | Failed correction demo = negative impression |

**Total estimated effort: ~7.5 hours** (fits in 12h window with buffer)  
**Total estimated score impact: +30 points** (from ~65 → ~80-82/105)

---

## 5. FINAL DATA DECISION

### Recommendation: **E2 — Fix Faker + Dynamic KPIs from DB**

**Why E2, not E1:**
- E1 (fix seed.ts only) still leaves hardcoded KPIs in `page.tsx`. After reseeding, the DB says "40% repurchase" but the screen still says "100%". This is **worse than the current state** — it proves the dashboard is disconnected from the data.
- E2 adds only 1 hour to E1 and eliminates the disconnect entirely.
- E2 also solves the "活跃买家" problem (G4) — the KPI card queries the DB for active user count.

**Why E2, not B (Olist):**
- Olist requires 4-6h of schema translation (column renaming, system prompt rewrite, demo-cache updates, MetricSidebar SQL updates)
- One missed column name = broken demo
- The self-correction loop (`agent.ts:145-186`) would likely fail on an unfamiliar schema
- +4 points potential (OC's estimate) is not worth the risk

**Implementation order:**
1. Fix `scripts/seed.ts` (power-law, seasonality, regional variance, realistic statuses)
2. Regenerate `ecommerce.db`
3. Replace KPI cards in `page.tsx` with `useEffect` + `fetch('/api/query')` calls
4. Replace static chart arrays with DB queries
5. Update PPT with computed values
6. Test the full demo flow end-to-end

**Commitment:** After E2 is complete and verified, no further data changes. Ship what we have.

---

## 6. SCORE RECALIBRATION

### Current State (Consensus from 5 R1 analyses)

| Criterion | Max | Recalibrated | Basis |
|-----------|-----|-------------|-------|
| Demo 现场可用 | 25 | **14-16** | All 5 agree: hardcoded KPIs + static data = broken demo |
| 用户价值/PMF | 20 | **12-14** | Real pain point, but fake data kills credibility |
| 技术实现 | 20 | **13-15** | Self-correction is good, but dead code + static data |
| 创新性 | 15 | **6-7** | Text-to-SQL is commodity, underplayed differentiators |
| 商业潜力 | 10 | **5-6** | SQLite-only, no auth, demo-stage |
| 路演表达 | 10 | **7** | Unknown PPT quality |
| Bonus | +5 | **+3** | ClawHunt + Demo showcase |
| **TOTAL** | **105** | **~65** | |

### After E2 + Defect Fixes + Innovation Framing

| Criterion | Max | Projected | Delta | Confidence |
|-----------|-----|-----------|-------|------------|
| Demo 现场可用 | 25 | **20-22** | +6 | High — fixes the critical defects |
| 用户价值/PMF | 20 | **16-18** | +4 | High — credible data makes the story work |
| 技术实现 | 20 | **17-19** | +4 | Medium — depends on wiring Dashboard.tsx cleanly |
| 创新性 | 15 | **10-12** | +5 | Medium — depends on demo execution |
| 商业潜力 | 10 | **6-7** | +1 | Low — judges may still see limitations |
| 路演表达 | 10 | **8-9** | +2 | Medium — depends on PPT update quality |
| Bonus | +5 | **+3** | 0 | High |
| **TOTAL** | **105** | **80-82** | **+15-17** | |

### Risk-Adjusted Scenarios

| Scenario | Score | Probability |
|----------|-------|-------------|
| All fixes land, demo rehearsed, innovation pitch works | **82-85** | 30% |
| E2 + defect fixes land, innovation pitch is decent | **78-82** | 50% |
| Only E2 (seed fix + dynamic KPIs), no other changes | **72-75** | 15% |
| Something breaks during demo (API down, bad data) | **65-70** | 5% |

**Expected value: ~80/105.** This is contender territory — competitive for top 3 if execution is clean.

---

*Cross-examination complete. The unanimous verdict: commit to E2, fix the critical defects, lead with "Metric-as-Code," and rehearse the demo. The 12-hour window is tight but sufficient.*

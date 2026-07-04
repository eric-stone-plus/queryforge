# R2 Cross-Examination — OpenCode (oc)

**Reviewer:** OpenCode
**Date:** 2026-07-04
**Artifacts Reviewed:** CW, OC, KC, MiMo, OMP (5/5)

---

## 1. CONSENSUS FINDINGS (All 5 Agree — Highest Confidence)

These findings appear in **every single R1 analysis** and should be treated as ground truth:

| # | Finding | Evidence | Confidence |
|---|---------|----------|------------|
| 1 | **KPI cards are hardcoded lies** | `page.tsx:154-161` — "100% repurchase rate" is faker artifact from `seed.ts:293` | 100% — all 5 cite identical line numbers |
| 2 | **Dashboard data is entirely static** | `page.tsx:56-88` — `REGION_STATIC`, `CATEGORY_STATIC`, etc. are baked-in arrays, not DB queries | 100% |
| 3 | **Dashboard.tsx is dead code** | 214-line component never imported by `page.tsx` | 100% |
| 4 | **Self-correction loop is the #1 differentiator** | `agent.ts:145-186` — error feedback + single retry | 100% |
| 5 | **"Analyst-defined metrics" is a feature, not a moat** | `MetricSidebar.tsx` uses localStorage, no sharing, no RBAC | 100% |
| 6 | **Option E (better faker) is the right data strategy** | All 5 recommend E as primary, B as stretch only | 100% |
| 7 | **System prompt leaks full schema** | `agent.ts:33-60` — acceptable for demo, not production | 100% (all note it, all deprioritize) |
| 8 | **No client-side error boundary or timeout** | No `AbortController`, no `ErrorBoundary` anywhere | 100% |

**Verdict:** These 8 findings are unassailable. Any action plan must address #1-#4 as the top priority.

---

## 2. DISAGREEMENTS (With Resolution)

### 2A. Score Projections — Who Is Most Accurate?

| Dimension | CW | OC | KC | MiMo | OMP | Spread |
|-----------|----|----|----|----|-----|--------|
| Demo (25) | 18 | 13 | 14-16 | 13-16 | 14-16 | 5 pts |
| PMF (20) | 16 | 12 | 12-14 | 10-13 | 12-14 | 6 pts |
| Tech (20) | 14 | 14 | 13-15 | 12-14 | 13-15 | 3 pts |
| Innovation (15) | 8 | 6 | 7-8 | 5-7 | 6-7 | 3 pts |
| Business (10) | 7 | 5 | 6-7 | 5-6 | 5-6 | 2 pts |
| Pitch (10) | 7 | 7 | 7-8 | 5-6 | 7-8 | 3 pts |
| **Total** | **75** | **60** | **62-73** | **53-67** | **60-71** | **22 pts** |

**Analysis:** CW is the most optimistic (+15 over MiMo's low end). The spread is driven by two biases:

1. **CW overvalues PMF and Demo** (gives 16 and 18) — CW treats "the core loop works" as sufficient, but ignores that hardcoded KPIs during a live demo will cause judges to question *everything*. OC and MiMo are more realistic that "100% repurchase" is a credibility bomb.

2. **CW overvalues Innovation** (gives 8) — CW sees the self-correction loop as novel. MiMo (5-7) is more honest: it's a single retry, not a true agent loop.

**My resolution:** OC and MiMo's ranges are most realistic. **Current score: ~60-65/105.** CW's 75 is aspirational, not evidence-based. KC's range (62-73) is the best central estimate.

### 2B. Data Recommendation — Is Option B (Olist) Actually Viable?

All 5 recommend Option E. But the task asks: **could Option B be done in time if we focus?**

**Evidence against Option B:**
- Schema mismatch: Olist has `order_purchase_timestamp`, not `order_date`; `payment_value`, not `total_amount`. Every SQL query in `agent.ts`, `demo-cache.ts`, `MetricSidebar.tsx` would need rewriting.
- The agent prompt hardcodes `Revenue = SUM(oi.quantity*oi.unit_price*(1-oi.discount))` — Olist doesn't have `quantity`, `unit_price`, or `discount` in that structure.
- Portuguese column names need translation or aliasing.
- 4-6 hours minimum with full testing. Demo Day is tomorrow.

**Evidence that Option B *might* work:**
- If we only use Olist for the *dashboard* data (static → dynamic) and keep the NL2SQL chat on the existing schema, we could get "real data" credibility without rewriting the agent.
- But this splits the system into two data sources — incoherent.

**My verdict:** Option B is NOT viable in 12 hours for a working demo. The 5 analysts are unanimous and correct. Option E is the only sane choice.

### 2C. Innovation Narrative — Which Framing Is Strongest?

| Analyst | Framing | Strength | Weakness |
|---------|---------|----------|----------|
| CW | "Analyst-as-Trainer" | Positions MetricSidebar as core innovation | Requires metric few-shot injection (1-2h work not yet done) |
| OC | "Analyst-Augmented AI" | Clear positioning vs. Vanna/Wren | Similar to CW's framing, less punchy |
| KC | "Metric-as-Code" | Catchy, maps to "Infrastructure-as-Code" mental model | Overstates what exists (localStorage ≠ code) |
| MiMo | "Transparent AI Analyst" | Focuses on thinking visibility + trust | Thinking visibility is just a `<details>` element — thin |
| OMP | "Self-Correcting Agent" | Focuses on the strongest technical differentiator | Doesn't address the metric library angle |

**My resolution:** **KC's "Metric-as-Code" is the strongest framing for judges.** Here's why:

1. It's memorable — judges hear "Text-to-SQL" from every team, but "Metric-as-Code" is fresh.
2. It maps to a real product vision: analysts define metrics as reusable SQL templates, business users consume them.
3. The implementation already partially exists (`MetricSidebar.tsx`). The demo can show: "analyst defines a metric → saves it → business user runs it via chat."
4. It pairs well with the self-correction loop: "Metrics that fix themselves."

**Recommended pitch:** Lead with "Metric-as-Code," support with self-correction loop demo.

### 2D. Current Innovation Score

| Analyst | Score |
|---------|-------|
| CW | 8/15 |
| OC | 6/15 |
| KC | 7-8/15 |
| MiMo | 5-7/15 |
| OMP | 6-7/15 |

**My assessment:** The self-correction loop is real but basic (1 retry). The thinking visibility is a `<details>` tag. The MetricSidebar is localStorage. **Current innovation: 6/15.** After "Metric-as-Code" framing + live correction demo: **10-11/15.**

---

## 3. MISSED GAPS (What All 5 R1 Analysts Missed)

### Gap 1: Demo Cache Exact-Match Is a Live Demo Trap

`demo-cache.ts` uses exact string matching (`CACHED_RESULTS[message]`). The 4 demo chips must match *exactly*. If a presenter paraphrases "各地区月度销售额趋势" as "各地区月度销售趋势" (dropping 额), the cache misses, hits the API, and if Kimi is slow or down, the demo stalls.

**Risk:** HIGH. During a live demo under pressure, exact string recall is unreliable.

**Fix:** Add fuzzy matching or normalize whitespace/punctuation. 15-minute fix.

### Gap 2: Nobody Stress-Tested the Self-Correction Loop for Live Demo

All 5 analysts praise the self-correction loop (`agent.ts:145-186`) as a differentiator. **None of them verified it works reliably in a live scenario.** Questions:
- What happens if the *corrected* SQL also fails? (Only 1 retry — second failure = error shown to user)
- What if the Kimi API returns a valid but wrong SQL? (No confidence scoring)
- What if the error message is too long for the LLM context? (No truncation)

**Risk:** If the correction loop fails live, it becomes a negative demo moment instead of a positive one.

**Fix:** Rehearse the correction demo with a known-bad query. Have a cached fallback ready. 30 minutes.

### Gap 3: `temperature=1` Makes Results Non-Deterministic

`agent.ts:9` sets `AI_TEMPERATURE = 1`. For data queries, this means the same question can produce different SQL each time. During a demo, if a judge asks the same question twice and gets different results, it undermines trust.

**Risk:** MEDIUM. Judges may re-ask questions to test consistency.

**Fix:** Set temperature to 0.3 for data queries (keep 1 for explanation generation). 5-minute fix.

### Gap 4: No One Checked If Railway Deployment Handles Demo Load

All analyses focus on code quality but none verify the deployment. Questions:
- Is the Railway instance warm when the demo starts? (Cold start = 10-30s delay)
- Can it handle a demo with 5-10 rapid queries?
- Is the SQLite DB persisted across Railway deploys?

**Risk:** MEDIUM. A cold start during the demo kills momentum.

**Fix:** Ping the deployment 5 minutes before presenting. Have a "pre-warm" script. 10 minutes.

### Gap 5: MetricSidebar and Agent Are Completely Disconnected

Multiple analysts (CW, KC, OC) pitch "analyst-defined metrics" as innovation. But `MetricSidebar.tsx` and `agent.ts` are **completely independent**:
- MetricSidebar saves SQL to localStorage
- Agent.ts has no access to saved metrics
- Saved metrics are NOT used as few-shot examples in the system prompt
- There's no "inject metric context into agent" flow

The "analyst-as-trainer" / "Metric-as-Code" narrative **requires this connection** to be credible. Without it, the metric library is just a bookmark feature.

**Risk:** The innovation pitch is hollow without this wiring.

**Fix:** Inject saved metrics into the system prompt as context. 1-2 hours. This is the highest-leverage innovation investment.

### Gap 6: COLORS Constant Defined 3 Times with Different Values

MiMo noted this briefly but no one followed up. `page.tsx:12`, `ChatPanel.tsx:16`, `Dashboard.tsx:40` each define a `COLORS` array with different values. This means charts in different parts of the app use different color palettes — visual inconsistency.

**Risk:** LOW for scoring, but sloppy.

**Fix:** Extract to a shared constant. 5 minutes.

### Gap 7: New Faker Data May Break Cached Demo Queries

If Option E changes the data distribution, the 4 cached demo queries in `demo-cache.ts` will return different results. The cached results must be regenerated after reseeding. **None of the 5 analysts flagged this dependency explicitly.**

**Risk:** HIGH. If the demo chip returns data that contradicts the KPI cards, the demo looks broken.

**Fix:** After reseeding, run each cached query and update `demo-cache.ts` with new expected results. 30 minutes.

---

## 4. PRIORITIZED ACTION LIST (Top 10 Items — Next 12 Hours)

| # | Action | Time | Score Impact | Risk if Failed |
|---|--------|------|-------------|----------------|
| 1 | **Fix `seed.ts`**: power-law user distribution, seasonal patterns, realistic status dist, regional variance, product popularity skew | 2h | +6-8 pts (Demo + PMF) | "100% repurchase" stays — judges lose confidence immediately |
| 2 | **Replace hardcoded KPIs in `page.tsx`** with live DB queries on mount | 1h | +4-5 pts (Demo) | KPI cards show stale numbers that contradict dashboard charts |
| 3 | **Replace static chart arrays** in `page.tsx:56-88` with DB queries | 1.5h | +3-4 pts (Tech + Demo) | Dashboard is a static infographic, not a data product |
| 4 | **Regenerate `demo-cache.ts`** after reseeding | 30m | +2 pts (defensive) | Cached results contradict new data — demo looks broken |
| 5 | **Update PPT** with post-reseed real numbers | 30m | +2 pts (Pitch) | PPT shows "100% repurchase" — embarrassing in presentation |
| 6 | **Add React `ErrorBoundary`** wrapping the app | 30m | +2 pts (Demo safety) | One bad chart render = white screen = demo death |
| 7 | **Add `AbortController`** with 90s client timeout in `ChatPanel.tsx` | 15m | +1 pt (Demo safety) | API hang = infinite spinner, no recovery |
| 8 | **Inject saved metrics into agent system prompt** as few-shot examples | 1.5h | +3-4 pts (Innovation) | "Metric-as-Code" narrative has no technical backing |
| 9 | **Wire `Dashboard.tsx` into `page.tsx`** or delete it | 30m | +1-2 pts (Tech cleanliness) | Dead code in repo = judges question engineering quality |
| 10 | **Rehearse self-correction demo** with a known-bad query | 30m | +2 pts (Innovation) | Correction loop fails live = negative demo moment |

**Total estimated effort: ~8.5 hours.** Feasible in 12 hours with buffer.

**Critical path:** Items 1 → 2 → 3 → 4 → 5 must be sequential (each depends on prior). Items 6, 7, 9, 10 can be parallel. Item 8 is independent but high-value.

---

## 5. FINAL DATA DECISION

### Options Recap

| Option | Description | Time | Risk |
|--------|-------------|------|------|
| E1 | Fix faker `seed.ts` only (keep hardcoded KPIs) | 2h | Data is better but KPIs still stale |
| E2 | Fix faker + make KPIs dynamic from DB | 3h | Best balance of effort and impact |
| B | Switch to Olist real data | 4-6h | High breakage risk, schema mismatch |
| Hybrid | Fix faker first, then try Olist if time | 5-8h | Scattered focus, likely neither done well |

### 🏆 RECOMMENDATION: **E2 — Fix faker `seed.ts` + Make KPIs dynamic from DB**

**Justification:**

1. **E1 alone is insufficient.** Even with realistic faker data, hardcoded KPIs in `page.tsx` still show stale numbers. If the dashboard charts (from DB) show different numbers than the KPI cards (hardcoded), judges will notice the inconsistency. E1 fixes the *data* but not the *presentation layer*. E2 fixes both.

2. **Olist (Option B) is too risky for Demo Day.** All 5 analysts agree. The schema mismatch (different column names, different domain, Portuguese labels) requires rewriting the system prompt, all 6 MetricSidebar queries, all 4 demo-cache entries, and the PPT. One missed column name = broken demo. The +4 points over E2 are not worth the risk.

3. **Hybrid is a trap.** "Fix faker first, then try Olist" means neither gets full attention. If Olist is attempted and fails at hour 6, you've wasted time that could have been spent on KPI wiring and PPT updates. Commit to E2 and execute it well.

4. **E2 is the minimum viable fix.** Judges will ask "show me how you calculated that number." If the KPI comes from a live DB query, the answer is "here's the SQL." If it's hardcoded, the answer is silence. E2 makes every number in the product defensible.

**Implementation sequence:**
1. Fix `seed.ts` (2h) — power-law, seasonality, realistic distributions
2. Regenerate `ecommerce.db` (5m) — `npm run seed` or equivalent
3. Replace KPI cards with DB queries (1h) — `useEffect` + `fetch('/api/query')`
4. Regenerate `demo-cache.ts` (30m) — run each cached query against new DB
5. Update PPT (30m) — real numbers from DB

**Total: 4 hours.** Leaves 8 hours for other items on the action list.

---

## 6. SCORE RECALIBRATION

### Current State (Consensus Estimate)

| Dimension | Max | My Estimate | Reasoning |
|-----------|-----|-------------|-----------|
| Demo 现场可用 | 25 | 14 | Hardcoded KPIs + static data = demo is a scripted presentation, not a live product |
| 用户价值/PMF | 20 | 12 | Pain point is real but "100% repurchase" destroys credibility |
| 技术实现 | 20 | 13 | Self-correction is solid, but dead code + static data + no error handling |
| 创新性 | 15 | 6 | Text-to-SQL is commodity; self-correction is basic (1 retry) |
| 商业潜力 | 10 | 5 | SQLite-only, no auth, no multi-tenancy |
| 路演表达 | 10 | 7 | Assuming PPT exists and is decent |
| Bonus | +5 | +3 | ClawHunt listing achievable |
| **Total** | **105** | **60** | |

### After E2 + Action List Items 1-7 (Realistic)

| Dimension | Max | Projected | Delta | What Changed |
|-----------|-----|-----------|-------|--------------|
| Demo 现场可用 | 25 | 21 | +7 | Real KPIs from DB, believable data, error boundary as safety net |
| 用户价值/PMF | 20 | 17 | +5 | Credible data patterns (35-45% repurchase, power-law users) |
| 技术实现 | 20 | 17 | +4 | Dynamic dashboard, dead code resolved, timeout handling |
| 创新性 | 15 | 8 | +2 | Better framing, but no metric-to-agent wiring yet |
| 商业潜力 | 10 | 6 | +1 | Better demo enables better business story |
| 路演表达 | 10 | 9 | +2 | Real numbers in PPT, confident narrative |
| Bonus | +5 | +3 | 0 | Same |
| **Total** | **105** | **81** | **+21** | |

### After E2 + Full Action List (All 10 Items — Best Case)

| Dimension | Max | Projected | Delta | What Changed |
|-----------|-----|-----------|-------|--------------|
| Demo 现场可用 | 25 | 23 | +2 | Rehearsed correction demo, fuzzy cache matching |
| 用户价值/PMF | 20 | 18 | +1 | Consistent data everywhere |
| 技术实现 | 20 | 18 | +1 | Dashboard.tsx wired in, clean code |
| 创新性 | 15 | 11 | +3 | Metric few-shot injection enables "Metric-as-Code" pitch |
| 商业潜力 | 10 | 7 | +1 | Stronger positioning |
| 路演表达 | 10 | 9 | 0 | Same |
| Bonus | +5 | +3 | 0 | Same |
| **Total** | **105** | **89** | **+8** | **Contender for top 3** |

### Risk Scenarios

| Scenario | Score | Probability |
|----------|-------|-------------|
| All fixes land, rehearsal goes well | 89/105 | 30% |
| E2 + KPI wiring done, innovation push partial | 81/105 | 50% |
| Only faker fix, no KPI wiring, no PPT update | 72/105 | 15% |
| Faker fix breaks something, demo stumbles | 65/105 | 5% |

**Expected value: ~80/105.** This is a top-5 finish in a typical hackathon, top-3 if the innovation pitch lands.

---

*Cross-examination complete. The path forward is clear: commit to E2, execute the 10-item action list, rehearse the correction demo, and lead with "Metric-as-Code."*

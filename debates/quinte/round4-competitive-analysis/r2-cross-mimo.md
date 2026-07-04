# R2 Cross-Examination — MiMo

**Agent:** MiMo v2.5 Pro
**Date:** 2026-07-04
**Input:** R1 analyses from CW, OC, KC, MiMo (4 of 5; OMP not available)

---

## 1. CONSENSUS FINDINGS (All 4 Agree — Highest Confidence)

These findings appear in every R1 analysis and are therefore the highest-confidence assessments:

| # | Finding | Evidence Quality |
|---|---------|-----------------|
| 1 | **Hardcoded KPIs are the #1 or #2 defect.** All 4 auditors identify `page.tsx:154-161` with "100% 复购率" as the most damaging code-level problem. | Unanimous, code-verified |
| 2 | **Static dashboard data (REGION_STATIC etc.) is a critical defect.** `page.tsx:56-88` hardcodes 6 datasets; only `monthlyData` is dynamic. | Unanimous, code-verified |
| 3 | **Dashboard.tsx is dead code.** 214 lines, never imported by `page.tsx`. | Unanimous, code-verified |
| 4 | **"Analyst-defined metrics" is a feature, not a moat.** localStorage-based MetricSidebar has no RBAC, no sharing, no versioning. Any competitor can replicate in a sprint. | Unanimous |
| 5 | **Option E (Better Faker) is the recommended data strategy.** All 4 independently converge on the same conclusion: fix `seed.ts` distributions, don't risk Olist migration. | Unanimous |
| 6 | **Self-correction loop is genuine but basic.** Single retry with error feedback in `agent.ts:145-186`. Real, but not a deep moat. | Unanimous |
| 7 | **No client-side error boundary or timeout.** `ChatPanel.tsx` has no `AbortController`; no React ErrorBoundary wraps the app. | Unanimous |
| 8 | **System prompt leaks full DB schema.** `agent.ts:33-60` hardcodes all table/column definitions. Low demo risk, high production risk. | Unanimous |

**Cross-examiner verdict:** These 8 findings are rock-solid. No auditor disputes any of them. Treat these as the factual baseline for all decisions.

---

## 2. DISAGREEMENTS (With Resolution)

### Disagreement A: Score Projections Vary Widely

| Agent | Current Score | After Fixes | Delta |
|-------|--------------|-------------|-------|
| CW | 75 | 93 | +18 |
| OC | 60 | 79 | +19 |
| KC | 62-73 | 81-93 | +19-20 |
| MiMo | 53-67 | 74-86 | +21-19 |

**Analysis:** CW is the most optimistic (+13 baseline vs OC). The gap is primarily in:
- **Demo (25pts):** CW says 18 current, OC says 13. CW gives more credit for cached fallback working.
- **PMF (20pts):** CW says 16, OC says 12, MiMo says 10-13. CW weights the "real pain point" more generously.
- **Innovation (15pts):** CW says 8, OC says 6, MiMo says 5-7. CW credits the self-correction loop more.

**Resolution:** OC and MiMo are most conservative; KC sits in the middle. **KC's range (62-73 current, 81-93 post-fix) is the most defensible** because:
1. KC explicitly bounds estimates with ranges, not point values
2. KC's reasoning matches the evidence most closely (14-16 for Demo current, 12-14 for PMF current)
3. CW's 75 current score gives too much credit for features that don't actually work (dashboard is dead code, KPIs are fake)

**My calibrated projection:** Current ~60/105, post-fix target ~80/105. KC's midpoint.

### Disagreement B: Option E vs. Option B (Olist)

All 4 recommend Option E, but the reasoning varies:

| Agent | Option E Time | Option B Time | Risk Assessment |
|-------|--------------|---------------|-----------------|
| CW | 2-3h | 4-6h | "Too risky for Demo Day" |
| OC | 2-3h | 4-6h | "+4 points not worth the risk" |
| KC | 2h | 4-6h | "Significant schema mismatch risk" |
| MiMo | 2-3h | 4-6h | "High breakage risk" |

**Resolution: Option E is definitively correct.** The unanimous convergence across 4 independent analyses with different methodologies is strong evidence. Key additional reasoning:
- Olist requires column renaming (`order_id` → `id`, `customer_id` → `user_id`), Portuguese→English translation, system prompt rewrite, all 6 MetricSidebar SQL updates, all 4 demo-cache updates, and PPT rewrite
- Even if Olist succeeds, the incremental score gain is ~4 points (OC's estimate) — not worth 4-6 hours of high-risk work
- The real problem isn't "fake data" — it's "obviously fake KPIs." Option E fixes the symptom without surgery.

**Sub-question: Should we do E1 (seed only) or E2 (seed + dynamic KPIs)?**

CW and OC both recommend fixing seed.ts AND wiring KPI cards to live DB queries. KC and MiMo focus on seed.ts primarily. **E2 (seed + dynamic KPIs) is the right call** because:
- Hardcoded KPIs in `page.tsx` will still be wrong even after reseeding if we don't wire them
- Wiring KPIs is ~1 hour of straightforward `useEffect` + `fetch('/api/query')` work
- A judge asking "is this live?" destroys credibility if the answer is "no, it's hardcoded"

### Disagreement C: Innovation Framing

| Agent | Framing | Core Claim |
|-------|---------|------------|
| CW | "Analyst-as-Trainer" | Analysts define metrics, AI learns from them (few-shot) |
| OC | "Analyst-Augmented AI" | We amplify analysts, not replace them |
| KC | "Metric-as-Code" | Analyst-defined metrics are portable, versionable artifacts |
| MiMo | "Transparent AI Analyst" | We show reasoning, self-correction, build trust |

**Resolution: KC's "Metric-as-Code" is the strongest framing.** Here's why:

1. **"Metric-as-Code" is a concrete, demo-able concept.** The MetricSidebar literally stores SQL as JSON — that's code. You can show it, export it, version it. CW's "Analyst-as-Trainer" requires implementing few-shot injection (1-2h extra work) to be credible. KC's framing works with the existing code.

2. **"Metric-as-Code" maps to a known developer paradigm** (Infrastructure-as-Code, Policy-as-Code). Judges who are engineers immediately understand the analogy. OC's "Analyst-Augmented AI" is too generic — every AI product claims this.

3. **"Transparent AI Analyst" (MiMo) is complementary, not primary.** The thinking visibility and self-correction are *supporting evidence* for why Metric-as-Code works — analysts can verify the AI's reasoning. Lead with Metric-as-Code, support with transparency.

4. **"Analyst-as-Trainer" (CW) overpromises.** The system prompt currently has zero metric context. To credibly claim "training," you'd need to inject saved metrics as few-shot examples. That's 1-2 hours of work that may not land before Demo Day.

**Recommended pitch:** "Metric-as-Code: Analysts define SQL metrics once, business users run them forever. Unlike RAG-based tools that require training data, QueryForge's metrics are explicit, portable, and transparent." Use thinking visibility and self-correction as supporting evidence.

---

## 3. MISSED GAPS (Things All 4 R1 Auditors Missed)

### Gap #1: `temperature=1` for Data Queries Is Dangerous

`agent.ts:9` sets `temperature: 1` for the LLM call. For Text-to-SQL, this means the same question can produce different SQL each time. In a live demo, asking the same question twice might return different results — or different SQL entirely. **No auditor flagged this.**

**Fix:** Lower to `temperature: 0` or `0.1` for deterministic SQL generation. 2-minute change, prevents demo inconsistency.

### Gap #2: Live Self-Correction Demo Is Risky Without a Safety Net

CW and OC both suggest demoing the self-correction loop live (intentionally trigger an error). **Nobody assessed what happens if the correction also fails.** If the LLM produces bad SQL twice in a row, the demo shows a failure loop, not a success story.

**Mitigation:** Prepare a cached "self-correction success" result in `demo-cache.ts` as a fallback. If the live demo fails, fall back to the cached version seamlessly.

### Gap #3: The 4 Demo Chips Must Survive Reseeding

After Option E reseeds the database, the 4 hardcoded demo chip queries in `ChatPanel.tsx:18-23` and their cached results in `demo-cache.ts` will return different numbers. **Nobody mentioned that demo-cache.ts must be regenerated after reseeding.** If the cached SQL returns different column names or the result shape changes, the demo breaks.

**Action:** After reseeding, re-run all 4 demo chip queries, capture new results, and update `demo-cache.ts`.

### Gap #4: No Demo Script / Run-of-Show

All 4 auditors analyzed code and strategy, but **nobody produced a minute-by-minute demo script.** The demo is presumably 5 minutes. What's the flow? Which chip goes first? When do you show the self-correction? When do you show MetricSidebar? Without a script, the presenter will ramble.

**Action:** Write a 5-minute demo script with exact timing: 0:00-1:00 problem statement, 1:00-2:30 live NL→SQL→chart, 2:30-3:30 MetricSidebar demo, 3:30-4:30 self-correction demo, 4:30-5:00 vision close.

### Gap #5: COLORS Constant Defined 3 Times

MiMo's R1 flagged this in the "Additional Defects" table but none of the auditors explored the impact. `page.tsx:12`, `ChatPanel.tsx:16`, and `Dashboard.tsx:40` each define their own `COLORS` array with potentially different values. If Dashboard.tsx gets wired in, color inconsistency between charts will be visible.

**Fix:** Extract to a shared `lib/colors.ts`. 5 minutes.

### Gap #6: Nobody Assessed the Presenter's Skill

All analyses assume the demo goes smoothly. But if the presenter isn't comfortable with the codebase, a judge question like "how does the self-correction work?" could derail the presentation. **A cheat sheet for Q&A should be prepared** covering the top 5 likely judge questions and one-line answers.

---

## 4. PRIORITIZED ACTION LIST (Next 12 Hours)

| # | Action | Time | Score Impact | Risk |
|---|--------|------|-------------|------|
| 1 | **Fix `seed.ts` distributions** — power-law user orders, seasonal patterns, regional variance, realistic status distribution | 2h | +6-8 pts (Demo + PMF) | Low — schema unchanged, only data changes |
| 2 | **Regenerate DB + update `demo-cache.ts`** — reseed, re-run 4 demo chip queries, capture new cached results | 0.5h | +2 pts (Demo) | Medium — if cache doesn't match, demo fallback breaks |
| 3 | **Wire KPI cards to live DB** — replace hardcoded strings in `page.tsx:154-161` with `useEffect` + `fetch('/api/query')` | 1h | +4-5 pts (Demo) | Low — straightforward API call |
| 4 | **Replace static chart data** — swap `REGION_STATIC` etc. in `page.tsx:56-88` with DB queries | 1.5h | +3-4 pts (Demo + Tech) | Medium — chart rendering may break with different data shapes |
| 5 | **Update PPT with real numbers** — recompute all KPIs from new DB, update slides | 0.5h | +2 pts (路演表达) | Low |
| 6 | **Add `temperature: 0` to agent.ts** — deterministic SQL generation | 5min | +1 pt (Demo consistency) | None |
| 7 | **Wire Dashboard.tsx or delete it** — eliminate dead code, use the existing component | 0.5h | +2-3 pts (Tech) | Medium — wiring may introduce rendering bugs |
| 8 | **Add ErrorBoundary + AbortController** — prevent white-screen crash, add 90s client timeout | 0.5h | +1-2 pts (Demo defensive) | Low |
| 9 | **Write 5-min demo script** — exact timing, exact flow, Q&A cheat sheet | 0.5h | +1-2 pts (路演表达) | None |
| 10 | **Inject saved metrics into system prompt** — few-shot examples from MetricSidebar for "Metric-as-Code" story | 1h | +2-3 pts (Innovation) | Medium — may change SQL generation behavior |

**Total:** ~8.5 hours. Fits within the 12-hour window with buffer.

**Critical path:** Items 1→2→3→5 are sequential (data must change before KPIs can be computed). Items 6-10 can be parallelized.

---

## 5. FINAL DATA DECISION

### Recommendation: **E2 — Fix faker seed.ts + Make KPIs dynamic from DB**

| Option | Verdict | Reasoning |
|--------|---------|-----------|
| E1: Seed only | ❌ Insufficient | KPIs remain hardcoded; judge asking "is this live?" exposes the fake |
| **E2: Seed + dynamic KPIs** | **✅ COMMIT TO THIS** | Fixes the data AND proves it's live. 3h total. |
| B: Olist | ❌ Too risky | 4-6h, high breakage, +4 points max, Demo Day is tomorrow |
| Hybrid | ❌ Tempting but dangerous | "If time permits" never works under pressure. Commit to E2, execute it fully. |

**Justification:**

1. **All 4 independent auditors converge on Option E.** This is not a coincidence — it's the mathematically correct answer given the constraints (time, risk, score impact).

2. **E2 specifically (not E1) because:** The hardcoded KPIs are the single most damaging defect. Fixing the faker data without wiring the KPIs means the dashboard still shows fake numbers — you just changed *which* fake numbers. A judge who interacts with the dashboard will immediately see the disconnect between chat results and KPI cards.

3. **Olist (Option B) is a trap.** The +4 points (OC's estimate) sound appealing, but:
   - Column name mismatches will break the system prompt
   - Portuguese data requires translation in the UI
   - All 6 MetricSidebar queries need rewriting
   - All 4 demo-cache entries need regenerating
   - The PPT needs a complete rewrite (different domain)
   - If *any* of these break during the demo, the score drops below Option E

4. **The "100% repurchase rate" must drop to 35-45%.** This is the single number most likely to embarrass the team. A realistic e-commerce repurchase rate of 35-45% is defensible ("our platform has strong retention") without being suspicious.

**Execution order:**
1. Modify `seed.ts` (2h)
2. Regenerate DB + update `demo-cache.ts` (30min)
3. Wire KPI cards to live DB queries (1h)
4. Verify all 4 demo chips still work (15min)
5. Update PPT with real numbers (30min)

**Total: 4.25 hours. Completable tonight.**

---

## 6. SCORE RECALIBRATION

### Current State (My Assessment)

| Criterion | Max | Estimate | Reasoning |
|-----------|-----|----------|-----------|
| Demo 现场可用 | 25 | **14** | Core NL→SQL→chart loop works + cached fallback, but hardcoded KPIs and static dashboard are visible fakes |
| 用户价值/PMF | 20 | **12** | Real pain point, clear user group, but "100% repurchase" destroys data credibility |
| 技术实现 | 20 | **13** | Self-correction loop is solid, SSE streaming works, but dead Dashboard.tsx, no error handling, static data |
| 创新性 | 15 | **6** | Text-to-SQL is commodity; self-correction and thinking visibility are minor differentiators |
| 商业潜力 | 10 | **5** | SQLite-only, no auth, no multi-tenancy |
| 路演表达 | 10 | **7** | Good story structure, but PPT has fake numbers |
| Bonus | +5 | **+3** | ClawHunt listing + Demo showcase |
| **TOTAL** | **105** | **60** | Below KC's midpoint, aligned with OC |

### After E2 + Critical Fixes (Items 1-6)

| Criterion | Max | Projected | Delta | Key Change |
|-----------|-----|-----------|-------|------------|
| Demo 现场可用 | 25 | **21** | +7 | Dynamic KPIs from DB, realistic data, all charts live |
| 用户价值/PMF | 20 | **17** | +5 | Credible data patterns, "35% repurchase" is defensible |
| 技术实现 | 20 | **17** | +4 | Dynamic dashboard, error boundary, timeout, temperature=0 |
| 创新性 | 15 | **9** | +3 | "Metric-as-Code" framing, thinking visibility as supporting evidence |
| 商业潜力 | 10 | **6** | +1 | Better demo → better business case |
| 路演表达 | 10 | **9** | +2 | Real numbers in PPT, practiced demo script |
| Bonus | +5 | **+3** | 0 | Same |
| **TOTAL** | **105** | **82** | **+22** | Top-tier range, competitive for top 3 |

### After E2 + All 10 Items

| Criterion | Max | Projected | Delta |
|-----------|-----|-----------|-------|
| Demo 现场可用 | 25 | **22** | +8 |
| 用户价值/PMF | 20 | **18** | +6 |
| 技术实现 | 20 | **18** | +5 |
| 创新性 | 15 | **11** | +5 |
| 商业潜力 | 10 | **7** | +2 |
| 路演表达 | 10 | **9** | +2 |
| Bonus | +5 | **+3** | 0 |
| **TOTAL** | **105** | **88** | **+28** |

### Risk-Adjusted Final Projection

| Scenario | Score | Probability |
|----------|-------|-------------|
| All 10 items land cleanly | 88 | 20% |
| E2 + critical fixes (items 1-6) | 82 | 50% |
| Only seed fix + KPI wiring | 75 | 25% |
| Something breaks during demo | 65 | 5% |

**Expected value: ~80/105.** Competitive for top 3 if execution is clean.

---

*Cross-examination complete. The single most important decision: commit to E2 (fix faker + dynamic KPIs) and execute it fully before touching anything else.*

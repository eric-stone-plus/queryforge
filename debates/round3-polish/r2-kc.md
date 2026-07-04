# QUINTE R2 Cross-Examination: QueryForge Final Polish — Kilo Code (kc)

**Agent:** Kilo Code (kc)
**Date:** 2026-07-04
**Inputs:** task-r2-polish.md, r1-cw.md, r1-oc.md, r1-kc.md, r1-mimo.md, r1-omp.md, task-polish.md

**Methodology:** Read all 5 R1 artifacts line-by-line. For each of the 6 audit questions, cross-examined findings for consensus, disagreements, gaps, and prioritized actions.

---

## Q1: Score Maximization Strategy

### 1. Unanimous Findings (5/5 or 4/5 agreement)

- **Dashboard.tsx wiring is the single highest-ROI action.** All 5 auditors rank it #1 or #2. Estimated +3-8 points for 2-3 hours of work. Consensus: it transforms the app from "chatbot" to "SaaS product."
- **Dead dependency cleanup is quick wins.** All 5 agree: `npm uninstall` 7 packages in 5-15 min. Zero risk, signals polish.
- **Demo rehearsal is critical.** All 5 allocate 3-4 hours for rehearsal. CW is most emphatic: "the difference between 75 and 90 is rehearsal, not code."
- **API key should move to env var.** All 5 list this as a quick fix (5-15 min).
- **DB singleton in `query/route.ts` needs fixing.** All 5 identify this. CW confirms it's still broken in the actual code.

### 2. Key Disagreements

| Disagreement | Positions | Assessment |
|---|---|---|
| **Current score estimate** | CW: 72-78, OC: 75-85, KC: 64-74, MiMo: 75-85, OMP: 57-71 | **CW is most accurate.** KC's 64-74 is too low (underweights the working demo cache and save flow). OMP's 57-71 is far too low — the app has 4 working cached queries, offline fallback, metric save, and SQL validation. CW's 72-78 properly accounts for the incomplete DB singleton and 30s timeout without being pessimistic. |
| **Metric rerun bug severity** | KC: "Demo-breaking" (MUST fix), MiMo: "Demo-breaking" (MUST fix), CW: not mentioned, OC: SHOULD fix, OMP: not in MUST list | **KC and MiMo are right.** The `history.length === 0` guard at ChatPanel.tsx:262 means clicking a saved metric after chatting does nothing. In the demo flow, chips are clicked first (creating history), then the metric save step comes later — the rerun will fail silently. This is a demo flow killer. CW and OC miss this because they focused on backend issues over frontend demo flow. |
| **Timeout severity** | CW: MUST fix (30s→15s), OC: not listed as MUST, KC: not listed as MUST, MiMo: not listed as MUST, OMP: not listed as MUST | **CW is partially right.** 30s is too long for a live demo, but 15s may be too aggressive for the MiMo API (PROJECT-MEMO notes 15-30s response times). A 20s timeout is safer. However, this is a 2-line change — the disagreement is moot in terms of effort. |
| **Innovation strategy** | CW: self-correction + narration, OC: AI Insight (2nd LLM call) + self-correction, KC: self-healing + domain narration, MiMo: self-correction + multi-view, OMP: "指标即代码" framing | **OC's AI Insight layer is an underexplored idea that 3/5 auditors miss.** Only CW and OC propose a second LLM call for business insights. This directly attacks the weakest dimension (创新性, 15pts) and is worth +3-5 points for 3 hours. The other auditors focus on self-correction, which is riskier (depends on SQL failing reliably in demo). |
| **ClawHunt priority** | OMP: #1 priority ("non-negotiable, guaranteed 5 points"), Others: later in timeline | **OMP overstates it.** ClawHunt requires a public URL, which requires deployment. It can't be first if Railway deployment takes 2-3h. The correct ordering is: fix bugs → deploy → then ClawHunt listing (30 min). OMP's "30 min" estimate assumes deployment is already done. |

### 3. Gaps All Auditors Missed

- **ChartConfig type conflict.** CW mentions it in passing (Dashboard.tsx has `nameKey`/`valueKey` fields not in ChatPanel's ChartConfig), but no auditor estimates the actual effort to reconcile. This could be 30 min or 3 hours depending on how deep the type divergence goes. Nobody verified the actual types.
- **No stress test for judge interaction.** All auditors plan for rehearsed chip queries but none address: what happens if a judge grabs the keyboard and types a complex SQL-adjacent question? The `extractJson` greedy regex (flagged by CW, KC, MiMo) could break on edge-case MiMo outputs. No auditor proposes a fallback for this scenario.
- **Seed data verification.** The hardcoded stats bar claims "10,000+ 订单, 500 商品, 8 个地区, 1,000 用户." No auditor verified whether `scripts/seed.ts` actually produces these exact numbers. If the DB has 9,847 orders and the bar says "10,000+", a detail-oriented judge will notice.
- **Demo screen resolution.** No auditor mentions testing the UI at the actual projector resolution. The MetricSidebar is `hidden lg:flex` — if the projector is 1280x720 (common at hackathons), the sidebar might be hidden.
- **Concurrent API calls.** If the presenter clicks a chip while a previous query is still loading, two LLM calls fire simultaneously. No auditor identifies this race condition or proposes a loading guard.

### 4. Prioritized Action List

| # | Action | Score Impact | Effort | Source |
|---|--------|-------------|--------|--------|
| 1 | Fix metric rerun visibility (ChatPanel.tsx:262) | +3-5 (Demo) | 15 min | KC, MiMo unanimous |
| 2 | Wire Dashboard.tsx as landing view | +4-6 (Demo, PMF) | 2.5h | All 5 unanimous |
| 3 | Fix DB singleton in query/route.ts | +1-2 (Demo safety) | 5 min | All 5 unanimous |
| 4 | Reduce timeout to 20s | +1 (Demo safety) | 2 min | CW identified |
| 5 | Move API key to env var | +1 (Tech) | 5 min | All 5 unanimous |
| 6 | Remove dead dependencies | +1 (Tech) | 5 min | All 5 unanimous |
| 7 | Add ErrorBoundary around charts | +1-2 (Demo safety) | 15 min | CW, KC, OC, OMP |
| 8 | AI Insight layer (2nd LLM call) | +3-5 (Innovation) | 3h | CW, OC |
| 9 | Dynamic KPI stats from DB | +1-2 (Demo) | 30 min | All 5 |
| 10 | Demo rehearsal (5× with stopwatch) | +3-5 (Demo, Pitch) | 4h | All 5 |

---

## Q2: Innovation Narrative

### 1. Unanimous Findings

- **Text2SQL is commodity.** All 5 auditors state this explicitly. The 创新性 dimension (15pts) is universally identified as the weakest link at 7-10/15.
- **Revenue formula intelligence is a differentiator worth showing.** All 5 reference the `SUM(oi.quantity*oi.unit_price*(1-oi.discount))` system prompt as proof of domain understanding.
- **The thinking trace (reasoning chain) should be shown in demo.** All 5 mention expanding the `<details>` element to show AI reasoning.

### 2. Key Disagreements

| Disagreement | Positions | Assessment |
|---|---|---|
| **Primary innovation framing** | CW: "AI 数据分析师，不是 SQL 翻译器", OC: "AI Insight Layer" (2nd LLM call), KC: "Self-Healing Agent", MiMo: "Analyst-in-the-Loop" + multi-view, OMP: "指标即代码" (Metrics-as-Code) | **OMP's "指标即代码" is the strongest narrative** because it's backed by existing code (MetricSidebar), is provable in 30 seconds, and has a clear scaling story. However, it's more of a reframing than a technical innovation. **OC's AI Insight layer is the strongest technical addition** because it adds a visible second LLM call that judges can see. **Best combination: OMP's framing + OC's implementation.** |
| **Self-correction loop value** | KC: +3-5 pts, CW: +3-4 pts, MiMo: +3-5 pts, OC: +2-3 pts, OMP: not recommended | **Risk is higher than KC/CW/MiMo suggest.** Self-correction requires: (1) a query that reliably fails SQL validation, (2) MiMo's fix being correct on retry, (3) the whole loop completing within demo time. This is fragile. OC's +2-3 pts is more realistic. OMP is wise to not recommend it — the risk of a failed self-correction demo is worse than not showing it at all. |
| **"Wow moment" engineering** | CW: pre-cache a self-healing result, OC: show the insight panel, KC: live self-healing demo, MiMo: show SQL error→fix loop, OMP: show metric save/replay | **Pre-caching (CW's approach) is safest.** A live self-healing demo that fails is worse than no demo at all. However, a pre-cached "self-healing" result that a judge asks to see live will expose the deception. **Better approach:** Have the self-correction code implemented but only trigger it organically; for the scripted demo, rely on the domain knowledge + metric save narrative. |

### 3. Gaps All Auditors Missed

- **No one addresses the "ChatGPT can do this" objection directly in the innovation narrative.** The strongest counter is: "ChatGPT doesn't connect to your database, validate SQL safety, auto-LIMIT results, or remember your metrics." OMP comes closest with the "指标即代码" framing but doesn't explicitly address the ChatGPT comparison as an innovation defense.
- **No one proposes a quantitative demo metric.** e.g., "Watch — I'll ask a question and get a chart in under 10 seconds. ChatGPT would take 2 minutes of copy-pasting." Showing a stopwatch during the demo would make the speed advantage tangible.
- **No one considers the "opposite of innovation" risk.** If the self-correction loop looks like the AI is making mistakes and fixing them, judges might score lower on 技术实现 (the AI should get it right the first time). The framing must be "safety net" not "error recovery."

### 4. Prioritized Action List

| # | Action | Innovation Score | Effort |
|---|--------|-----------------|--------|
| 1 | Adopt "指标即代码" as primary narrative framing | +2-3 (reframing, no code) | 0h |
| 2 | Build AI Insight layer (2nd LLM call post-query) | +3-5 | 3h |
| 3 | Implement self-correction loop as safety net (not demo focus) | +1-2 | 2h |
| 4 | Script the "ChatGPT comparison" talking point | +1 | 0h |
| 5 | Add quantitative demo moment (stopwatch) | +1 | 0h |

---

## Q3: UI Overhaul Priorities

### 1. Unanimous Findings

- **Wire Dashboard.tsx into page.tsx.** All 5 agree this is the #1 UI action. It exists, it's 214 lines, it works — just needs importing and data.
- **Replace hardcoded stats with real DB data.** All 5 identify the `STATS` array in page.tsx:7-12 as fake.
- **Data table below chart.** 4/5 auditors (CW, OC, KC, MiMo) recommend a sortable table showing raw query results.

### 2. Key Disagreements

| Disagreement | Positions | Assessment |
|---|---|---|
| **Dashboard as landing vs. tab** | OC: landing page, MiMo: landing page, OMP: landing page, KC: tab navigation (Chat/Dashboard/Metrics), CW: view toggle | **Landing page is better for demo.** First impression matters — judges seeing 4 charts on load is more impressive than an empty chat panel. Tab navigation adds complexity and could confuse the demo flow. CW's "view toggle" is a good middle ground but KC's 3-tab approach is overengineered for 30 hours. |
| **Dashboard color fix effort** | CW: 20min, OC: not explicitly listed, KC: 30min, MiMo: 15min, OMP: not quantified | **CW and KC are right to flag this.** Dashboard.tsx uses hardcoded `text-slate-900` while the rest of the app uses CSS variables. This will look inconsistent. However, it's a straightforward find-and-replace — 20-30 min is accurate. |
| **KPI cards complexity** | OC: new KPI cards component (1h), KC: new KPICard.tsx (1h), MiMo: new KpiCards.tsx (1.5h), OMP: /api/stats endpoint (1h), CW: 30min via /api/stats | **CW's 30min is optimistic; 1h is more realistic.** Need a new API endpoint + a component. But KC and MiMo overcomplicate it by proposing a new component file. Reuse the existing stats bar structure in page.tsx — just change the data source. |

### 3. Gaps All Auditors Missed

- **ChartConfig type reconciliation effort.** CW flags that Dashboard.tsx has `nameKey`/`valueKey` extra fields, but no auditor actually reads both type definitions to estimate the merge effort. This is a blocking dependency for wiring Dashboard.tsx.
- **Dashboard.tsx data source.** All auditors say "wire it in" but none specify how the Dashboard gets its data. Does it call 4 separate API endpoints? One batch endpoint? Does it use the demo-cache directly? This architectural decision affects the implementation significantly.
- **Mobile/responsive testing on demo screen.** The MetricSidebar is `hidden lg:flex`. If the demo projector is < 1024px wide, the sidebar disappears. No auditor mentions testing at actual demo resolution.
- **Font loading.** No auditor checks whether the Tailwind font stack loads correctly on the demo machine. If the demo laptop doesn't have the system fonts, the UI could render with fallback fonts.

### 4. Prioritized Action List

| # | Action | Visual Impact | Effort |
|---|--------|--------------|--------|
| 1 | Wire Dashboard.tsx as landing page with 4 pre-cached charts | HIGH | 2.5h |
| 2 | Replace hardcoded stats with DB queries via /api/stats | MEDIUM | 1h |
| 3 | Add collapsible data table below chart | MEDIUM | 1h |
| 4 | Fix Dashboard.tsx colors (hardcoded → CSS vars) | LOW-MEDIUM | 20 min |
| 5 | Add loading skeleton (replace spinner) | LOW | 30 min |
| 6 | CSV export button on chart results | LOW | 20 min |

---

## Q4: Demo Flow Design

### 1. Unanimous Findings

- **Chips first, typed query last.** All 5 auditors agree: use pre-cached chip queries for the guaranteed opening, save freeform typing for later (or skip if risky).
- **Show the revenue formula in SQL.** All 5 agree this is the key "intelligence" demo moment — the agent uses `quantity * unit_price * (1-discount)` not `total_amount`.
- **Save a metric during the demo.** All 5 include metric save → sidebar → rerun as a demo step.
- **Pre-cache is the fallback plan.** All 5 agree that if MiMo API is slow/down, fall back to cached results automatically.

### 2. Key Disagreements

| Disagreement | Positions | Assessment |
|---|---|---|
| **Persona framing** | OC: "I'm an ecommerce manager who uses QueryForge every morning", CW: prefers OC's persona, OMP: straightforward technical demo, KC: standard hook with pain point, MiMo: pain point → value prop | **OC's persona approach is stronger for Demo Day (5 min) but overkill for 赛区预选 (3 min).** In 3 minutes, there's no time for role-playing. For 5-min Demo Day, the persona adds narrative depth. |
| **When to show Dashboard** | OC: 0:00-0:20 (open with dashboard), MiMo: at the end, KC: 2:20-2:50, OMP: 0:20-0:50, CW: 3:00-3:40 (5-min only) | **Open with Dashboard for first impression, then switch to chat for queries.** OC and OMP are right — showing 4 charts on load immediately signals "this is an analytics product, not a chatbot." KC and CW's approach of showing it late wastes the visual impact. |
| **Freeform query risk** | CW: "If typed query takes >10s, immediately pivot to cached", KC: include freeform as Demo 3, MiMo: include as Demo 4, OC: include as Scenario 3, OMP: include as Demo 3 | **All include freeform but CW has the best mitigation.** The pivot-to-cached strategy should be rehearsed. However, no auditor addresses what happens if the freeform query returns empty results or wrong results. Need a pre-selected "safe" freeform question that's been tested to return good data. |

### 3. Gaps All Auditors Missed

- **No "dry run" proposal.** No auditor suggests running the actual demo on the actual demo machine the night before to catch environment-specific issues (projector resolution, font rendering, browser extensions interfering, etc.).
- **No Q&A prep for "why not ChatGPT?"** OC and OMP mention it in passing but none dedicate a Q&A preparation section. This is the #1 question judges will ask.
- **No timing buffer.** All flows are packed to the second. No auditor allocates buffer time for the inevitable "oh wait, let me scroll up" or "let me show you this other thing" moments. A 3-minute demo should target 2:40 of content.
- **No backup for MetricSidebar not showing.** If the projector resolution hides the sidebar (`hidden lg:flex`), the "save metric" demo step fails visually. Need a fallback: resize the browser before demo or override the media query.

### 4. Prioritized Action List

| # | Action | Demo Impact | Effort |
|---|--------|------------|--------|
| 1 | Write a complete 3-min script with exact talking points | HIGH | 1h |
| 2 | Rehearse 3-min flow 5× with stopwatch | HIGH | 2h |
| 3 | Write 5-min Demo Day script with persona narrative | HIGH | 1.5h |
| 4 | Rehearse 5-min flow 3× with stopwatch | HIGH | 1.5h |
| 5 | Test on actual demo machine (resolution, fonts, sidebar) | MEDIUM | 30 min |
| 6 | Prepare Q&A answers (ChatGPT comparison, security, scaling) | MEDIUM | 1h |

---

## Q5: Technical Debt Triage

### 1. Unanimous Findings

- **DB singleton in query/route.ts MUST be fixed.** All 5 agree. Import `getDb` from `db.ts` instead of `new Database()`. 5-10 min.
- **Dead dependencies should be removed.** All 5 agree. `npm uninstall` 7 packages. 5-15 min.
- **API key should move to env var.** 4/5 agree (OC lists it as SHOULD, not MUST). All acknowledge it's a quick fix.

### 2. Key Disagreements

| Disagreement | Positions | Assessment |
|---|---|---|
| **Metric rerun severity** | KC: MUST fix (demo-breaking), MiMo: MUST fix (demo-breaking), OC: SHOULD fix, OMP: not in MUST, CW: not mentioned | **KC and MiMo are right — it's MUST fix.** The demo flow goes: chip query → metric save → metric rerun. After the chip query, `history.length > 0`, so the rerun guard at ChatPanel.tsx:262 fires and the result is invisible. This breaks the demo at the exact moment the presenter says "watch, I can re-run my saved metric." CW, OC, and OMP miss this because they don't trace the exact demo flow against the code. |
| **extractJson regex** | CW: MUST fix (greedy regex), OC: MUST fix, KC: CAN ignore (works for 4 demo queries), MiMo: SHOULD fix, OMP: SHOULD fix | **KC's CAN-ignore position is technically correct but risky.** The regex works for all 4 cached demo queries. But if a judge types a freeform query and MiMo returns markdown fences or multiple JSON objects, parsing fails. It's a 10-15 min fix (use balanced-brace extraction). Given the low effort, it SHOULD be fixed. |
| **Timeout value** | CW: reduce to 15s, OC: not listed, KC: not listed, MiMo: not listed, OMP: not listed | **CW is the only one who flags the 30s timeout as insufficient.** He's right that 30s is too long for a live demo — a judge staring at a spinner for 25 seconds is catastrophic. But 15s may be too aggressive for MiMo's response times. **20s is the right compromise.** |
| **No error boundary severity** | OC: MUST fix, OMP: MUST fix, KC: SHOULD fix, CW: SHOULD fix, MiMo: not listed | **OC and OMP are right.** A chart crash during live demo → white screen. This is unrecoverable without a page refresh. MUST fix, 15 min. |

### 3. Gaps All Auditors Missed

- **No one checks if `npm uninstall` actually works.** If any of the 7 "dead" packages are indirectly required by other packages, uninstalling could break the build. CW mentions verifying `clsx` and `lucide-react` imports but doesn't run the actual uninstall. This needs a build verification after removal.
- **No one addresses the `require()` call in query/route.ts.** Line 20 uses `require("better-sqlite3")` which is CommonJS in an ESM Next.js route. Fixing the singleton import (using `getDb`) also fixes this, but no auditor explicitly notes the CJS/ESM issue.
- **No one proposes a pre-demo smoke test script.** A checklist or script that verifies: (1) all 4 chips work, (2) metric save works, (3) metric rerun works, (4) Dashboard loads, (5) offline fallback works. This 5-minute test before going on stage prevents 90% of demo failures.
- **No one considers the `/api/schema` endpoint.** It's 72 lines of dead code. 3 auditors say delete it, 2 say leave it. But nobody checks if Dashboard.tsx's data loading could reuse it. If Dashboard needs schema info for chart labels, `/api/schema` might actually be useful.

### 4. Prioritized Action List

| # | Action | Risk Mitigated | Effort |
|---|--------|---------------|--------|
| 1 | Fix metric rerun visibility (ChatPanel.tsx:262) | Demo flow break | 15 min |
| 2 | Fix metric rerun data passthrough (thinking/explanation) | Incomplete rerun display | 15 min |
| 3 | Fix DB singleton in query/route.ts | Memory leak, WAL lock | 5 min |
| 4 | Add ErrorBoundary around ChartResult | White screen crash | 15 min |
| 5 | Reduce timeout to 20s | 30s spinner during demo | 2 min |
| 6 | Move API key to .env.local | Security, code review | 5 min |
| 7 | Remove dead dependencies (verify build after) | Signals polish | 10 min |
| 8 | Fix extractJson regex (balanced-brace) | Freeform query parse failure | 10 min |
| 9 | Add pre-demo smoke test script | All demo scenarios | 30 min |

---

## Q6: Deployment Decision

### 1. Unanimous Findings

- **Railway is the correct platform.** All 5 agree: `better-sqlite3` native module works on Railway (persistent container), not Vercel (serverless).
- **Localhost should remain as backup.** All 5 agree on a hot-standby approach.
- **Deploy the night before, not demo day.** All 5 agree this is critical.

### 2. Key Disagreements

| Disagreement | Positions | Assessment |
|---|---|---|
| **Deployment priority** | OMP: #1 (Phase 1, "non-negotiable"), CW: Plan B (night before), OC: after tech debt (hour 5-8), KC: Block 3 (after bugs + UI), MiMo: Phase 2 (hour 4-6) | **CW's "deploy as Plan B, demo locally as Plan A" is the safest strategy.** OMP's rush to deploy first is wrong — there's no point deploying broken code. KC and MiMo's mid-timeline placement is reasonable. The right time is after MUST fixes and UI wiring but before rehearsal. |
| **Deployment time estimate** | CW: 1.5h, OC: 2-3h, KC: 1-1.5h, MiMo: 2-3h, OMP: 2-3h | **CW's 1.5h is optimistic but possible with the Dockerfile approach.** The risk is `better-sqlite3` native compilation, which CW explicitly addresses with a Dockerfile. KC's 1h is too optimistic. 2h is realistic. |
| **ClawHunt bonus dependency** | All agree ClawHunt needs a public URL, but CW proposes `npx localtunnel` as emergency fallback for ClawHunt if Railway fails | **CW's localtunnel fallback is clever.** If Railway fails, a localtunnel URL for the ClawHunt submission (even if unstable) gets the +3 points. Nobody else proposes this. |

### 3. Gaps All Auditors Missed

- **No one addresses the SQLite data persistence on Railway.** Railway containers are ephemeral — the SQLite file resets on every redeploy. The seed data needs to be either: (a) committed to the repo and seeded on deploy, (b) stored on a Railway volume, or (c) served from a static file. No auditor specifies which approach.
- **No one checks if `data/ecommerce.db` is in `.gitignore`.** KC mentions checking it but doesn't verify. If it's gitignored, it won't be in the Railway deploy. If it's not gitignored, it's a 2.7MB binary in the repo.
- **No one considers Railway cold start impact.** Free tier Railway apps sleep after inactivity. The first request after sleep takes 30-60s. If the demo starts with a cold Railway URL, the first query will time out. Need to pre-warm 2 minutes before demo.
- **No one proposes a deployment smoke test.** After deploying to Railway, need to test: (1) all 4 chips work, (2) offline fallback works, (3) metric save works, (4) the DB has seed data. This takes 30 min but prevents deploying a broken URL.

### 4. Prioritized Action List

| # | Action | Risk/Benefit | Effort |
|---|--------|-------------|--------|
| 1 | Create Dockerfile with build deps for better-sqlite3 | Prevents native module failure | 30 min |
| 2 | Deploy to Railway, set MIMO_API_KEY env var | Public URL + ClawHunt | 1h |
| 3 | Verify seed data on Railway (test all 4 chips) | Prevents empty demo | 30 min |
| 4 | Register on ClawHunt with Railway URL | +3 bonus points | 15 min |
| 5 | Set up localtunnel as emergency backup | Fallback URL | 5 min |
| 6 | Pre-warm Railway URL 2 min before demo | Prevents cold start | 0 min |

---

## CHANGED Positions

| Old Position | New Position | Evidence |
|---|---|---|
| **KC: extractJson regex is CAN IGNORE** | **Changed to SHOULD fix** | CW (Participant A) correctly identifies that while the regex works for cached queries, any freeform judge input that triggers unusual MiMo output (markdown fences, multiple JSON blocks) will break parsing. At 10 min effort, it's worth fixing. |
| **KC: Current score is 64-74** | **Revised to 70-78** | CW's ground-truth P0 audit (Participant A) shows 4/6 P0 items are genuinely closed, plus the demo cache and metric save flow are working. The lower bound should be higher. However, CW is right that the incomplete DB singleton and 30s timeout lower the estimate below the 75-85 range claimed by OC, MiMo, and OMP. |
| **KC: Self-healing is the primary innovation strategy** | **Changed to "AI Insight layer + 指标即代码 framing"** | OC (Participant B) makes a compelling case that a second LLM call for business insights directly attacks the weakest dimension. OMP's "指标即代码" narrative is backed by existing code (MetricSidebar) and is more defensible than self-correction, which depends on SQL failing reliably. Combined approach is stronger. |
| **KC: Metric rerun bug is #1 MUST fix priority** | **Confirmed — remains #1** | MiMo (Participant D) independently confirms the same bug at ChatPanel.tsx:262 with the same diagnosis. CW and OC miss it, strengthening the evidence that KC and MiMo identified a real demo-flow issue that others overlooked. |

---

## Consolidated Score Projection

| Scenario | Demo (25) | PMF (20) | Tech (20) | Innovation (15) | Business (10) | Pitch (10) | Bonus (5) | **Total** |
|----------|-----------|----------|-----------|-----------------|---------------|------------|-----------|-----------|
| Current state (verified) | 18-20 | 13-15 | 14-16 | 7-9 | 5-6 | 3-5 | 0 | **60-71** |
| + MUST fixes (Q5 #1-8) | 21-23 | 13-15 | 16-18 | 7-9 | 5-6 | 3-5 | 0 | **65-76** |
| + Dashboard + KPI + data table | 22-24 | 16-18 | 17-18 | 7-9 | 6-7 | 3-5 | 0 | **71-81** |
| + AI Insight layer + narrative | 22-24 | 16-18 | 18-19 | 11-13 | 6-7 | 3-5 | 0 | **76-86** |
| + Railway + ClawHunt | 22-24 | 16-18 | 18-19 | 11-13 | 7-8 | 3-5 | +5 | **82-92** |
| + Rehearsed demo + PPT | 23-25 | 17-19 | 18-19 | 12-14 | 7-8 | 8-10 | +5 | **90-100** |

**Ceiling:** 95-100/105 achievable with disciplined execution. **Realistic estimate:** 85-93/105 given debugging time, unforeseen issues, and the fact that the last 10 points always take more effort than the first 90.

**Highest-leverage single action:** Fix metric rerun bug (15 min, +3-5 Demo points). It's the cheapest fix with the highest demo impact — without it, the "save metric → rerun" demo step fails.

**Highest-leverage single investment:** Wire Dashboard.tsx + AI Insight layer (5.5h total, +7-11 points across Demo, PMF, and Innovation). These two together transform the app from "chatbot demo" to "analytics SaaS product."

**Most underrated action:** Rehearse with a stopwatch. All 5 auditors agree but none emphasize it enough. CW puts it best: "the difference between 75 and 90 is rehearsal, not code."

---

*Cross-examination complete. Written by Kilo Code (kc) — 2026-07-04.*

# QUINTE R2 Cross-Examination: QueryForge Final Polish — OpenCode (oc)

**Reviewer:** OpenCode (oc)
**Date:** 2026-07-04
**R1 Artifacts Reviewed:** r1-cw.md, r1-oc.md (self), r1-kc.md, r1-kimi.md, r1-omp.md

---

## Q1: Score Maximization Strategy

### Unanimous Findings (5/5 agree)

1. **Wire Dashboard.tsx is the single highest-impact UI action.** All five auditors rank it #1 or #2. Component exists (214 lines), just needs import + data source. Estimated +3-6 points across Demo + PMF dimensions.
2. **Innovation (15pts) is the weakest dimension**, currently scoring 7-10/15. Every auditor identifies this as the ceiling-limiter.
3. **Demo (25pts) is the highest-weighted dimension** and most directly under team control.
4. **Dead dependencies should be removed.** 7 packages (`@ai-sdk/openai`, `openai`, `sql.js`, `@faker-js/faker`, `clsx`, `lucide-react`, `zod`) — 5/5 flag this. Quick win.

### Key Disagreements

**1. Current Score Baseline — CW is right, the rest of us were too optimistic.**

| Auditor | Estimate |
|---------|----------|
| CW | 62-72 |
| OC (me) | 75-85 |
| KC | 64-74 |
| Kimi | 65-75 |
| OMP | 57-71 |

CW found two P0 items the rest of us missed:
- `query/route.ts:19-23` still creates `new Database()` per request — the DB singleton fix was only applied to `agent.ts`
- Timeout is 30s, not the 15s specified in the R3 verdict

**CHANGED: My baseline estimate of 75-85 BECAUSE CW verified the actual code.** Both KC and OMP (including myself) listed the DB singleton as "must fix" but didn't verify whether it was already fixed. We wrote from the PROJECT-MEMO's "completed" list, not from reading `query/route.ts`. The corrected baseline is 65-75.

**2. Innovation Strategy — KC's self-healing is the best bet.**

| Auditor | Recommended Innovation Approach |
|---------|--------------------------------|
| OC (me) | AI Insight layer (second LLM call) — 3h |
| KC | Self-healing SQL agent — 2h |
| Kimi | Self-correction + multi-view — 2h |
| OMP | "Metrics-as-Code" framing (0h code, 2h narrative) |
| CW | "推理过程可视化 + 错误自愈" — 3h or 0h (narrative only) |

I initially recommended the AI Insight layer (second LLM call for business analysis). After reviewing all R1 artifacts, **KC's self-healing SQL is better** for three reasons:
1. It's cheaper (2h vs 3h)
2. It's more technically impressive (visible agent behavior, not just "another LLM call")
3. It directly demonstrates the "agent" framing, while a second LLM call could be dismissed as "just prompting twice"

OMP's "Metrics-as-Code" framing is strong as a **narrative overlay** but weak as a code change — the MetricSidebar already exists, so the "innovation" is reframing existing work, not building something new. This is fine for Pitch points but won't move the Innovation needle much on its own.

**CHANGED: My recommended innovation approach from AI Insight layer BECAUSE KC and Kimi both argue for self-correction with better point-per-hour reasoning.** However, I still think the AI Insight layer is worth doing *in addition* if time permits (total: 5h for both).

**3. Deployment Strategy — CW's "Plan B" framing is wrong.**

CW recommends: "Deploy as Plan B, demo locally as Plan A."
Everyone else recommends: Deploy to Railway as primary, localhost as backup.

CW's reasoning is risk-averse (avoid deployment debugging on demo day), which is sound, but the framing is backwards. The ClawHunt bonus (+3 pts) requires a public URL. If you don't deploy, you lose 3 guaranteed points. The correct framing is:

> Deploy to Railway as Plan A (night before). If it fails, localhost is Plan B. Never deploy on demo day.

CW's Dockerfile advice is valuable — I'll include it in the action plan.

### Gaps All Auditors Missed

1. **The `.env.local` issue is unresolved.** PROJECT-MEMO notes "apiKey 无法从 .env.local 读取." No auditor verified whether this was fixed in Next.js 14.2.x. If it's still broken, moving the API key to env vars will break the app. **Action: Test `process.env.KIMI_API_KEY` locally before removing the hardcoded key.**

2. **No one stress-tested the demo chip queries.** All 4 cached queries in `demo-cache.ts` are assumed to work. Did anyone verify the SQL actually returns meaningful data from the seed database? If "复购率最高的用户" returns 0 rows because the seed data has no repeat buyers, the demo fails silently.

3. **No auditor checked whether `node-sql-parser` rejects any of the 4 demo SQL queries.** The parser is strict — if any cached SQL uses SQLite-specific syntax the parser doesn't support, validation will fail even though the SQL is correct.

4. **The `chart_config` vs `chartConfig` naming inconsistency is a latent bug.** CW and OMP both flag it, but no one verified whether the existing normalization (checking both keys) actually covers all code paths. One missed check = broken chart.

5. **No one analyzed the seed data quality.** The demo relies on 10K orders across 8 regions and 500 products. Is the data realistic enough that charts look compelling? Or does "哪个品类利润率最高？" return a flat bar chart because margins are uniform?

### Prioritized Action List (by score impact)

| # | Action | Points | Effort | Source |
|---|--------|--------|--------|--------|
| 1 | Fix remaining P0: DB singleton in query/route.ts + timeout 30→15s | +2-3 (Demo) | 15 min | CW verification |
| 2 | Wire Dashboard.tsx as landing view with 3-4 pre-loaded charts | +4-6 (Demo+PMF) | 2.5h | 5/5 consensus |
| 3 | Self-healing SQL retry loop | +3-5 (Innovation) | 2h | KC+Kimi |
| 4 | ClawHunt 上架 + 游园展示 | +3-5 (Bonus) | 30 min | OMP (guaranteed points) |
| 5 | Rehearse demo 5× with stopwatch | +3-4 (Pitch+Demo) | 4h | CW (most underrated) |
| 6 | Dynamic KPI stats from DB | +1-2 (Demo) | 30 min | 4/5 consensus |
| 7 | Error boundary on charts | +2 (Demo safety) | 30 min | OMP+CW |
| 8 | Deploy to Railway (night before) | +2-3 (Demo+Business) | 1.5h | 4/5 consensus |
| 9 | Dead dependency cleanup | +1 (Tech signal) | 10 min | 5/5 consensus |
| 10 | API key → env var | +1 (Tech signal) | 5 min | 5/5 consensus |
| 11 | Data table below chart | +1-2 (Demo+PMF) | 1h | 4/5 consensus |
| 12 | PPT / slides | +1-2 (Pitch) | 2h | OMP+CW |

---

## Q2: Innovation Narrative

### Unanimous Findings (4/5 agree)

1. **Text2SQL is commodity.** Every auditor opens with this. Vanna.ai, Chat2DB, Dataherald, Julius AI, ChatGPT Code Interpreter — judges will have seen this before.
2. **The reasoning/thinking chain is already built** and should be shown during the demo. Expand the `<details>` panel.
3. **The revenue formula intelligence** (`SUM(oi.quantity*oi.unit_price*(1-oi.discount))`) is a genuine differentiator that demonstrates domain knowledge, not just translation.

### Key Disagreements

**1. Primary innovation mechanism — KC wins.**

The options cluster into three camps:
- **Technical feature:** Self-healing SQL (KC, Kimi Option A, CW partial) — adds agent behavior
- **Product framing:** "Metrics-as-Code" (OMP) — reframes existing MetricSidebar
- **UX layer:** AI Insight second call (OC) + multi-view (Kimi Option C)

KC's self-healing SQL is the strongest because:
- It's **visible** in a 3-minute demo (type a tricky query → see error → see fix)
- It's **technically novel** (actual agent loop, not just prompting)
- It's **cheap** (2h implementation)
- It's **low-risk** (only triggers on failure, no downside for normal queries)

OMP's "Metrics-as-Code" is a good **pitch line** but not a good **demo feature** — the MetricSidebar already works, so the "innovation" is narration, not code. Use it in the 5-minute demo Day pitch, not as the primary Innovation differentiator.

**2. Live demo of self-correction — Kimi is right about the risk.**

Kimi notes: "Self-correction demo needs a query that reliably fails first attempt — fragile." This is correct. If the self-correction triggers on every query, the demo is slow. If it never triggers, the feature is invisible.

**Solution:** Pre-cache a self-correction result in `demo-cache.ts`. For the 3-minute flow, show the cached "error → fix" sequence. For the 5-minute Demo Day flow, attempt it live as a bonus moment — if it works, great; if not, use the cached version.

### Gaps All Auditors Missed

1. **No one analyzed whether Kimi's output format is reliable enough for the self-correction loop.** If Kimi returns inconsistent JSON when given an error context, the retry will also fail. Need to test this with actual Kimi API calls.

2. **The "wow moment" depends on the thinking chain quality.** No auditor read a sample thinking chain output. If Kimi's reasoning is generic ("I will write a SQL query to answer this question"), the demo loses its punch. **Action: Read a cached thinking chain and evaluate whether it's demo-worthy.**

3. **No one considered the "ChatGPT objection."** A judge will ask "why not just use ChatGPT?" The best answer isn't about self-correction — it's about **database connectivity** (QueryForge connects to your DB, ChatGPT doesn't) and **SQL safety** (AST validation, SELECT-only enforcement). These are existing features that need better narration, not new code.

### Prioritized Action List

| # | Action | Points | Effort |
|---|--------|--------|--------|
| 1 | Implement self-healing SQL retry loop in agent.ts | +3-5 (Innovation) | 2h |
| 2 | Pre-cache a self-correction demo result | +1 (Demo reliability) | 30 min |
| 3 | Write "Metrics-as-Code" pitch line for 5-min demo | +1-2 (Pitch) | 30 min |
| 4 | Evaluate thinking chain quality — if weak, improve system prompt | +1-2 (Demo) | 1h |
| 5 | Prepare "why not ChatGPT?" answer | +0 (Pitch) | 15 min |

---

## Q3: UI Overhaul Priorities

### Unanimous Findings (5/5 agree)

1. **Wire Dashboard.tsx as landing page.** Every auditor's #1 or #2 priority. 214 lines of dead code that transforms the app from "chatbot" to "analytics dashboard."
2. **Data table below chart.** Judges want to see raw data. Collapsible `<details>` element.
3. **Don't add dark mode toggle.** CSS vars exist but no switch needed. Not worth the time.
4. **Don't rebuild UI from scratch.** The Tailwind + CSS vars foundation is solid.

### Key Disagreements

**1. KPI cards vs. dynamic stats — both are good, KPI cards are better.**

CW and KC recommend replacing the hardcoded `STATS` array with real DB counts. Kimi and OMP recommend KPI cards with real data. These are essentially the same thing, but KPI cards are visually more impressive. The stats bar is a thin strip; KPI cards are prominent visual elements.

**Recommendation:** Replace the stats bar with 4 KPI cards (total orders, total revenue, avg order value, top region). Query from DB on mount. This addresses both the "hardcoded" problem and the "thin UI" problem simultaneously.

**2. Tab navigation vs. dashboard-as-landing — dashboard-as-landing is simpler.**

KC recommends tab navigation (Chat / Dashboard / Metrics). OC, Kimi, OMP recommend showing the dashboard on load with chat below or as a toggle. Tab navigation adds complexity (new component, routing logic) for marginal benefit. In a 3-minute demo, you don't want to explain tabs.

**Recommendation:** Dashboard on load, chat input below the dashboard charts. When user submits a query, scroll to the chat section. Simple, no new routing.

### Gaps All Auditors Missed

1. **Dashboard.tsx color mismatch.** CW flagged this explicitly: hardcoded `text-slate-900`, `border-slate-200` instead of CSS variables. If wired as-is, the dashboard will look visually inconsistent with the rest of the app. **Action: Update Dashboard.tsx to use CSS variables (20 min).**

2. **No one addressed the ChartConfig type conflict.** Dashboard.tsx has `nameKey` and `valueKey` fields that ChatPanel's `ChartConfig` doesn't. Before wiring, need to reconcile types or Dashboard will have TypeScript errors.

3. **No loading state for dashboard.** If the dashboard loads 4 charts from the API on mount, there's a 2-5 second window where the page shows empty chart cards. Need skeleton loaders for the dashboard grid.

### Prioritized Action List

| # | Action | Points | Effort |
|---|--------|--------|--------|
| 1 | Wire Dashboard.tsx as landing with 3-4 pre-loaded charts | +4-6 | 2.5h |
| 2 | Replace stats bar with KPI cards from real DB data | +2-3 | 1h |
| 3 | Fix Dashboard.tsx color mismatch (CSS vars) | +1 | 20 min |
| 4 | Add data table below chart (collapsible) | +1-2 | 1h |
| 5 | Add loading skeletons for dashboard grid | +1 | 30 min |
| 6 | ErrorBoundary around chart components | +2 (safety) | 30 min |

---

## Q4: Demo Flow Design

### Unanimous Findings (5/5 agree)

1. **Chips first, typed query last.** Chips are cached and guaranteed. Typed queries are risky.
2. **Have a fallback plan for Kimi API failure.** 4 cached results in `demo-cache.ts`.
3. **Rehearse with a stopwatch.** The difference between a good demo and a bad demo is rehearsal, not features.
4. **Show the thinking chain.** The expandable `<details>` with "查看推理过程" is the closest thing to a "wow moment."

### Key Disagreements

**1. 3-minute flow: live freeform query — CW is right to be cautious.**

KC and Kimi include a live typed query in the 3-minute flow. CW warns: "If the typed query takes >10s, immediately pivot to a pre-cached result." CW is right. In a 3-minute flow with 2 judges, you cannot afford a 15-second dead zone.

**Recommendation:** For 赛区预选 (3 min), use chips only. Type a freeform query only if time permits and API is confirmed responsive. For Demo Day (5 min), include a typed query as the 3rd demo — but have a cached fallback ready.

**2. Self-correction demo timing — Kimi's 5-min flow placement is best.**

CW puts the self-correction in the 5-min flow as optional. Kimi puts it at 2:00-2:40 as a dedicated segment. Kimi's placement is better because:
- By minute 2, the audience is warmed up
- It's a distinct "wow" moment that breaks the query-chart-query-chart monotony
- It needs its own narrative beat: "Watch what happens when the AI makes a mistake"

### Gaps All Auditors Missed

1. **No one addressed what happens if a judge's freeform query returns empty results.** The seed data has 10K orders, but if a judge asks "哪个供应商的退货率最高？" and there's no supplier table, the agent will either fail or return garbage. **Action: Pre-test 5-10 likely judge questions against the schema.**

2. **No one mentioned the demo screen resolution.** The UI uses `hidden lg:flex` for the sidebar. If the projector resolution is <1024px wide, the sidebar disappears. **Action: Test at 1280×720 (common projector resolution).**

3. **No one planned the transition from dashboard landing to chat.** If the demo starts with a dashboard view and then switches to chat, the visual transition needs to be smooth. If it's jarring (page scroll, layout shift), it looks unprofessional.

### Prioritized Action List

| # | Action | Points | Effort |
|---|--------|--------|--------|
| 1 | Write and rehearse 3-min flow (5× with timer) | +3-4 (Pitch+Demo) | 2h |
| 2 | Write and rehearse 5-min flow (3× with timer) | +2-3 (Pitch+Demo) | 2h |
| 3 | Pre-cache self-correction demo result | +1 (Demo reliability) | 30 min |
| 4 | Test demo queries against schema for empty results | +0 (risk mitigation) | 30 min |
| 5 | Test UI at 1280×720 projector resolution | +0 (risk mitigation) | 15 min |

---

## Q5: Technical Debt Triage

### Unanimous Findings (5/5 agree)

1. **`/api/query` creates new DB per request** — must fix, 5-10 min. All auditors flag this.
2. **Dead dependencies (7 packages)** — must remove, 5-10 min.
3. **API key hardcoded in agent.ts** — should fix, 5-15 min.
4. **No error boundary on charts** — should fix, 15-30 min.

### Key Disagreements

**1. Metric rerun bugs — KC is right that these are demo-breaking.**

KC flags two bugs that other auditors downplay:
- `ChatPanel.tsx:262` — `history.length === 0` guard means metric rerun is invisible after first chat
- `page.tsx:26-30` — `handleRunMetric` drops thinking/explanation

KC's assessment is correct. The demo flow includes "save metric → click to rerun." If the rerun doesn't show results because `history.length > 0`, the demo breaks at the most critical moment (showing the workflow loop). This is a **MUST fix**, not a SHOULD fix.

**2. `extractJson` greedy regex — CW is right to flag it, but KC is right to deprioritize it.**

CW lists the `extractJson` greedy regex as MUST fix. KC lists it as CAN IGNORE. The truth is in between: it's a real bug that could bite during live demo (if Kimi returns markdown fences), but it works for all 4 cached queries. **Action: Fix it if time permits (10 min), but don't block on it.** The demo cache covers the failure mode.

**3. Timeout — CW is right, the rest of us missed it.**

CW found that the timeout is 30s, not 15s as specified in the R3 verdict. 30s is too long for a live demo — a judge staring at a spinner for 25 seconds is catastrophic. **MUST fix: reduce to 15s.**

### Gaps All Auditors Missed

1. **No one verified the `require("better-sqlite3")` in query/route.ts actually works with the singleton.** The fix is to import `getDb` from `db.ts`, but does `getDb()` return a `better-sqlite3` Database instance? If `db.ts` uses a different SQLite library, the import will fail.

2. **No one checked whether removing dead dependencies breaks the build.** Some packages might be indirectly required (e.g., `zod` might be a peer dependency of another package). **Action: Run `npm run build` after each uninstall to verify.**

3. **No one addressed the `require()` vs `import` inconsistency.** `query/route.ts` uses `require("better-sqlite3")` while `agent.ts` uses `import`. This is a Next.js route file — `require()` might work but is non-standard. The fix (importing from `db.ts`) resolves this, but it's worth noting.

### Prioritized Action List

| # | Action | Effort | Risk if skipped |
|---|--------|--------|-----------------|
| 1 | Fix query/route.ts DB singleton (import from db.ts) | 5 min | Demo failure under repeated clicks |
| 2 | Fix metric rerun visibility (remove history.length guard) | 15 min | Demo flow breaks at save/rerun step |
| 3 | Fix metric rerun data passthrough (include thinking) | 15 min | Rerun shows blank explanation |
| 4 | Reduce timeout 30s → 15s | 2 min | 25-second spinner during demo |
| 5 | Add ErrorBoundary around charts | 30 min | White screen on chart crash |
| 6 | Move API key to env var | 5 min | Security red flag if judges read code |
| 7 | Remove dead dependencies | 10 min | Build bloat signal |
| 8 | Fix extractJson greedy regex | 10 min | Potential parse failure on edge cases |

---

## Q6: Deployment Decision

### Unanimous Findings (5/5 agree)

1. **Railway is the correct platform** (not Vercel, due to `better-sqlite3` native module).
2. **Localtunnel is the fallback** (already working per PROJECT-MEMO).
3. **Never deploy on demo day.** Deploy the night before.
4. **ClawHunt 上架 requires a public URL** — strongest argument for deployment.

### Key Disagreements

**1. Deploy as Plan A or Plan B — everyone except CW says Plan A.**

CW recommends "Deploy as Plan B, demo locally as Plan A." KC, Kimi, OMP, and I all recommend deploying as the primary plan with localhost as backup. CW's reasoning (avoid deployment debugging) is sound, but the framing is wrong. The ClawHunt bonus is +3 points for ~1.5h of work. That's the best ROI in the entire project.

**Recommendation:** Deploy to Railway as Plan A, night before. If it fails, localhost is Plan B. CW's Dockerfile advice is valuable — include it in the deployment plan.

**2. Deployment timing — KC has the best sequencing.**

CW says "night before." KC says "Block 3 (after bug fixes + UI overhaul)." OMP says "Phase 5 (after innovation + presentation prep)."

KC's sequencing is best because: deployment should happen after the UI is polished (so the deployed version looks good) but before demo rehearsal (so you can rehearse on the actual Railway URL). The optimal order is:

1. Bug fixes (2h)
2. UI overhaul (4h)
3. **Deploy to Railway (1.5h)**
4. Innovation feature (2h)
5. Demo rehearsal (4h)

### Gaps All Auditors Missed

1. **No one verified that `data/ecommerce.db` (2.7MB) is included in the deploy.** If `.gitignore` excludes it, the deployed version will have no data. **Action: Check `.gitignore` before deploying.**

2. **No one planned for Railway cold starts.** Free tier Railway apps sleep after inactivity. First request takes 30-60s. **Action: Hit the Railway URL 2 minutes before the demo to wake it up.**

3. **No one considered the Kimi API key on Railway.** The hardcoded key in `agent.ts` will work on Railway, but if we move it to `.env.local` (as recommended), we need to set it in Railway's environment variables too. **Action: Set `KIMI_API_KEY` in Railway dashboard.**

4. **No one mentioned the SQLite write concern on Railway.** Railway containers have ephemeral storage. If the app writes to `data/ecommerce.db` (e.g., saving metrics to localStorage is fine, but if the app writes to the DB file), changes will be lost on redeploy. **Action: Verify the app only reads from the DB file, never writes to it during runtime.**

### Prioritized Action List

| # | Action | Effort |
|---|--------|--------|
| 1 | Create Railway account + project (do TODAY) | 15 min |
| 2 | Check .gitignore — ensure data/ecommerce.db is included | 5 min |
| 3 | Deploy to Railway + set KIMI_API_KEY env var | 1h |
| 4 | Test all 4 demo chips on Railway URL | 30 min |
| 5 | Pre-warm Railway URL 2 min before demo | 0 min (during demo) |
| 6 | Register on ClawHunt with public URL | 15 min |

---

## Cross-Examination Summary

### Positions Changed

| Change | Reason |
|--------|--------|
| Lowered baseline score estimate from 75-85 to 65-75 | CW verified code: DB singleton fix incomplete, timeout not reduced |
| Switched innovation recommendation from AI Insight to self-healing SQL | KC and Kimi both argue better point-per-hour ratio |
| Upgraded metric rerun bugs from SHOULD to MUST fix | KC correctly identifies demo flow breakage |

### Highest-Confidence Recommendations (all 5 auditors agree)

1. Wire Dashboard.tsx as landing page — 2.5h, +4-6 pts
2. Fix query/route.ts DB singleton — 5 min, prevents demo failure
3. Remove dead dependencies — 10 min, code quality signal
4. Rehearse demo with stopwatch — 4h, +3-4 pts
5. Deploy to Railway for ClawHunt — 1.5h, +3-5 pts

### Most Controversial Recommendation

**Self-healing SQL vs. AI Insight layer.** KC and Kimi favor self-healing (2h, +3-5 Innovation). I initially favored AI Insight (3h, +3-5 Innovation). After cross-examination, self-healing is better because it's cheaper and more technically impressive. However, the two are not mutually exclusive — if time permits (5h total), both can be done.

### Blind Spots Across All R1 Audits

1. **Seed data quality** — no one verified the demo queries return compelling data
2. **Kimi API reliability** — no one tested whether the thinking chain is demo-worthy
3. **`.env.local` issue** — PROJECT-MEMO flags it but no auditor verified it's resolved
4. **`node-sql-parser` compatibility** — no one checked if cached SQL passes validation
5. **Projector resolution** — UI uses `hidden lg:flex`, may hide sidebar at 1280×720

---

## Final Prioritized Action List (All 6 Questions Combined)

| # | Action | Dimension | Points | Effort | Conflicts? |
|---|--------|-----------|--------|--------|------------|
| 1 | Fix query/route.ts DB singleton | Demo | +2-3 | 5 min | None |
| 2 | Reduce timeout 30s → 15s | Demo | +1-2 | 2 min | None |
| 3 | Fix metric rerun visibility + data passthrough | Demo | +3-5 | 30 min | None |
| 4 | Wire Dashboard.tsx as landing with 3-4 charts | Demo+PMF | +4-6 | 2.5h | None |
| 5 | Replace stats bar with KPI cards from DB | Demo+PMF | +2-3 | 1h | None |
| 6 | Self-healing SQL retry loop | Innovation | +3-5 | 2h | None |
| 7 | ClawHunt 上架 + 游园展示 | Bonus | +3-5 | 30 min | None |
| 8 | Deploy to Railway (night before) | Demo+Business | +2-3 | 1.5h | None |
| 9 | ErrorBoundary on charts | Demo safety | +2 | 30 min | None |
| 10 | Dead dependency cleanup | Tech | +1 | 10 min | None |
| 11 | API key → env var | Tech | +1 | 5 min | None |
| 12 | Data table below chart | Demo+PMF | +1-2 | 1h | None |
| 13 | PPT / slides | Pitch | +1-2 | 2h | None |
| 14 | Rehearse 3-min flow 5× | Pitch+Demo | +3-4 | 2h | None |
| 15 | Rehearse 5-min flow 3× | Pitch+Demo | +2-3 | 2h | None |
| 16 | Test seed data + schema compatibility | Risk mitigation | 0 | 1h | None |
| 17 | Fix Dashboard.tsx color mismatch | Polish | +1 | 20 min | None |

**Total estimated effort:** ~18h (leaving ~12h buffer for debugging + sleep)
**Total estimated points:** +28-42 → **final score 88-100/105 + 3-5 bonus**

---

*Cross-examination complete. Written by OpenCode (oc) — 2026-07-04.*

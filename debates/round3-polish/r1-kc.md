# QUINTE Audit: QueryForge Final Polish — Kilo Code (kc)

**Date:** 2026-07-04 13:58 CST
**Scope:** 10 source files (~700 lines), package.json, globals.css, layout.tsx, scoring criteria, hackathon rules, 3 prior audit rounds (R1/R2/R3), demo-script.md, PROJECT-MEMO.md
**Time remaining:** ~30 hours to deadline (7/5 20:00)

---

## Current State Summary

### P0 Fixes — Status from R3 Audit

| # | Fix | Status | Evidence |
|---|-----|--------|----------|
| 1 | MetricSidebar save button | **DONE** | `ChatPanel.tsx:241-254` — "保存指标" button writes to localStorage |
| 2 | LLM timeout | **DONE** | `agent.ts:77` — `AbortSignal.timeout(30000)` (30s) |
| 3 | Offline fallback | **DONE** | `demo-cache.ts` — 4 cached results; `route.ts:14-26` falls back to cache |
| 4 | Chart title per-item | **DONE** | `ChatPanel.tsx:228` — uses `item.r.chartConfig?.title` per history item |
| 5 | DB singleton | **PARTIAL** | `db.ts` singleton exists, but `query/route.ts:19-23` still creates new instances via `require()` |
| 6 | LIMIT enforcement | **DONE** | `agent.ts:58-60` — auto-adds `LIMIT 500` if missing |

### Remaining Issues — Verified in Source

| Issue | File:Line | Severity |
|-------|-----------|----------|
| Metric rerun invisible after first chat | `ChatPanel.tsx:262` — `history.length === 0` guard | **Demo-breaking** |
| Metric rerun drops thinking/explanation | `page.tsx:26-30` — only passes sql, data, chartConfig | **Visible** |
| API key hardcoded in source | `agent.ts:9` — `apiKey: "REMOVED_MIMO_API_KEY"` | **Security** |
| DB connection not unified | `query/route.ts:19-23` — `new Database()` per request vs `db.ts` singleton | **Architecture** |
| Dashboard.tsx unused | 214 lines, never imported in `page.tsx` | **Dead code** |
| /api/schema unused | `schema/route.ts` — 72 lines, never consumed by frontend | **Dead code** |
| Dead dependencies | `package.json` — @ai-sdk/openai, openai, sql.js, @faker-js/faker, clsx, lucide-react, zod | **Build bloat** |
| Hardcoded stats bar | `page.tsx:7-12` — static "10,000+ 订单" etc. | **Fragile** |
| No streaming | `agent.ts:73` — `generateText` not `streamText` | **UX** |
| No error boundary | Charts crash → white screen | **Demo risk** |
| No dark mode toggle | CSS vars defined in `globals.css` but no switch | **Incomplete** |
| extractJson regex greedy | `agent.ts:65` — `/\{[\s\S]*\}/` matches outermost braces | **Fragile** |

---

## Q1: Score Maximization Strategy

### Assessment

With 30 hours remaining, the project has a working core (4 demo queries, offline fallback, save metric, SQL validation). The highest-ROI work is **not new features** but **reliability hardening + UI polish + presentation prep**. The scoring rubric weights Demo (25pts) and Presentation (10pts) most heavily for a total of 35 points that are directly under team control in the remaining time.

### Recommended Time Allocation (30 hours)

| Priority | Action | Score Impact | Effort | Hours |
|----------|--------|-------------|--------|-------|
| **1** | Fix metric rerun visibility + data passthrough | Demo +3-5 | 30 min | 0.5 |
| **2** | Wire Dashboard.tsx into page.tsx as overview tab | Demo +2-3, PMF +2, Tech +1 | 2h | 2 |
| **3** | Replace hardcoded stats with live DB queries | Demo +1-2 | 1h | 1 |
| **4** | Add data table view below chart | Demo +2, Tech +1 | 1.5h | 1.5 |
| **5** | Move API key to .env.local + document | Tech +1 (signals engineering) | 15 min | 0.25 |
| **6** | Unify DB connection (query/route.ts → db.ts) | Tech +1 | 15 min | 0.25 |
| **7** | Remove dead dependencies | Tech +1 (signals polish) | 20 min | 0.3 |
| **8** | Add React error boundary around charts | Demo +2 (prevents crash) | 30 min | 0.5 |
| **9** | Expand demo-cache to 6 queries (add 2 more) | Demo +1 (more wow) | 30 min | 0.5 |
| **10** | Deploy to Railway | Demo +3, Business +2 | 1.5h | 1.5 |
| **11** | Professional UI polish pass (spacing, shadows, typography) | Presentation +2-3 | 3h | 3 |
| **12** | Rehearse demo 5× + refine script | Presentation +3, Demo +2 | 4h | 4 |
| **13** | PPT creation + narrative design | Presentation +3 | 3h | 3 |
| **14** | Add "AI insight" second LLM call (optional) | Innovation +3-4 | 2h | 2 |
| **15** | ClawHunt listing + 游园展示 prep | +5 bonus | 2h | 2 |
| | **Buffer for debugging** | | | 6.2 |
| | **TOTAL** | | | **30** |

### Scoring Projection

| Scenario | Demo (25) | PMF (20) | Tech (20) | Innovation (15) | Business (10) | Pitch (10) | Bonus | **Total** |
|----------|-----------|----------|-----------|-----------------|---------------|------------|-------|-----------|
| Current (P0 done) | 19-21 | 13-15 | 15-17 | 7-9 | 5-6 | 5-6 | 0 | **64-74** |
| + Fix bugs + UI polish | 22-24 | 15-17 | 17-18 | 7-9 | 6-7 | 7-8 | 0 | **74-83** |
| + Deploy + rehearse + PPT | 23-25 | 16-17 | 18-19 | 8-10 | 7-8 | 8-9 | +5 | **85-93** |
| + AI insight differentiator | 23-25 | 16-18 | 18-19 | 11-13 | 7-8 | 8-9 | +5 | **88-97** |

### Risk Factors
- **UI polish is subjective** — 3 hours might produce marginal improvement if the designer lacks taste
- **Railway deployment could hit native module issues** — better-sqlite3 C++ addon needs compilation on target platform
- **AI insight step adds failure mode** — new LLM call could timeout or produce bad output

### Confidence: **HIGH** — This allocation is conservative and prioritizes reliability over features.

---

## Q2: Innovation Narrative

### Assessment

Text2SQL is commoditized. Vanna.ai, Chat2DB, Dataherald, and dozens of startups do this. The 创新性 dimension (15pts) is the weakest. Current estimated score: 7-9/15. The ceiling without a narrative shift is ~10/15.

### The Problem
Judges will see "natural language → SQL → chart" and think "I've seen this before." The current demo doesn't show anything a well-prompted ChatGPT can't do.

### Narrative Strategies (ranked by impact/effort)

#### Strategy A: "Self-Healing Agent" — **RECOMMENDED**
**Concept:** Add a retry loop in `agent.ts` that catches SQL errors, feeds them back to the LLM, and asks it to fix the query. Show this live during the demo.

**Implementation:**
```typescript
// In agent.ts — add after line 83 (queryDb)
let retries = 0;
let data: Record<string, unknown>[];
try {
  data = queryDb(safeSql);
} catch (sqlError) {
  if (retries < 1) {
    // Feed error back to LLM
    const fixPrompt = `The SQL you generated failed: ${sqlError.message}. Original question: ${query}. Previous SQL: ${sql}. Fix the SQL and return the same JSON format.`;
    // ... re-call LLM with fix prompt
  }
}
```

**Demo moment:** Type a deliberately tricky query like "哪些产品的退货率最高？" (which has no returns table). The agent attempts SQL, fails, self-corrects, and produces a reasonable approximation. **This is the "wow" moment.**

**Effort:** 2 hours. **Impact:** Innovation +3-5 points.

#### Strategy B: "Domain-Aware Reasoning"
**Concept:** The system prompt already contains domain knowledge (Revenue = SUM(oi.quantity*oi.unit_price*(1-oi.discount)), NEVER use orders.total_amount). Frame this as "the agent understands your business logic, not just your schema."

**Demo moment:** Ask "上个季度的营收是多少？" — the agent correctly uses the line-item revenue formula, not the unreliable `total_amount` column. Show the thinking panel to reveal the reasoning.

**Effort:** 0 hours (already implemented). **Impact:** Innovation +1-2 (just needs narration).

#### Strategy C: "Multi-Chart Dashboard Generation"
**Concept:** For complex questions, generate multiple SQL queries and render a multi-chart dashboard. "给我一个销售概览" → 4 charts (revenue trend, top categories, regional breakdown, top products).

**Implementation:** Modify the system prompt to support returning an array of chart configs. Use the existing `Dashboard.tsx` component.

**Effort:** 3 hours. **Impact:** Innovation +2-3, Demo +2.

#### Strategy D: "Proactive Insight Generation"
**Concept:** After generating the chart, add a second LLM call that analyzes the data and produces actionable insights. "华东地区Q2销售额下降15%，主要受电子产品品类拖累。建议关注库存周转率。"

**Effort:** 2 hours. **Impact:** Innovation +3-4, PMF +2.

### Recommended Combination
**A + B** (self-healing + domain reasoning narration) = 4 hours, Innovation +4-6 points. This is the best ROI.

### Risk Factors
- Self-healing loop adds latency (extra LLM call = +15-30s). Must only trigger on SQL failure, not every query.
- If the LLM can't fix the SQL, the demo looks worse than without the feature.
- Judges may not notice the innovation unless explicitly narrated.

### Confidence: **MEDIUM** — Strategy A is technically feasible but depends on MiMo's ability to fix SQL errors reliably. Strategy B is free but requires strong narration.

---

## Q3: UI Overhaul Priorities

### Assessment

The current UI is functional but "thin" — it's a chat panel with a single chart and a sidebar. It looks like a developer prototype, not a business SaaS product. The `Dashboard.tsx` component (214 lines) exists but is completely unused.

### What Makes It Look Like a "Demo Hack" vs "Business SaaS"

| Demo Hack | Business SaaS |
|-----------|---------------|
| Single chat interface | Multiple views (chat, dashboard, metrics) |
| Hardcoded stats | Live data from DB |
| No data table | Sortable/filterable data grid |
| Static layout | Responsive, tabbed navigation |
| Plain text headers | KPI cards with trend indicators |
| No export | CSV/image export |
| No loading states | Skeleton loaders, progress bars |

### Specific Changes (ranked by visual impact / effort)

| # | Change | Impact | Effort | Files |
|---|--------|--------|--------|-------|
| 1 | **Add tab navigation** (Chat / Dashboard / Metrics) | HIGH — transforms single-view to multi-view app | 1.5h | `page.tsx`, new `TabNav.tsx` |
| 2 | **Wire Dashboard.tsx** with 4 pre-loaded charts from demo-cache | HIGH — shows multi-chart capability | 1h | `page.tsx`, `Dashboard.tsx` |
| 3 | **Replace hardcoded stats with live KPI cards** | HIGH — "10,000+ 订单" becomes real | 1h | `page.tsx`, new `KPICard.tsx` |
| 4 | **Add data table below chart** | MEDIUM — judges can inspect raw data | 1.5h | `ChatPanel.tsx`, new `DataTable.tsx` |
| 5 | **Add CSV export button** | MEDIUM — "analyst workflow" signal | 30 min | `ChatPanel.tsx` |
| 6 | **Improve loading states** (skeleton instead of spinner) | MEDIUM — perceived quality | 45 min | `ChatPanel.tsx` |
| 7 | **Add subtle animations** (chart entry, result card slide-in) | LOW-MEDIUM — polish signal | 1h | `globals.css`, components |
| 8 | **Professional color refinements** | LOW — already good | 30 min | `globals.css` |

### Total Effort: ~7.5 hours

### What NOT To Do
- Do NOT add dark mode toggle (CSS vars exist but it's a time sink for no scoring benefit)
- Do NOT redesign the chat interface from scratch (current one is clean)
- Do NOT add drag-and-drop or complex interactions (untestable in 30 hours)
- Do NOT add authentication or multi-user features (won't be demoed)

### Risk Factors
- Dashboard.tsx uses hardcoded Tailwind colors (`text-slate-900`, `border-slate-200`) instead of CSS vars — needs adaptation to match the design system
- Multi-tab layout could confuse the demo flow if not rehearsed
- Adding too many views dilutes the narrative focus

### Confidence: **HIGH** — Items 1-4 are straightforward React work with clear visual payoff.

---

## Q4: Demo Flow Design

### Context
- **赛区预选:** 3 minutes fast talk + short Q&A. 2 judges per zone. Focus: running demo + one-sentence value prop.
- **Demo Day:** 5 minutes demo + 3 minutes Q&A. Investment + guest judges. Full scoring rubric.

### 3-Minute 赛区预选 Flow

| Time | Action | What Judges See | Scoring Signal |
|------|--------|-----------------|----------------|
| 0:00-0:20 | **Hook:** "业务团队提需求，数据团队排期3天。我们把它缩短到10秒。" | Screen shows QueryForge landing page | PMF: pain point |
| 0:20-0:50 | **Query 1:** Click "各地区月度销售额趋势" | Thinking → SQL → line chart (8 regions × 12 months) | Demo: works, Tech: AI reasoning visible |
| 0:50-1:20 | **Query 2:** Type "哪个品类利润率最高？" manually | Agent correctly uses revenue formula, not total_amount | Tech: domain knowledge, Innovation: business logic |
| 1:20-1:50 | **Query 3:** Type a freeform question (judge picks) | Agent handles unscripted input | Demo: robust, Tech: generalization |
| 1:50-2:20 | **Metric save + rerun:** Click "保存指标" → sidebar populates → click to rerun | Full workflow loop | PMF: analyst workflow |
| 2:20-2:50 | **Dashboard view:** Switch to Dashboard tab, show 4-chart overview | Multi-chart grid | Demo: rich UI |
| 2:50-3:00 | **Close:** "已部署到线上，随时可以测试。" Show URL | Deployed URL on screen | Business: production-ready |

### 5-Minute Demo Day Flow

| Time | Action | Narrative Beat |
|------|--------|----------------|
| 0:00-0:30 | **Problem:** "企业数据团队每天花2-3小时拉报表。业务方等3-5天。" Show a mock Slack conversation | Empathy |
| 0:30-1:00 | **Solution intro:** "QueryForge — 用自然语言提问，AI 自动生成安全的 SQL 查询。" | Value prop |
| 1:00-1:40 | **Query 1:** "各地区月度销售额趋势" — show thinking panel, SQL, chart | Technical depth |
| 1:40-2:20 | **Query 2:** Complex query — "复购率最高的用户分析" — agent understands "复购" concept | Intelligence |
| 2:20-3:00 | **Query 3 (live):** Ask judge to suggest a question. Type it live. | Robustness + audience engagement |
| 3:00-3:30 | **Self-healing demo (if implemented):** Tricky query that triggers SQL error → agent self-corrects | Innovation wow |
| 3:30-4:00 | **Metric workflow:** Save → sidebar → rerun → Dashboard view | Product completeness |
| 4:00-4:30 | **Business value:** "可部署的SaaS。企业数据团队市场。已上线，欢迎测试。" | Business potential |
| 4:30-5:00 | **Close:** Show deployed URL, QR code if available. "谢谢。" | Call to action |

### Fallback Plan (MiMo API Slow/Down)

| Scenario | Response |
|----------|----------|
| API takes >15s | Cached results kick in automatically (`demo-cache.ts`). "离线演示" badge appears. No manual intervention needed. |
| API returns error | Chat API catches error, falls back to cache. Same behavior. |
| API completely down | Pre-load the 4 cached results into MetricSidebar on page load. Demo the sidebar → rerun flow instead of chat flow. |
| WiFi down | Run `npm run dev` on localhost. Demo on laptop screen. Pre-load all 4 results by clicking chips once during warm-up. |
| All software fails | Show the PPT with screenshots and talk through the architecture. Worst case but still scores Presentation points. |

### Pre-Demo Warm-Up Checklist
1. Start dev server 5 minutes before presentation
2. Click all 4 demo chips to warm up DB + verify data
3. Test one freeform query to verify API is responsive
4. Open Dashboard tab to verify charts render
5. Save one metric to verify sidebar works
6. Have localhost URL ready as backup

### Risk Factors
- **Judge asks a query that returns empty data** — mitigate by pre-testing common business questions
- **Judge asks about SQL injection** — point to `node-sql-parser` validation in `agent.ts:51-62`
- **Judge asks "why not just use ChatGPT?"** — answer: "ChatGPT doesn't connect to your database, validate SQL safety, or remember your business metrics."
- **Demo takes longer than expected** — have a "skip to Dashboard" shortcut ready

### Confidence: **HIGH** — The demo script is well-designed. The cached fallback is robust. Main risk is live freeform query quality.

---

## Q5: Technical Debt Triage

### MUST Fix (Would Cause Live Demo Failure)

| # | Issue | Risk | Fix | Effort |
|---|-------|------|-----|--------|
| 1 | **Metric rerun invisible after first chat** (`ChatPanel.tsx:262`) | User clicks metric sidebar after chatting → nothing happens. Demo flow breaks. | Remove `history.length === 0` guard. Append external results to history array instead. | 15 min |
| 2 | **Metric rerun drops thinking/explanation** (`page.tsx:26-30`) | Rerun shows blank explanation text. Looks broken. | Add `thinking` and `explanation` to `SavedMetric` type and pass through in `handleRunMetric`. | 15 min |
| 3 | **API key hardcoded in source** (`agent.ts:9`) | If source is reviewed, key is exposed. If key rotates, code must change. | Move to `process.env.MIMO_API_KEY` with `.env.local` fallback. | 10 min |

### SHOULD Fix (Visible Quality Signal)

| # | Issue | Risk | Fix | Effort |
|---|-------|------|-----|--------|
| 4 | **DB connection not unified** (`query/route.ts:19-23`) | New connection per request wastes file descriptors. Judges may read code. | Import `getDb` from `@/lib/db` instead of `require("better-sqlite3")`. | 10 min |
| 5 | **Dead dependencies** (7 unused packages) | `npm install` output shows bloat. Signals rushed assembly. | `npm uninstall @ai-sdk/openai openai sql.js @faker-js/faker clsx lucide-react zod` | 5 min |
| 6 | **Hardcoded stats bar** (`page.tsx:7-12`) | Stats don't match data if seed changes. Judges may verify. | Add `/api/stats` endpoint that queries real counts, or compute in `page.tsx` server component. | 1h |
| 7 | **No error boundary** | Chart crash → white screen during demo. | Wrap `ChartResult` in React error boundary with fallback UI. | 30 min |
| 8 | **Dashboard.tsx color mismatch** | Uses hardcoded `text-slate-900` instead of CSS vars. Looks inconsistent if wired in. | Replace with `var(--text)`, `var(--border)`, etc. | 30 min |

### CAN Ignore (Not Worth Time)

| # | Issue | Why Ignore |
|---|-------|------------|
| 9 | No streaming response | `generateText` works fine. Streaming adds complexity for marginal UX improvement. Not worth 30 min. |
| 10 | extractJson regex greedy | Works for all 4 demo queries. Risk is only for adversarial freeform input. Not worth rewriting. |
| 11 | No conversation memory | Single-turn is a known limitation. Multi-turn requires major architecture change (session storage, context window management). Not feasible in 30 hours. |
| 12 | No agent loop | Single LLM call is the architecture. Adding loops changes the entire pipeline. Not worth it unless doing Strategy A (self-healing). |
| 13 | /api/schema unused | Dead code but harmless. Could be useful if judges ask about schema. Leave it. |
| 14 | No dark mode toggle | CSS vars are defined but no toggle exists. Not a scoring dimension. Skip. |
| 15 | No tests | Zero tests. Not worth starting now. Would distract from polish. |
| 16 | SQL validation duplication | `agent.ts` and `query/route.ts` both validate. Minor code smell. Not worth refactoring. |

### Risk Factors
- Fixing #1 (metric rerun visibility) requires modifying ChatPanel.tsx which is the most complex component (350 lines). Risk of introducing new bugs.
- Fixing #5 (dead deps) could break the build if any package is indirectly required. Test after uninstalling.
- Fixing #6 (hardcoded stats) adds a new API endpoint — more surface area for bugs.

### Confidence: **HIGH** — The "MUST" fixes are well-understood, small changes. The "SHOULD" fixes are straightforward. The "CAN ignore" list is defensible.

---

## Q6: Deployment Decision

### Assessment

The previous QUINTE rounds converged on Railway (not Vercel, due to better-sqlite3 native module). The question now is: with 30 hours left, is Railway worth the time vs. running locally with localtunnel?

### Option A: Railway Deployment

| Aspect | Detail |
|--------|--------|
| **Time estimate** | 1-2 hours (CLI setup, deploy, env config, test) |
| **Risk** | Medium — better-sqlite3 native module compilation on Railway's build environment. Could require Dockerfile or nixpacks config. |
| **Reward** | Stable public URL. Judges can test on phones. Looks professional. Scores Business +2-3 and Demo +2-3. |
| **Fallback** | If Railway fails, fall back to localtunnel. |
| **Cost** | Railway free tier or ~$5 for the weekend. |

### Option B: Localtunnel / localhost

| Aspect | Detail |
|--------|--------|
| **Time estimate** | 0 hours (already working per PROJECT-MEMO) |
| **Risk** | High — URL changes on restart. Tunnel can drop. Judges can't test independently. Looks unprofessional. |
| **Reward** | Zero deployment risk. Works immediately. |
| **Fallback** | Is the fallback. |
| **Cost** | $0 |

### Option C: Railway + localhost as hot standby

| Aspect | Detail |
|--------|--------|
| **Time estimate** | 1.5 hours |
| **Risk** | Low — if Railway works, use it. If not, localhost is already running. |
| **Reward** | Best of both worlds. |
| **Strategy** | Deploy to Railway first. Keep localhost running. During demo, show Railway URL. If Railway is slow/down, switch to localhost seamlessly. |

### Recommendation: **Option C**

**Reasoning:**
1. 30 hours is plenty of time. 1.5 hours for deployment is <5% of remaining budget.
2. A stable public URL scores at least +5 points across Demo and Business dimensions.
3. The judges at a hackathon called "ClawHunt Builder Camp" will expect a deployed product, not a localhost demo.
4. The risk is asymmetric: if Railway works (likely), big payoff. If it fails (unlikely with 30h buffer), localhost is already there.
5. Per hackathon rules: "上架 Clawhunt 平台 +3 分" — this may require a public URL.

### Deployment Steps (if proceeding)
1. `npm install -g @railway/cli` (5 min)
2. `railway login` (2 min)
3. `railway init` → `railway up` (10 min)
4. Set `MIMO_API_KEY` env var in Railway dashboard (5 min)
5. Verify `data/ecommerce.db` is included in deploy (check `.gitignore` — it's NOT in `.gitignore`, so it should be included)
6. Test all 4 demo queries on Railway URL (15 min)
7. If native module fails: add `nixpacks.toml` with build deps or use Dockerfile (30 min contingency)
8. Total: 37 min + 30 min contingency = ~1 hour

### Risk Factors
- **better-sqlite3 compilation failure on Railway** — most common issue. Mitigation: Railway supports native modules well; use `nixpacks.toml` if needed.
- **SQLite file too large for deploy** — `ecommerce.db` with 10K orders is likely <5MB. Should be fine.
- **Cold start latency** — Railway free tier may have cold starts. First request after idle takes 5-10s. Mitigation: pre-warm before demo.
- **Railway account setup** — needs email verification, possibly credit card for free tier. Do this TODAY, not tomorrow.

### Confidence: **HIGH** — Railway + localhost hot standby is the obvious choice with 30 hours remaining. The only question is whether Railway's build environment handles better-sqlite3, which is well-documented and supported.

---

## Appendix: Complete Action Plan (Priority Order)

### Block 1: Bug Fixes (2 hours)
1. Fix metric rerun visibility — remove `history.length === 0` guard, append to history (15 min)
2. Fix metric rerun data passthrough — include thinking/explanation in SavedMetric (15 min)
3. Move API key to .env.local (10 min)
4. Unify DB connection in query/route.ts (10 min)
5. Add React error boundary around ChartResult (30 min)
6. Remove dead dependencies (5 min)
7. Fix Dashboard.tsx colors to use CSS vars (30 min)

### Block 2: UI Overhaul (4 hours)
8. Add tab navigation (Chat / Dashboard / Metrics) (1.5h)
9. Wire Dashboard.tsx with 4 pre-loaded charts (1h)
10. Replace hardcoded stats with live KPI cards (1h)
11. Add data table below chart (30 min)

### Block 3: Deployment (1.5 hours)
12. Deploy to Railway (1h)
13. Test all queries on deployed URL (30 min)

### Block 4: Innovation Differentiator (2 hours)
14. Implement self-healing SQL retry loop in agent.ts (1.5h)
15. Add 2 more demo-cache queries for Dashboard view (30 min)

### Block 5: Presentation (7 hours)
16. Create PPT (3h)
17. Refine demo script (1h)
18. Rehearse 3-minute flow 5× (1.5h)
19. Rehearse 5-minute flow 3× (1.5h)

### Block 6: Bonus (2 hours)
20. ClawHunt listing (1h)
21. 游园展示 preparation (1h)

### Buffer: ~12 hours for debugging, edge cases, and sleep.

---

## Final Score Projection

| Dimension | Current | After Blocks 1-3 | After All Blocks |
|-----------|---------|-------------------|------------------|
| Demo (25) | 19-21 | 23-25 | 24-25 |
| PMF (20) | 13-15 | 16-17 | 17-18 |
| Tech (20) | 15-17 | 18-19 | 19-20 |
| Innovation (15) | 7-9 | 8-10 | 11-13 |
| Business (10) | 5-6 | 7-8 | 7-8 |
| Pitch (10) | 5-6 | 6-7 | 9-10 |
| Bonus (+5) | 0 | 0 | +5 |
| **Total** | **64-74** | **78-86** | **92-99** |

The 92-99 range assumes all blocks execute cleanly. Realistic estimate with debugging and setbacks: **85-93/105**.

---

*Audit complete. Written by Kilo Code (kc) — 2026-07-04 13:58 CST.*

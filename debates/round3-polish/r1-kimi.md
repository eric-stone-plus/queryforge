# R1 Kimi Audit: QueryForge Final Polish

## Q1: Score Maximization Strategy

### Assessment

Current baseline: ~75-85/105 with P0 fixes already done (MetricSidebar save, LLM timeout, offline fallback, chart title, DB singleton, LIMIT). The gap to 85-90 is primarily UI thinness and innovation narrative.

### Ranked Actions (Score Impact / Effort)

| # | Action | Impact | Effort | Ratio |
|---|--------|--------|--------|-------|
| 1 | Wire Dashboard.tsx into page.tsx as landing view | +5-8 (Demo+PMF) | 2h | HIGH |
| 2 | Fix sidebar rerun bug (ignored when history > 0) | +3-5 (Demo) | 30min | HIGH |
| 3 | Remove 7 dead deps + fix demo-script Zod claim | +2-3 (Tech) | 20min | HIGH |
| 4 | Add data table view below chart | +3-5 (Demo+PMF) | 2h | MED |
| 5 | Build KPI cards from real DB data (not hardcoded) | +3-5 (Demo+PMF) | 1.5h | MED |
| 6 | Deploy to Railway + custom domain | +3-5 (Demo) | 3h | MED |
| 7 | Add conversation memory (2-turn context) | +3-5 (Tech) | 3h | MED |
| 8 | Add self-correction loop (SQL fail → retry with error) | +3-5 (Tech+Innovation) | 2h | MED |
| 9 | Polish demo narrative + rehearse | +3-5 (Presentation) | 2h | MED |
| 10 | Dark mode toggle (CSS vars already defined) | +1-2 (Demo) | 1h | LOW |

### Recommendation

**Phase 1 (4h):** Items 1-3 — highest ROI, unblocks the "SaaS product" appearance.
**Phase 2 (6h):** Items 4-6 — substance layer, makes the demo impressive.
**Phase 3 (5h):** Items 7-8 — technical depth, addresses weakest scoring dimension.
**Phase 4 (3h):** Items 9-10 — polish and rehearsal.

### Risk Factors
- Dashboard.tsx uses different color palette and Tailwind classes — visual inconsistency risk
- Railway deployment has unknown auth complexity
- Conversation memory may introduce state bugs

**Confidence: HIGH** — the math is straightforward. The biggest risk is trying to do too much.

---

## Q2: Innovation Narrative

### Assessment

Text2SQL is commodity in 2024-2026. Every hackathon has one. The 创新性 dimension (15pts) is the weakest link, currently estimated at 8-10/15. Need to reach 12-14/15.

### Three Viable Innovation Framings

**Option A: "Analyst-in-the-Loop" (Self-Correction Agent)**
- When SQL execution fails or returns empty results, the agent catches the error, feeds it back to Kimi, and generates a corrected SQL — in a visible loop
- Show the audience: "Watch it debug its own SQL in real time"
- Implementation: wrap execute in try/catch, on error → second LLM call with error message → re-execute. ~2h work
- Wow moment: user sees "SQL 错误 → 正在修正 → 修正完成" in the UI

**Option B: "Metric Memory" (Persistent Knowledge Graph)**
- Saved metrics aren't just bookmarks — they form a knowledge base that the agent references
- When user asks "上个月的销售趋势怎么样？", the agent checks saved metrics first, finds "各地区月度销售额趋势", and says "您之前保存过类似指标，已为您更新时间范围"
- Implementation: inject saved metrics into system prompt, ~1.5h work
- Wow moment: "它记得我之前查过什么"

**Option C: "Chart Intelligence" (Auto-Visualization Agent)**
- Instead of the agent choosing one chart type, render a mini-dashboard with 2-3 complementary views of the same data
- "利润率最高品类" → bar chart + pie chart + data table, all in one view
- Wire Dashboard.tsx for this purpose
- Wow moment: one question, three perspectives

### Recommendation

**Go with Option A (Self-Correction) + partial Option C (multi-view).** Self-correction is the most technically impressive and easiest to demo live. Multi-view leverages existing Dashboard.tsx code.

Combined narrative: "不是一个 SQL 生成器，是一个能自我修正的数据分析 Agent。" This directly addresses the "Text2SQL is not novel" weakness.

### Risk Factors
- Self-correction adds LLM latency (potentially 30+ seconds total for a failed query)
- Need to demo the self-correction live — if the first query succeeds, the feature is invisible

**Confidence: MEDIUM** — the narrative works, but live demo of self-correction requires careful query selection.

---

## Q3: UI Overhaul Priorities

### Assessment

Current UI: chat panel + single chart + metric sidebar. This looks like a "ChatGPT wrapper", not a SaaS product. The PROJECT-MEMO explicitly says "产品视觉太单薄".

### Concrete Changes (Priority Order)

| # | Change | File(s) | Effort | Impact |
|---|--------|---------|--------|--------|
| 1 | **Landing Dashboard** — On load, show KPI cards + 2-3 overview charts instead of empty chat | `page.tsx`, `Dashboard.tsx` | 3h | HIGH |
| 2 | **KPI Cards Row** — 4 cards: total orders, revenue, avg order value, active users (from real DB queries) | new `KpiCards.tsx` | 1.5h | HIGH |
| 3 | **Data Table Below Chart** — Toggle to see raw SQL results as a sortable table | `ChatPanel.tsx` | 2h | HIGH |
| 4 | **Fix Sidebar Rerun** — Results should appear in chat regardless of history state | `ChatPanel.tsx:262` | 30min | MED |
| 5 | **Header Polish** — Replace hardcoded "10K 订单" with real stats, add branding | `page.tsx` | 30min | MED |
| 6 | **Chart Color Unification** — Dashboard.tsx uses `#2563eb`, ChatPanel uses `#0969da` | both files | 15min | MED |
| 7 | **Loading States** — Skeleton loaders instead of spinner text | `ChatPanel.tsx` | 1h | LOW |
| 8 | **Responsive Sidebar** — MetricSidebar is `hidden lg:flex`, add mobile drawer | `MetricSidebar.tsx` | 1.5h | LOW |

### Minimum Viable Polish (4 hours)

Items 1-5 above. This transforms the app from "chat demo" to "analytics dashboard with AI chat".

### Architecture Note

Dashboard.tsx currently has its own chart rendering system, different from ChatPanel. Two approaches:
- **Quick:** Import Dashboard.tsx as-is for the landing view, accept visual inconsistency
- **Proper:** Extract shared chart rendering into a `ChartRenderer` component, use in both. ~2h extra.

Recommend quick approach given 30h deadline.

### Risk Factors
- Dashboard.tsx uses different Tailwind classes (slate-900 vs CSS vars) — looks unpolished if not unified
- KPI cards need new DB queries — adding API endpoints
- Landing dashboard may confuse demo flow ("where do I type?")

**Confidence: HIGH** — these are well-scoped UI changes with existing code to reference.

---

## Q4: Demo Flow Design

### 3-Minute 赛区预选 Flow

| Time | Segment | Action | What Audience Sees |
|------|---------|--------|--------------------|
| 0:00-0:20 | Hook | "业务团队等一个报表要 3-5 天" | Pain point |
| 0:20-0:30 | Intro | "QueryForge: 自然语言 → SQL → 图表，10 秒" | Value prop |
| 0:30-1:00 | Demo 1 | Click chip: "各地区月度销售额趋势" | Line chart, 240 data points, AI thinking chain |
| 1:00-1:30 | Demo 2 | Type: "哪个品类利润率最高？" | Bar chart, show SQL uses correct revenue formula |
| 1:30-2:00 | Demo 3 | Click "保存指标" → sidebar → click to rerun | Metric persistence workflow |
| 2:00-2:30 | Demo 4 | Type freeform: "复购率最高的用户是谁？" | NL understanding, no SQL knowledge needed |
| 2:30-3:00 | Close | "可部署的 SaaS，企业数据团队市场" | Commercial viability |

### 5-Minute Demo Day Flow

| Time | Segment | Action |
|------|---------|--------|
| 0:00-0:40 | Story | Expanded pain point with real scenario |
| 0:40-1:20 | Demo 1-2 | Two chip queries (trend + comparison) |
| 1:20-2:00 | Demo 3 | Freeform query with visible AI reasoning |
| 2:00-2:40 | Demo 4 | **Self-correction demo** — type a query that will fail SQL validation, watch agent fix it |
| 2:40-3:20 | Demo 5 | Metric save → rerun → dashboard view |
| 3:20-4:00 | Architecture | "Single LLM call + AST validation + auto-viz" |
| 4:00-5:00 | Business | SaaS model, market size, team background |

### Query Sequence Logic

1. **Warm-up (chip):** Trend query — visually impressive, easy to understand
2. **Complexity (typed):** Profit margin — shows domain knowledge (correct revenue formula)
3. **Workflow (save+rerun):** Persistence — shows it's a product, not a toy
4. **Flexibility (freeform):** Repurchase rate — shows NL understanding depth
5. **Resilience (Demo Day only):** Self-correction — shows agent sophistication

### Fallback Plan

**If Kimi API is slow (>15s):**
- Pre-cache all 5 demo queries (currently only 4 are cached)
- Show the loading state as a feature: "AI 正在深度分析 10,000 条订单数据..."
- Have the thinking chain expand during wait to show "work is happening"

**If Kimi API is down:**
- All cached queries trigger automatically via `_cached: true` fallback
- The UI shows "离线演示" badge — acknowledge it openly: "API 暂时不可用，但所有结果都是真实的预计算数据"
- Do NOT try to hide it — judges will notice lag absence

**If SQLite is corrupted:**
- Seed script (`scripts/seed.ts`) can rebuild in 5 seconds
- Have it ready: `npm run seed`

### Risk Factors
- Self-correction demo needs a query that reliably fails first attempt — fragile
- 5-minute flow is tight; rehearsal is mandatory
- Typing queries live is risky (typos, unexpected results) — use chips for first 2

**Confidence: HIGH** — the flow is standard hackathon demo structure. Rehearsal is the real differentiator.

---

## Q5: Technical Debt Triage

### MUST Fix (Would Cause Live Demo Failure)

| Issue | Risk | Fix | Effort |
|-------|------|-----|--------|
| Sidebar rerun ignored when `history.length > 0` | Demo step 3 broken | Change condition at ChatPanel.tsx:262 to always show externalResult | 10min |
| `handleRunMetric` silently swallows errors | User clicks rerun, nothing happens | Add toast/alert on catch | 15min |
| `/api/query` creates new DB connection per request | Potential SQLite lock under demo load | Import getDb from db.ts | 10min |
| No input validation on `/api/chat` message | Empty input crashes agent | Add `if (!message)` guard | 5min |

**Total: 40 minutes**

### SHOULD Fix (Visible Quality Signal)

| Issue | Risk | Fix | Effort |
|-------|------|-----|--------|
| 7 dead npm dependencies | "Why is lucide-react installed but unused?" | `npm uninstall` 7 packages | 5min |
| Demo-script claims Zod but it's not used | Caught in Q&A | Remove Zod claim from script | 2min |
| Hardcoded API key in agent.ts | Security red flag if judges read code | Move to env var (fix the .env.local issue) | 15min |
| Duplicate SQL validation (agent.ts vs query/route) | Inconsistent LIMIT behavior | Share validateSelectOnly from agent.ts | 20min |
| ChartConfig type defined 3 times | "Is this a real codebase?" | Extract to shared types file | 15min |
| Hardcoded stats bar | "Are these numbers real?" | Query real DB or remove | 30min |
| `/api/schema` endpoint unused | Dead code in codebase | Remove or wire into agent.ts | 10min |

**Total: ~1.5 hours**

### CAN Ignore (Won't Affect Demo Score)

| Issue | Why Ignore |
|-------|-----------|
| No conversation memory | Single-turn is acceptable for demo; multi-turn is a v2 feature |
| No streaming response | 15-30s wait is tolerable with good loading UX |
| No dark mode toggle | CSS vars defined but no switch — judges won't test this |
| No accessibility (ARIA) | Not a scoring dimension |
| No responsive mobile layout | Demo is on laptop/projector |
| Dashboard.tsx dead code | Will be wired in Q3 overhaul (not "dead" anymore) |
| @faker-js/faker in production deps | Only matters for bundle size, irrelevant for demo |
| Port mismatch (3456 vs 3000) | Just use `npm run dev` |

### Priority Execution Order

1. **MUST fixes (40min)** — do first, prevents demo embarrassment
2. **Dead deps + script fix (7min)** — quick wins
3. **API key to env var (15min)** — judges might glance at code
4. **Share validation logic (20min)** — code quality signal
5. **Everything else** — only if time permits after Q1-Q4 priorities

**Confidence: HIGH** — the MUST/SHOULD/CAN split is clear-cut.

---

## Q6: Deployment Decision

### Assessment

Previous QUINTE decided Railway. The question is whether 30 hours is enough time.

### Railway Deployment Analysis

**Time estimate:** 2-3 hours
- Railway account setup + project creation: 15min
- Environment variables (API key, DB path): 15min
- Build configuration (better-sqlite3 native module): 30-60min (this is the risk — native modules can be tricky on Railway)
- DB seeding on Railway: 15min (need to run seed script on deploy)
- Custom domain or stable URL: 15min
- Testing + debugging: 30-60min

**Benefits:**
- Stable URL for demo (no localtunnel URL changes)
- Judges can access after demo for evaluation
- Looks more professional
- Required for ClawHunt listing (+3 bonus points)

**Risks:**
- `better-sqlite3` is a native C++ module — may need Railway's Nixpacks buildpack configuration
- SQLite on Railway is ephemeral (file resets on redeploy) — need to seed on every deploy or use a volume
- Kimi API latency from Railway servers vs localhost (same region should be fine)
- Debugging deployment issues eats into the 30h budget

### Alternative: Local + localtunnel

**Time estimate:** 15 minutes
- `npx localtunnel --port 3000` — done
- URL changes on restart (can mitigate with `--subdomain` flag, but not guaranteed)

**Benefits:**
- Zero deployment risk
- Full control over environment
- Instant feedback loop

**Risks:**
- localtunnel URLs are ugly and unreliable
- Judges can't access after demo
- Looks unprofessional
- **Cannot get ClawHunt +3 bonus** (requires public URL)

### Recommendation

**Deploy to Railway, but not as first priority.** The ClawHunt bonus (+3 pts) makes deployment worth it. However, the risk is the `better-sqlite3` native module build.

**Execution plan:**
1. **Hour 0-4:** Fix MUST bugs + UI overhaul (Q1, Q3, Q5)
2. **Hour 4-6:** Attempt Railway deployment
3. **If Railway fails on better-sqlite3:** Fall back to Vercel + Turso (SQLite-compatible hosted DB), or localtunnel
4. **Hour 6+:** Demo prep, rehearsal (Q4)

**Key mitigation:** Test Railway deployment early (hour 4, not hour 24). If it fails, you have 20+ hours to pivot.

### Risk Factors
- better-sqlite3 native module compilation on Railway (HIGH risk)
- SQLite data persistence on Railway (MEDIUM risk — need volume or re-seed)
- Time sink if deployment debugging drags on (MEDIUM risk)

**Confidence: MEDIUM** — deployment is high-value but the native module risk is real. Test early.

---

## Summary Score Projection

| Dimension | Current (est) | After This Plan | Delta |
|-----------|--------------|-----------------|-------|
| Demo 现场可用 (25) | 18-20 | 22-24 | +4 |
| 用户价值/PMF (20) | 14-16 | 17-19 | +3 |
| 技术实现 (20) | 12-14 | 16-18 | +4 |
| 创新性 (15) | 8-10 | 12-14 | +4 |
| 商业潜力 (10) | 7-8 | 8-9 | +1 |
| 路演表达 (10) | 6-7 | 8-9 | +2 |
| ClawHunt+游园 (5) | 0 | 4-5 | +4 |
| **Total** | **65-75** | **87-92** | **+22** |

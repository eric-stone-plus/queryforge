# R1 Analysis — MiMo
**QueryForge Competitive Analysis, Product Defects & Data Source Evaluation**
**Agent: MiMo v2.5 Pro | Date: 2026-07-04**

---

## 1. COMPETITIVE ANALYSIS (Q1)

### QueryForge's Actual Differentiation

After auditing the codebase, QueryForge's positioning as "analyst-defined metrics + business self-service" is **not a real moat**. Here's why:

**What exists today:**
- `MetricSidebar.tsx` (100 lines): 6 hardcoded preset SQL metrics stored in localStorage, plus users can save their own queries. This is a thin feature — any competitor could add a "saved queries" sidebar in a day.
- `ChatPanel.tsx` line 251-256: "保存指标" button writes to `localStorage` — client-side only, no persistence, no sharing, no collaboration.

**What's claimed but not built:**
- "语义层（分析师知识沉淀）" — the system prompt (`agent.ts` lines 33-60) hardcodes the full DB schema inline. There is no semantic layer, no business metric definitions, no terminology mapping. The LLM sees raw column names, not business concepts.
- "自纠正循环" — exists (`agent.ts` lines 145-186) but is a single retry with error message appended. No confidence scoring, no multi-step reasoning, no schema-aware correction.

### Market Gaps QueryForge Could Fill (But Doesn't Yet)

| Gap | Competitors | QueryForge Status |
|-----|-------------|-------------------|
| RAG-based learning from past queries | Vanna.ai | ❌ Not implemented |
| Semantic layer / business metrics | Wren AI | ❌ Schema-only, no semantic layer |
| Multi-database support | BlazeSQL, Vanna, Wren | ❌ SQLite only |
| Self-correction with confidence | BlazeSQL (70-85% accuracy) | ⚠️ Basic single retry |
| Real-time dashboards | AskYourDatabase | ❌ Dashboard.tsx exists but not wired |
| Data governance / RBAC | Wren AI (enterprise) | ❌ Not implemented |
| Collaborative features | Most competitors | ❌ localStorage only |

### Honest Assessment

QueryForge's differentiation is essentially: **"we use Kimi K2.7 Code and show the thinking process"**. The "agent thinking visibility" (`ChatPanel.tsx` lines 223-230, the `<details>` element showing推理过程) is a nice UX touch but not a defensible moat. The self-correction loop is real but basic.

**The real value proposition is the demo experience** — a clean, working pipeline from natural language → SQL → chart in under 5 seconds with SSE streaming progress. This is a demo-quality product, not a competitive product.

### Competitive Positioning Recommendation

Stop claiming "semantic layer" and "analyst knowledge persistence" — these features don't exist. Instead, position as:
- **"Instant data analysis agent with transparent reasoning"** — the thinking visibility + self-correction + SSE progress is genuinely good UX
- **"Demo-ready Text-to-SQL with business-friendly charts"** — honest about what it is

---

## 2. DEFECT AUDIT (Q2) — Ranked by Scoring Impact

### Top 5 Defects (Ranked by Demo Day Point Loss)

**🔴 DEFECT #1: Hardcoded Static Data in page.tsx (Impact: -8 to -12 points on Demo 25分)**

`page.tsx` lines 56-88 contain 6 hardcoded datasets:
```
REGION_STATIC, CATEGORY_STATIC, CHANNEL_STATIC, SEGMENT_STATIC, MONTHLY_STATIC, TOP_PRODUCTS
```

These are displayed as the main dashboard. Only `monthlyData` (line 112) is fetched from the database at runtime. All other charts show stale, pre-computed values.

**Why this kills scoring:**
- Demo criterion (25 pts): "Core functions run live" — if a judge asks "show me the data for just the 华东 region" and the chart doesn't change, the demo fails.
- Any live query that contradicts the hardcoded data exposes the fake.
- The KPI cards (lines 154-161) show "总营收 ¥23,256万" — if the DB query returns a different number, it's immediately suspicious.

**Fix effort:** 2-3 hours. Replace hardcoded arrays with DB queries via `/api/query` endpoint, or compute at build time.

---

**🔴 DEFECT #2: "100% 复购率" Faker Artifact (Impact: -5 to -8 points on PMF 20分)**

`page.tsx` line 157: `<KpiCard label="复购率" value="100%" icon="🔄" sub="人均10单" />`

This is a direct artifact of `seed.ts` line 293: `const userId = faker.number.int({ min: 1, max: 1000 })` — uniform random assignment means every user gets ~10 orders. No real business has 100% repurchase rate.

**Why this kills scoring:**
- PMF criterion (20 pts): "Real pain point, clear users" — fake data with impossible KPIs undermines credibility.
- Any judge with e-commerce experience will immediately spot this as unrealistic.
- "人均10单" is mathematically forced by 10000 orders / 1000 users — not a real metric.

**Fix effort:** 1 hour. Either fix the faker distribution to create realistic repurchase patterns, or compute real percentages from the DB.

---

**🟡 DEFECT #3: Dashboard.tsx Dead Code (Impact: -3 to -5 points on Demo 25分)**

`Dashboard.tsx` (214 lines) is a complete, well-structured component with chart rendering logic — but it's **never imported** by `page.tsx`. The `page.tsx` file reimplements all chart rendering inline.

**Why this matters:**
- Shows poor engineering practices (dead code in repo)
- Suggests incomplete integration — was this meant to be the main dashboard?
- If a judge asks "where's the dashboard component?" and you show Dashboard.tsx, they'll ask why it's not used.

**Fix effort:** 30 minutes. Either wire it into page.tsx or delete it.

---

**🟡 DEFECT #4: No Error Boundaries or Client-Side Timeout (Impact: -2 to -4 points on Tech 20分)**

- `ChatPanel.tsx`: No `try/catch` around SSE parsing (line 158 has a catch but only for parse errors, not network failures)
- No `AbortController` for the fetch call — if the LLM hangs, the UI spins forever
- No React error boundary — a crash in the chart rendering kills the entire page
- `agent.ts` line 8: `AI_TIMEOUT_MS = 60000` (60s server-side timeout) but no client-side timeout

**Fix effort:** 1 hour. Add AbortController with 30s timeout, wrap chart in error boundary.

---

**🟡 DEFECT #5: System Prompt Leaks Full Schema (Impact: -1 to -2 points on Tech 20分)**

`agent.ts` lines 33-60: The entire database schema is hardcoded in the system prompt. This means:
- No dynamic schema discovery
- Schema changes require code changes
- Exposes internal structure to the LLM (potential security concern in real deployment)

**Why this is low impact for Demo Day:** It actually works fine for the demo. But it shows the product isn't production-ready.

**Fix effort:** 2+ hours (not worth fixing for demo).

---

### Additional Defects (Lower Impact)

| Defect | Location | Impact |
|--------|----------|--------|
| COLORS constant defined 3x with different values | page.tsx:12, ChatPanel.tsx:16, Dashboard.tsx:40 | Low (visual inconsistency) |
| No input validation on chat messages | ChatPanel.tsx:116-117 | Low (demo-only) |
| temperature=1 for data queries | agent.ts:9 | Medium (inconsistent results) |
| Only 4 cached demo queries | demo-cache.ts | Medium (limited offline fallback) |
| No pagination on query results | agent.ts:71 (LIMIT 500 only) | Low |

---

## 3. DATA SOURCE RECOMMENDATION (Q3)

### Option Analysis

| Option | Effort | Credibility | Demo Impact | Risk |
|--------|--------|-------------|-------------|------|
| **A: Keep faker as-is** | 0 hours | ❌ Low ("100% repurchase" is embarrassing) | Negative | High — judges will notice |
| **B: Olist (Kaggle)** | 4-6 hours | ✅ High (real Brazilian e-commerce) | Very positive | Medium — schema mismatch, Demo Day is tomorrow |
| **C: Chinook** | 2-3 hours | ⚠️ Medium (music ≠ e-commerce narrative) | Neutral | Low |
| **D: Google Analytics** | 6+ hours | ✅ High | Positive | High — BigQuery→SQLite conversion |
| **E: Better faker** | 2-3 hours | ⚠️ Medium (still synthetic, but believable) | Positive | Low |

### 🏆 RECOMMENDATION: Option E (Better Faker) with Option B as Stretch Goal

**Rationale:**

1. **Demo Day is tomorrow (2026-07-05).** Olist requires CSV download, schema transformation, column renaming, system prompt updates, and re-testing all queries. That's 4-6 hours of work with high risk of breaking something.

2. **Option E fixes the embarrassing problems** in 2-3 hours:
   - Add seasonality to order dates (higher in Nov-Dec for 双11/双12)
   - Create realistic repurchase distribution (60% one-time, 25% 2-3 orders, 10% 4-5, 5% 6+)
   - Add product popularity distribution (power law, not uniform)
   - Fix "100% 复购率" to a realistic 35-45%
   - Add regional variation (华东 higher revenue, 西北 lower)
   - Make channel distribution realistic (天猫 30%, 京东 25%, etc.)

3. **Option E preserves the existing schema** — no changes to agent.ts system prompt, no SQL query rewrites, no chart config changes.

4. **If time permits after Option E**, start Olist integration as a stretch goal for post-demo follow-up.

### Option E Implementation Plan

Changes to `scripts/seed.ts`:
1. **Repurchase distribution** (line 293): Replace uniform `faker.number.int({ min: 1, max: 1000 })` with weighted distribution — 600 users get 1-2 orders, 250 get 3-5, 100 get 6-8, 50 get 9-15
2. **Seasonality** (line 334): Weight order dates toward Q4 (双11/双12) and Chinese New Year
3. **Regional revenue variation**: Make 华东 and 华南 account for 30% of orders, 西北 and 东北 for 10%
4. **Channel realism**: 天猫 30%, 京东 25%, 抖音 15%, 微信 12%, 线下 12%, 官网 6%
5. **Product popularity**: Power law — top 20% of products account for 60% of sales
6. **Fix KPI computation**: After seeding, compute real KPIs from DB instead of hardcoding

---

## 4. PPT IMPACT (Q4)

If data changes (Option E), these PPT references need updating:

| Current PPT Content | Needs Update? | New Value (Option E Estimate) |
|---------------------|---------------|-------------------------------|
| "10,000 订单 · 8 地区 · 20 品类" | ✅ Keep | Same (seed still generates 10K orders) |
| "总营收 ¥23,256万" | ✅ Yes | Recompute from DB after reseed |
| "客单价 ¥23,256" | ✅ Yes | Will change with new distribution |
| "毛利率 46.7%" | ⚠️ Maybe | Depends on new cost/price distribution |
| "复购率 100%" | ✅ MUST FIX | Should be 35-45% (realistic) |
| "人均10单" | ✅ MUST FIX | Should be 2-3单 (realistic) |
| "完成率 66.5%" | ✅ Yes | Recompute from new status distribution |
| "退款率 16.6%" | ✅ Yes | Recompute |
| "连带率 2.5件" | ⚠️ Maybe | Depends on new item count distribution |
| "活跃买家 1,000" | ✅ Keep | Same (1000 users in seed) |

**PPT Update Strategy:**
1. After reseeding with Option E, run SQL queries to get real KPIs
2. Update PPT with computed values
3. Add a slide showing "数据基于真实分布模式生成" to be transparent

---

## 5. INNOVATION STRATEGY (Q5)

### Current Innovation Score Assessment: ~5-7/15

The innovation dimension is the weakest. Text-to-SQL is not novel. Here's what QueryForge has and what it should push:

### Existing Innovation Assets

1. **Self-correction loop** (`agent.ts` lines 145-186): Real but basic — single retry with error message. Not enough for 15 points.

2. **Agent thinking visibility** (`ChatPanel.tsx` lines 223-230): The `<details>` element showing "推理过程" is genuinely good UX. Users can see *why* the AI generated that SQL. This is under-marketed.

3. **SSE streaming progress** (`route.ts` + `ChatPanel.tsx`): Real-time progress updates (analyzing → generating SQL → executing → correcting → done) is a polished experience most competitors lack.

4. **MetricSidebar** (`MetricSidebar.tsx`): The "save and reuse queries" concept is good but basic (localStorage only).

### Recommended Innovation Push

**Primary angle: "Transparent AI Analyst" (透明AI分析师)**

Position the self-correction + thinking visibility as a *feature*, not an implementation detail:
- "We don't just give you an answer — we show you the reasoning"
- "If the AI makes a mistake, it tells you what went wrong and fixes it"
- This addresses the #1 enterprise concern with AI: **trust and explainability**

**Implementation to back this up (2-3 hours):**
1. **Add confidence scoring**: After SQL generation, compute a confidence score based on:
   - Did the query need correction? (lower confidence)
   - How many rows returned? (0 rows = low confidence)
   - Did the LLM express uncertainty in thinking? (parse for keywords)
2. **Show confidence in UI**: Add a confidence badge to each result
3. **Add "为什么这个查询?" (Why this query?)**: Expand the thinking section to show the full reasoning chain

**Secondary angle: "Analyst-Defined Business Logic" (分析师定义业务逻辑)**

Transform MetricSidebar from "saved queries" to "business metric definitions":
- Add a simple DSL for defining metrics (e.g., `revenue = SUM(quantity * price * (1-discount))`)
- Let analysts define these once, then business users reference them by name
- This is the "semantic layer" that Wren AI does, but in a simpler, more accessible form

**What NOT to push:**
- Don't claim "semantic layer" — it doesn't exist
- Don't claim "RAG-based learning" — Vanna.ai does this better
- Don't claim "multi-database" — it's SQLite only

---

## 6. SCORE PROJECTION

### Current State (As-Is)

| Criterion | Max | Current Estimate | Notes |
|-----------|-----|-----------------|-------|
| Demo 现场可用 | 25 | **13-16** | Works but hardcoded data, "100% repurchase" is embarrassing, Dashboard.tsx not wired |
| 用户价值/PMF | 20 | **10-13** | Real pain point but fake data undermines credibility |
| 技术实现 | 20 | **12-14** | Self-correction works, SSE streaming is good, but no error handling, dead code |
| 创新性 | 15 | **5-7** | Text-to-SQL is not novel, thinking visibility is nice but under-marketed |
| 商业潜力 | 10 | **5-6** | SQLite-only, no multi-tenancy, no real business model |
| 路演表达 | 10 | **5-6** | Unknown (PPT not reviewed in this analysis) |
| Bonus | 5 | **3-5** | ClawHunt listing + Demo showcase |
| **TOTAL** | **105** | **53-67** | **Below average** |

### After Recommended Changes (Option E + Innovation Push)

| Criterion | Max | Projected Estimate | Improvement |
|-----------|-----|-------------------|-------------|
| Demo 现场可用 | 25 | **20-22** | +7: Real data, no embarrassing KPIs, all charts from DB |
| 用户价值/PMF | 20 | **15-17** | +5: Credible data patterns, realistic KPIs |
| 技术实现 | 20 | **14-16** | +2: Error boundaries, timeout, clean code |
| 创新性 | 15 | **9-11** | +4: Confidence scoring, "Transparent AI Analyst" positioning |
| 商业潜力 | 10 | **6-7** | +1: Better narrative with real data patterns |
| 路演表达 | 10 | **7-8** | +2: Updated PPT with real KPIs |
| Bonus | 5 | **3-5** | Same |
| **TOTAL** | **105** | **74-86** | **+21-19 improvement** |

### Key Risk: Timeline

Demo Day is **tomorrow (2026-07-05)**. The recommended changes require:
- Option E (better faker): 2-3 hours
- KPI computation from DB: 1 hour
- Dashboard.tsx integration: 30 min
- Confidence scoring: 1-2 hours
- PPT updates: 1 hour
- **Total: 5-7 hours**

This is achievable if started immediately. Priority order:
1. Fix faker data (biggest bang for buck)
2. Replace hardcoded KPIs with DB queries
3. Wire Dashboard.tsx or delete it
4. Update PPT
5. Add confidence scoring (stretch goal)

---

*Analysis complete. MiMo v2.5 Pro recommends Option E (Better Faker) + Transparent AI Analyst positioning as the highest-ROI path to improving QueryForge's Demo Day score from ~60 to ~80.*

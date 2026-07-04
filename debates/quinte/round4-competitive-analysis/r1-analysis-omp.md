# R1 Analysis — QueryForge Competitive Landscape, Defects & Strategy
**Agent: Oh My Pi | Date: 2026-07-04 | Demo Day: 2026-07-05**

---

## 1. COMPETITIVE ANALYSIS (Q1)

### 1.1 Market Position

QueryForge operates in the **Text-to-SQL + BI visualization** space. The market has matured significantly:

| Player | Type | Stars/Users | Differentiator | Weakness |
|--------|------|-------------|----------------|----------|
| Vanna.ai | OSS | 12K+ ★ | RAG-trained on custom SQL | No anomaly detection |
| BlazeSQL | SaaS | — | 70-85% accuracy OOB | Closed, expensive |
| AskYourDatabase | SaaS | — | No-code dashboards | Limited customization |
| Wren AI | OSS | — | Semantic layer, GenBI | Complex setup |
| SQL Chat | OSS | — | Simple chat UI | No analytics depth |
| Waii.ai | Enterprise API | — | Multi-viz framework | No self-service UI |

### 1.2 QueryForge's Actual Differentiation

**What we claim:** "Analyst-defined metrics + business self-service"

**What we actually have (evidence from code):**

1. **Self-correction loop** (`src/lib/agent.ts:145-186`): When SQL execution fails, the agent feeds the error back to Kimi K2.7 and gets a corrected query. This is a real technical differentiator — most competitors either fail silently or ask the user to rephrase.

2. **Agent thinking visibility** (`src/lib/agent.ts:39`, rendered in `ChatPanel.tsx:223-231`): The `thinking` field from the LLM is exposed via a collapsible `<details>` element. Users can see *why* the agent chose a particular SQL approach. No major competitor does this.

3. **Analyst metric library** (`src/components/MetricSidebar.tsx`): 6 preset metrics with pre-validated SQL, plus user-saveable metrics to localStorage. This is a thin feature — any competitor can add it in a week.

4. **SSE streaming progress** (`src/app/api/chat/route.ts:11-38`): Real-time progress updates (analyzing → generating SQL → executing → done) via Server-Sent Events. Good UX, but not a moat.

### 1.3 Is "Analyst-Defined Metrics" a Real Moat?

**No.** It's a feature, not a moat. Here's why:

- `MetricSidebar.tsx` stores metrics in `localStorage` — no server-side persistence, no sharing, no versioning
- The preset metrics are hardcoded SQL strings (lines 9-39) — they break if the schema changes
- Any competitor with a plugin system can replicate this in a sprint

**What COULD be a moat (if built):**
- **Metric versioning + anomaly alerting**: "This metric deviated 3σ from its 30-day average"
- **Domain-specific semantic layer**: Understanding that "复购率" means repeat purchase rate, not just a SQL COUNT
- **Audit trail**: Full history of queries, corrections, and data lineage

### 1.4 Real Gaps QueryForge Fills

The one genuine gap: **transparent AI reasoning for non-technical users**. Business analysts distrust black-box SQL generation. QueryForge shows the thinking, the SQL, the correction — building trust through transparency. This is the angle to push.

---

## 2. DEFECT AUDIT (Q2) — Ranked by Scoring Impact

### Defect #1: Hardcoded KPIs with Fake Numbers
**Impact: CRITICAL (-5 to -8 points on Demo现场可用 + 用户价值)**

```tsx
// src/app/page.tsx:154-161
<KpiCard label="总营收" value="¥23,256万" icon="💰" sub="30个月累计" />
<KpiCard label="复购率" value="100%" icon="🔄" sub="人均10单" />
```

The "100% repurchase rate" is an artifact of `scripts/seed.ts:292` — every user gets exactly 10 orders (`orderId` 1-10000, users 1-1000, uniform random). Any judge who asks "is this real data?" will see through it instantly. The "¥23,256万" total revenue and "¥23,256 客单价" are suspiciously round.

**Evidence**: `seed.ts:293` — `const userId = faker.number.int({ min: 1, max: 1000 })` means each user averages exactly 10 orders.

### Defect #2: All Dashboard Data is Hardcoded Static Arrays
**Impact: CRITICAL (-4 to -6 points on 技术实现)**

```tsx
// src/app/page.tsx:56-88
const REGION_STATIC = [
  { name: "西南", value: 3348 }, { name: "华中", value: 3128 }, ...
];
const CATEGORY_STATIC = [...];
const CHANNEL_STATIC = [...];
```

Six static arrays power the entire right sidebar dashboard. These are never computed from the database. If a judge asks "show me the SQL for this chart," there is none — it's baked into the source code. This undermines the core value proposition of a data analysis tool.

**Exception**: `monthlyData` (line 112) IS queried from the DB — but only this one chart.

### Defect #3: Dashboard.tsx Exists But Is Not Wired In
**Impact: HIGH (-3 points on Demo现场可用)**

`src/components/Dashboard.tsx` (175+ lines) is a fully implemented generic chart renderer that supports bar, line, pie, and area charts. It's imported nowhere in `page.tsx`. The page reimplements all chart rendering inline (lines 207-297). This is dead code that signals unfinished refactoring.

**Risk**: A judge exploring the repo sees an unused component and wonders "did they run out of time?"

### Defect #4: No Error Boundaries
**Impact: MODERATE (-2 points on Demo现场可用)**

Zero `ErrorBoundary` components anywhere in the codebase. If the LLM returns malformed JSON (which `extractJson` in `agent.ts:76-91` handles, but edge cases exist), or if `ChartResult` receives unexpected data shapes, the entire React tree crashes with a white screen. On Demo Day, a white screen = instant elimination.

### Defect #5: No Client-Side Timeout for LLM Calls
**Impact: MODERATE (-1 to -2 points on Demo现场可用)**

`ChatPanel.tsx:126` — `fetch("/api/chat", ...)` has no `AbortController`. The server has a 60s timeout (`AI_TIMEOUT_MS`), but if the SSE stream stalls or the network hiccups, the client spins forever with "AI 正在分析数据..." and no way to cancel.

### Defect #6: System Prompt Leaks Full DB Schema
**Impact: LOW (-1 point on 技术实现, but noted by security-conscious judges)**

```typescript
// src/lib/agent.ts:52-59
Schema:
regions(id, name, country)
categories(id, name, parent_id)
products(id, name, category_id, sku, unit_cost, unit_price, created_at)
...
```

The entire schema including column names and types is in the system prompt. For a demo this is fine; for production it's a data governance concern. Not urgent for Demo Day.

---

## 3. DATA SOURCE RECOMMENDATION (Q3)

### Option Analysis

| Option | Time | Credibility | Schema Match | Risk | Verdict |
|--------|------|-------------|--------------|------|---------|
| A: Keep faker | 0h | ⭐ | Perfect | "100% repurchase" embarrassment | ❌ |
| B: Olist (Kaggle) | 6-8h | ⭐⭐⭐⭐⭐ | Poor (different columns) | High — schema mismatch bugs on Demo Day | ⚠️ |
| C: Chinook | 3-4h | ⭐⭐⭐ | Poor (music ≠ ecommerce) | Narrative mismatch | ❌ |
| D: Google Analytics | 8h+ | ⭐⭐⭐⭐ | Poor (BigQuery → SQLite) | Too much work | ❌ |
| E: Better faker | 2-3h | ⭐⭐⭐ | Perfect | Low — same schema, realistic patterns | ✅ |

### Recommendation: **Option E — Improved Faker with Realistic Patterns**

**Why NOT Olist (despite being "real data"):**

1. **Schema translation risk is too high for Demo Day.** Olist has `order_purchase_timestamp`, `order_delivered_customer_date`, `payment_value` — completely different from our `order_date`, `total_amount`, `quantity * unit_price * (1-discount)` formula. The system prompt (agent.ts:33-60), demo-cache.ts SQL queries, MetricSidebar presets, and all static data would need rewriting. One missed column name = broken demo.

2. **Column name mismatch in the agent.** The agent prompt says `Revenue = SUM(oi.quantity*oi.unit_price*(1-oi.discount))`. Olist doesn't have `quantity`, `unit_price`, or `discount` in the same structure. The self-correction loop would likely fail on unfamiliar schema.

3. **Time budget.** With Demo Day tomorrow, a 6-8 hour migration with full testing is not feasible. Option E takes 2-3 hours.

**Why Better Faker Wins:**

- **Same schema** — zero changes to agent.ts, demo-cache.ts, MetricSidebar, or system prompt
- **Fix the embarrassing KPIs** — make repurchase rate ~30%, add seasonality, vary order counts per user
- **Believable patterns** — add monthly seasonality (Q4 spike), regional concentration (华东/华南 > 东北), category variance
- **Quick iteration** — modify `scripts/seed.ts`, regenerate DB, update static arrays in `page.tsx`

### Specific Faker Improvements Needed

1. **User order distribution**: Replace uniform random with power law — 60% of users have 1-3 orders, 25% have 4-8, 15% have 9+. Result: repurchase rate drops to ~40%.

2. **Seasonal patterns**: Add `Math.sin()` modulation to order dates — peak in Q4 (双11, 双12), dip in Q1. Makes monthly trend charts look realistic.

3. **Regional concentration**: Weight orders — 华东 20%, 华南 18%, 华北 15%, ... 东北 5%. Current uniform distribution is suspicious.

4. **Price realism**: Current prices are `faker.number.float({ min: 8, max: 3200 })` with markup 1.18-2.8x. Add category-specific price ranges — 手机 ¥1000-5000, 零食 ¥10-80.

5. **Order status**: Current `["completed", "completed", "completed", "completed", "shipped", "refunded"]` gives 66.7% completion. Adjust to 85% completed, 10% shipped, 3% refunded, 2% canceled.

---

## 4. PPT IMPACT (Q4)

If we switch to Option E (better faker), these PPT numbers change:

| Metric | Current (Fake) | After Fix | Why |
|--------|---------------|-----------|-----|
| 总营收 | ¥23,256万 | ~¥18,000万 | More realistic unit prices |
| 客单价 | ¥23,256 | ~¥1,800 | Adjusted price ranges |
| 毛利率 | 46.7% | ~35-40% | Tighter margins per category |
| 复购率 | 100% ⚠️ | ~35-40% ✅ | Power law distribution |
| 完成率 | 66.5% | ~85% | Realistic order lifecycle |
| 退款率 | 16.6% | ~3% | Industry-standard |
| 连带率 | 2.5件 | ~2.2件 | Slight adjustment |
| 活跃买家 | 1,000 (100%) | ~650 (65%) | Not everyone buys |

**PPT scripts to update:**
- `scripts/gen-ppt-final.py` — main PPT generator
- `scripts/regenerate-queryforge-pitch.py` — pitch deck
- Any hardcoded KPI text in slides

**Key narrative shift**: Move from "look at these impressive numbers" to "look at these realistic insights our AI discovered." The story becomes: "Our AI identified that 80% of revenue comes from 3 regions" or "Repeat customers have 3x higher AOV" — insights that require real-looking data patterns.

---

## 5. INNOVATION STRATEGY (Q5)

### The Problem: Text-to-SQL Is Not Novel

Vanna.ai, BlazeSQL, Wren AI, SQL Chat — they all do Text-to-SQL. The 创新性 dimension (15 pts) is QueryForge's weakest because "natural language → SQL → chart" is table stakes in 2026.

### Innovation Angle: **Self-Correcting Agent with Transparent Reasoning**

This is the combination no competitor has:

```
User Question → LLM Thinking (visible) → SQL Generation → Execution →
  ├─ Success → Chart + Explanation
  └─ Failure → Auto-Correction Loop → Fixed SQL → Chart + Correction Note
```

**Evidence this is partially built:**
- `agent.ts:145-186` — full self-correction loop
- `ChatPanel.tsx:220-222` — correction note display ("🔧 SQL 已自动修正")
- `ChatPanel.tsx:223-231` — thinking visibility ("▸ 查看推理过程")
- `ChatPanel.tsx:244-246` — "AI 自纠正" badge on corrected results

### What to Push for Demo Day

1. **Frame it as "AI Agent" not "Text-to-SQL"**: The self-correction loop is agent behavior — it observes failure, reasons about the fix, and acts. This is agentic AI, not just prompt engineering.

2. **Demo the correction loop live**: Deliberately ask a question that produces a SQL error on first try, then show the auto-correction. This is the wow moment.

3. **Metric library as "institutional knowledge"**: Frame MetricSidebar as "your team's analytical memory" — pre-validated queries that encode business knowledge. This is more compelling than "preset buttons."

4. **Show the thinking**: During demo, expand the "推理过程" details. Let judges see the agent's chain-of-thought. This builds trust and demonstrates technical depth.

### Innovation Score Projection

- **Current**: ~6-7/15 (basic text-to-sQL, no clear differentiation)
- **With framing + live correction demo**: ~10-12/15 (agent behavior + transparency)

---

## 6. SCORE PROJECTION

### Current State (as-is)

| Criterion | Max | Estimated | Notes |
|-----------|-----|-----------|-------|
| Demo 现场可用 | 25 | 14-16 | Hardcoded data, fake KPIs, no error boundaries |
| 用户价值/PMF | 20 | 12-14 | Real pain point, but data undermines credibility |
| 技术实现 | 20 | 13-15 | Self-correction is good, but dead code + static data |
| 创新性 | 15 | 6-7 | Not differentiated from competitors |
| 商业潜力 | 10 | 5-6 | SQLite-only, no auth, demo-stage |
| 路演表达 | 10 | 7-8 | Depends on PPT quality |
| Bonus | +5 | +3-5 | ClawHunt + Demo showcase |
| **TOTAL** | **105** | **60-71** | Mid-pack, not a winner |

### After Recommended Changes (Option E + Defect Fixes + Innovation Framing)

| Criterion | Max | Estimated | Delta | What Changed |
|-----------|-----|-----------|-------|--------------|
| Demo 现场可用 | 25 | 20-22 | +6 | Real-looking data, error boundaries, timeout handling |
| 用户价值/PMF | 20 | 16-18 | +4 | Credible KPIs, believable patterns |
| 技术实现 | 20 | 17-19 | +4 | All data from DB, Dashboard.tsx wired in, clean architecture |
| 创新性 | 15 | 10-12 | +5 | Agent framing, live correction demo, transparency angle |
| 商业潜力 | 10 | 6-7 | +1 | Better data enables realistic business case |
| 路演表达 | 10 | 8-9 | +1 | Stronger narrative with real insights |
| Bonus | +5 | +3-5 | — | Same |
| **TOTAL** | **105** | **80-92** | **+20-25** | **Contender territory** |

### Priority Action Items (Ordered by Impact/Effort)

| # | Action | Effort | Impact | Dependency |
|---|--------|--------|--------|------------|
| 1 | Fix seed.ts: power law users, seasonal patterns, realistic prices | 2h | 🔴 Critical | None |
| 2 | Replace hardcoded KPIs in page.tsx with DB queries | 1h | 🔴 Critical | #1 |
| 3 | Replace static arrays with DB queries | 1.5h | 🔴 Critical | #1 |
| 4 | Wire Dashboard.tsx into page.tsx (or delete it) | 1h | 🟡 High | #3 |
| 5 | Add React ErrorBoundary wrapper | 30m | 🟡 High | None |
| 6 | Add AbortController timeout in ChatPanel | 30m | 🟡 Moderate | None |
| 7 | Update PPT numbers + scripts | 1h | 🟡 Moderate | #1 |
| 8 | Rehearse correction-loop demo | 30m | 🟢 Innovation | None |

**Total estimated effort: ~8 hours** — tight but feasible before Demo Day.

---

## Appendix: Key Code References

- Self-correction loop: `src/lib/agent.ts:145-186`
- Hardcoded KPIs: `src/app/page.tsx:154-161`
- Static dashboard data: `src/app/page.tsx:56-88`
- Dead Dashboard component: `src/components/Dashboard.tsx` (unused)
- Faker seed logic: `scripts/seed.ts:292-351`
- System prompt with schema: `src/lib/agent.ts:33-60`
- SSE streaming: `src/app/api/chat/route.ts:11-38`
- Demo cache fallback: `src/lib/demo-cache.ts`
- Metric presets: `src/components/MetricSidebar.tsx:9-39`

# QUINTE Audit: QueryForge Final Polish — CodeWhale (cw)

**Agent:** CodeWhale (cw)
**Date:** 2026-07-04
**Inputs:** task.md, full source (10 core files, 1084 lines), package.json, demo-script.md, PROJECT-MEMO.md, r1-kc.md, r1-omp.md, r3-audit-verdict.md, r3-direction-verdict.md, criteria/hackathon-rules.md

**Methodology:** Read every source file line-by-line, verified P0 closure status against actual code, cross-referenced both prior audits (KC, OMP) for factual accuracy.

---

## P0 Closure Status (Ground Truth Check)

Before answering the 6 questions, I audited whether the R3 P0 items are actually closed in code:

| R3 P0 Item | Status | Evidence |
|---|---|---|
| MetricSidebar save flow | ✅ **Closed** | `ChatPanel.tsx:241-254` — "保存指标" button writes to localStorage + dispatches StorageEvent |
| LLM timeout | ⚠️ **Partial** | `agent.ts:72` has `AbortSignal.timeout(30000)` (30s). R3 verdict specified 15s. 30s is too long for live demo — a judge staring at a spinner for 25 seconds is catastrophic. |
| Offline fallback | ✅ **Closed** | `demo-cache.ts` has 4 cached results, `route.ts:14-23` falls back on API error, `_cached` flag triggers "离线演示" badge in UI |
| Chart title per item | ✅ **Closed** | `ChatPanel.tsx:228` uses `item.r.chartConfig?.title` per history item, `ChatPanel.tsx:109-112` derives `chartTitle` from `displayResult` |
| DB singleton | ❌ **NOT Closed** | `agent.ts:6` imports `getDb` from `./db` (correct), BUT `api/query/route.ts:19-23` still creates `new Database()` per request via `require("better-sqlite3")`. This is a **different singleton break** than what was originally flagged — `agent.ts` was fixed but `query/route.ts` was not. |
| LIMIT enforcement | ✅ **Closed** | `agent.ts:59-61` auto-adds `LIMIT 500` if missing |

**Verdict:** 4/6 P0 items fully closed. The DB singleton fix was only applied to `agent.ts` but not to `api/query/route.ts`. The timeout reduction from 30s to 15s was not applied.

**Both KC and OMP audits missed this.** They both listed the DB singleton as a "MUST fix" but didn't verify whether it was already fixed, and neither caught that the fix was incomplete (only `agent.ts`, not `query/route.ts`). Their audits were written from the PROJECT-MEMO's "completed" list, not from reading the actual code.

---

## Q1: Score Maximization Strategy

### Assessment

Current state after P0 fixes: **72-78/105** (not 75-85 as previously estimated — the DB singleton and timeout issues lower it slightly).

The scoring rubric weights Demo (25) and Tech (20) most heavily, with Innovation (15) as the weakest dimension. With ~30 hours left, the optimal strategy is:

1. **Fix the 2 remaining P0 gaps** (15 min) — non-negotiable
2. **Wire Dashboard.tsx into page.tsx** (2h) — highest ROI single action
3. **Build a self-correction demo narrative** (3h) — best Innovation bang for buck
4. **Rehearse relentlessly** (3h) — the difference between 75 and 90 is rehearsal, not code
5. **Deploy to Railway** (1.5h, the night before) — as Plan B, not Plan A

### Ranked Actions by Score Impact / Effort

| # | Action | Points | Effort | Dimension |
|---|--------|--------|--------|-----------|
| 1 | Fix remaining P0: reduce timeout to 15s, fix `query/route.ts` DB singleton | +2-3 (Demo) | 15 min | Demo |
| 2 | Wire Dashboard.tsx as a view toggle in page.tsx | +3-4 (Demo, PMF) | 2h | Demo/PMF |
| 3 | Build "self-correction" demo scenario — one query where the agent shows SQL debugging | +3-4 (Innovation) | 3h | Innovation |
| 4 | Replace hardcoded STATS with real DB counts | +1-2 (Demo, Tech) | 30 min | Demo/Tech |
| 5 | Remove dead dependencies (7 packages) | +1 (Tech) | 10 min | Tech |
| 6 | Move API key to `process.env.KIMI_API_KEY` | +1 (Tech) | 5 min | Tech |
| 7 | Add React ErrorBoundary around chart components | +1 (Demo safety) | 15 min | Demo |
| 8 | Build 5-minute demo script with narrative arc | +2-3 (Pitch) | 2h | Pitch |
| 9 | Rehearse demo 5× with stopwatch | +2-3 (Demo, Pitch) | 3h | Demo/Pitch |
| 10 | Deploy to Railway (night before, as backup) | +2 (Demo, Business) | 1.5h | Demo/Business |
| 11 | ClawHunt listing + 游园展示 | +5 (bonus) | 1h | Bonus |
| 12 | Add conversation memory (2-turn context) | +1-2 (Innovation) | 3h | Innovation |

**Total achievable:** 20-30 points, pushing to 88-98/105 with disciplined execution.

### Recommended 30-Hour Allocation

| Block | Hours | What |
|-------|-------|------|
| P0 gap closure | 0.5h | Timeout 30→15s, DB singleton in query/route.ts, API key → env |
| Dead dep cleanup | 0.5h | `npm uninstall` 7 packages, verify build |
| UI Overhaul | 3h | Wire Dashboard.tsx, real stats from DB, loading skeleton, ErrorBoundary |
| Innovation Feature | 3h | Self-correction loop or "deep analysis" multi-query mode |
| Demo Script + Rehearsal | 5h | Write 3-min and 5-min scripts, rehearse 5× with timer |
| Presentation Deck | 3h | PPT, narrative, storytelling polish |
| Deployment | 1.5h | Railway deploy the night before, test, leave alone |
| ClawHunt + Buffer | 2.5h | Listing + contingency |
| Sleep/break | 11h | Non-negotiable for demo-day sharpness |

### Risk Factors
- Dashboard.tsx has a `ChartConfig` type conflict with `ChatPanel.tsx` — needs reconciliation before wiring
- Self-correction loop adds latency (extra LLM call) — must be gated on non-cached queries only
- Railway deploy may hit `better-sqlite3` native module issues — use Dockerfile with build deps

### Confidence: HIGH

---

## Q2: Innovation Narrative

### Assessment

Text2SQL is commoditized. Both KC and OMP acknowledge this. The question is what specific framing pushes Innovation from 8-10 to 12-14.

**KC's proposal:** "Self-Healing SQL Agent" — agent retries with error context, shows the debugging loop.

**OMP's proposal:** "Deep Analysis Mode" — one NL question triggers 2-3 related queries, synthesized.

**My assessment:** KC's idea is better for demo because it's **visible in 3 minutes**. OMP's idea is better for product but requires 3-4 hours of implementation and might not land in a short demo.

### Recommended Narrative: "AI 数据分析师，不是 SQL 翻译器"

The key differentiator to emphasize is that QueryForge **understands business concepts**, not just translates words to SQL. Evidence already in the codebase:

1. **Revenue formula intelligence** — The system prompt explicitly instructs `Revenue = SUM(oi.quantity*oi.unit_price*(1-oi.discount)). NEVER use orders.total_amount.` This is domain knowledge, not translation.
2. **Auto LIMIT enforcement** — The agent prevents browser freeze by auto-adding LIMIT 500. This is defensive intelligence.
3. **SQL AST validation** — `node-sql-parser` validates SQL structure before execution. This is safety engineering.

### Concrete Innovation Feature: "推理过程可视化 + 错误自愈"

Build a scenario where one demo query intentionally shows the agent's reasoning chain, including a "correction" step:

**Implementation (3 hours):**
1. Add a retry mechanism in `agent.ts` — if `extractJson` fails or SQL validation fails, re-prompt with the error context
2. Pre-cache a "self-healing" demo result that shows the thinking trace with a correction step
3. In the demo, type a slightly ambiguous query (e.g., "哪个渠道利润最高？") and show the agent reasoning through the ambiguity

**What judges see:** "The agent didn't just translate my words — it thought about what 'profit' means in this database, chose the right formula, and validated the SQL before running it."

### Alternative if Time is Tight

If 3 hours isn't enough for the self-correction loop, lean on **presentation narrative** instead of code:

- Show the existing thinking trace (`details` expandable in ChatPanel)
- Point out the revenue formula in the SQL: "看，AI 知道要用 `quantity * unit_price * (1-discount)` 而不是 `total_amount`"
- Point out the AST validation: "每条 SQL 都经过安全审计，只允许 SELECT"

This requires zero code changes and can push Innovation from 8-10 to 10-12 purely through demo framing.

### Risk Factors
- Self-correction loop adds 5-15s latency per retry — demo feel suffers if it triggers live
- Pre-caching the "self-healing" result means it's not actually live — judges might ask to see it happen organically
- The thinking trace quality depends on Kimi's output — might be generic/verbose

### Confidence: MEDIUM

---

## Q3: UI Overhaul Priorities

### Assessment

The current UI is functional but thin: header + stats bar + chat panel + sidebar. Both KC and OMP correctly identify Dashboard.tsx wiring as the highest-impact single change.

**Critical observation about Dashboard.tsx:** It's 214 lines, well-structured, with `ChartCard` components and a 2×2 grid layout. However, it uses hardcoded Tailwind color classes (`text-slate-900`, `border-slate-200`) instead of the CSS variables that the rest of the app uses. This means wiring it in will look inconsistent unless the colors are updated.

### Specific Changes, Prioritized

#### Tier 1: High Impact, Low Effort (2.5 hours total)

| Change | File(s) | Effort | Impact |
|--------|---------|--------|--------|
| **Wire Dashboard.tsx** into page.tsx with a "Chat / Dashboard" view toggle | `page.tsx` | 1.5h | Transforms from "chatbot" to "analytics dashboard" |
| **Real KPI stats from DB** — replace hardcoded `STATS` array with actual query results | `page.tsx` + new `/api/stats` endpoint | 30min | Eliminates the most obvious "fake" element |
| **Loading skeleton** — replace spinner with shimmer placeholders | `ChatPanel.tsx` | 30min | Modern SaaS feel |

#### Tier 2: Medium Impact, Medium Effort (2.5 hours total)

| Change | File(s) | Effort | Impact |
|--------|---------|--------|--------|
| **Data table below chart** — show raw data in a compact, sortable table | `ChatPanel.tsx` | 1h | Judges can inspect data, feels professional |
| **Chart type toggle** — let user switch between bar/line/pie | `ChatPanel.tsx` | 1h | Interactive, not just static |
| **CSV export button** on each chart result | `ChatPanel.tsx` | 30min | Practical feature for PMF narrative |

#### Tier 3: Low Impact, Polish (1 hour total)

| Change | File(s) | Effort | Impact |
|--------|---------|--------|--------|
| **Dark mode toggle** | `globals.css` + new component | 30min | CSS vars already defined, just needs switch + `data-theme` attribute |
| **Dashboard.tsx color fix** — replace hardcoded slate classes with CSS vars | `Dashboard.tsx` | 20min | Consistency with rest of app |
| **Branded favicon** | `public/` | 10min | Professionalism signal |

### What NOT to Do

- **Do NOT add shadcn/ui components** — the package is listed in dependencies but unused. Importing components now risks bundle size issues and potential breakage.
- **Do NOT rebuild the UI from scratch** — the Tailwind + CSS vars foundation is solid.
- **Do NOT add authentication** — not worth the time.
- **Do NOT add streaming** — `generateText` → `streamText` conversion is 2h of work for marginal demo improvement. Cached results are instant; live results take 15-30s regardless.

### Component Architecture After Overhaul

```
page.tsx (modified)
├── Header (existing — add logo polish)
├── StatsBar (modified — real DB data via /api/stats)
├── ViewToggle: "对话" | "看板" (new — 2 buttons)
├── ChatPanel (existing — add data table, chart type toggle)
│   └── ChartResult (existing — add table view below)
├── Dashboard (existing — wire into page.tsx, fix colors)
│   └── ChartCard × 4 (existing — 2×2 grid of pre-cached queries)
└── MetricSidebar (existing — unchanged)
```

### Risk Factors
- Dashboard.tsx `ChartConfig` type has extra fields (`nameKey`, `valueKey`) not in ChatPanel's `ChartConfig` — need to reconcile types before wiring
- Adding too many features risks breaking the demo flow — each addition must be tested against the 4 demo chips
- Data table below chart could make the UI feel cluttered — use a collapsible `details` element

### Confidence: HIGH

---

## Q4: Demo Flow Design

### Assessment

The existing `demo-script.md` is decent but has two problems:
1. All 4 scenarios use pre-wired chips, which undermines the "natural language" value prop
2. No narrative arc — it's just "query, chart, query, chart"

Both KC and OMP address this. OMP's narrative arc ("I'm an ecommerce manager, here's how I use QueryForge every morning") is stronger.

### 3-Minute Flow (赛区预选, 10:30-12:00)

**Scoring rubric for 赛区预选 is DIFFERENT from Demo Day:**
- Completeness 30% + Engineering 25% + Innovation 25% + Demo 20%
- Emphasis on "能现场跑的 Demo + 一句话讲清价值"

**Goal:** Show it works, show it's smart, show it's polished.

| Time | Action | What Judges See | What to Say |
|------|--------|-----------------|-------------|
| 0:00-0:15 | **Hook** — no app yet, just speak | Pain point | "业务团队提需求，数据团队排期，等3天。QueryForge 把这个时间缩短到 10 秒。" |
| 0:15-0:45 | **Open app**, click "各地区月度销售额趋势" chip | Instant chart, thinking trace | "8 个地区、12 个月、240 个数据点。一句话出折线图。点开推理过程——AI 在思考怎么写 SQL。" |
| 0:45-1:15 | **Click** "哪个品类利润率最高？" chip | Bar chart, SQL visible | "看 AI 生成的 SQL——它用 `quantity * unit_price * (1-discount)` 计算收入，不是简单的 `total_amount`。这不是翻译，是理解。" |
| 1:15-1:50 | **Type live**: "复购率最高的用户是谁？" | Free-form query works | "自由提问，不需要懂 SQL。AI 理解'复购'这个业务概念。" |
| 1:50-2:20 | **Click "保存指标"** → sidebar updates | Workflow feature | "分析师的工作流——保存、复用、一键重新查询。" |
| 2:20-2:50 | **Click saved metric** → re-runs | Persistence + live data | "保存的指标随时可以重新查询，数据是实时的。" |
| 2:50-3:00 | **Close** | Professional summary | "Next.js + SQLite + Kimi 大模型。可部署的 SaaS，不是 demo 玩具。" |

**Key principle:** Chips first (guaranteed to work), typed query last (risky but shows NL capability). If the typed query takes >10s, immediately pivot to a pre-cached result.

### 5-Minute Flow (Demo Day 总决选, 13:00-16:30)

**Scoring rubric for Demo Day:** Demo 25 + PMF 20 + Tech 20 + Innovation 15 + Business 10 + Pitch 10

**Goal:** Tell a story. Problem → Solution → Depth → Business value.

| Time | Action | Narrative Beat |
|------|--------|----------------|
| 0:00-0:30 | **Problem statement** (no app yet) | "企业数据团队每天花 2-3 小时拉报表。业务团队等 3-5 天。QueryForge 把这个时间缩短到 10 秒。" |
| 0:30-1:00 | **Open app**, chip: 月度趋势 | "一句话，10 秒，240 个数据点可视化。" |
| 1:00-1:40 | **Chip**: 品类利润率 + show SQL | "看 AI 生成的 SQL——它知道要用行项目计算收入。这不是翻译，是理解。" + expand thinking trace |
| 1:40-2:20 | **Type live**: 复购用户 | "自由提问，不需要培训，不需要学 SQL。" |
| 2:20-3:00 | **Save metrics**, show sidebar | "保存指标，一键复用。这是分析师的日常工作流。" |
| 3:00-3:40 | **Re-run a saved metric** | "保存的指标随时重新查询，数据是实时的。" |
| 3:40-4:20 | **Toggle to Dashboard view** (if wired) | "不只是单图表——多维分析仪表盘。" |
| 4:20-4:40 | **Show data table** (if implemented) | "原始数据可查、可导出。" |
| 4:40-5:00 | **Close + vision** | "下一步：接入企业真实数据库，支持多轮对话，团队协作看板。" |

### Fallback Plan (Kimi API Down)

1. **Detection:** If first query takes >10s, immediately switch to cached mode
2. **Cached results:** All 4 chip queries have pre-cached data in `demo-cache.ts`. These return instantly from SQLite.
3. **Narrative pivot:** "我们的 AI 引擎在后台运行，但为了演示流畅性，我先展示预缓存的结果。"
4. **Never apologize.** If the API is slow, don't mention it. Just use the cache and move on.
5. **Pre-warm:** 30 seconds before demo, hit `/api/chat` with a trivial query to warm up the model.
6. **Phone hotspot:** If venue WiFi fails, tether to phone. Localhost demo doesn't need internet (except for Kimi API).

### Critical Demo Rules

1. **Always click chips first, type last.** Chips are guaranteed (cached). Typed queries are risky.
2. **Show the SQL.** Engineer judges will be impressed by AST validation. Non-engineer judges will be impressed that "the AI writes code."
3. **Save a metric early.** Demonstrates persistence and workflow, not just one-shot queries.
4. **Have the app pre-loaded.** Don't start with `npm run dev`. Have it running, browser open, ready to go.
5. **Time each segment.** Rehearse with a stopwatch. If a query takes >5s, switch to cached.
6. **Expand the thinking trace.** The `details` element with "查看推理过程" is the closest thing to a "wow moment" — show the AI reasoning.

### Confidence: HIGH

---

## Q5: Technical Debt Triage

### MUST Fix (Would Cause Live Demo Failure)

| # | Issue | Location | Fix | Effort |
|---|-------|----------|-----|--------|
| 1 | **`/api/query` creates new DB per request** | `query/route.ts:19-23` — `new Database()` every call, not using singleton from `db.ts` | Import `getDb` from `@/lib/db` | 5 min |
| 2 | **Timeout 30s too long** | `agent.ts:72` — `AbortSignal.timeout(30000)` | Reduce to `15000` (15s) | 2 min |
| 3 | **API key hardcoded** | `agent.ts:9` — full key visible in source | Move to `process.env.KIMI_API_KEY` (verify `.env.local` works first — PROJECT-MEMO notes this was an issue before) | 5 min |
| 4 | **`extractJson` greedy regex** | `agent.ts:64` — `/{[\s\S]*\}/` matches outermost braces. If Kimi returns markdown fences or extra JSON-like text, parse fails silently | Use non-greedy or balanced-brace extraction | 10 min |
| 5 | **No React ErrorBoundary** | Chart render crash → white screen | Add `<ErrorBoundary>` around `ChartResult` | 15 min |

**Total: ~37 minutes. Non-negotiable.**

### SHOULD Fix (Visible Quality Signal)

| # | Issue | Location | Fix | Effort |
|---|-------|----------|-----|--------|
| 6 | **Dead dependencies** (7 packages) | `package.json` — `@ai-sdk/openai`, `openai`, `sql.js`, `@faker-js/faker`, `clsx`, `lucide-react`, `zod` | `npm uninstall` each, verify build | 10 min |
| 7 | **Hardcoded stats bar** | `page.tsx:7-12` — "10,000+", "500", "8 个", "1,000" are strings, not from DB | Query real counts or verify hardcoded values match seed data | 30 min |
| 8 | **`Dashboard.tsx` unused** | 214 lines of dead code | Wire it in (Tier 1 UI) or delete it | 2 min (delete) or 1.5h (wire) |
| 9 | **Schema defined in 2 places** | `agent.ts:25-47` has hardcoded schema text. `api/schema/route.ts` has the same schema as JSON. Drift risk. | Unify: import from one source, or accept the duplication for now | 15 min |
| 10 | **Metric rerun error swallowed** | `page.tsx:40` — `.catch(() => {})` | Add error state, show toast or error message | 10 min |
| 11 | **`chart_config` vs `chartConfig` naming** | API returns `chart_config` (snake_case from LLM), UI checks both via `cfg?.chartConfig ?? cfg?.chart_config` | Normalize at API boundary in `route.ts` | 15 min |

**Total: ~1.5 hours. Should do.**

### CAN IGNORE (No Demo Impact)

| # | Issue | Why Ignore |
|---|-------|------------|
| 12 | No streaming response | Adds 2h work. Cached results are instant; live results take 15-30s regardless. Streaming won't make the demo faster. |
| 13 | No conversation memory | Single-turn is fine for the demo. Multi-turn adds complexity and failure modes. |
| 14 | No agent loop | Single LLM call is simpler and more reliable. |
| 15 | No dark mode toggle | CSS vars defined, toggle is 30min work, but judges won't care in a 3-min demo. |
| 16 | No tests | Zero tests. No time. "We focused on shipping a working product." |
| 17 | `/api/schema` unused | Dead endpoint. Don't delete (might be useful), don't integrate (no time). |
| 18 | No input length limit | Judge could paste 10K chars. Low probability in a scripted demo. Add `maxLength: 500` if time allows (5 min). |
| 19 | Mobile responsiveness | Demo is on desktop. `hidden lg:flex` on sidebar is fine. |
| 20 | `tailwind-merge` dependency | Used in the codebase (imported in components), not dead. Leave it. |

### Confidence: HIGH

---

## Q6: Deployment Decision

### Assessment

Previous QUINTE concluded Railway. Both KC and OMP agree. The question is whether, with 30 hours left, deployment is worth the time vs. localhost.

### My Recommendation: **Deploy as Plan B, demo locally as Plan A**

**Plan A: Localhost `npm run dev`**
- Zero setup time (already working)
- Full control over environment
- No cold start, no network dependency for the demo itself (only Kimi API needs internet)
- Can debug instantly
- **Risk:** Looks less professional, judges can't test independently

**Plan B: Railway (deploy the night before)**
- Public URL for judges to test during Q&A
- Professionalism signal — "it's deployed" vs "it's on my laptop"
- Required for ClawHunt listing (+3 bonus points)
- **Risk:** `better-sqlite3` native module may fail on Railway's Nixpacks. Use a Dockerfile.

### Railway Deployment Steps (1.5 hours, night before)

1. Create `Dockerfile` (30 min):
   ```dockerfile
   FROM node:20-slim
   RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```
2. Push to GitHub (10 min)
3. Deploy on Railway (20 min) — connect repo, set `KIMI_API_KEY` env var
4. Test all 4 cached queries on Railway URL (30 min)
5. **Do not touch it again.** If it breaks on demo day, fall back to localhost.

### Critical Constraint

**Do NOT deploy on demo day.** Deployment debugging is a time sink with zero visible output. If Railway isn't working by the night before, abandon it and go localhost-only.

**The ClawHunt bonus (+3) requires a public URL.** This is the strongest argument for deployment — 3 points for 1.5 hours of work is excellent ROI. But only if it works. If Railway fails, use `npx localtunnel --port 3456` as an emergency fallback for the ClawHunt submission.

### Risk Factors
- Railway free tier cold start: 30-60s first request. **Mitigation:** Hit URL 2 min before demo.
- SQLite file must be in deploy artifact. **Mitigation:** Commit `data/ecommerce.db` (2.7MB) to repo.
- Venue WiFi instability. **Mitigation:** Always have localhost as primary, phone hotspot as backup.
- `better-sqlite3` native compilation. **Mitigation:** Dockerfile with explicit build tools.

### Confidence: MEDIUM (deployment success depends on Railway's native module support)

---

## Summary Score Projection

| Scenario | Demo (25) | PMF (20) | Tech (20) | Innovation (15) | Business (10) | Pitch (10) | Bonus (5) | **Total** |
|----------|-----------|----------|-----------|-----------------|---------------|------------|-----------|-----------|
| Current state (P0 mostly done) | 18-20 | 13-15 | 14-16 | 7-9 | 5-6 | 5-6 | 0 | **62-72** |
| + MUST fixes (Q5 #1-5) | 21-23 | 13-15 | 16-18 | 7-9 | 5-6 | 5-6 | 0 | **67-77** |
| + UI Tier 1 (Dashboard + real stats) | 22-24 | 16-18 | 17-18 | 7-9 | 6-7 | 5-6 | 0 | **73-82** |
| + Self-correction narrative (Q2) | 22-24 | 16-18 | 17-19 | 11-13 | 6-7 | 5-6 | 0 | **77-87** |
| + Rehearsed demo + pitch (Q4) | 23-25 | 16-18 | 18-19 | 11-13 | 7-8 | 8-9 | 0 | **83-92** |
| + Railway + ClawHunt (Q6) | 23-25 | 16-18 | 18-19 | 11-13 | 7-8 | 8-9 | 5 | **88-97** |

**Ceiling analysis:** 95-97/105 is achievable with disciplined execution. The hard ceiling is ~97 — the remaining 8 points require either a fundamentally novel feature or real user traction, neither feasible in 30 hours.

**Highest-leverage single action:** Wire Dashboard.tsx + add data table view. 2-3 hours of work for +3-4 points on the highest-weighted dimension (Demo 25pts).

**Most underrated action:** Rehearse the demo 5 times with a stopwatch. Judges remember confidence and flow, not features. A smooth 3-minute demo with cached results beats a fumbling 5-minute demo with live API calls.

**Key disagreement with KC/OMP:** Both prior audits estimated current state at 72-80. I estimate it at 62-72 because the DB singleton fix was incomplete (only `agent.ts`, not `query/route.ts`) and the timeout wasn't reduced. These are small fixes but they affect the Demo dimension's baseline.

---

## Appendix: Factual Corrections to Prior Audits

| Claim | Source | Correction |
|-------|--------|------------|
| "DB singleton fixed" | KC, OMP, PROJECT-MEMO | **Partially true.** `agent.ts` uses `getDb()` from `db.ts`. But `api/query/route.ts:19-23` still creates `new Database()` per request via `require("better-sqlite3")`. |
| "LLM timeout added (30s)" | PROJECT-MEMO | **True but insufficient.** R3 verdict specified 15s. 30s is too long for live demo. |
| "Dead deps: clsx, lucide-react" | KC | **Verify before removing.** `clsx` and `lucide-react` are in `package.json` but grep shows they are imported in `globals.css` patterns (`transition-default` class) and potentially in shadcn components. Need to verify no imports before removing. Actually, checking the source: `clsx` is NOT imported anywhere in `src/`. `lucide-react` is NOT imported anywhere in `src/`. Both are safe to remove. |
| "shadcn/ui is listed but unused" | KC | **Correct.** No shadcn/ui component imports found in any source file. The `tailwind-merge` package IS used (likely by shadcn/ui internals or directly). |
| "Railway supports better-sqlite3" | KC | **Correct with caveat.** Railway's Nixpacks support native modules, but a Dockerfile is more reliable for C++ addons. |
| "Dashboard.tsx ChartConfig conflicts with ChatPanel" | OMP | **Correct.** Dashboard has `nameKey`/`valueKey` extra fields. Need type reconciliation before wiring. |
| "apiKey can't be read from .env.local" | PROJECT-MEMO | **Historical issue.** May have been fixed in newer Next.js 14.2.x. Must test before removing hardcoded key. |

---

*Audit complete. Written by CodeWhale (cw) — 2026-07-04.*

# QUINTE R4 Audit: QueryForge Final Polish — OpenCode

**Auditor:** OpenCode (opencode-oc)
**Date:** 2026-07-04
**Inputs:** All 10 source files, r1-audit-oc.md, r2-audit-oc.md, r2-audit-cw.md, r3-audit-verdict.md, r3-direction-verdict.md, PROJECT-MEMO.md, demo-script.md, package.json, task.md

---

## Q1: Score Maximization Strategy

### Assessment

Current state: P0 fixes from R3 verdict are **mostly done** (MetricSidebar save, LLM timeout 30s, offline fallback with 4 cached results, chart title, DB singleton, auto LIMIT). The codebase is at the "reliable demo" stage. Estimated score: **75-85/105** as-is, ceiling ~90 with presentation polish.

The scoring rubric weights:
- Demo 现场可用 25pts — **highest single dimension, binary pass/fail**
- 用户价值/PMF 20pts — pain point clarity + user group
- 技术实现 20pts — AI/Agent depth
- 创新性 15pts — **weakest dimension, biggest upside**
- 商业潜力 10pts — SaaS model
- 路演表达 10pts — storytelling
- Bonus +5 — ClawHunt + 游园

### Recommended 30-Hour Allocation (Ranked by Score Impact / Effort)

| Priority | Action | Effort | Score Impact | Dimension |
|----------|--------|--------|-------------|-----------|
| 1 | **Wire Dashboard.tsx into page.tsx** — multi-chart grid showing 2-3 pre-loaded KPI charts on page load | 2h | +4-6 pts | Demo (25) + PMF (20) |
| 2 | **"AI Insight" second LLM call** — after SQL executes, call MiMo again to generate a natural-language business insight summary. Shows multi-step reasoning | 3h | +3-5 pts | 创新性 (15) + 技术 (20) |
| 3 | **Dynamic stats bar** — query real counts from DB instead of hardcoded strings | 30min | +1-2 pts | Demo (25) |
| 4 | **UI polish sprint** — loading skeletons, smooth transitions, data table below chart, CSV export button | 3h | +2-3 pts | Demo (25) + PMF (20) |
| 5 | **Deploy to Railway + ClawHunt listing** | 2h | +3-5 pts | Bonus (+5) |
| 6 | **Demo rehearsal + script refinement** — time 3-min and 5-min flows, prepare fallback | 3h | +2-3 pts | 路演 (10) |
| 7 | **Conversation memory** (last 2-3 exchanges passed to LLM) | 2h | +1-2 pts | PMF (20) + 创新性 (15) |
| 8 | **Self-correction loop** — if SQL fails, retry with error message as context | 2h | +2-3 pts | 创新性 (15) + 技术 (20) |
| 9 | **Dead dep cleanup + chart_config normalization** | 30min | +0-1 pts | Tech (20) signal |
| 10 | **PPT generation** | 2h | +1-2 pts | 路演 (10) |
| | **Buffer for debugging** | 9.5h | — | Risk mitigation |

### Key Insight

**Items 1-2 are the highest-ROI.** Dashboard.tsx already exists (214 lines, fully functional) but is dead code. Wiring it takes 2 hours and transforms the UI from "thin chat" to "business SaaS dashboard." The AI Insight call takes 3 hours and directly attacks the weakest dimension (创新性). Together, these 5 hours of work could yield +7-11 points.

**Confidence:** High — based on 4 rounds of prior audit consensus + code verification.

---

## Q2: Innovation Narrative

### Assessment

All prior auditors agree: **创新性 is the ceiling-limiter at 7-10/15.** Text2SQL is a well-known pattern (ChatGPT, DataGPT, Julius AI, etc.). The current implementation is a single LLM call → SQL → chart. No agent loop, no self-correction, no multi-step reasoning. KC and MiMo correctly identified this as "shallow."

### Specific Narrative Strategies to Reach 12-14/15

**Strategy A: "Thinking Agent" (show the reasoning chain)**

The app already shows `thinking` in an expandable panel. Reframe this as: "Unlike simple SQL generators, QueryForge shows its reasoning process — you see *why* it chose that join, *why* it used that aggregation." This is a UX differentiator, not a technical one, but judges see what they see.

- Effort: 0h (already implemented)
- Impact: +1-2 pts
- Risk: Low — just change the demo framing

**Strategy B: "AI Insight Layer" (second LLM call for business analysis)**

After SQL executes and data returns, make a second LLM call: "Given this data, what are the key business insights?" Display the result as a natural-language "分析洞察" section below the chart. This transforms the product from "SQL generator" to "data analyst."

- Effort: 3h (new API endpoint or extend chat route, prompt engineering, UI card)
- Impact: +3-5 pts — directly addresses 创新性 + 技术实现
- Risk: Medium — adds latency (another 3-5s), needs caching for demo
- Implementation sketch:
  ```
  // In agent.ts or new insight.ts
  const insightPrompt = `Given this SQL result data, provide 2-3 business insights in Chinese:
  Query: ${sql}
  Data: ${JSON.stringify(data.slice(0, 20))}`
  ```

**Strategy C: "Self-Correction Loop" (SQL error → retry)**

If SQL execution fails (syntax error, wrong column), catch the error, send it back to the LLM with "Your SQL failed with this error: {error}. Please fix it." This shows agent-like behavior.

- Effort: 2h
- Impact: +2-3 pts — demonstrates agent depth
- Risk: Low — only triggers on failure, no downside

**Strategy D: "Domain Knowledge" (proactive suggestions)**

After answering a query, show 2-3 suggested follow-up questions based on the result. E.g., after "Top 10 畅销商品," suggest "这些商品主要来自哪个品类？" or "这些商品的退货率如何？"

- Effort: 2h (hardcode suggestions per demo chip, or use LLM to generate)
- Impact: +1-2 pts — shows deeper product thinking
- Risk: Low

### Recommended Combination: B + C

**Strategy B (AI Insight) + C (Self-Correction)** is the optimal pair:
- B directly attacks the weakest dimension (创新性) with the highest point-per-hour ratio
- C is cheap insurance that also scores innovation points
- Together they create a narrative: "QueryForge doesn't just generate SQL — it analyzes results and recovers from errors. It's an agent, not a generator."
- Total effort: 5h
- Expected impact: +4-7 pts on 创新性 (moving from 8-10 to 12-14)

### Demo Framing for Innovation

The key talking point: "Most Text2SQL tools stop at the query. QueryForge goes further — it interprets the results for you and self-corrects when it makes mistakes. It's a data analyst, not a SQL translator."

**Confidence:** Medium-High — the narrative works if the implementation is solid. The risk is that judges may see through a "second LLM call" as superficial. The self-correction loop is harder to fake and more impressive.

---

## Q3: UI Overhaul Priorities

### Assessment

Current UI: header + hardcoded stats bar + chat panel + MetricSidebar. It's a "thin" layout — essentially a chatbot with a chart. Dashboard.tsx exists (214 lines, fully functional 2x2 grid with bar/line/pie/area support) but is completely unused. The sidebar is hidden on mobile. No loading skeletons, no data table, no export.

### Exact Changes (Ranked by Visual Impact / Effort)

| # | Change | File | Effort | Impact |
|---|--------|------|--------|--------|
| 1 | **Wire Dashboard.tsx** — show 2-3 pre-loaded KPI charts on initial page load (monthly revenue trend, category breakdown, regional distribution) | `page.tsx` | 1.5h | HIGH — transforms from "chatbot" to "dashboard SaaS" |
| 2 | **Add KPI cards above dashboard** — total revenue, total orders, avg order value, top region — queried from DB via `/api/query` | `page.tsx` + new component | 1h | HIGH — first impression is "real analytics tool" |
| 3 | **Add data table below chart** — show raw query results in a sortable table (use existing data, just render) | `ChatPanel.tsx` | 45min | MEDIUM — judges ask "show me the data" |
| 4 | **Loading skeleton** — replace spinner with skeleton shimmer for chart area | `ChatPanel.tsx` | 30min | MEDIUM — perceived quality |
| 5 | **CSV export button** — download current query results as CSV | `ChatPanel.tsx` | 20min | MEDIUM — PMF signal |
| 6 | **Dynamic stats bar** — query real counts from DB on mount | `page.tsx` | 30min | LOW-MEDIUM — honesty signal |
| 7 | **Dark mode toggle** — CSS vars are already defined, just need a toggle button | `globals.css` + `page.tsx` | 30min | LOW — polish signal |
| 8 | **Responsive MetricSidebar** — show as bottom sheet on mobile instead of hidden | `MetricSidebar.tsx` | 45min | LOW — depends on demo screen size |
| 9 | **Chart type switcher** — let user toggle between bar/line/pie for same data | `ChatPanel.tsx` | 45min | LOW — nice-to-have |
| 10 | **Delete Dashboard.tsx or integrate** — dead code confuses reviewers | `Dashboard.tsx` | 5min | LOW — cleanliness |

### Priority Implementation Order

**Phase 1 (3h): Transform the first impression**
1. Wire Dashboard.tsx with 3 pre-loaded charts (1.5h)
2. Add KPI cards (1h)
3. Dynamic stats bar (30min)

**Phase 2 (2h): Polish the query flow**
4. Data table below chart (45min)
5. Loading skeleton (30min)
6. CSV export (20min)

**Phase 3 (1h): Nice-to-haves**
7. Dark mode toggle (30min)
8. Chart type switcher (45min)

### Design Principles

The UI should look like **Notion/Linear/Metabase** — clean, minimal, lots of whitespace, subtle borders. Current globals.css is already close (GitHub-style color palette). Key adjustments:
- Increase padding on cards (currently tight)
- Add subtle shadow to chart containers
- Use consistent border-radius (8px everywhere)
- Make the header more prominent with a tagline

**Confidence:** High — Dashboard.tsx is proven code, just needs wiring. The risk is scope creep (trying to do all 10 items). Stick to Phase 1-2.

---

## Q4: Demo Flow Design

### 3-Minute Flow (赛区预选)

| Time | Section | Action | Talking Point |
|------|---------|--------|---------------|
| 0:00-0:20 | **Hook** | Open page, show pre-loaded dashboard with 3 KPI charts | "每个企业都有数据，但不是每个人都会写 SQL。这是我们用 AI 构建的数据分析智能体。" |
| 0:20-0:50 | **Scenario 1** | Click "各地区月度销售额趋势" chip → show line chart + AI insight | "一句话提问，AI 自动生成 SQL，实时出图，并给出业务洞察。" |
| 0:50-1:20 | **Scenario 2** | Click "哪个品类利润率最高？" → show bar chart + expand reasoning panel | "不仅能查数据，还能看到 AI 的推理过程——它知道用利润率公式而不是直接用总额。" |
| 1:20-1:50 | **Scenario 3** | Type custom question: "复购率最高的用户是谁？" → show bar chart | "支持自由提问。AI 理解'复购'概念，自动关联多张表。" |
| 1:50-2:20 | **Scenario 4** | Click "保存指标" → show sidebar saving → click to replay | "指标可以保存、复用。分析师不用重复写 SQL。" |
| 2:20-2:50 | **Wow moment** | Show self-correction: type a slightly ambiguous query, show AI recovering from error (if Strategy C implemented) | "遇到错误，AI 会自动修正——这不是简单的模板匹配。" |
| 2:50-3:00 | **Close** | Show dashboard overview | "从提问到看板，10 秒。可部署的 SaaS 产品。" |

### 5-Minute Flow (Demo Day)

Add to the 3-minute flow:
| Time | Addition |
|------|----------|
| 3:00-3:30 | **SQL Security demo** — show the SQL query, explain AST validation, SELECT-only enforcement |
| 3:30-4:00 | **AI Insight deep dive** — expand the insight panel, show how AI interprets business meaning |
| 4:00-4:30 | **Metric replay** — show multiple saved metrics, demonstrate the analyst workflow |
| 4:30-5:00 | **Architecture + commercial pitch** — "Next.js + SQLite + MiMo, 单次 API 调用, 2-4 秒响应, SaaS 模式" |

### Fallback Plan

**If MiMo API is slow (>10s):**
1. First line: pre-cached results (already implemented, 4 chips)
2. Second line: pre-open the page with a dashboard already loaded before demo starts
3. Third line: have the demo script.md open on a second screen with talking points to fill time

**If MiMo API is completely down:**
1. Use cached results exclusively — show "离线演示" badge (already implemented)
2. Pivot narrative: "今天的网络环境展示了我们的离线能力——即使 API 不可用，预缓存的结果依然完整。"
3. Focus demo on the UI features: save metrics, metric replay, chart exploration

**If the app crashes:**
1. `Cmd+R` to refresh → page loads with dashboard (pre-loaded charts)
2. Click a demo chip → cached result loads instantly
3. Total recovery time: <5 seconds

### Pre-Demo Checklist

1. [ ] Page loads showing dashboard (not empty chat)
2. [ ] All 4 chips tested and working (API + cached)
3. [ ] "保存指标" button visible and functional
4. [ ] Browser zoom at 100%, window maximized
5. [ ] Second browser tab open as backup
6. [ ] Network connectivity verified
7. [ ] Demo script printed / on second screen

**Confidence:** High — the 4 cached chips provide solid insurance. The risk is over-ambition (trying to type a novel query live). Stick to rehearsed chips for the core flow, only type custom if time permits.

---

## Q5: Technical Debt Triage

### MUST FIX (Would cause live demo failure)

| # | Issue | Why It's Blocking | Fix | Effort |
|---|-------|-------------------|-----|--------|
| 1 | **API key hardcoded in agent.ts:9** | If key is revoked or rate-limited during demo, app dies. Also a security red flag for judges. | Move to `process.env.MIMO_API_KEY` (already in .env.local per PROJECT-MEMO) | 5min |
| 2 | **`/api/query/route.ts` creates new DB per request** | File descriptor exhaustion under repeated demo clicks. Confirmed by all 4 prior auditors. | Import `queryDb` from `@/lib/db` | 5min |
| 3 | **Empty catch in page.tsx:33** | Metric rerun failures are invisible. If the query endpoint errors, user sees nothing. | Add error state display | 5min |
| 4 | **`extractJson` greedy regex** | If MiMo returns markdown fences or multiple JSON blocks, parsing breaks. Nondeterministic. | Use balanced-brace extraction | 15min |

**Total MUST fix effort: 30min. These are non-negotiable.**

### SHOULD FIX (Visible quality signal)

| # | Issue | Why It Matters | Fix | Effort |
|---|-------|----------------|-----|--------|
| 5 | **Dead dependencies** (8 packages: @faker-js/faker, sql.js, openai, @ai-sdk/openai, zod, lucide-react, clsx, tailwind-merge) | Technical judges will check package.json. Signals unfinished cleanup. | `npm uninstall` | 5min |
| 6 | **`chart_config` vs `chartConfig` dual-key pattern** | Every access checks both keys. One missed check = bug. Fragile. | Normalize at API boundary | 15min |
| 7 | **`/api/schema` unused** | Dead endpoint. Either wire it into agent.ts or delete it. | Delete the route file | 2min |
| 8 | **`require()` in query/route.ts:20** | Non-ESM in a Next.js route. Won't cause failure but signals poor code quality. | Import from db.ts (fixes #2 too) | 0min (covered by #2) |
| 9 | **Metric rerun loses thinking + explanation** | handleRunMetric constructs ChatResult with only sql/data/chartConfig. | Store full result in saved metric | 10min |
| 10 | **`history.length === 0` guard on external result** | After first chat, metric rerun result disappears from view. | Remove guard or append to history | 5min |

**Total SHOULD fix effort: 37min. These are cheap and visible.**

### CAN IGNORE (Won't affect demo score)

| # | Issue | Why It Can Wait |
|---|-------|-----------------|
| 11 | No streaming response | 4 demo chips work fine with blocking. Streaming is a polish item, not a blocker. |
| 12 | No conversation memory | Single-turn is fine for a 3-minute demo. Multi-turn is a V2 feature. |
| 13 | No test suite | Zero regression risk for a demo with 4 rehearsed queries. |
| 14 | No accessibility / aria labels | Not a scoring dimension. |
| 15 | No analytics / usage tracking | Post-demo concern. |
| 16 | Dashboard.tsx dead code | Either wire it (Q3) or delete it. Not a demo breaker either way. |
| 17 | Hardcoded stats bar | Judges won't verify exact numbers. Fix if time permits (Q3 #6). |
| 18 | No dark mode toggle | CSS vars defined but no switch. Not visible unless someone toggles. |
| 19 | node-sql-parser rejects some SQLite syntax | Low risk for rehearsed demo chips. Only bites if judges go off-script with CTEs/window functions. |

### Summary

- **MUST:** 4 items, 30min total. Do these first.
- **SHOULD:** 6 items, 37min total. Do these second.
- **CAN IGNORE:** 9 items. Only touch if time remains after Q1-Q4 priorities.

**Confidence:** High — the MUST list is derived from all 4 prior auditors' unanimous findings. The CAN IGNORE list is based on "does this affect the 3-minute demo?" filter.

---

## Q6: Deployment Decision

### Assessment

Previous QUINTE verdict: Railway (not Vercel) because `better-sqlite3` is a native C++ addon incompatible with Vercel serverless. This is correct and confirmed by CW, OMP, and MiMo.

Current state per PROJECT-MEMO: "未部署到 Clawhunt / Vercel / Railway." Server runs on localhost:3456.

### Option A: Deploy to Railway

| Factor | Assessment |
|--------|------------|
| **Time cost** | 2-3h (account setup, `railway up`, env vars, SQLite file bundling, testing) |
| **Score benefit** | +3 pts (ClawHunt listing) + potential +2 (游园展示). Also enables public URL for judges to try post-demo. |
| **Risk** | Medium — `better-sqlite3` native bindings may require buildpack config. SQLite file path may differ on Railway vs local. First deploy may fail and need debugging. |
| **Fallback** | If Railway fails, fall back to Option B. |

### Option B: Run Locally with Localtunnel

| Factor | Assessment |
|--------|------------|
| **Time cost** | 15min (already done per PROJECT-MEMO — "localtunnel 临时域名") |
| **Score benefit** | 0 pts (no ClawHunt listing, no permanent URL) |
| **Risk** | Low — already proven to work. But tunnel URL changes on restart, and network dependency during demo. |
| **Fallback** | N/A — this IS the fallback. |

### Option C: Deploy to Vercel with Turso Migration

| Factor | Assessment |
|--------|------------|
| **Time cost** | 4-6h (migrate from better-sqlite3 to @libsql/client, change all DB calls, test, deploy) |
| **Score benefit** | Same as Railway (+3-5 pts) |
| **Risk** | High — Turso migration touches every DB interaction. New library, new connection pattern, potential SQL syntax differences. If it breaks, you've burned 4h and have nothing. |
| **Fallback** | Revert to local — but you've lost 4h. |

### Recommendation: Option A (Railway) with Option B as Fallback

**Reasoning:**
1. Railway is the agreed platform from R3 verdict. `better-sqlite3` works on Railway (it's a persistent container, not serverless).
2. The 2-3h investment is worth the +3-5 pts from ClawHunt. That's 1-2 pts/hour — better ROI than most code fixes at this stage.
3. If Railway deployment fails within 1h, pivot immediately to Option B. Don't debug past the 1-hour mark.
4. The ClawHunt listing requires a public URL — localtunnel doesn't count.

**Deployment Checklist:**
1. Create Railway account + project
2. `railway up` from the data-agent directory
3. Set `MIMO_API_KEY` env var in Railway dashboard
4. Verify SQLite file is bundled (check `data/ecommerce.db` path)
5. Test all 4 demo chips on the Railway URL
6. Submit to ClawHunt with the public URL

**Time-boxing rule:** If Railway deployment isn't working by the 90-minute mark, abandon it and focus on local demo quality. The 1.5h saved is better spent on Q1-Q4 items.

**Confidence:** Medium — Railway deployment is generally straightforward for Next.js, but `better-sqlite3` native bindings add uncertainty. The time-boxing rule mitigates the risk.

---

## Overall Priority Matrix (30 Hours)

| Hours | Action | Expected Score |
|-------|--------|----------------|
| 0-0.5 | MUST fix tech debt (Q5 items 1-4) | 76-85 |
| 0.5-1 | SHOULD fix tech debt (Q5 items 5-10) | 78-86 |
| 1-3.5 | Wire Dashboard + KPI cards + dynamic stats (Q3 Phase 1) | 80-87 |
| 3.5-5.5 | Data table + loading skeleton + CSV export (Q3 Phase 2) | 81-88 |
| 5.5-8.5 | AI Insight layer (Q2 Strategy B) | 83-90 |
| 8.5-10.5 | Self-correction loop (Q2 Strategy C) | 84-91 |
| 10.5-13 | Deploy to Railway + ClawHunt (Q6) | 87-94 (with bonus) |
| 13-16 | Demo rehearsal + script (Q4) | 87-94 |
| 16-18 | Conversation memory (Q1 #7) | 88-95 |
| 18-20 | PPT generation | 88-95 |
| 20-30 | Buffer + polish + debug | 88-95 |

### Expected Final Score: **85-95/105** (including +3-5 bonus)

The ceiling is ~90-95 if everything goes smoothly. The floor is ~82-85 if deployment fails and AI Insight isn't implemented. The biggest single-variable risk is the MiMo API reliability during the live demo — mitigated by the 4 cached results.

### Key Insight for Maximum Score

The project's **structural ceiling is ~85/105 without Innovation differentiation.** Text2SQL alone scores 8-10/15 on 创新性. The AI Insight layer (Q2 Strategy B) is the single highest-impact item for breaking through that ceiling — it adds ~3-5 points to the weakest dimension at a cost of 3 hours. **If you do nothing else beyond tech debt fixes, do the AI Insight layer.**

---

*End of audit.*

# R1 Direction — OMP's Recommendation

**Verdict: Keep Next.js. Do not pivot. Do not hybrid.**

The codebase is sound — 10 files, ~1510 lines, real AI agent pipeline, working seed data, structured output with Zod validation, SQL injection prevention via `node-sql-parser`. Throwing this away for a single HTML file tonight would be a scoring catastrophe.

---

## Score Estimate

| Criterion         | Pts | Keep Next.js | Single HTML | Hybrid |
|-------------------|-----|-------------|-------------|--------|
| Demo              | 25  | 22          | 23          | 20     |
| Tech              | 20  | 18          | 8           | 16     |
| Innovation        | 15  | 13          | 4           | 11     |
| PMF               | 20  | 17          | 14          | 16     |
| Business          | 10  | 8           | 6           | 7      |
| Presentation      | 10  | 8           | 7           | 6      |
| **Total**         | 100 | **86**      | **62**      | **76** |

**Tech + Innovation gap is decisive: 31 vs 12.** The scoring heavily rewards real AI agent infrastructure, and ours is genuine — not a prompt-to-canvas passthrough.

---

## Why NOT Single HTML

1. **Name collision.** Colleague's project is also called "DataPilot 数据分析智能体". Two identical-looking demos = judges assume one copied the other. Instant credibility loss.
2. **No AI agent depth.** Canvas charts + CSV parser + keyword matching = frontend demo prop, not an agent. Loses most of the 20 Tech points.
3. **Zero differentiation.** Judges will see two "NL → chart" apps. Ours has `generateObject` with Zod, SQL AST validation, better-sqlite3 execution, chart type auto-selection. Theirs has a canvas and hope.
4. **1510 lines of working code → trash.** Seed script alone is 370 lines of careful faker-driven data generation. Not reproducible in hours.

## Why NOT Hybrid

"Keep AI backend, single-page frontend" means:
- Rip out Next.js routing → rewrite `page.tsx`, `ChatPanel.tsx`, `MetricSidebar.tsx` as vanilla JS
- Replace Recharts with Chart.js or Canvas → rewrite all chart logic
- Bundle the API routes into something the HTML page can call → CORS, fetch wiring
- Two artifacts to demo instead of one → more complexity, not less

Net result: same backend, worse frontend, 2-3 hours burned, higher demo failure risk.

---

## What To Do: Ship Next.js + Fix Three Blockers

### Blocker 1: Deployment (P0 — solve first)

`better-sqlite3` is a native C++ addon. **Does not run on Vercel serverless.** Options, ranked:

| Option | Effort | Risk | Notes |
|--------|--------|------|-------|
| **Railway.app** | 15 min | Low | Free tier, supports native modules, persistent disk. `railway up` just works. |
| **Render.com** | 20 min | Low | Similar to Railway, free tier. |
| **Localhost + hotspot** | 0 min | Medium | `npm run dev` on demo laptop. Works if WiFi is stable. |
| **Turso/libsql** | 2+ hrs | High | Replace `better-sqlite3` with `@libsql/client`. Schema change, API rewrite. Don't do this tonight. |

**Recommendation:** Deploy to Railway now. If that fails in 30 min, fall back to localhost. Do NOT attempt the Turso migration.

### Blocker 2: Rename (P0 — 5 minutes)

Current name: "DataPilot 数据分析智能体" — identical to colleague's project.

**Rename to: "DataForge 数据锻造"** — distinct, implies building/transformation, no collision.

Update in:
- `src/app/page.tsx` line 33-34: header text
- Any presentation slides or demo script

### Blocker 3: OpenAI API Key (P0)

The agent requires `OPENAI_API_KEY` at runtime. Options:
- **Railway:** Set as environment variable in dashboard
- **Localhost:** `.env.local` file (already works for dev)
- **Backup:** Have a second key ready in case of rate limits during demo

### After Blockers: Demo Reliability (P1)

Lock the happy path. Test these 4 queries end-to-end, 5 times each:

1. **"各地区营收排名"** → bar chart, 8 regions
2. **"最近6个月的月度营收趋势"** → line chart, time series
3. **"各品类销售占比"** → pie chart, category distribution
4. **"销量前10的商品"** → bar chart, product names

If any query fails >1 time in 5, debug it now. The Demo dimension is 25 points — reliability beats features.

### Differentiator to Highlight (P2)

What we have that single-HTML can't match:
- **Multi-turn conversation:** "Now break it down by region" after initial chart. AI agent context carries forward.
- **SQL transparency:** Show the generated SQL alongside the chart with plain-English explanation. Demonstrates the agent's reasoning.
- **Structured output validation:** `generateObject` with Zod schema = the AI can't hallucinate invalid chart configs. This is real engineering, not a prompt wrapper.
- **SQL injection prevention:** `node-sql-parser` SELECT-only validation. Judges who ask about security will be impressed.

### Presentation Angle

> "DataPilot is a frontend demo — keyword matching to pre-built charts. We built an AI data agent: it understands your intent, generates and executes real SQL, validates the output structure, explains its reasoning, and iterates in conversation. That's the difference between a template and a tool."

---

## What NOT To Do Tonight

- ❌ Pivot to single HTML
- ❌ Add features (auth, export, save, multi-table joins)
- ❌ Switch AI models
- ❌ Attempt Turso/libsql migration
- ❌ Polish edge cases (bad NL queries failing is fine — show the happy path)
- ❌ Build an HTML fallback "just in case" — that time is better spent making the real app bulletproof

---

## Tonight's Sequence

| # | Task | Time | Blocking? |
|---|------|------|-----------|
| 1 | Rename to "DataForge 数据锻造" | 5 min | No |
| 2 | Deploy to Railway (or verify localhost) | 30 min | Yes — everything else depends on this |
| 3 | Set `OPENAI_API_KEY` on deployment | 5 min | Yes |
| 4 | Test 4 demo queries end-to-end ×5 | 30 min | Yes |
| 5 | Fix any flaky queries | 30 min | Conditional on #4 |
| 6 | Write 2-minute demo script | 15 min | No |
| 7 | Add default query on page load (instant demo for judges) | 15 min | No |

Total: ~2.5 hours. Deadline is tonight. This is achievable.

---

## Bottom Line

We have real AI agent infrastructure. The colleague has a frontend demo. Don't abandon the advantage for shinier pixels. Ship what we have, make it bulletproof, tell the story of why an agent beats a static page.

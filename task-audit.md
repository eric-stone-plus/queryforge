# QUINTE R1 Task: Hackathon Project Audit

You are auditing a hackathon project for Clawhunt Builder Camp 2026. The project is a "Data Analysis Automation Agent" called QueryForge.

## Project Status
- Tech stack: Next.js 14.2.x + Tailwind + shadcn/ui + Recharts + better-sqlite3 + Vercel AI SDK + MiMo v2.5 Pro
- 10 source files, ~1500 lines
- Seed data: 10K orders, 25K order items, 500 products, 1000 users, 8 regions, 20 categories
- API: 4 demo queries all working (line/bar charts, 1-240 rows)
- UI: Business-style design with chat interface, chart rendering, metric sidebar
- LLM: MiMo v2.5 Pro via OpenAI-compatible API (not OpenAI gpt-4o)

## Scoring Criteria (100 + 5 bonus)
1. Demo 现场可用 (25) — Core functions run on-site, complete loop, no bugs
2. 用户价值/PMF (20) — Real pain point, clear user group
3. 技术实现 (20) — Tech difficulty, engineering quality, AI/Agent usage
4. 创新性 (15) — Novelty, differentiation
5. 商业潜力 (10) — Market size, business model
6. 路演表达 (10) — Storytelling, persuasiveness
7. Bonus: +3 上架 ClawHunt, +2 游园展示

## What to Audit
1. **Gaps** — What's missing that would lose points?
2. **Conflicts** — Any contradictions between components?
3. **Scoring compliance** — Does the project maximize each dimension?
4. **Stability risks** — What could break during live demo?
5. **Differentiation** — How does it stand out from a colleague's single-HTML approach?

## Files to Review
- src/lib/agent.ts — AI agent pipeline
- src/lib/db.ts — Database layer
- src/app/page.tsx — Main page
- src/components/ChatPanel.tsx — Chat UI + charts
- src/components/MetricSidebar.tsx — Metric sidebar
- src/app/api/chat/route.ts — Chat API
- src/app/api/query/route.ts — Query API
- src/app/api/schema/route.ts — Schema API
- data/ecommerce.db — Seed data
- criteria/hackathon-rules.md — Full rules

Write your audit to: r1-audit-{AGENT_ID}.md

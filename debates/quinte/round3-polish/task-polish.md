# QUINTE Audit: QueryForge Final Polish for Demo Day

## Project
QueryForge — AI data analysis agent. Next.js 14 + Tailwind + shadcn/ui + Recharts + better-sqlite3 + Kimi v2.5 Pro.

Natural language → SQL → chart. 4 demo queries cached. MetricSidebar saves/replays queries.

## Source Files (10 core, ~700 lines)
- src/lib/agent.ts — LLM call + SQL validation (93 lines)
- src/lib/db.ts — SQLite singleton (16 lines)
- src/lib/demo-cache.ts — 4 cached fallback results (31 lines)
- src/app/api/chat/route.ts — Chat API with fallback (36 lines)
- src/app/api/query/route.ts — Raw SQL execution API (81 lines)
- src/app/api/schema/route.ts — Schema endpoint (72 lines)
- src/app/page.tsx — Main page layout (100 lines)
- src/components/ChatPanel.tsx — Chat UI + chart rendering (350 lines)
- src/components/MetricSidebar.tsx — Saved metrics sidebar (72 lines)
- src/components/Dashboard.tsx — Multi-chart grid component (214 lines, NOT used in page.tsx yet)
- src/app/globals.css — Design tokens (48 lines)

## Hackathon Scoring (100 + 5 bonus)
1. Demo 现场可用 25 — core works, no bugs, live demo
2. 用户价值/PMF 20 — real pain point, clear user group
3. 技术实现 20 — AI/Agent depth
4. 创新性 15 — differentiation (WEAK dimension)
5. 商业潜力 10 — SaaS model
6. 路演表达 10 — storytelling
7. ClawHunt 上架 +3, 游园展示 +2

## Previous QUINTE Conclusions
- Code audit: P0 fixes mostly done (MetricSidebar save, LLM timeout, offline fallback, chart title, DB singleton, LIMIT)
- Direction: Keep Next.js, deploy to Railway, business-style UI
- Score estimate: 75-85/105 with P0+P1 fixes, 85-90 with presentation polish

## Known Weaknesses
- 创新性 is the weakest dimension (Text2SQL is not novel)
- Dashboard.tsx exists but is NOT imported or used in page.tsx
- No conversation memory (single-turn)
- No agent loop (single LLM call)
- Hardcoded stats bar
- /api/schema endpoint exists but is unused
- Dead dependencies: @ai-sdk/openai, openai, sql.js, @faker-js/faker, clsx, lucide-react, zod
- No dark mode toggle (CSS vars defined but no switch)
- API key hardcoded in agent.ts
- No streaming response

## Time Budget
~30 hours until deadline (7/5 20:00). Need to prioritize ruthlessly.

## Audit Questions

### Q1: Score Maximization Strategy
Given the scoring rubric and current state, what is the optimal allocation of the remaining ~30 hours to maximize total score? Rank concrete actions by score impact / effort ratio.

### Q2: Innovation Narrative
Text2SQL is not novel. What specific narrative, feature twist, or demo framing can push the 创新性 score from 8-10 to 12-14? Consider: multi-step reasoning, self-correction loops, domain-specific knowledge, unique UX patterns, or "wow moment" demo scenarios.

### Q3: UI Overhaul Priorities
The UI is "thin" — just chat + single chart. Dashboard.tsx (multi-chart grid) exists but isn't wired. What specific UI changes would make this look like a "business SaaS product" rather than a "demo hack"? List exact components to add/modify with effort estimates.

### Q4: Demo Flow Design
Design the optimal 3-minute demo flow for the 赛区预选 and 5-minute flow for Demo Day. What query sequence creates the best narrative arc? What fallback plan if Kimi API is slow or down?

### Q5: Technical Debt Triage
Which technical debts MUST be fixed before demo (would cause live failure), which SHOULD be fixed (visible quality signal), and which can be ignored? Consider: dead deps, hardcoded keys, missing error boundaries, single-turn limitation, streaming.

### Q6: Deployment Decision
Railway deployment was decided in previous QUINTE. With ~30 hours left, is deploying worth the time investment vs. running locally with localtunnel? What's the risk/reward?

## Output Format
Write your analysis as structured markdown. For each question, provide:
1. Your assessment
2. Concrete recommendations with effort estimates
3. Risk factors
4. Confidence level (high/medium/low)

Write to: debates/quinte/round3-polish/r1-{AGENT_ID}.md

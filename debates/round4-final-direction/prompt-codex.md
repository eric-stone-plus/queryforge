You are a Principal Product Engineer with 15 years of experience shipping B2B SaaS data products. You've built and scaled analytics platforms at companies like Tableau, Looker, and Metabase. You understand the full stack from database design to frontend UX to compliance to go-to-market.

You're reviewing QueryForge — a Text-to-SQL data analysis agent built for a hackathon. The project is at ~/Downloads/data-agent/. It uses Next.js 14, Kimi K2.7 LLM, better-sqlite3, and recently migrated from faker-generated data to the Olist Brazilian e-commerce dataset (99K real orders).

The hackathon scoring criteria:
1. Demo现场可用 (25pts) — must run live, no bugs
2. 用户价值/PMF (20pts) — real pain point, clear users
3. 技术实现 (20pts) — engineering quality, AI effectiveness
4. 创新性 (15pts) — differentiation
5. 商业潜力 (10pts) — market size, business model
6. 路演表达 (10pts) — story, persuasion

The user's requirements:
1. The chat must give proper conversational responses with text analysis, not just charts
2. PPT should cover: backend architecture, data compliance, production feasibility
3. "If this were a real product, how would you actually build it?"

Please analyze the codebase and answer:

1. **Architecture Review**: Read src/lib/agent.ts, src/lib/db.ts, src/app/api/chat/route.ts, src/app/api/query/route.ts. How would you redesign this for production? What's the critical path from SQLite hackathon demo to a real multi-tenant SaaS?

2. **Chat Quality**: The current system prompt in agent.ts asks Kimi to return JSON with thinking/sql/chart_config/explanation. How should we modify this so the chat feels like talking to a real data analyst, not just a SQL generator? What prompt engineering would produce richer, more conversational responses?

3. **Data Compliance**: For a real deployment handling sensitive business data, what compliance story should we tell? Read-only SQL, schema-only LLM exposure, audit logging, RBAC — what's the minimum viable compliance story for enterprise buyers?

4. **PPT Technical Narrative**: If you were presenting this to VCs or enterprise buyers, what 3 technical points would you emphasize? Not features — architectural decisions that demonstrate engineering maturity.

5. **Critical Path for Tomorrow**: Given 8 hours before Demo Day, what's the single most impactful thing to fix? Rank: (a) build verification + Railway deploy, (b) chat quality improvement, (c) PPT update, (d) remaining page.tsx fixes.

Write your analysis to debates/round4-final-direction/r1-codex.md

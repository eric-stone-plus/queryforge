QUINTE R1 — Final Implementation Direction (Pre-Demo)
======================================================

Context: QueryForge hackathon project. Demo Day is tomorrow (2026-07-05). Two primary deliverables:
1. Railway deployment: queryforge-production-8d6f.up.railway.app
2. PPT: QueryForge-Pitch.pptx

We just migrated from faker-generated data to Olist Brazilian e-commerce real dataset (99K orders, 96K users, 74 categories). The migration is done but code updates are partial.

## Current State
- DB: Olist data seeded (99,441 orders, real Brazilian marketplace data)
- agent.ts: System prompt updated for Olist schema
- demo-cache.ts: 4 cached queries updated for Olist
- MetricSidebar.tsx: Default metrics updated
- page.tsx: KPI cards and static data updated (PARTIAL - user distribution section still shows old faker segments)
- ChatPanel.tsx: NOT updated
- PPT: NOT updated (still shows old faker numbers)
- Railway: NOT redeployed yet
- Build: NOT verified yet

## User Requirements (Critical)
1. "对话框里是正常的对话，不要乱回答" — Chat must give proper conversational responses with text analysis, not just charts
2. "要有文字叙述和辅助分析" — Responses should include narrative explanation and auxiliary analysis
3. PPT technical narrative should focus on: backend architecture, data compliance, real-world production feasibility — not just "we used AI"
4. "如果你这是个真实的落地项目，这些技术栈你要怎么去落实" — Show how this would work as a real production product

## Questions for QUINTE

### Q1: Chat Quality
Currently agent.ts returns: thinking, intent, sql, chart_config, explanation. The Kimi LLM generates SQL and a brief explanation. 

How should we improve the chat experience to feel like a real data analyst assistant, not just a SQL generator? What should the system prompt emphasize? Should we add a second LLM call for richer analysis?

### Q2: PPT Technical Narrative
The current PPT focuses on features (取数、可视化、纠错、指标库). The user wants the technical section to cover:
- Backend architecture (how it would scale beyond SQLite)
- Data compliance (how to handle real business data securely)
- Production feasibility (what it takes to go from demo to product)

What specific technical points should we include in the PPT? How much detail vs. keeping it accessible for non-technical judges?

### Q3: Implementation Priority
Given ~8 hours before Demo Day, what's the critical path?
- Fix remaining page.tsx issues (user distribution section)
- Update PPT with Olist numbers
- Verify build + Railway deploy
- Improve chat quality (system prompt tuning)
- Rehearse demo flow

Which items MUST be done vs. nice-to-have?

### Q4: Data Compliance Narrative
The Olist dataset is public Kaggle data. In a real production scenario, QueryForge would handle sensitive business data. What data compliance story should we tell in the PPT?
- Read-only SQL (already implemented)
- No data leaves the database (LLM only sees schema, not data)
- Role-based access (future feature)
- Audit logging (future feature)
- What else?

### Q5: Railway Deployment Strategy
The current Railway deployment uses Kimi K2.7. After the Olist migration, we need to:
1. Push updated code to GitHub
2. Railway auto-deploys from main branch
3. Verify the live app works with new data

What risks should we watch for? Should we keep a fallback with the old data?

## Output Format

Write to: debates/round4-final-direction/r1-{AGENT_ID}.md
Structure: Answer each Q1-Q5 with specific, actionable recommendations. Include risk assessment.

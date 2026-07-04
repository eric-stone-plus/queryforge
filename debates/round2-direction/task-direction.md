# QUINTE R1 Task: Hackathon Project Direction Decision

## Context
We are at Clawhunt Builder Camp 2026 (Shenzhen). Our team project is "Data Analysis Automation Agent" — accepts NL business requirements, generates metrics/SQL, produces BI dashboards.

## Key Decision
A colleague's project (seen but NOT to be copied) uses a single 93KB HTML file approach: pure frontend, Canvas-based charts, CSV parser, built-in sample data, zero backend. It's called "DataPilot 数据分析智能体".

Our current approach: Next.js 14 + SQLite + Vercel AI SDK + OpenAI gpt-4o + Recharts + server-side SQL agent pipeline. We have 10 files already built (1510 lines), seed script working (10K orders, 25K items).

## The Question
1. Should we keep the Next.js approach (has real AI agent depth, but heavier deployment)?
2. Should we pivot to single HTML (lighter, easier demo, but less technical depth)?
3. Or hybrid — keep the AI backend but make the frontend a single deployable page?

## Scoring Criteria (what maximizes points)
- Demo 25pts: Must run smoothly on-site, complete loop, no bugs
- Tech 20pts: AI/Agent tools used appropriately and effectively  
- Innovation 15pts: Novel, differentiated approach
- PMF 20pts: Solves real pain point
- Business 10pts: Market size, growth
- Presentation 10pts: Storytelling, persuasiveness

## Constraints
- Tonight deadline (July 4)
- Must deploy to free public domain
- Must show NL → metric → SQL → dashboard flow
- Must be differentiated from colleague's approach
- Chinese e-commerce mock data

Provide a clear recommendation with reasoning. Be specific about what to build and how to differentiate.

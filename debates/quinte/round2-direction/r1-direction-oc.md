# R1 Direction Recommendation (OpenCode)

## TL;DR: Keep Next.js. Do not pivot.

---

## Recommendation: Keep Next.js 14 Stack

### Why NOT single HTML

1. **You'd be cloning the competitor.** Your colleague already owns "single HTML file DataPilot." Pivoting puts you in direct comparison — you lose on first-mover perception and look derivative. Judges will notice.

2. **You lose your scoring edge.** The single-HTML approach has zero AI agent depth. Your current stack (GPT-4o → structured output → SQL validation → SQLite query → Recharts) directly scores Tech (20pts) and Innovation (15pts). A Canvas+CSV file scores near-zero on Tech.

3. **No secure OpenAI integration.** Single HTML means exposing your API key in frontend JavaScript, or not using AI at all. Either is a disqualifier or a regression.

4. **SQLite can't run in browsers.** You'd have to ship CSV mock data, losing the real 10K-order database that makes your demo credible.

### Why NOT hybrid

- Adds conversion work (React → vanilla HTML) for zero functional gain.
- Next.js already deploys as a single URL. The "single page" benefit is automatic.
- Splitting frontend/backend across different hosts adds deployment complexity you don't have time for tonight.

### Why KEEP Next.js

| Factor | Your Stack | Single HTML |
|--------|-----------|-------------|
| AI/Agent depth (20pts) | GPT-4o + Vercel AI SDK + structured Zod schema | None |
| Innovation (15pts) | NL → thinking → intent → SQL → validate → query → chart config | CSV parser + Canvas |
| Demo loop (25pts) | Type question → AI responds with chart | Upload CSV → pick columns |
| Differentiation | Real agent pipeline | Same as colleague |
| PMF (20pts) | "Ask questions, get dashboards" | "Manual chart builder" |

---

## Concrete Plan for Tonight

### 1. Deploy to Vercel (30 min)
- `npx vercel` from project root
- Set `OPENAI_API_KEY` as environment variable in Vercel dashboard
- Note: `better-sqlite3` needs native bindings. If Vercel fails, use **Railway** (`railway up`) or **Render** (free web service) instead
- Alternative: if all cloud fails, demo locally with `npm run dev` and screen-share — still counts

### 2. Polish the demo flow (1 hr)
- Pre-seed 3-4 compelling demo questions in the chat UI as clickable chips:
  - "各地区月销售额趋势" (monthly revenue trend by region)
  - "哪个品类利润率最高？" (highest margin category)
  - "复购率最高的用户画像" (repeat buyer profile)
  - "Top 10 畅销商品" (top 10 bestsellers)
- Ensure each one runs end-to-end in <5 seconds
- Verify charts render correctly for each

### 3. Rename to avoid confusion (5 min)
- Your page.tsx line 34 says "DataPilot" — rename to something distinct (e.g., "DataAgent 数据分析智能体" or "QueryPilot") to differentiate from colleague

### 4. Presentation angle (30 min)
- **Story**: "Everyone builds dashboards manually. We built an agent that builds them for you."
- **Demo**: Show the AI thinking process (your `thinking` field), the generated SQL, the validation, and the auto-selected chart type
- **Differentiation callout**: "Unlike CSV-based tools, our agent understands your data schema, generates safe SQL, and runs against a real database"
- **PMF hook**: "Any business analyst can ask questions in natural language — no SQL knowledge required"

### 5. Backup plan
- If GPT-4o API is slow/down during demo: have 2-3 pre-cached `AgentResult` responses hardcoded as fallback
- If deployment fails: `npm run build && npm run start` locally is fine for hackathon

---

## Scoring Optimization Summary

| Criterion | Pts | Strategy |
|-----------|-----|----------|
| Demo | 25 | Pre-seed demo questions, test full loop tonight |
| Tech | 20 | Lean into AI agent: show structured output, SQL validation, schema-aware prompting |
| Innovation | 15 | "AI agent with real database" vs "CSV visualizer" — pitch the gap |
| PMF | 20 | "Natural language to dashboard for non-technical users" |
| Business | 10 | E-commerce analytics is a $20B+ market |
| Presentation | 10 | Live demo with real AI responses, show the thinking chain |

**Maximum points path = keep Next.js, deploy tonight, demo the AI agent depth that no single-HTML approach can match.**

# Recommendation: Keep Next.js (Option 1) — with targeted cuts

## Verdict

**Keep the Next.js approach. Do not pivot.** Here's why, scored against your criteria:

### Scoring Breakdown

| Criterion | Pts | Single HTML | Next.js (current) | Next.js (trimmed) |
|-----------|-----|-------------|--------------------|--------------------|
| Demo      | 25  | 22          | 18                 | 23                 |
| Tech      | 20  | 10          | 19                 | 19                 |
| Innovation| 15  | 5           | 12                 | 13                 |
| PMF       | 20  | 15          | 18                 | 18                 |
| Business  | 10  | 7           | 8                  | 8                  |
| Present.  | 10  | 7           | 8                  | 9                  |
| **Total** | 100 | **66**      | **83**             | **90**             |

### Why NOT single HTML

- Your colleague already owns that lane. Judges will see two near-identical demos.
- No real AI agent — just a prompt-to-Canvas pipeline. Loses most of the 20 Tech points.
- You'd throw away 1510 lines of working code with hours left on the deadline.

### Why NOT hybrid (Option 3)

"Keep AI backend, make frontend a single page" sounds clean but is a trap tonight:
- You'd need to rip out Next.js routing, replace Recharts with Canvas, rewrite the UI — all while keeping the API layer working.
- Net new work with zero margin for error. Not worth it.

### What to do instead: Trimmed Next.js

You already have the hard parts working (seed data, SQL agent, AI SDK). Focus the remaining hours on **Demo reliability** (25pts) and **Presentation** (10pts):

1. **Lock the happy path.** One NL query → metric extraction → SQL gen → dashboard render. Test it 5 times end-to-end. Fix any flaky spots. This is worth more than any new feature.

2. **Deploy to Vercel now.** `npx vercel --prod`. Free, instant, public URL. Don't wait until the deadline — deploy early and iterate.

3. **Add a "wow" differentiator** your colleague can't match:
   - Multi-turn conversation: "Now break it down by region" after the first dashboard. This is the AI agent depth single-HTML can't do.
   - Real-time SQL explanation: show the generated SQL alongside the chart with a plain-English explanation. Demonstrates transparency.

4. **Seed with a compelling demo query.** Hardcode a default: "分析上个月各品类销售额，找出增长最快和下降最多的品类" → preloaded dashboard. Judges see results instantly, then can try their own.

5. **Presentation angle:** "DataPilot is a frontend toy. We built an AI data agent — it understands your intent, generates and executes real SQL, explains its reasoning, and iterates in conversation." This is a clear differentiator story.

### What to cut (tonight only)

- Don't polish edge cases. If a bad NL query fails, that's fine — show the happy path.
- Don't add auth, export, or save features.
- Don't optimize the seed script beyond what works.

### Bottom line

You have real AI agent infrastructure that your competitor doesn't. Don't abandon it for a shinier frontend. Ship what you have, make the demo bulletproof, and tell the story of why an agent beats a static page.

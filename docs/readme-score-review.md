# README Demo Day Score Review

Reviewed files:

- `README.md`
- `criteria/hackathon-rules.md`

Scoring lens: this evaluates how clearly the README communicates value against the Demo Day rubric, not a full product audit from running the demo.

## Overall Score: 71 / 100

The README presents a credible AI analytics product with a live demo, clear workflow, concrete stack, and a sensible safety model. It is strongest on technical implementation and basic demo readiness. It is weaker on market proof, commercial potential, innovation framing, and pitch narrative. For Demo Day judges, the README explains what QueryForge does, but it does not yet make the case for why this specific product will win sustained users or become a business.

## 1. Demo / On-Site Usability: 19 / 25

Does the README clearly communicate the value?

Partially yes. The README includes a hosted live demo link, a macOS desktop release link, example prompts, and a simple explanation of the end-to-end user flow. It clearly says the product can turn natural-language questions into SQL, execute the query, show charts, and explain results.

What is strong:

- Live demo link is prominent near the top and repeated in the Demo section.
- Example questions help judges quickly understand what to try.
- The README describes a complete loop: question -> SQL -> validation -> execution -> visualization -> explanation.
- The self-correction loop for failed SQL suggests the demo is more resilient than a basic one-shot LLM wrapper.
- Hosted web app plus desktop app makes the demo feel more complete.

What is missing:

- No screenshots, GIF, or short demo video. Judges reading quickly cannot see the actual product surface or proof that it works.
- No explicit "Demo script" showing the best 60-90 second path through the product.
- No mention of known demo constraints, expected latency, or fallback behavior if the AI provider or hosted database fails.
- The README does not show sample output, generated SQL, chart examples, or a before/after view of a typical analyst request.
- The desktop app is mentioned, but the README does not explain why judges should use it instead of the hosted demo.

Recommended README improvements:

- Add a "Demo in 60 seconds" section with 3 exact questions and the expected visible result.
- Add 2-3 screenshots or a short GIF showing chat, generated SQL, chart, and explanation.
- Add a "Reliability notes" line covering demo data, retry behavior, and what is live versus mocked.

## 2. User Value / PMF: 14 / 20

Does the README clearly communicate the value?

Mostly yes at the problem-solution level. The README identifies a real pain: analytics teams repeatedly answer small reporting questions, while business users wait for analysts or dashboard changes. It positions QueryForge as governed self-service analytics.

What is strong:

- The target users are clear: analysts set up definitions; business teams ask natural-language questions.
- The pain is recognizable and concrete: repeated breakdowns, region cuts, revenue dips, and metric SQL requests.
- The product value is easy to understand: faster answers for business users and less repetitive work for analysts.
- The "approved data layer" and metric sidebar help communicate governance, which matters in analytics workflows.

What is missing:

- No PMF evidence: no user interviews, usage stats, quotes, waitlist, pilot, benchmark, or observed workflow savings.
- The README does not quantify the pain, such as analyst hours saved, average ticket latency reduced, or number of repeated data asks handled.
- It does not name a beachhead customer profile beyond broad "teams" and "business departments."
- It does not explain the adoption path inside a company: who installs it, who configures metrics, who approves data access, and who uses it daily.
- It does not address why teams would use this instead of existing BI natural-language features, dashboard filters, or internal analyst copilots.

Recommended README improvements:

- Add a short "Who uses this" section with 2-3 concrete personas.
- Add one quantified value claim, even if based on demo assumptions, such as "turns a 30-minute analyst request into a 30-second self-serve query."
- Add PMF signals from hackathon user testing if available: number of testers, feedback themes, or quotes.

## 3. Technical Implementation: 17 / 20

Does the README clearly communicate the value?

Yes. This is the README's strongest dimension. It explains the stack, data flow, safety model, query validation, retry loop, streaming progress, deployment target, and project structure.

What is strong:

- The architecture is understandable at a glance.
- The stack table is specific and credible: Next.js, TypeScript, Vercel AI SDK, Kimi K2.7 Code, SQLite, better-sqlite3, node-sql-parser, Recharts, SSE, Railway.
- The safety model is directly relevant to the product: read-only SELECT queries, parsing, single-statement validation, LIMIT enforcement, read-only access.
- The SQL self-correction loop is a real agentic behavior, not just a chat interface.
- The README mentions quality work through the QUINTE protocol, including independent AI review agents and P0 bug discovery.

What is missing:

- The README does not show enough implementation evidence for judges to quickly assess robustness: no architecture diagram, no sample generated SQL, no validation examples, no test results.
- The "Quality" line is intriguing but underexplained. Judges may not know what QUINTE means or whether the P0 bugs were fixed.
- It does not specify limits of SQL validation, schema grounding, prompt design, or how hallucinated columns/tables are handled.
- It does not mention automated tests, linting, type checks, or CI status.
- It does not clarify whether the macOS desktop app is a native app, wrapper, or packaged web view.

Recommended README improvements:

- Add a compact architecture diagram or flow image.
- Add a "Safety and correctness examples" section with one rejected unsafe query and one corrected failed SQL query.
- Add verification status: tests run, known limitations, and whether the 5 P0 bugs were fixed.

## 4. Innovation: 9 / 15

Does the README clearly communicate the value?

Somewhat. The README communicates a useful product, but it does not strongly argue that the approach is novel or differentiated. Natural-language-to-SQL with charts and explanations is valuable, but judges may see it as a familiar BI copilot pattern unless the README makes the distinctive angle explicit.

What is strong:

- The analyst-approved metric sidebar gives the product a more governed workflow than a generic SQL chatbot.
- The self-correction loop and streaming progress improve usability and trust.
- The dual hosted web app and macOS desktop app give the project more polish than a minimal prototype.
- Positioning the analyst as the owner of definitions, while business teams self-serve, is a practical product angle.

What is missing:

- No explicit comparison to existing alternatives such as Tableau/Power BI natural-language Q&A, ChatGPT over CSV, Metabase, or internal data copilots.
- The README does not explain what is meaningfully new about QueryForge's agent loop, governance model, or workflow.
- No unique insight is stated, such as "business users do not need more dashboards; they need constrained ad hoc analysis over approved metrics."
- No mention of future differentiators, such as semantic layer integration, approvals, query audit logs, scheduled insights, Slack integration, or warehouse connectors.

Recommended README improvements:

- Add a "What is different" section with 3 defensible differentiators.
- Frame the innovation as governed self-service analytics, not just natural-language SQL.
- Include a short comparison table against dashboards, raw SQL copilots, and BI Q&A tools.

## 5. Business Potential: 5 / 10

Does the README clearly communicate the value?

Only lightly. The README identifies a plausible enterprise productivity problem, but it does not yet communicate market size, buyer, pricing, go-to-market, or why this can become a durable business.

What is strong:

- The problem is tied to a real business workflow: analytics queue bottlenecks.
- The likely buyers are inferable: data/analytics leaders, operations teams, growth teams, ecommerce teams, or BI owners.
- The product could fit a vertical SaaS or internal data-tooling wedge.

What is missing:

- No explicit business model.
- No pricing hypothesis.
- No market sizing or target segment.
- No buyer/user distinction.
- No wedge strategy, such as ecommerce SMBs, ops teams, or internal analytics teams at fast-growing startups.
- No moat or sustainability argument beyond implementation quality.
- No path from SQLite demo to production warehouse deployment.

Recommended README improvements:

- Add a "Business" section with target customer, buyer, pricing hypothesis, and initial market.
- Explain production expansion: connectors to Postgres/BigQuery/Snowflake, permissions, audit logs, team workspaces.
- Add one sentence on why this can be sold: reduced analyst backlog, faster decision cycles, and governed access.

## 6. Presentation / Pitch Clarity: 7 / 10

Does the README clearly communicate the value?

Yes, at a functional level. The README is organized, readable, and avoids excessive hype. It has a clear tagline, problem section, feature list, architecture, stack, safety model, demo, and development instructions.

What is strong:

- The opening Chinese tagline is concise and strong: "让业务部门自助取数，解放数据分析师的重复需求."
- The English positioning sentence is clear and judge-friendly.
- The README follows a logical order from problem to product to implementation to demo.
- The writing is concrete and product-focused.

What is missing:

- The pitch lacks a sharper narrative arc: pain, stakes, old way, new way, proof, business opportunity.
- The README does not make the "why now" argument for AI agents in analytics.
- It does not include a one-slide-style summary that judges can remember after many demos.
- The bilingual opening is fine, but the rest of the README is English; for a Chinese hackathon audience, a concise Chinese summary could improve judge comprehension.
- There is no visual evidence, which weakens presentation even if the written structure is clean.

Recommended README improvements:

- Add a short "Judge summary" near the top: problem, product, user, demo proof, business potential.
- Add a Chinese version of the core value proposition and demo script.
- Add visual assets to make the README feel more like a polished Demo Day artifact.

## Priority Fixes Before Demo Day

1. Add screenshots or a GIF of the live product flow.
2. Add a 60-90 second demo script with exact prompts and expected results.
3. Add PMF evidence from user testing, even if lightweight.
4. Add a "What is different" section comparing QueryForge with dashboards and generic SQL copilots.
5. Add a short business model section with target customer, buyer, pricing, and production roadmap.
6. Clarify quality status: tests run, P0 fixes completed, and known limitations.

## Suggested Revised Score After README Improvements

If the README adds visual proof, a demo script, PMF evidence, differentiation, and business framing, it could plausibly move from 71 / 100 to roughly 84-88 / 100 without changing the product itself.


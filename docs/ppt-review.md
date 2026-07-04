# QueryForge Pitch Deck Review Against Hackathon Criteria

Reviewed:

- PPT: `/Users/ericstone/Downloads/data-agent/assets/QueryForge-Pitch.pptx`
- Rubric: `/Users/ericstone/Downloads/data-agent/criteria/hackathon-rules.md`

## Executive Diagnosis

The deck is visually coherent and already communicates the basic product: QueryForge lets business users ask natural-language data questions and get charts, KPI cards, dashboards, and reusable metric views. The problem is that the business pitch is still too descriptive. It says what the product does, but it does not yet make judges believe three things strongly enough:

1. The live demo will run smoothly and show a complete loop.
2. A specific user segment would keep using this every week.
3. QueryForge is meaningfully different from a generic Text2SQL demo, ChatGPT over data, or a BI tool with natural-language Q&A.

The Demo Day scoring criteria are:

| Dimension | Points | What The Deck Must Help Judges Believe |
|---|---:|---|
| Demo / 现场可用 | 25 | The product runs live, completes a workflow, and has fallback/reliability planning. |
| 用户价值 / PMF | 20 | A specific buyer/user has a frequent, painful, expensive workflow that QueryForge improves. |
| 技术实现 | 20 | The AI/agent is core to the workflow, technically credible, safe, and stable. |
| 创新性 | 15 | This is more than "natural language to SQL"; the workflow or architecture has a differentiated angle. |
| 商业潜力 | 10 | There is a clear market wedge, buyer, pricing logic, and expansion path. |
| 路演表达 | 10 | The story is sharp, paced, memorable, and evidence-led. |

Important deck inventory note: the actual PPT contains 9 slides, not 8. The extracted slides are:

1. Cover
2. Pain Point
3. Solution
4. Product Demo
5. Data Proof
6. How It Works
7. Use Cases
8. What's Next
9. CTA

The user-provided structure says 8 slides and includes "Dual value" as slide 6. The actual deck has no clear dual-value slide; it has a "How It Works" slide instead. If the final pitch must stay at 8 slides, merge the current slide 8 roadmap into the final CTA and rebuild slide 6 as a combined "Dual value + technical trust" slide.

## Overall Gaps By Scoring Dimension

### Demo / 25

Current gap: the deck mentions a deployed demo and screenshots, but it does not prescribe the live demo path. Judges should know exactly what they will see before the presenter switches to the product.

Add:

- A 90-120 second demo storyboard: prompt -> agent progress -> SQL safety -> chart/dashboard -> save/reuse metric.
- Exact demo prompts and expected outputs, preferably the same prompts used in the live app.
- A live QR or URL on cover and final slide.
- Reliability notes: Railway deployed app, 30s model timeout, pre-cached fallback for demo prompts, read-only database.
- A "complete loop" proof: ask question, inspect generated answer, save metric, rerun metric.

### PMF / 20

Current gap: the pain is plausible but not evidenced. The deck says analysts handle repeated requests, but it does not quantify frequency, cost, or urgency.

Add:

- A beachhead persona: ecommerce/retail operations manager, growth lead, or internal analytics lead.
- A buyer/user distinction: Head of Data or Ops buys; business teams and analysts use.
- A quantified before/after claim. If no external data exists, present it as an observed demo/pilot assumption, not a fabricated benchmark: "turns a common 30-minute analyst request into a self-serve query in under 1 minute."
- Lightweight PMF evidence from the hackathon: number of users who tried it, feedback themes, repeated questions they asked, or direct quotes.
- The adoption path: analyst defines approved metrics -> business team self-serves -> team saves recurring views.

### Tech / 20

Current gap: the deck does not show enough of the real engineering that exists in the project. QueryForge has stronger technical evidence than the slides currently expose.

Use these concrete product facts:

- Kimi K2.7 Code generates structured JSON with intent, SQL, chart config, and explanation.
- SQL is parsed and restricted to a single `SELECT`.
- Queries auto-add `LIMIT 500`.
- Database access is read-only.
- The API streams progress states: analyzing, generating SQL, executing, correcting, done/error.
- The agent has a self-correction loop if generated SQL fails.
- The app has cached demo fallback for known prompts if the model/API fails.
- KPI cards and dashboard panels are backed by the demo database.

Add a compact architecture/safety visual rather than a prose list.

### Innovation / 15

Current gap: the slides can be mistaken for a generic Text2SQL wrapper. The differentiator should be framed as "governed self-service analytics" and "metric library as reusable business knowledge."

Add:

- A clear "not just Text2SQL" line.
- Differentiation against three alternatives:
  - ChatGPT: no governed DB connection, no SQL validation, no reusable metric library.
  - BI dashboards: fixed views; hard to answer new follow-up questions.
  - SQL copilots: require analyst skill and do not create business-facing reusable answers.
- The innovation claim: every useful query can become a reusable metric definition, turning one-off data asks into a shared metric library.
- Show self-correction and visible agent progress as agent behavior, not decorative AI.

### Business / 10

Current gap: current slides have no pricing, buyer, wedge, market, or sustainable business logic. "What's next" is a roadmap, not a business case.

Add:

- Initial customer wedge: ecommerce/retail operations and growth teams with frequent reporting requests.
- Buyer: Head of Data, Head of Ops, or founder/COO at data-heavy SMBs.
- User: analysts configure metrics; non-technical business users ask questions.
- Business model: team-based SaaS, analyst-led setup, priced by seats/workspace/data connectors.
- Expansion: SQLite demo -> Postgres/MySQL -> BigQuery/Snowflake -> permissions/audit logs -> shared metric catalog.
- Economic logic: reduce analyst backlog, speed up operating decisions, standardize metric definitions.

### Presentation / 10

Current gap: several slide titles are topic labels or generic claims. Many slides use paragraphs where judges need proof objects.

Improve:

- Make every slide title a conclusion, not a label.
- Reduce prose blocks; use one dominant proof object per slide.
- Repeat one memorable phrase: "Analysts define the truth. Business teams move on it."
- Use slide subtitles as speaker cues, not as extra body copy.
- Fix pacing for 5 minutes: 60-90 seconds on slides, 2-3 minutes live demo, final 30 seconds ask.

## Recommended 8-Slide Rebuild

If time is limited, keep 8 slides and use this flow:

| Slide | New Role | Scoring Job |
|---|---|---|
| 1 | Cover / thesis | PMF, Presentation |
| 2 | Pain / quantified workflow | PMF, Business |
| 3 | Solution / product shift | PMF, Innovation |
| 4 | Live demo storyboard | Demo, Presentation |
| 5 | Proof on dataset + demo outputs | Demo, Tech |
| 6 | Agent architecture + dual value | Tech, PMF, Innovation |
| 7 | Beachhead use cases + business model | Business, PMF |
| 8 | Ask / pilot / QR | Presentation, Business, Demo |

This means merging current slide 8 "What's Next" and slide 9 "CTA" into one final slide, and replacing the current generic use-case/roadmap material with business value and scoring proof.

## Slide-By-Slide Improvement Plan

### Slide 1: Cover

Current content:

- "QueryForge"
- "Natural-language business data queries with charts on demand."
- Live context: built in 72 hours, ClawHunt, Kimi K2.7 Code, demo data scope.
- URL.

What is missing:

- The headline does not say the business outcome.
- No target user or buyer appears in the first 10 seconds.
- No "from/to" transformation: from analyst ticket queue to governed self-service.
- No explicit "live demo is ready" signal beyond a small URL.
- The phrase "natural-language business data queries" sounds like a generic Text2SQL tool.

What would raise scores:

| Dimension | Upgrade |
|---|---|
| Demo | Add a visible "Live deployed demo" QR/URL and a small strip: "Ask -> SQL-safe query -> chart -> save metric." |
| PMF | Name the user immediately: "For operations teams waiting on analyst queues." |
| Tech | Keep Kimi and dataset scope, but add "SQL-safe agent" or "SELECT-only read-only DB" as a credibility marker. |
| Innovation | Replace generic Text2SQL framing with "governed self-service analytics." |
| Business | Add "team workspace for recurring business metrics" so it feels like a SaaS product, not a demo utility. |
| Presentation | Use a claim headline: "QueryForge turns analyst ticket queues into self-service business answers." |

Recommended rewrite:

- Title: `QueryForge`
- Claim: `Analysts define the truth. Business teams move on it.`
- Subhead: `A governed AI data agent that turns natural-language business questions into SQL-safe charts and reusable metrics.`
- Proof strip: `Live Railway demo | Kimi K2.7 Code | 10K orders | 8 KPI cards | 6 dashboard panels | Saved metric library`
- Footer/QR: live URL and GitHub/ClawHunt listing if available.

Presenter goal: in 15 seconds, judges should understand the product category, target user, and why it is not just ChatGPT.

### Slide 2: Pain Point

Current content:

- "The bottleneck is request handling, not analysis."
- Analyst queue and business waiting loop.
- Opportunity statement: make common questions self-service while keeping metrics reusable.

What is missing:

- No quantified pain: time lost, number of requests, wait time, analyst cost, repeated definitions.
- No specific persona. "Business teams" is too broad.
- No concrete example request thread.
- No stakes: what decision gets delayed, what goes wrong when definitions differ.
- No PMF signal from user testing or observed hackathon feedback.

What would raise scores:

| Dimension | Upgrade |
|---|---|
| Demo | Use a pain example that becomes the exact live demo prompt on slide 4. |
| PMF | Add persona + frequency: "Ecommerce ops asks daily questions about region, category, channel, and customer behavior." |
| Tech | Mention that ad hoc questions require schema knowledge, joins, formulas, and safety checks. |
| Innovation | Frame the unresolved issue as "business questions are dynamic, but dashboards are static." |
| Business | Translate pain into cost: analyst time, slower operating reviews, inconsistent metrics. |
| Presentation | Replace paragraph cards with a single workflow bottleneck visual. |

Recommended rebuild:

- Title: `Business questions move faster than analytics queues.`
- Proof object: left-to-right bottleneck:
  - Operating review asks: "Why is East region revenue down?", "Which category has highest margin?", "Who are repeat buyers?"
  - Analyst queue: SQL joins, metric definitions, chart rebuild, follow-up.
  - Delayed decisions: inventory, pricing, campaign spend, sales follow-up.
- Add one quantified line, marked honestly:
  - If validated: `Observed in user testing: X/Y testers asked follow-up cuts after the first chart.`
  - If not validated: `Common workflow: simple custom report requests often wait 1-3 days while the business decision is needed today.`

Speaker note: do not over-argue the pain. Tell one concrete scene: "An operations lead is in a morning review and needs a region/category cut now; the analyst should not become the manual API for every follow-up."

### Slide 3: Solution

Current content:

- "Analysts define the metric library once; business users self-serve."
- Three steps: analyst setup -> business questions -> reusable answers.

What is missing:

- The "metric library" is not explained as a governed semantic layer or reusable knowledge base.
- The product boundary is vague: what does the analyst define, what does the AI infer, what does the business user see?
- No before/after contrast.
- No connection to adoption inside a company.
- No explanation of why this is safer than letting everyone ask a general chatbot.

What would raise scores:

| Dimension | Upgrade |
|---|---|
| Demo | Identify the exact demo loop: ask, watch progress, inspect SQL/chart, save/rerun metric. |
| PMF | Show the two-sided workflow: analysts retain control; business users gain speed. |
| Tech | Add "approved schema + metric formulas + SQL validation" as the middle layer. |
| Innovation | Use "metric library as business memory" as the differentiator. |
| Business | Show repeat usage: each saved metric increases the value of the workspace. |
| Presentation | Convert the 3 cards into a product-system diagram. |

Recommended rebuild:

- Title: `Set up once. Self-serve every operating review.`
- Visual:
  - Left: `Analyst-owned context`
    - schema
    - metric formulas
    - saved metrics
    - permissions/safety
  - Center: `QueryForge agent`
    - intent -> SQL -> validation -> execution -> chart -> explanation
  - Right: `Business outputs`
    - KPI card
    - chart
    - dashboard panel
    - reusable metric
- Bottom claim: `The analyst stops rebuilding the same answer; the business team stops waiting for every follow-up.`

### Slide 4: Product Capabilities / Demo

Current content:

- Screenshots from the deployed demo.
- Natural-language entry, 8 KPI cards, 6 dashboard panels, preset metric library.
- Product view is built around operating health, regional performance, channel mix, product focus, and user segmentation.

What is missing:

- No live demo script. For a 25-point Demo category, this is the most important missing piece.
- The slide says screenshots are from the demo, but it does not tell judges what they should watch for.
- No evidence of complete loop: ask -> generate -> validate -> chart -> save -> rerun.
- No visible SQL, agent progress, self-correction, or fallback reliability.
- No "what can go wrong and how we handle it" confidence signal.

What would raise scores:

| Dimension | Upgrade |
|---|---|
| Demo | Turn this into the stage storyboard: 3 exact prompts, outputs, and the final saved metric rerun. |
| PMF | Make each prompt a real business question, not a feature demo. |
| Tech | Call out visible agent progress, generated SQL, chart selection, and validation. |
| Innovation | Show saved metric reuse as the transition from one-off query to shared metric library. |
| Business | Present the product as a daily workspace, not a one-time chat. |
| Presentation | Use annotated product screenshot with 4 callouts instead of dense text. |

Recommended demo storyboard:

1. `各地区月度销售额趋势`
   - Shows time-series chart across 8 regions.
   - Scoring proof: live query -> chart.
2. `哪个品类利润率最高？`
   - Shows business formula selection and category comparison.
   - Scoring proof: metric logic, not keyword search.
3. `复购率最高的用户是谁？`
   - Shows free-form business concept translation.
   - Scoring proof: natural-language understanding.
4. Save and rerun a metric from the library.
   - Shows repeated use and analyst/business workflow.
   - Scoring proof: complete product loop.

Add a small reliability note:

- `30s timeout | cached demo fallback for core prompts | read-only DB | SELECT-only parser`

### Slide 5: Data Proof

Current content:

- Eight KPI cards: total revenue, AOV, margin, repeat rate, completion, refund, basket, active buyers.
- Demo data scope: 10K orders, 500 products, 1,000 users, 8 regions, 20 categories.

What is missing:

- This is dataset proof, not product proof. Judges need proof that QueryForge can answer business questions live.
- Some values may look artificial or confusing, especially `100% repeat rate` and high AOV. If this is synthetic demo data, call it "realistic seed data" rather than implying external business validation.
- No sample generated SQL.
- No query result/chart example.
- No latency, success/fallback, or number of tested prompts.
- No proof that the KPI cards are database-backed rather than hardcoded.

What would raise scores:

| Dimension | Upgrade |
|---|---|
| Demo | Add "4 demo prompts run end-to-end" with expected visible result. |
| PMF | Tie each metric to a decision: region allocation, category focus, refund investigation, repeat-buyer targeting. |
| Tech | Show one generated SQL snippet with the revenue formula and `LIMIT`. |
| Innovation | Show query result becoming a reusable metric definition. |
| Business | Explain why this dataset maps to the first market wedge: ecommerce/retail operations. |
| Presentation | Replace 8 equal KPI cards with a proof matrix: question, data used, output, decision. |

Recommended rebuild:

- Title: `The demo runs on operating data, not toy prompts.`
- Left proof strip:
  - `10K orders`
  - `25K order items`
  - `500 products`
  - `1,000 users`
  - `8 regions`
  - `20 categories`
- Right proof matrix:

| Business Question | Data Joined | Output | Decision Use |
|---|---|---|---|
| Regional revenue trend | orders + regions + order_items | line chart | allocate inventory/campaigns |
| Category margin | products + categories | bar chart | prioritize profitable categories |
| Top products | order_items + products | ranked table/chart | merchandising focus |
| Repeat buyers | users + orders | segment view | retention targeting |

Add one small code/SQL callout:

`Revenue = SUM(quantity * unit_price * (1 - discount))`, not `orders.total_amount`.

This is a strong technical credibility detail because it shows the agent understands business metric definitions.

### Slide 6: Dual Value / How It Works

Current content in actual PPT:

- "Question to answer, with progress visible throughout."
- Steps: ask, stream, answer, reuse.
- Self-correction loop.

User-provided intended content:

- "Dual value."

What is missing:

- The actual slide is closer to workflow/architecture than dual value.
- It does not show the analyst/business value split that the narrative needs.
- It underuses the real technical architecture: structured JSON, SQL validation, read-only DB, timeout, fallback, self-correction.
- It does not answer the expected judge objection: "Why not ChatGPT?"

What would raise scores:

| Dimension | Upgrade |
|---|---|
| Demo | Keep the visible progress steps and map them to what judges will see live. |
| PMF | Add a dual-value rail: analysts get leverage; business gets speed. |
| Tech | Show architecture and safety gates from natural language to chart. |
| Innovation | Use "reusable metric library + self-correcting SQL-safe agent" as the differentiated system. |
| Business | Explain compounding value: each saved metric reduces future analyst requests. |
| Presentation | Make this the "trust slide" with a clean pipeline, not another text card slide. |

Recommended rebuild:

- Title: `The agent is constrained enough for business use.`
- Main pipeline:
  1. `Natural-language question`
  2. `Kimi structured output: intent + SQL + chart config + explanation`
  3. `SQL parser: single SELECT only`
  4. `Read-only database + LIMIT 500`
  5. `Chart/KPI/table output`
  6. `Save reusable metric`
  7. `If SQL fails: correction loop -> retry`
- Side rail:
  - `For analysts: fewer repeat tickets, consistent formulas, reusable definitions.`
  - `For business: instant answers, charts in context, reusable operating views.`

Add a direct comparison line:

`ChatGPT answers a prompt. QueryForge connects to approved data, validates the query, renders the result, and turns useful answers into reusable metrics.`

### Slide 7: Use Cases

Current content:

- Regional performance
- Category margin
- Product focus
- Customer behavior

What is missing:

- These are generic analytics examples; they do not identify the best first customer.
- No buyer, urgency, budget owner, or reason to adopt now.
- No connection to pricing or market size.
- No evidence that these use cases produce repeated weekly usage.
- No contrast with existing BI dashboards.

What would raise scores:

| Dimension | Upgrade |
|---|---|
| Demo | Map each use case to one live demo prompt so the deck and demo reinforce each other. |
| PMF | Pick a beachhead: ecommerce/retail ops or growth teams with frequent reporting questions. |
| Tech | Name data sources needed for production: Postgres/MySQL/warehouse tables, BI exports, event data. |
| Innovation | Show that the same metric library supports many repeated workflows. |
| Business | Add buyer, pricing, and expansion path. |
| Presentation | Replace broad use-case cards with a "first wedge -> expansion" diagram. |

Recommended rebuild:

- Title: `Start with ecommerce operations, expand into company-wide self-service analytics.`
- Visual:
  - Beachhead: `Ecommerce/Retail Ops`
    - daily sales review
    - category margin
    - regional performance
    - repeat buyer targeting
  - Buyer: `Head of Ops / Head of Data / founder-operator`
  - Users: `analysts + ops/growth/finance leads`
  - Pricing hypothesis: `team subscription + setup; expand by seats, data sources, and saved metrics`
  - Expansion: `retail -> growth -> finance -> sales/customer success`

If the team has no validated pricing yet, phrase it as a hypothesis:

`Pricing hypothesis: team workspace subscription, with analyst-led setup and paid connectors as expansion.`

This is better than omitting business model entirely because the rubric explicitly awards 10 points for commercial potential.

### Slide 8: What's Next

Current content:

- Deployment hardening.
- More data sources.
- Team features.

What is missing:

- This slide is a roadmap, but judges need business proof and an ask.
- "More data sources" and "team features" are expected, not differentiated.
- No milestone timing.
- No link from roadmap to revenue or PMF validation.
- If the final deck must be 8 slides, this slide competes with the CTA and should be merged or replaced.

What would raise scores:

| Dimension | Upgrade |
|---|---|
| Demo | Show the current state vs next state: what is already live today and what comes after. |
| PMF | Tie roadmap to design partner feedback: connectors, permissions, shared views. |
| Tech | Name the production hardening path: connectors, RBAC, audit logs, warehouse support. |
| Innovation | Roadmap should extend the metric library concept, not just add generic SaaS features. |
| Business | Turn roadmap into milestones toward pilots and revenue. |
| Presentation | Use this slide only if it sharpens the closing ask; otherwise merge into final CTA. |

Recommended replacement if keeping 9 slides:

- Title: `From hackathon demo to pilot-ready analytics workspace.`
- Three milestones:
  1. `Now: live deployed demo, SQL-safe agent, KPI dashboard, saved metrics.`
  2. `Next 2 weeks: Postgres/MySQL connector, workspace setup, user testing with 3 teams.`
  3. `Pilot: shared metric library, permissions, audit logs, recurring operating reports.`
- Bottom: `Commercial path: team subscription + data-source connectors + enterprise governance.`

Recommended action if compressing to 8 slides:

- Delete this as a standalone slide.
- Move the strongest roadmap bullets into the final CTA:
  - `Looking for 3 design partners`
  - `Production priorities: connectors, permissions, audit logs`
  - `Pilot target: ecommerce/ops teams with weekly reporting backlog`

### Slide 9: CTA

Current content:

- QueryForge.
- "Let business teams ask for data directly while analysts own the reusable metrics."
- Live demo URL and GitHub.
- Built at ClawHunt in 72 hours with Kimi K2.7 Code.

What is missing:

- No clear ask.
- No QR code.
- No pilot/design partner language.
- No recap of the scoring proof: live product, dataset, SQL safety, metric reuse.
- No mention of ClawHunt bonus actions if completed: platform listing and 游园展示 / user testing.
- No memorable closing line.

What would raise scores:

| Dimension | Upgrade |
|---|---|
| Demo | Invite judges to try the exact prompts; include QR. |
| PMF | Ask for design partners with frequent analyst-request bottlenecks. |
| Tech | Repeat one trust proof: SQL-safe, read-only, self-correcting agent. |
| Innovation | Close on reusable metrics, not natural-language querying. |
| Business | Ask for pilots/intros and state the first target customer. |
| Presentation | End with a crisp line that judges can repeat. |

Recommended rewrite:

- Title: `Help us validate the next self-service analytics workflow.`
- Three ask cards:
  1. `Judges: try the live demo now`
     - QR + URL
     - prompts: regional trend, category margin, repeat buyers
  2. `Design partners: ecommerce/ops teams with recurring reporting queues`
     - goal: validate weekly workflows and saved metric library
  3. `Technical feedback: connectors, permissions, audit logs, production safety`
     - goal: make it enterprise-ready
- Closing line:
  - `Analysts define the truth. Business teams move on it.`

## Concrete Content To Add From The Existing Product

The deck should use facts already visible in the codebase and docs:

- Hosted demo: `queryforge-production-8d6f.up.railway.app`
- Model: Kimi K2.7 Code
- Demo data: 10K orders, 25K order items, 500 products, 1,000 users, 8 regions, 20 categories
- Product UI: KPI row, dashboard panels, chat/query surface, metric sidebar
- Demo prompts:
  - `各地区月度销售额趋势`
  - `哪个品类利润率最高？`
  - `Top 10 畅销商品`
  - `复购率最高的用户是谁？`
- Technical safety:
  - single `SELECT` statement only
  - SQL parser validation
  - read-only SQLite connection
  - automatic `LIMIT 500`
  - 30s timeout
  - cached fallback for known demo prompts
  - self-correction loop on SQL failure
- Business framing:
  - analysts define metrics and govern formulas
  - business users self-serve recurring questions
  - saved metrics turn one-off questions into reusable team knowledge

## Recommended 5-Minute Pitch Timing

The deck should support the demo, not compete with it.

| Time | Material | Goal |
|---:|---|---|
| 0:00-0:20 | Slide 1 | One-line thesis and target user. |
| 0:20-0:50 | Slide 2 | Concrete pain and business stakes. |
| 0:50-1:15 | Slide 3 | Product shift: analyst-owned metrics, business self-service. |
| 1:15-3:45 | Live demo using slide 4 storyboard | Win Demo points. Show complete loop. |
| 3:45-4:10 | Slide 5 | Prove data scope and outputs. |
| 4:10-4:35 | Slide 6 | Prove tech/innovation: safety, agent loop, reusable metrics. |
| 4:35-4:50 | Slide 7 | Business wedge and pricing hypothesis. |
| 4:50-5:00 | Slide 8 | Ask + QR + closing line. |

## High-Priority Edits Before Submission

1. Fix deck count and flow.
   - Decide whether the final deck is 8 or 9 slides.
   - If 8, merge current slides 8 and 9.
   - Restore the missing "dual value" idea inside slide 6.

2. Replace generic feature description with demo proof.
   - Add exact live prompts.
   - Add expected outputs.
   - Show complete loop: query, chart, save, rerun.

3. Add a technical trust slide.
   - Use architecture/safety pipeline.
   - Show SQL validation, read-only DB, timeout, fallback, and self-correction.

4. Add business model and wedge.
   - Target ecommerce/retail ops first.
   - Buyer/user distinction.
   - Pricing hypothesis and expansion path.

5. Add PMF evidence if any exists.
   - Hackathon user testing count.
   - Quotes.
   - Observed repeated questions.
   - ClawHunt platform listing and 游园展示 participation if completed.

6. Rewrite titles as claims.
   - Avoid labels like "Product Demo", "Use Cases", "CTA."
   - Use claim titles that still make sense if a judge only sees the slide thumbnail.

## Stronger Claim Titles

Use these or adapt them:

1. `QueryForge turns analyst ticket queues into self-service business answers.`
2. `Business questions move faster than analytics queues.`
3. `Analysts define the truth once; business teams reuse it every day.`
4. `The live demo shows a complete loop: ask, chart, save, rerun.`
5. `The product is tested on a realistic commerce operating dataset.`
6. `The agent is constrained for business use, not just prompted for SQL.`
7. `Ecommerce operations is the first wedge; team analytics is the expansion.`
8. `We are looking for design partners with recurring analytics bottlenecks.`

## Judge Q&A Prep The Deck Should Anticipate

The final deck should make these answers easy:

| Likely Judge Question | Best Answer To Prepare |
|---|---|
| Why not just use ChatGPT? | ChatGPT is not connected to approved company data, does not enforce SQL safety, and does not create reusable team metric definitions. QueryForge connects to the DB, validates SQL, renders charts, and saves metrics for reuse. |
| Why not Tableau/Power BI Q&A? | BI dashboards are strong for fixed reporting. QueryForge targets ad hoc operating questions and follow-up exploration over analyst-approved metric context. |
| How do you prevent dangerous queries? | Single SELECT only, SQL parser validation, read-only DB connection, automatic LIMIT, and production roadmap for permissions/audit logs. |
| Is the data real? | It is realistic demo ecommerce data: 10K orders, 25K items, 500 products, 1,000 users, 8 regions, 20 categories. Do not imply external customer data unless validated. |
| Who pays? | First wedge: ecommerce/retail ops or growth teams with frequent reporting queues. Buyer is Head of Data/Ops; users are analysts and business stakeholders. Team SaaS with paid setup/connectors is the initial model. |
| What is innovative? | The reusable metric library and SQL-safe agent loop turn one-off natural-language questions into governed self-service analytics, not just generated SQL. |

## Expected Score Impact If Rebuilt

This is not a guarantee, but it is the likely direction if the product demo works live:

| Dimension | Current Deck Risk | Improved Deck Potential |
|---|---|---|
| Demo / 25 | Demo path underexplained; screenshots carry too much weight. | Strong if live storyboard and complete loop are shown. |
| PMF / 20 | Pain is plausible but generic. | Stronger with persona, quantified workflow, and user-testing signal. |
| Tech / 20 | Real technical work is hidden. | Stronger with safety/architecture pipeline and self-correction proof. |
| Innovation / 15 | Risks being judged as Text2SQL. | Stronger with metric-library/governed-self-service framing. |
| Business / 10 | Currently thin. | Much stronger with wedge, buyer, pricing hypothesis, expansion path. |
| Presentation / 10 | Clear but not yet memorable. | Strong if slides become claim/proof/story beats and support the live demo. |

The fastest path to a higher-scoring pitch is not adding more slides. It is making each slide carry one scoring job and replacing generic product description with concrete proof: live workflow, specific user pain, technical trust, differentiated metric reuse, and a credible business wedge.

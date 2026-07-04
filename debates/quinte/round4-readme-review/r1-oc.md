# R1 — README, About & Technical Tags Review (opencode)

---

## Q1: README Content Audit

### Missing

1. **No hero tagline.** The SVG logo has no accompanying one-liner. Judges landing on the repo see an image and three links — no context. Add a single sentence under the hero: what it is, who it's for, what makes it different.

2. **No live demo screenshot/GIF.** README.md line 8 links to a live demo but shows zero visual proof. A screenshot of the dashboard + a chat query result would immediately prove "现场可用."

3. **No data schema overview.** After the Olist migration, judges need to see what tables/columns exist. A compact schema diagram or table listing the 7-8 key tables (orders, products, customers, payments, reviews, sellers, geolocation, categories) with row counts would signal real engineering, not a toy demo.

4. **No benchmark/accuracy numbers.** The QUINTE section (line 58-66) mentions issues were found and fixed, but gives zero metrics. "SQL injection gaps found: 3, fixed: 3" is more credible than vague prose. Consider a small table of audit findings + resolution status.

5. **No comparison table vs. competitors.** Vanna.ai, BlazeSQL, Wren AI are the obvious comparators. A 3-row table showing QueryForge's advantages (schema-only exposure, analyst metric library, self-correction) would make differentiation instant.

### Present but Unnecessary/Distracting

1. **使用场景 (lines 130-138).** Four generic use-case paragraphs that say nothing specific to QueryForge. Every BI tool claims "电商运营, 销售管理, 财务分析, 产品分析." Cut this section entirely or replace with one real example backed by a screenshot.

2. **演示示例 (lines 140-152).** Five bullet questions are not a demo. Either embed a GIF/video of an actual query flow, or cut. Questions alone don't prove the product works.

3. **macOS 桌面版 (lines 154-163).** This is a niche deliverable that dilutes the core message. Judges evaluating a text-to-SQL agent don't need a SwiftUI wrapper pitch. Move to a separate doc or fold into 快速开始 with one line.

4. **项目结构 (lines 93-120).** A full directory tree in the README is noise for judges. Replace with a 3-line architecture summary and link to a CONTRIBUTING.md or ARCHITECTURE.md for details.

### Incorrect/Outdated

1. **Line 106: "33K 商品" vs task context "74 categories."** The README says 33K products but the task context says 74 categories. Verify which is correct — likely both, but the README should say "33K products across 74 categories" to match the Olist dataset accurately.

2. **Line 56: "node-sql-parser 实现 AST 级 SQL 安全校验."** Verify this dependency actually exists in package.json. If it was replaced during migration, update accordingly.

3. **Line 170: "Codex (OpenAI GPT-5.5)" in Acknowledgments.** This is a potential liability — judges may view it as "AI wrote the code." Consider removing or rewording to "Architecture review assistance."

### Weak Positioning vs. Competitors

- The README never mentions text-to-SQL competitors. The "分析师预设指标库" differentiator (line 38) is buried in a feature list. It should be front-and-center as the key architectural insight: unlike Vanna.ai (vector similarity over DDL) or Wren AI (semantic layer), QueryForge lets analysts curate metric definitions that constrain LLM output — reducing hallucination by design.

---

## Q2: GitHub About Section

**Recommended About text (119 chars):**

> Text-to-SQL agent for business teams — analyst-curated metrics, self-correcting queries, schema-only LLM exposure

**Recommended topics/tags:**

```
text-to-sql, data-analysis, natural-language-query, nextjs, sqlite, vercel-ai-sdk, ai-agent, business-intelligence, kimik2, olist-dataset
```

---

## Q3: Technical Tags & Positioning

**Keywords that must appear in the README:**

| Keyword | Why |
|---|---|
| text-to-SQL | Core category — judges will search for this |
| self-correction / auto-retry | Differentiator vs. one-shot generators |
| schema-only LLM exposure | Security differentiator — LLM never sees raw data |
| analyst-defined metric library | Core differentiator — not in Vanna/Blaze/Wren |
| AST-level SQL validation | Technical maturity signal |
| read-only database access | Security posture |
| streaming response | UX quality signal |
| Olist dataset (99K orders) | Real data, not synthetic — credibility |

**Differentiators to emphasize:**

- **vs. Vanna.ai:** No training data needed. Metric library replaces vector similarity over DDL.
- **vs. BlazeSQL:** Open-source, schema-only (BlazeSQL sends data to cloud APIs).
- **vs. Wren AI:** Self-correcting queries + analyst-curated metrics vs. static semantic layer.

---

## Q4: What to Cut / Merge / Rewrite

| Section | Verdict | Reason |
|---|---|---|
| 解决什么问题 | **Keep, tighten** | Good pain-point framing. Cut from 6 lines to 3. |
| 产品能力 | **Rewrite** | Too long, too generic. Group into 3 categories: Query, Dashboard, Safety. Each gets one line. |
| 工作原理 | **Keep, add diagram** | The ASCII flow is fine but add a real architecture diagram (SVG). |
| QUINTE 对抗审查 | **Keep, add metrics** | Needs a findings table: issue, severity, status. Vague claims hurt credibility. |
| 技术路线 | **Keep as-is** | Good. Clean table. |
| 快速开始 | **Keep as-is** | Essential for judges who want to run it. |
| 项目结构 | **Cut from README** | Move to ARCHITECTURE.md. Replace with 3-line summary. |
| 安全机制 | **Merge into 产品能力** | Security is a feature, not a standalone section. |
| 使用场景 | **Cut entirely** | Generic filler. Replace with one real walkthrough + screenshot. |
| 演示示例 | **Replace with live demo embed** | Show, don't tell. Embed a GIF or link to a video walkthrough. |
| macOS 桌面版 | **Cut from README** | Move to separate docs/DESKTOP.md. One line + link in 快速开始. |
| Acknowledgments | **Keep, reword Codex line** | Remove "GPT-5.5" specificity to avoid "AI-built" perception. |
| License | **Keep** | MIT is fine. |

---

## Q5: One-Liner Positioning

> **QueryForge is an open-source text-to-SQL agent that lets business users query real data in natural language, using analyst-curated metric definitions to constrain LLM output — eliminating hallucination at the architecture level, not the prompt level.**

This captures: what it is (text-to-SQL agent), who it's for (business users), the key technical differentiator (metric library as architectural constraint), and the credibility signal (real data, open-source, audited).

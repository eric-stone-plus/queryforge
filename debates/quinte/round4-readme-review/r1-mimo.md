QUINTE R1 — README Review (MiMo)
==================================

## Q1: README Content Audit

### Missing — Must Add

1. **No hero screenshot/GIF of the actual product.** `assets/hero.svg` is a logo, not a product shot. Judges need to see the dashboard + chat in 3 seconds. Add a real screenshot or animated GIF right after the hero.

2. **No "one-glance" feature summary.** The 产品能力 section is prose-heavy. Judges skim — a 2-column feature table or badge row (e.g. `Natural Language → SQL` · `Live Dashboard` · `Auto Error Recovery` · `Metric Library`) scans in 2 seconds.

3. **No data scale callout.** "99K orders" is buried in 项目结构 line 106. This is a credibility signal — surface it early (subtitle or hero badge): *"Powered by real Brazilian e-commerce data — 99K orders, 96K users, 74 categories."*

4. **No "How it's different" section.** Judges will compare to Vanna.ai / BlazeSQL / Wren AI. There's nothing that explicitly says "here's why we're not just another text-to-SQL wrapper." The analyst-defined metric library + self-correction loop + schema-only LLM exposure is the differentiator — make it a dedicated 3-bullet section.

5. **No performance/reliability metrics.** Judges want to know: What's the query success rate? Average response time? Self-correction hit rate? Even approximate numbers ("95%+ query success with auto-retry") add credibility.

6. **No architecture diagram.** The ASCII flow in 工作原理 is functional but low-fidelity. A clean SVG/PNG architecture diagram (frontend → API → LLM → SQLite → chart) would signal engineering maturity.

### Present but Distracting — Should Cut or Move

1. **macOS 桌面版 (lines 154–163)** — This is a WebView wrapper, not a native feature. It distracts from the core product and signals scope creep. Move to a separate `docs/DESKTOP.md` or cut entirely. One line in 快速开始 linking to releases is enough.

2. **使用场景 (lines 131–138)** — Generic and adds nothing. "电商运营查询销量" is obvious. Cut this section; the 演示示例 already covers use cases concretely.

3. **演示示例 (lines 140–153)** — The 5 example questions are good but redundant with 使用场景. Merge into one "Try It" section with the live demo link + 3 example queries. Cut the desktop download link here (already in header).

4. **Acknowledgments line 170** — "Product Engineering Review: Codex (OpenAI GPT-5.5)" is a flex that may backfire — judges may wonder how much was AI-generated vs. human-built. Consider removing or rewording to "Quality tooling: QUINTE protocol."

### Incorrect or Outdated

1. **Line 56: "Kimi K2.7 Code 大模型负责语义理解"** — The task says the model is K2.7, but verify this is the actual deployed model name. If the API model string is `kimi-for-coding` (line 87), the README should match exactly to avoid confusion.

2. **Line 74: "Kimi K2.7 Code · Vercel AI SDK · 智能纠错"** — "智能纠错" is a feature, not a technology. Replace with the actual mechanism: "node-sql-parser AST validation" or "auto-retry with error diagnosis."

3. **Line 106: "Olist 巴西电商数据（99K 订单 · 96K 用户 · 33K 商品）"** — The task says "74 categories" but the README says "33K 商品." Verify which is correct and include categories if accurate.

### Weak Positioning

The README reads like a feature list for a course project, not a competition entry. It lacks:
- A clear "why us, not them" statement
- Any mention of production-readiness (error handling, rate limiting, monitoring)
- Evidence of engineering depth (the QUINTE section is vague about what was actually found/fixed)

---

## Q2: GitHub About Section

**About description (~120 chars):**
```
Text-to-SQL agent for business analysts. Natural language → dashboards, anomaly detection & decision insights. Real data.
```

**Topics/tags:**
```
text-to-sql, natural-language-processing, data-analytics, nextjs, vercel-ai-sdk, sqlite, kimi, business-intelligence, dashboard, self-correction, sql-generation
```

---

## Q3: Technical Tags & Positioning

**Keywords for judges (insert naturally into README):**

| Signal | Where to use |
|--------|-------------|
| `text-to-SQL` | Hero subtitle, 技术路线 |
| `self-correcting query engine` | 产品能力 → 智能纠错 |
| `metric library / governed metrics` | 产品能力 → 分析师预设指标库 |
| `schema-only LLM exposure` | New "Differentiation" section |
| `AST-level SQL validation` | 技术路线, 安全机制 |
| `real dataset (99K orders)` | Hero badge |
| `streaming response` | 工作原理 |
| `zero-shot natural language` | 解决什么问题 |

**Differentiation vs. competitors:**

| Competitor | Their weakness | QueryForge's edge |
|-----------|---------------|-------------------|
| Vanna.ai | No metric governance, raw SQL to LLM | Analyst-defined metric library, schema-only exposure |
| BlazeSQL | Desktop-only, no self-correction | Cloud + auto-retry with error diagnosis |
| Wren AI | No anomaly detection, no decision layer | Full pipeline: query → viz → anomaly → recommendation |

---

## Q4: What to Cut / Merge / Rewrite

| Section | Action | Rationale |
|---------|--------|-----------|
| 解决什么问题 | **Keep, tighten** | Good pain point framing. Cut from 4 bullets to 2. Remove "80/20" cliché. |
| 产品能力 | **Rewrite as feature grid** | Current prose is unreadable for skimmers. Convert to 2-col table or badge row. |
| 工作原理 | **Replace ASCII with diagram** | The ASCII flow is low-signal. Replace with SVG architecture diagram. |
| QUINTE 对抗审查 | **Keep, add specifics** | Currently vague ("发现了问题，均已修复"). List 2-3 concrete findings with before/after. |
| 技术路线 | **Keep as-is** | Clean table, good for judges. Minor fix: replace "智能纠错" with actual tech. |
| 快速开始 | **Keep, tighten** | Good. Remove macOS desktop mention from this section. |
| 项目结构 | **Cut to essentials** | Judges don't need the full tree. Show only `src/` + `data/` + `debates/`. Move full tree to docs. |
| 安全机制 | **Merge into 技术路线** | 5 bullets is too much standalone. Merge as a "Security" row in the tech table, or keep as 2 bullets. |
| 使用场景 | **Cut entirely** | Generic. 演示示例 covers this better. |
| 演示示例 | **Merge into header** | Move 3 examples + demo link into a "Try It Now" callout below the hero. |
| macOS 桌面版 | **Cut from README** | Move to `docs/DESKTOP.md`. One line in header is enough. |
| Acknowledgments | **Keep, reword** | Remove Codex reference. Keep Olist + Kimi + QUINTE. |

---

## Q5: One-Liner Positioning

**Proposed positioning statement:**

> QueryForge is a self-correcting text-to-SQL agent that lets business teams query real data in natural language — with analyst-governed metrics, AST-level SQL validation, and a full anomaly-to-recommendation pipeline, validated through 5-party adversarial QA.

**Why this works for judges:**
- "Self-correcting" → engineering depth
- "Analyst-governed metrics" → differentiator vs. Vanna.ai/BlazeSQL
- "AST-level SQL validation" → technical credibility
- "Anomaly-to-recommendation pipeline" → not just a SQL generator
- "5-party adversarial QA" → process maturity signal

---

## Summary of Recommended Changes (Priority Order)

1. **Add product screenshot/GIF** after hero — biggest visual gap
2. **Add "Why QueryForge" section** with 3-bullet differentiation
3. **Cut 使用场景, macOS 桌面版** — distractions
4. **Rewrite 产品能力 as feature grid** — skimmability
5. **Surface data scale** in hero subtitle
6. **Add concrete QUINTE findings** — credibility
7. **Fix 技术路线** "智能纠错" → actual tech name
8. **Tighten 解决什么问题** to 2 bullets

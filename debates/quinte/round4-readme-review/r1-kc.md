# KC — README, About & Technical Tags Review

## Q1: README Content Audit

### Missing

1. **No "badges" or social proof at the top.** Judges scan the first 3 lines. Add:
   - Live demo badge (Railway uptime)
   - A "99K real orders" callout near the hero image — this is the single biggest proof of credibility post-migration and it's buried in the project structure section (line 106).
   - A one-line "Built for ClawHunt Builder Camp 2026" banner — judges need context immediately.

2. **No architecture diagram or screenshot.** The hero SVG is decorative. Judges need to see the actual product — a single screenshot of the dashboard + chat panel would do more than the entire "产品能力" section.

3. **No "Quick Demo" GIF or video link.** The live demo URL is there (line 150) but no 15-second GIF showing the end-to-end flow (ask question → get chart). For a "Demo现场可用 (25分)" criterion, this is critical.

4. **No competitor comparison.** The task explicitly asks about Vanna.ai, BlazeSQL, Wren AI. The README doesn't mention them or explain differentiation. Even a 3-row table would be powerful:
   | Feature | QueryForge | Vanna.ai | BlazeSQL | Wren AI |
   |---|---|---|---|---|
   | Analyst-defined metric library | ✅ | ❌ | ❌ | ❌ |
   | Self-correction with audit trail | ✅ | ❌ | ❌ | ❌ |
   | Schema-only LLM exposure | ✅ | ❌ | ❌ | ❌ |

5. **No data model / schema overview.** After the Olist migration, judges need to see what tables exist and how they relate. A small ER diagram or table list would prove the data is real and the system is grounded.

6. **No mention of the QUINTE audit results.** Line 66 says "均已修复" but doesn't cite specific improvements (e.g., "reduced SQL injection surface from 3 vectors to 0", "query success rate improved from X% to Y%"). Concrete metrics matter.

### Present but unnecessary or distracting

1. **"使用场景" section (lines 130-138).** Generic scenario descriptions ("电商运营", "销售管理", "财务分析", "产品分析") that apply to any BI tool. These dilute the positioning. Cut or replace with a single real user story from the Olist dataset.

2. **"macOS 桌面版" section (lines 154-163).** This is a sidebar feature, not a headline. It takes 10 lines and doesn't help the core pitch. Merge into a single line in the tech stack table: `| 部署 | Railway 云端 · macOS 桌面版（SwiftUI + WebView） |`.

3. **"演示示例" section (lines 140-152).** The example queries are useful but the section is formatted as a list. Replace with a live query box or screenshot that shows the actual interaction.

4. **"项目结构" section (lines 93-120).** Useful for developers but judges don't care about file paths. Move to a `CONTRIBUTING.md` or collapse into a `<details>` block.

5. **"Acknowledgments" section (lines 165-170).** The Codex (OpenAI GPT-5.5) line is noise — it doesn't add credibility and may confuse judges about who built what. Keep only Olist and Kimi.

### Incorrect or outdated after Olist migration

1. **Line 106**: `data/ecommerce.db # Olist 巴西电商数据（99K 订单 · 96K 用户 · 33K 商品）` — verify the exact counts. The Olist dataset has ~99K orders, ~96K customers, but ~33K products? The actual number is ~32K. Minor but judges may check.

2. **Line 56**: `核心技术：Kimi K2.7 Code 大模型负责语义理解` — is it K2.7 or K2? The model name should be precise. If it's `kimi-for-coding`, say that.

3. **Line 87**: `AI_MODEL=kimi-for-coding` — this is the API model ID, not "K2.7". Clarify in the README what the actual model is.

4. **Line 30**: "上个月销售额最高的 Top 10 商品" — does this query actually work on the Olist dataset? Olist doesn't have a `sales` column directly; it has `order_items` with `price`. Verify the example queries match the actual schema.

### Weak in positioning vs. competitors

- The README talks about features but never answers "why not just use ChatGPT + a database connector?" or "why not Vanna.ai?" The QUINTE audit and analyst-defined metric library are the two differentiators — they need to be front and center, not buried.

---

## Q2: GitHub About Section

**About description** (120 chars max):

```
Text-to-SQL agent for business teams — analyst-defined metrics, self-correction, 99K real orders. Built for ClawHunt.
```

(118 chars)

**Topics/tags:**

```
text-to-sql, data-analysis, ai-agent, nextjs, kimi, vercel-ai-sdk, sqlite, business-intelligence, self-correction, clawhunt-2026
```

---

## Q3: Technical Tags & Positioning

### Keywords for discoverability

| Priority | Keyword | Why |
|---|---|---|
| High | `text-to-sql` | Core category — judges will search this |
| High | `self-correction` | Differentiator — most agents fail silently |
| High | `analyst-defined metrics` | Unique — no competitor does this |
| High | `schema-only LLM exposure` | Security signal — mature engineering |
| Medium | `natural language data analysis` | Broader category |
| Medium | `real dataset` | Proof of credibility (not synthetic) |
| Medium | `AST-level SQL validation` | Technical depth signal |
| Low | `business intelligence` | Generic but needed for search |
| Low | `data agent` | Emerging category term |

### Differentiation from competitors

- **Vanna.ai**: Open-source, trains on your schema, but no metric library, no self-correction audit trail, no security hardening. QueryForge is opinionated; Vanna is a framework.
- **BlazeSQL**: Desktop app, good UX, but closed-source, no analyst workflow, no QUINTE audit. QueryForge is open-source + audited.
- **Wren AI**: Semantic layer approach, but complex setup. QueryForge is "clone and run in 60 seconds."

### Terms that signal maturity (not buzzwords)

- ✅ "AST-level SQL validation" (not "AI-powered security")
- ✅ "read-only database connection" (not "zero-trust architecture")
- ✅ "self-correction with audit trail" (not "intelligent error handling")
- ✅ "analyst-defined metric library" (not "smart metrics engine")
- ✅ "schema-only LLM exposure" (not "privacy-first AI")

---

## Q4: What to Cut

### Cut entirely

| Section | Reason |
|---|---|
| **使用场景** (lines 130-138) | Generic filler. Replace with 1 real query walkthrough from Olist data. |
| **演示示例** (lines 140-152) | Merge the live demo link into the hero area. Cut the query list — it's not a tutorial. |

### Merge

| Section | Merge into |
|---|---|
| **macOS 桌面版** (lines 154-163) | Single row in 技术路线 table |
| **安全机制** (lines 122-128) | Fold into 工作原理 — security is part of how it works, not a separate section |
| **项目结构** (lines 93-120) | `<details>` collapse or move to CONTRIBUTING.md |

### Rewrite

| Section | Current | Proposed |
|---|---|---|
| **解决什么问题** (lines 15-26) | Good pain points, but the solution line is too long. Split into problem (3 bullets) + solution (1 sentence). |
| **产品能力** (lines 28-40) | 6 features in paragraph form. Rewrite as a 2-column feature grid with icons. Judges skim — walls of text are death. |
| **QUINTE 对抗审查** (lines 58-66) | Vague ("均已修复"). Add specific metrics: what was found, what was fixed, what improved. |
| **技术路线** (lines 68-77) | Fine, but add the data layer explicitly (Olist schema, 74 categories). |

### Keep as-is

- **快速开始** (lines 79-91) — essential for judges to try it
- **工作原理** (lines 42-56) — good, but merge security into it
- **License** — MIT, fine

---

## Q5: One-Liner Positioning

> **QueryForge is an open-source text-to-SQL agent that lets business teams query real data in natural language — powered by an analyst-defined metric library, self-correction with audit trail, and schema-only LLM exposure, validated through a 5-party adversarial audit on 99K real e-commerce orders.**

(298 chars — for the README opening paragraph, not the About line)

**Shorter version for judges (under 150 chars):**

> Open-source text-to-SQL agent with analyst-defined metrics, self-correction, and real-data validation. Audited by QUINTE 5-party protocol.

(143 chars)

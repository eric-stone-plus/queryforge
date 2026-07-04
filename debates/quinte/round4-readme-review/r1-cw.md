# QUINTE R1 — README Review (CodeWhale)

**Reviewed file:** `README.md`
**Scoring lens:** ClawHunt Builder Camp 2026, Demo Day rubric (100 + 5)
**Prior baseline:** `docs/readme-score-review.md` scored 71/100. This review builds on that baseline with line-specific fixes.

---

## Q1: README Content Audit

### Missing — Must Add

**1. No visual evidence.** The README has zero screenshots, GIF, or demo video. For a hackathon where "现场演示优先于截图/描述" (Demo rubric item 1), a README with no visual proof of a working product is a credibility gap. Judges skim 20+ projects — a README that looks like a spec doc loses to one that shows a running product.

- **Fix:** Add a `## 截图` section immediately after the hero image with 2-3 screenshots or a GIF showing: (a) the dashboard with real data, (b) a chat interaction with generated SQL + chart, (c) the metric sidebar.

**2. No demo script.** The `演示示例` section lists example questions but gives no expected output, no recommended walkthrough path, and no timing guidance. A judge trying the demo needs to know: "Ask this → expect to see this → notice this detail."

- **Fix:** Replace the flat question list with a structured 60-second demo path:

```
## 60 秒体验

1. 打开演示 → 看到 8 个实时指标看板（GMV、订单量、客单价等）
2. 在对话框输入：「上个月销售额最高的 Top 10 品类」
   → 系统生成 SQL → 流式展示思考过程 → 返回柱状图 + 分析
3. 点击左侧指标库「复购率」
   → 自动查询 → 返回图表 + 决策建议
4. 输入一个错误查询测试纠错：「查询不存在的表」
   → 系统自动诊断 → 修正 → 重试成功
```

**3. No differentiation argument.** The README describes what QueryForge does but never says why it's better than Vanna.ai, BlazeSQL, Wren AI, or even ChatGPT + CSV. The `创新性` score (15 分) depends on this. The prior review (docs/readme-score-review.md) flagged this at 9/15.

- **Fix:** Add a `## 与同类工具对比` section (see Q4 for placement).

**4. No business framing.** No market size, no buyer persona, no pricing hypothesis. The `商业潜力` score (10 分) is currently near zero on the README alone. Even one paragraph helps.

- **Fix:** Add a brief `## 商业方向` section (see Q4).

**5. Dataset stats are buried.** The Olist dataset (99K orders, 96K users) is the proof that this runs on real data — not a toy demo. It's currently hidden in `项目结构` as a code comment. Move it up.

- **Fix:** Add a stat line near the top: `> 基于 Olist 巴西电商真实数据集：99,000 笔订单 · 96,000 名用户 · 74 个品类`

**6. No "why now" framing.** Judges see many AI projects. The README doesn't argue why AI agents in analytics matter *now* (LLM cost drop, structured output maturity, enterprise AI adoption wave).

### Present — Should Cut or Rewrite

**1. `使用场景` section — CUT entirely.** Four generic paragraphs (电商运营, 销售管理, 财务分析, 产品分析) that could describe any BI tool. They add zero signal for judges and consume vertical scroll space. Every sentence here is replaceable with "适用于需要数据的团队" — which means none of them earns their place.

- **Fix:** Delete the section. Fold the one useful insight (who the buyer is) into the new `商业方向` section.

**2. `macOS 桌面版` section — CUT to one line.** Currently 8 lines + a download link. This is a hackathon, not a product launch. The desktop app is a WebView wrapper (per line: "内嵌 WebView 加载网页版") — it adds polish but should not eat README real estate.

- **Fix:** Merge into the links bar at the top. One line: `> 也提供 macOS 桌面版（SwiftUI + WebView），下载见 Releases`

**3. `项目结构` section — CUT or move to bottom.** This is developer-facing content. Judges don't need a file tree. Keep it as a collapsed `<details>` block or move it below the fold.

- **Fix:** Wrap in `<details><summary>项目结构</summary>...</details>` or move to a `CONTRIBUTING.md`.

**4. `安全机制` section — MERGE into `技术路线`.** The current `安全机制` section duplicates information that belongs in the tech stack context. The items (read-only access, row limits, env vars, self-correction) are implementation details, not product features.

- **Fix:** Add a `安全` row to the `技术路线` table: `只读 SELECT · AST 校验 · 行数限制 · 环境变量注入`

**5. `工作原理` diagram — SIMPLIFY.** The current ASCII flow is 6 lines of arrows. It's clear but verbose. Judges want the idea in 3 seconds.

- **Fix:** Compress to: `提问 → AI 生成 SQL → 安全校验 → 查询 → 可视图 + 分析 + 建议` (one line)

### Incorrect or Outdated

**1. "33K 商品" may be wrong.** The Olist products dataset has ~33K rows, but the README says "33K 商品" in the project structure. This needs verification against the actual seeded data. If the translation table maps fewer categories, the stat should reflect that.

- **Fix:** Verify with a query against `ecommerce.db`. The Olist dataset actually has 32,951 products — "33K" is acceptable but "74 个品类" should be verified too.

**2. `智能纠错` appears twice.** Once in `产品能力` and once in `安全机制`. The second occurrence ("查询出错时系统自动修正并重试，不会将原始错误信息暴露给用户") conflates error correction with information hiding — these are different concerns.

- **Fix:** Keep `智能纠错` only in `产品能力`. In `安全机制`, replace with: "错误信息不暴露系统内部细节" (information hiding as a security property, not a feature).

**3. The `核心技术` line in `工作原理` is a run-on.** "Kimi K2.7 Code 大模型负责语义理解，Vercel AI SDK 实现流式响应，better-sqlite3 提供安全的数据库访问，node-sql-parser 实现 AST 级 SQL 安全校验，智能纠错机制确保查询成功率" — this is a comma-spliced list that's hard to parse.

- **Fix:** Move to the `技术路线` table (already exists) and delete the paragraph. The table does this job better.

### Weak in Positioning

**1. The opening problem statement is generic.** "业务侧反复提同样的取数需求" could describe any analytics tool. It doesn't name QueryForge's specific angle: governed self-service through analyst-defined metrics.

- **Fix:** Rewrite `解决什么问题` to lead with the analyst-as-architect angle:

```
## 解决什么问题

传统模式：业务提需求 → 分析师写 SQL → 排期 1-3 天 → 交付
QueryForge 模式：分析师定义指标口径 → 业务用自然语言自助查询 → 秒级返回

分析师从"取数工具人"变成"数据架构师"。
```

**2. The `产品能力` section is a flat feature list.** Six bold items with em-dashes. No hierarchy, no "hero feature" callout. Judges will skim and see a wall of text.

- **Fix:** Lead with the differentiator (分析师预设指标库), then group the rest into "核心能力" (NL query, charts, analysis) and "智能能力" (self-correction, suggestions).

---

## Q2: GitHub About Section

**Recommended description (~120 chars):**

```
自然语言取数 + 分析师指标库 + 智能纠错 | 基于真实电商数据 | QUINTE 对抗审查
```

English fallback (~120 chars):

```
Text-to-SQL analytics agent with analyst-defined metrics, self-correction, and adversarial audit. Real e-commerce data.
```

**Recommended topics/tags:**

```
text-to-sql  natural-language  data-analytics  nextjs  sqlite  ai-agent
vercel-ai-sdk  kimi  hackathon  quinte  ecommerce  brazilian-ecommerce
```

Rationale: `text-to-sql` is the primary category judges will search. `ai-agent` signals the architecture. `hackathon` ties to the event. `quinte` is unique to this project. `brazilian-ecommerce` and `ecommerce` help discovery. Avoid buzzword tags like `llm` or `gpt` that don't differentiate.

---

## Q3: Technical Tags & Positioning

**Keywords that should appear in the README** (currently missing or underweighted):

| Keyword | Current status | Where to add |
|---|---|---|
| Text-to-SQL | Not mentioned anywhere | Opening description, 技术路线 |
| AST 级 SQL 校验 | Mentioned once in 工作原理 paragraph | Highlight in 安全机制 or new section |
| Schema-only LLM exposure | Not mentioned | Add to 技术路线 or differentiation |
| Agent loop / 自动纠错 | Mentioned but not as "agent" framing | Reframe as "AI Agent" in opening |
| 结构化输出 (structured output) | Not mentioned | Add to 技术路线 |
| 流式响应 (streaming) | Mentioned in 技术路线 table | Good, keep |
| 只读数据库 | Mentioned in 安全机制 | Good, keep |
| 指标治理 (metric governance) | Implicit but not named | Name it explicitly |

**Differentiation keywords** (what judges should associate with QueryForge vs. competitors):

- **分析师预设指标库** — this is the #1 differentiator. No competitor has this. Name it prominently.
- **指标口径统一** — the governance angle. Differentiates from "dump your CSV into ChatGPT."
- **自动纠错** — real agent behavior, not just a chat wrapper.
- **AST 级校验** — technical maturity signal. Shows this isn't naive string-matching SQL.

**What NOT to use:**

- Don't use "AI 驱动" or "大模型" alone — every hackathon project claims this.
- Don't use "颠覆" or "革命性" — judges tune these out.
- Don't claim "企业级" without evidence.

---

## Q4: What to Cut, Merge, or Rewrite

### Proposed new README structure (ordered by judge skim priority):

```
1. Hero image + links bar (keep)
2. 一句话定位 (NEW — replaces 解决什么问题 as opener)
3. 真实数据 (NEW — one line with dataset stats)
4. 60 秒体验 (REPLACES 演示示例 — structured demo path)
5. 产品能力 (REWRITE — lead with differentiator, group features)
6. 与同类工具对比 (NEW — 3 defensible differentiators)
7. 技术路线 (MERGE 安全机制 into table)
8. QUINTE 对抗审查 (KEEP — shorten)
9. 商业方向 (NEW — target customer, market, pricing hypothesis)
10. 快速开始 (KEEP)
11. 项目结构 (MOVE to <details> collapsed block)
12. macOS 桌面版 (MERGE into links bar, one line)
13. Acknowledgments (KEEP)
14. License (KEEP)
```

### Section-by-section action:

| Current section | Action | Reason |
|---|---|---|
| 解决什么问题 | REWRITE | Too generic; rewrite with analyst-architect framing |
| 产品能力 | REWRITE | Flat list; lead with differentiator, group features |
| 工作原理 | SIMPLIFY to one-line flow | Verbose; table already covers tech |
| QUINTE 对抗审查 | SHORTEN | Mention P0 bugs found + fixed, link to debates/ |
| 技术路线 | MERGE 安全机制 | Add security row, delete separate section |
| 快速开始 | KEEP | Essential for developers |
| 项目结构 | COLLAPSE | Developer content, not judge-facing |
| 安全机制 | MERGE into 技术路线 | Redundant standalone section |
| 使用场景 | CUT | Generic filler, zero signal |
| 演示示例 | REPLACE with 60 秒体验 | Structured > flat list |
| macOS 桌面版 | MERGE into links bar | One line, not a section |
| Acknowledgments | KEEP | Credit is good |
| License | KEEP | MIT is fine |

### New sections to add:

**`一句话定位`** (top of README, below hero):
```
> QueryForge 是一个 Text-to-SQL 数据分析 Agent：分析师定义指标口径，业务用自然语言自助查询，秒级返回图表与决策建议。
```

**`与同类工具对比`:**
```
## 与同类工具对比

| | QueryForge | Vanna.ai / BlazeSQL | ChatGPT + CSV | BI 自然语言 |
|---|---|---|---|---|
| 指标治理 | ✅ 分析师预设指标库 | ❌ 无 | ❌ 无 | ⚠️ 有限 |
| SQL 安全 | ✅ AST 级校验 + 只读 | ⚠️ 基础 | ❌ 无校验 | ✅ 平台内置 |
| 自动纠错 | ✅ Agent 循环重试 | ⚠️ 单次 | ❌ 无 | ❌ 无 |
| 部署方式 | 云端 + 桌面 | 本地 | 无 | SaaS |
| 数据规模 | 真实 99K 订单 | Demo 数据 | 用户上传 | 企业数据 |
```

**`商业方向`:**
```
## 商业方向

**目标客户：** 中型电商、运营团队、数据分析团队（5-50 人规模）
**核心价值：** 将分析师 80% 的重复取数工作自动化，释放深度分析产能
**扩展路径：** SQLite 演示 → PostgreSQL/BigQuery 连接器 → 企业私有部署
**定价假设：** 按团队席位 + 数据源数量 SaaS 订阅
```

---

## Q5: One-Liner Positioning

> **QueryForge 是唯一一个让分析师预设指标口径、业务人员用自然语言自助查询的 Text-to-SQL Agent，基于 99K 真实订单数据验证，经 QUINTE 五方对抗审查。**

English:

> **QueryForge is the only text-to-SQL analytics agent where analysts pre-define metric definitions and business users self-serve with natural language — validated on 99K real orders and adversarial-audited through QUINTE.**

Why this works for judges:
- "唯一" (only) — claims differentiation (the metric library)
- "分析师预设指标口径" — names the specific innovation
- "业务人员用自然语言自助查询" — names the user and action
- "99K 真实订单" — proves it's not a toy
- "QUINTE 五方对抗审查" — signals quality rigor

---

## Priority Actions (Ranked by Score Impact)

1. **Add screenshots/GIF** — Demo score (25 分), lowest effort, highest impact
2. **Add 60 秒体验 section** — Demo score, replaces flat example list
3. **Add 与同类工具对比** — Innovation score (15 分), currently weakest
4. **Rewrite 解决什么问题** — User value score (20 分), sharpen the pain
5. **Add 商业方向** — Business potential score (10 分), easy points
6. **Cut 使用场景, merge macOS/安全机制/项目结构** — Presentation score (10 分), reduces clutter
7. **Add one-liner positioning at top** — All scores benefit from judge comprehension speed

---

## Estimated Score Impact

Prior review: **71 / 100**. If the above changes are made:

- Demo: 19 → 22-23 (screenshots + demo script)
- User Value: 14 → 17 (sharper pain, named personas)
- Tech: 17 → 19 (security merged, architecture clearer)
- Innovation: 9 → 13 (differentiation table, metric governance framing)
- Business: 5 → 8 (business section added)
- Presentation: 7 → 9 (structure cleaned, one-liner at top)

**Projected: ~88-89 / 100** — without changing the product itself.

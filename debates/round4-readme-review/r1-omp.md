# QUINTE R1 — README Review: QueryForge

Reviewer: omp  
Date: 2026-07-04

---

## Q1: Content Audit

### Missing

1. **No English anywhere.** The entire README is Chinese-only. For a competition with international judges or anyone outside the Chinese-speaking ecosystem, this is a wall. At minimum, add an English one-liner after the title and an English summary section (or a separate `README_EN.md` linked at top).

2. **No badge row.** Judges skim — a row of shields (deploy status, Next.js version, license, dataset size) communicates "this is real" in <2 seconds.

3. **No `.env.example` mention.** The quick-start block hardcodes env vars inline, but a `.env.example` exists at the repo root. The README should reference it:
   ```bash
   cp .env.example .env.local
   # Then edit .env.local with your key
   ```
   Current instructions (line 85–87) set `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` — but `.env.example` also documents `AI_PROVIDER_NAME` and `AI_TIMEOUT_MS`. Users following the README will miss these.

4. **No link to live demo screenshot/GIF.** The hero SVG is a logo, not a product screenshot. Judges who can't click the live demo (network, time) have zero visual proof. Add a screenshot or animated GIF showing a real query → chart flow.

5. **Schema API route undocumented.** `src/app/api/schema/route.ts` exists in the source tree but appears nowhere in the README's project structure (line 96–120) or feature descriptions.

### Present but Unnecessary/Distracting

6. **使用场景 (lines 130–138)** — Generic use-case paragraphs ("电商运营", "销售管理", "财务分析", "产品分析") that could describe any BI tool. This section adds ~400 characters of zero-signal content. **Cut entirely.** The 产品能力 section already covers what the product does; the demo examples (lines 140–148) show it concretely.

7. **演示示例 (lines 140–148)** — Redundant with the demo cache's actual queries. Five bullet points of example questions with no answers. Merge into 产品能力 as a sub-list, or cut — the live demo itself is the example.

8. **macOS 桌面版 (lines 154–163)** — A full section for a WebView wrapper. One bullet in the 技术路线 table's 部署 row already covers this. If the desktop app is important, give it a sub-section under 快速开始 with install instructions; if not, cut. Currently it's a standalone section that inflates the README for a secondary deliverable.

### Incorrect/Outdated

9. **Line 85–87 — env var names are WRONG for the actual codebase.** The README says:
   ```bash
   echo "AI_API_KEY=your_key" > .env.local
   echo "AI_BASE_URL=https://api.kimi.com/coding/v1" >> .env.local
   echo "AI_MODEL=kimi-for-coding" >> .env.local
   ```
   But `src/lib/agent.ts` line 6–13 checks `KIMI_API_KEY` **first**, then falls back to `AI_API_KEY`:
   ```typescript
   const AI_API_KEY = process.env.KIMI_API_KEY || process.env.AI_API_KEY || "";
   const AI_MODEL = process.env.KIMI_MODEL || process.env.AI_MODEL || "kimi-for-coding";
   ```
   The canonical env var names are `KIMI_API_KEY`, `KIMI_MODEL`, `KIMI_BASE_URL`. The README's `AI_*` names work but are the fallback path — confusing and inconsistent with `.env.example` which uses `AI_*`. Pick one convention and align all three: code, README, `.env.example`.

10. **Line 106 — "99K 订单 · 96K 用户 · 33K 商品"** — The task brief says "74 categories" but the README doesn't mention categories. Minor, but the data description should be complete: `99K orders · 96K users · 33K products · 74 categories`.

11. **Line 56 — "智能纠错机制确保查询成功率"** — The code (agent.ts lines 152–193) does a **single** retry, not a robust "mechanism." The 工作原理 diagram (line 53) says "修正 SQL → 重试查询" which implies one retry — consistent. But the prose overpromises. The self-correction is one-shot: first attempt → if fail, send error back to LLM → retry once → if fail again, throw. This is good engineering but calling it "智能纠错机制" without qualifying "single-retry" sets expectations the code doesn't meet.

12. **Line 12 — `@faker-js/faker` still in `package.json` dependencies.** The project migrated to real Olist data. This is dead weight that signals "unfinished migration" to anyone inspecting the repo.

### Weak Positioning

13. **No competitor mention or differentiation.** Vanna.ai, BlazeSQL, Wren AI are established text-to-SQL tools. The README never explains why QueryForge exists alongside them. The differentiator (analyst-defined metric library + schema-only LLM exposure + self-correction) is buried in feature descriptions rather than called out explicitly.

---

## Q2: GitHub About Section

**About description** (~120 chars):
```
AI data analyst for business teams. Natural language → SQL → charts. Analyst-defined metrics, self-correction, read-only.
```

**Topics/tags:**
```
text-to-sql, data-analysis, nextjs, ai-agent, sqlite, natural-language-query, kimik2, business-intelligence, vercel-ai-sdk, ecommerce-analytics
```

---

## Q3: Technical Tags & Positioning

Keywords the README should contain (currently missing or underemphasized):

| Keyword | Where it matters | Current status |
|---|---|---|
| `text-to-SQL` | Core category — judges search this | **Missing.** Never appears in README. |
| `schema-only LLM exposure` | Key differentiator — LLM never sees raw data | **Missing.** The security section (lines 122–128) lists "只读访问" but never mentions that the LLM only receives schema, not data. |
| `AST-level SQL validation` | Technical maturity signal — `node-sql-parser` parses SQL into AST before execution | Line 56 mentions it vaguely ("node-sql-parser 实现 AST 级 SQL 安全校验") — good, but should be in 安全机制 too. |
| `self-correction / retry` | Differentiator vs. Vanna.ai | Present but overpromises (see Q1 item 11). |
| `analyst-defined metric library` | Unique differentiator — no competitor does this | Present in 产品能力 (line 38) but not in the technical summary or positioning. |
| `streaming SSE` | Technical maturity — real-time progress | Missing. The API uses SSE (`text/event-stream` in route.ts line 41) but the README only says "流式进度推送" in the tech table. |
| `Olist dataset` | Credibility — real public dataset, not synthetic | Mentioned but not linked. Add a Kaggle link. |

---

## Q4: Sections to Cut, Merge, or Rewrite

| Section | Action | Rationale |
|---|---|---|
| 解决什么问题 (15–26) | **Keep, tighten.** Cut the bullet list to 2 items max. The punchline (line 24) is the real content; the bullets are padding. | |
| 产品能力 (28–40) | **Merge with 演示示例.** Add 2–3 example queries inline after each feature bullet. Cut the standalone 演示示例 section. | |
| 工作原理 (42–56) | **Rewrite.** The diagram is good. The prose (line 56) is a run-on sentence listing every tech. Split into: (1) diagram stays, (2) add "Key engineering decisions:" as a 3-bullet list covering schema-only exposure, AST validation, single-retry self-correction. | |
| QUINTE 对抗审查 (58–66) | **Keep, shorten.** Cut to 3 lines: what it is, what it found, where reports live. The current version is already close. | |
| 技术路线 (68–77) | **Keep as-is.** This table is clean and scannable. | |
| 快速开始 (79–91) | **Fix env vars** (see Q1 item 9). Add `cp .env.example .env.local` instruction. | |
| 项目结构 (93–120) | **Add `api/schema/route.ts`** to the listing. Otherwise keep. | |
| 安全机制 (122–128) | **Add AST validation and schema-only LLM exposure** as explicit bullets. Current list is generic ("只读访问", "返回条数限制") — good but incomplete. | |
| 使用场景 (130–138) | **Cut entirely.** Zero signal — any BI tool could claim these. | |
| 演示示例 (140–148) | **Merge into 产品能力** as inline examples. Cut standalone section. | |
| macOS 桌面版 (154–163) | **Merge into 技术路线 table** as a row, or into 快速开始 as a sub-section. Don't give it a standalone section. | |
| Acknowledgments (165–170) | **Keep.** Credit is good. | |

---

## Q5: One-Liner Positioning

> QueryForge is a text-to-SQL data agent that lets business teams query 99K orders of real e-commerce data in natural language — with analyst-defined metrics to prevent "口径混乱", AST-level SQL validation for safety, and self-correcting queries that retry on failure.

---

## Summary of Highest-Impact Changes

1. **Fix env var instructions** — currently wrong/misleading (Q1 item 9). This breaks the "quick start" experience.
2. **Remove `@faker-js/faker`** from `package.json` — signals unfinished migration (Q1 item 12).
3. **Add `text-to-SQL` as a keyword** — the core category is completely absent (Q3).
4. **Cut 使用场景 and merge 演示示例** — removes ~800 chars of low-signal content (Q4).
5. **Add a product screenshot/GIF** — judges without live access have zero visual proof (Q1 item 4).
6. **Add "schema-only LLM exposure" to 安全机制** — your strongest security differentiator is unmentioned (Q3).

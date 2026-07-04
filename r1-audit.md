# QueryForge — R1 Hackathon Audit

**Project:** QueryForge · AI 数据分析智能体  
**Track:** Track C — Business on AI (商业看板 / 数据洞察)  
**Stack:** Next.js 14.2 · Tailwind · shadcn/ui · Recharts · better-sqlite3 · Vercel AI SDK · MiMo v2.5 Pro  
**Codebase:** ~10 source files, ~1500 lines  

---

## Executive Summary

QueryForge is a clean, narrowly-scoped NL→SQL→Chart pipeline for an ecommerce dataset. The core loop works: natural language in → LLM generates SQL → validated & executed → chart rendered. Engineering is competent — SQL injection is mitigated, the UI is polished, the demo chips pre-wire four "wow" paths. **But the project has several structural gaps that will cost points across multiple scoring dimensions, and a few live-demo risks that need addressing before Day 3.**

---

## 1. Scoring Dimension Audit

### 1.1 Demo 现场可用 (25 pts) — **Est. 18–20/25**

**Strengths:**
- Four demo chips cover distinct chart types (line trend, pie/bar profit, bar top-10, repeat-user analysis) — good rehearsed path.
- Loading state, error display, chart rendering all implemented.
- SQL validation via `node-sql-parser` prevents injection and non-SELECT statements.

**Risks & Gaps:**

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| D1 | **No timeout / abort on LLM call** | 🔴 High | `runAgent()` calls `generateText()` with no timeout. MiMo API latency is unpredictable on a hackathon Wi-Fi. A 30s+ hang during live demo = dead screen. No AbortController, no client-side timeout, no retry. |
| D2 | **No graceful LLM failure mode** | 🔴 High | If MiMo returns malformed JSON (no `{`, extra text), `extractJson()` throws → 500 error → red box. No retry, no fallback prompt. LLMs are nondeterministic; this *will* happen once in 10 demo runs. |
| D3 | **`getDb()` opens new connection per request in query route** | 🟡 Medium | `/api/query/route.ts` line 20: `require("better-sqlite3")` creates a **new** `Database()` instance every request. The `agent.ts` singleton is not shared. Under load or rapid re-runs, WAL locking could cause `SQLITE_BUSY`. Not a single-user demo blocker, but fragile. |
| D4 | **Client `.catch(() => {})` swallows metric rerun errors** | 🟡 Medium | `page.tsx:33` — if the query API fails when clicking a saved metric, the error is silently swallowed. User sees no feedback. |
| D5 | **No input sanitization feedback** | 🟢 Low | Empty string is blocked, but there's no character limit. A very long prompt could hit token limits silently. |

**Recommendations for Demo Day:**
1. Add a **15-second client-side timeout** with an abort + friendly "分析超时，请重试" message.
2. Add **one retry** in `runAgent()` on JSON parse failure (re-prompt with "respond with valid JSON only").
3. Share the `getDb()` singleton from `db.ts` in the query route instead of opening new connections.

---

### 1.2 用户价值 / PMF (20 pts) — **Est. 12–14/20**

**Strengths:**
- Clear pain point: business users need data insights but can't write SQL.
- Defined user group: ecommerce operations / category managers.
- The NL→SQL→viz loop is the right abstraction.

**Gaps:**

| # | Issue | Detail |
|---|-------|--------|
| P1 | **No multi-turn conversation** | The chat is stateless — each message is a fresh LLM call with no history. Users can't say "now break that down by region" or "exclude refunds." This is the #1 expected behavior for a "data agent." The history array is display-only; it's never sent to the LLM. |
| P2 | **No data export** | Can't download results as CSV/Excel. For a business tool, this is table stakes. |
| P3 | **No query editing / correction** | If the generated SQL is wrong, user can't tweak it — they must rephrase the NL input and hope. A "编辑 SQL" button would be high-value, low-effort. |
| P4 | **Metric sidebar is localStorage-only** | Saved metrics don't persist across devices/browsers. No sharing. No server-side storage. |
| P5 | **Single dataset** | Hard-coded to one ecommerce DB. No upload, no connection to external data. Limits PMF signal. |

**Pitch advice:** Frame this as a **demo/POC** of the agent pattern, not a finished product. Emphasize the extensibility story (multi-turn, data upload, team sharing) in the roadmap slide.

---

### 1.3 技术实现 (20 pts) — **Est. 14–16/20**

**Strengths:**
- **SQL validation** via AST parsing (`node-sql-parser`) — not regex, not string matching. This is solid engineering.
- **Read-only enforcement** — `better-sqlite3` opened with `{ readonly: true }`. Defense in depth.
- **Deterministic seed data** — `faker.seed(20260704)` ensures reproducible demo data.
- **Vercel AI SDK** with OpenAI-compatible provider — correct abstraction, not raw HTTP.
- Clean separation: `agent.ts` (pipeline), `db.ts` (data), `route.ts` (API), components (UI).

**Issues:**

| # | Issue | Detail |
|---|-------|--------|
| T1 | **No streaming** | `generateText()` is used, not `streamText()`. The user waits for the full LLM response before seeing anything. Streaming would show the SQL being generated in real-time — better UX and shows technical sophistication. |
| T2 | **`@ai-sdk/openai` is a dead dependency** | `package.json` includes `@ai-sdk/openai` but code uses `@ai-sdk/openai-compatible`. Unused dep = noise. |
| T3 | **`sql.js` is a dead dependency** | Listed in `package.json` and configured in `next.config.mjs` (`serverExternalPackages: ["sql.js"]`), but never imported. The project uses `better-sqlite3`. |
| T4 | **`openai` SDK is a dead dependency** | Listed but unused — the code uses `@ai-sdk/openai-compatible`. |
| T5 | **`zod` is a dead dependency** | Listed but never imported anywhere. |
| T6 | **No structured output / tool calling** | The LLM returns free-form JSON extracted via regex (`/\{[\s\S]*\}/`). Vercel AI SDK supports `generateObject()` with Zod schemas — this would eliminate the fragile `extractJson()` and the JSON parse failure mode entirely. This is the single biggest technical improvement available. |
| T7 | **Dual chart_config naming** | `agent.ts` returns `chartConfig` (camelCase), but the LLM prompt says to return `chart_config` (snake_case). `ChatPanel.tsx` has to check both: `result.chartConfig ?? result.chart_config`. This works but is a code smell indicating the naming wasn't reconciled. |

**Biggest missed opportunity:** Using `generateObject()` with a Zod schema would (a) eliminate JSON parse failures, (b) remove the regex extraction, (c) demonstrate deeper AI SDK knowledge, and (d) make the demo more reliable. This is a ~20 line change.

---

### 1.4 创新性 (15 pts) — **Est. 8–10/15**

**Strengths:**
- Using MiMo v2.5 Pro (not OpenAI) shows model diversity awareness.
- The thinking/reasoning display (collapsible) is a nice touch — shows the agent's "brain."
- Chinese-native UX for a Chinese hackathon audience.

**Weaknesses:**
- **NL→SQL→Chart is a well-worn pattern.** Text2SQL demos have existed since 2023. Without a clear differentiator, this risks looking like a tutorial project.
- **Single-turn, single-table focus** limits the "agent" framing. An "agent" implies autonomy, tool use, multi-step reasoning — this is closer to a "text2SQL tool."
- **No memory, no learning, no multi-step planning.** The agent doesn't remember past queries, learn user preferences, or decompose complex questions.

**Differentiation advice:**
- Emphasize the **thinking trace** — show the LLM's reasoning process, not just the result. This is visually compelling and differentiates from a "black box" tool.
- If time permits, add a **"deep analysis" mode** that runs 2-3 related queries and synthesizes findings (e.g., "analyze Q2 performance" → run revenue, top products, and regional breakdown, then summarize). This would be a genuine multi-step agent.

---

### 1.5 商业潜力 (10 pts) — **Est. 5–6/10**

**What's there:**
- Clear market: BI/analytics is a $30B+ market. Self-serve data tools are hot.
- The "一人 AI 公司" angle works — a non-technical operator using this instead of hiring a data analyst.

**What's missing:**
- No pricing model mentioned.
- No competitive analysis (vs. ChatGPT Code Interpreter, Julius AI, Defog, etc.).
- No go-to-market story.
- No monetization path.

**Pitch advice:** Even a slide saying "freemium: 10 queries/month free, ¥99/month for unlimited" + "vs. hiring a data analyst at ¥15K/month" would cover this dimension. Don't leave it blank.

---

### 1.6 路演表达 (10 pts) — **Est. ?/10**

*Not assessable from code alone. Depends on PPT and delivery.*

**Recommendations:**
1. **Open with the pain:** "我是一个电商运营，每天要看数据，但不会写 SQL。"
2. **Demo the loop live:** Use one of the four chips, then ask a follow-up question to show the agent thinking.
3. **Show the thinking trace** — this is your "wow" moment.
4. **Close with the vision:** Multi-turn, data upload, team dashboard.
5. **Time the demo:** 3-minute pitch needs < 90 seconds of demo. Rehearse with a timer.

---

### 1.7 Bonus (+5 pts)

| Bonus | Status | Action |
|-------|--------|--------|
| 上架 ClawHunt (+3) | ❓ Unknown | Verify deployment to clawhunt.store/clawhunt.site before Day 3. |
| 游园展示 (+2) | ❓ Unknown | Confirm participation in the showcase session. |

---

## 2. Conflict Analysis

| # | Conflict | Detail |
|---|----------|--------|
| C1 | **"Agent" branding vs. single-turn reality** | The UI says "AI 数据分析智能体" (intelligent agent), but the implementation is a single-shot pipeline. Judges who know what "agent" means will notice. Mitigate by either (a) adding multi-turn context or (b) reframing as "AI 数据分析助手" in the pitch. |
| C2 | **`chartConfig` vs `chart_config`** | The LLM is instructed to return `chart_config` (snake_case), but the TypeScript type uses `chartConfig` (camelCase). The code handles both, but this creates confusion about the canonical format. Pick one and be consistent. |
| C3 | **Dead dependencies signal rushed code** | 4 unused packages (`@ai-sdk/openai`, `sql.js`, `openai`, `zod`) in `package.json`. A technical judge glancing at `package.json` will notice. Clean these up. |

---

## 3. Stability Risks for Live Demo

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| S1 | **MiMo API timeout / 502** | Medium | 🔴 Demo hangs | Add 15s timeout + retry + friendly error |
| S2 | **LLM returns invalid JSON** | Medium | 🔴 Red error box | Add retry or use `generateObject()` |
| S3 | **Wi-Fi drops at venue** | Medium | 🔴 No LLM, no demo | Have a **local fallback**: pre-cache the 4 demo chip responses as JSON. If the API fails, serve the cached response with a note "使用缓存数据演示." |
| S4 | **SQLite WAL lock** | Low | 🟡 Query error | Share the singleton `getDb()` across routes |
| S5 | **Recharts renders blank** | Low | 🟡 Empty chart | The `getChartKeys()` fallback logic is decent but could fail on unexpected column names. Test with all 4 demo chips on the actual venue machine. |

**Critical recommendation:** Pre-cache the 4 demo chip responses. This is your insurance policy. If the LLM API is down, you can still demo the UI, charts, and data pipeline.

---

## 4. Differentiation from a Single-HTML Approach

A colleague building a single HTML file with hardcoded queries and Chart.js will have:
- ✅ Faster load time (no Next.js cold start)
- ✅ Zero API dependency (no LLM call needed)
- ✅ Simpler debugging

**QueryForge's advantages:**
- 🟢 **Natural language input** — the core value prop. The HTML approach can't handle novel questions.
- 🟢 **Agent reasoning trace** — shows the AI's thinking process, not just a static chart.
- 🟢 **Extensibility** — the architecture supports multi-turn, new datasets, streaming.
- 🟢 **Professional UI** — business-grade design vs. a prototype.
- 🟢 **SQL validation** — security-aware engineering.

**But you must demo the NL flexibility.** Ask a question that's NOT one of the 4 chips. Something creative like "哪些用户买了超过 3 个品类的商品？" — something the HTML approach can't handle. This is your differentiator moment.

---

## 5. Prioritized Action Items

### Must-do (before Demo Day)

1. **Add LLM timeout + retry** (`agent.ts`) — 15s timeout, 1 retry on JSON parse failure
2. **Pre-cache 4 demo responses** — save to `data/demo-cache.json`, serve on API failure
3. **Clean dead dependencies** — remove `@ai-sdk/openai`, `sql.js`, `openai`, `zod` from `package.json`
4. **Share DB singleton** in `/api/query/route.ts` — import from `db.ts` instead of `require()`
5. **Fix metric rerun error handling** — show toast/alert instead of `catch(() => {})`

### Should-do (if time permits)

6. **Switch to `generateObject()` with Zod schema** — eliminates JSON fragility, shows SDK mastery
7. **Add streaming** — `streamText()` for real-time SQL generation display
8. **Add multi-turn context** — send last 2-3 exchanges as conversation history
9. **Reconcile `chartConfig` / `chart_config` naming**

### Nice-to-have (stretch)

10. **CSV export button** on chart results
11. **SQL edit mode** — let users tweak generated SQL before execution
12. **"Deep analysis" multi-query mode**

---

## 6. Score Estimate Summary

| Dimension | Max | Est. Range | Notes |
|-----------|-----|------------|-------|
| Demo 现场可用 | 25 | 18–20 | Timeout/failure risks |
| 用户价值/PMF | 20 | 12–14 | Single-turn limits depth |
| 技术实现 | 20 | 14–16 | Good foundation, dead deps, no streaming |
| 创新性 | 15 | 8–10 | Text2SQL is common; thinking trace helps |
| 商业潜力 | 10 | 5–6 | Needs pricing/market slide |
| 路演表达 | 10 | ? | Depends on delivery |
| Bonus | +5 | +0–5 | ClawHunt + showcase TBD |
| **Total** | **105** | **57–71** | **With improvements: 75–85** |

---

## 7. Verdict

QueryForge is a **solid B-tier hackathon project** — clean code, working demo, right market. To push into A-tier (top 12 contender), the team needs to:

1. **Harden the demo** (timeout, retry, cache) — this is non-negotiable for a live setting.
2. **Add one "wow" differentiator** — either multi-turn conversation or the "deep analysis" multi-query mode.
3. **Clean up the codebase** — dead deps, naming inconsistencies, shared DB singleton.
4. **Prepare the pitch story** — pain → demo → vision, timed to 3 minutes.

The biggest risk isn't technical — it's **looking like every other Text2SQL demo.** The thinking trace and the NL flexibility are your differentiators. Make sure the judges see them.

# QueryForge — R2 Cross-Examination Audit

**Cross-examiner:** MiMo Agent
**Date:** 2026-07-04
**Inputs:** R1 audits from CodeWhale (cw), OpenCode (oc), Kilo Code (kc), MiMo (mimo)
**Method:** Independent code verification against all R1 claims + gap analysis

---

## 1. UNANIMOUS AGREEMENTS (4/4 auditors concur)

These findings are **confirmed by all auditors** and verified against source code:

| # | Finding | Severity | Files | Verification |
|---|---------|----------|-------|-------------|
| A1 | **MetricSidebar save is completely broken.** No "保存指标" button exists anywhere. Sidebar permanently shows "暂无保存的指标". | 🔴 CRITICAL | `MetricSidebar.tsx`, `ChatPanel.tsx` | Confirmed. `MetricSidebar.tsx` exports `writeMetrics()` but nothing calls it. |
| A2 | **`extractJson` greedy regex is fragile.** `/{[\s\S]*\}/` matches first `{` to last `}` globally. LLM markdown fences, nested braces, or multi-object responses break parsing silently. | 🔴 CRITICAL | `agent.ts:59-63` | Confirmed. Single regex, no fallback, no retry. |
| A3 | **No LLM timeout or retry.** `generateText()` has no `maxDuration`, no `abortSignal`, no timeout. A hung API response blocks the demo indefinitely. | 🔴 CRITICAL | `agent.ts:68-72` | Confirmed. No timeout params on the call. |
| A4 | **`/api/query` creates new DB connections per request** instead of using the `db.ts` singleton. Wastes resources, risks WAL lock contention. | 🟡 WARNING | `query/route.ts:19-23` vs `db.ts:6-12` | Confirmed. `query/route.ts` does `new Database(dbPath, ...)` on every POST. |
| A5 | **`chartTitle` bug — all history items show the same title.** `chartTitle` is a single `useMemo` on `displayResult` (line 109-112) but rendered inside every history item loop (line 228). | 🟡 WARNING | `ChatPanel.tsx:109-112, 228` | Confirmed. The memo depends on `displayResult`, not on each `item.r`. |
| A6 | **No streaming.** Uses `generateText` (blocks until complete) instead of `streamText`. User sees spinner for 3-10s with no feedback. | 🟡 WARNING | `agent.ts:68` | Confirmed. `streamText` is available in the `ai` SDK but unused. |
| A7 | **No conversation memory.** Each query is stateless. History is display-only, never fed back to the LLM. No follow-up capability. | 🟡 WARNING | `agent.ts`, `route.ts` | Confirmed. `runAgent(query)` takes a single string, no history param. |
| A8 | **Unused dependencies in `package.json`.** `sql.js`, `openai`, `@ai-sdk/openai`, `@faker-js/faker` are never imported in source. | 🟢 MINOR | `package.json` | Confirmed via grep. `seed.ts` uses `@faker-js/faker` but that's a script, not runtime code. |
| A9 | **`/api/schema` is dead code.** Endpoint exists but no frontend component fetches it. Schema is hardcoded in `agent.ts:39-47`. | 🟢 MINOR | `schema/route.ts` | Confirmed. No `fetch("/api/schema")` anywhere. |
| A10 | **Core NL→SQL→Chart loop works.** 4 demo chips function, SQL validation via AST is solid, Recharts renders 4 chart types. | ✅ POSITIVE | All | Confirmed. |
| A11 | **SQL injection protection is robust.** `node-sql-parser` AST validation enforces SELECT-only in both `agent.ts` and `query/route.ts`. | ✅ POSITIVE | `agent.ts:51-57`, `query/route.ts:25-30` | Confirmed. |
| A12 | **Seed data is realistic and well-structured.** Chinese brand names, 20 categories, proper price distributions. Sells the demo. | ✅ POSITIVE | `scripts/seed.ts` | Confirmed. 373 lines of thoughtful generation. |

---

## 2. DISAGREEMENTS & DIVERGENCES

### 2.1 Dashboard.tsx — Dead Code?

| Auditor | Position |
|---------|----------|
| **cw** | ❌ Flags as dead code — "never imported anywhere in the app" |
| oc | Does not mention |
| kc | Does not mention |
| mimo | Does not mention |

**Verdict: CW is correct.** I verified: `Dashboard.tsx` exports `Dashboard` but no file imports it. It's 214 lines of dead code with a different color scheme (`#2563eb` vs `#0969da`) and different chart logic. Should be deleted before demo — it confuses reviewers who browse the codebase.

### 2.2 Metric Rerun Data Loss

| Auditor | Position |
|---------|----------|
| **kc** | Flags that `handleRunMetric` drops `thinking` and `explanation` — rerun results show blank explanation |
| **oc** | Flags empty `.catch(() => {})` silently swallowing errors |
| cw | Does not emphasize |
| mimo | Does not emphasize |

**Verdict: KC is correct on both counts.** `page.tsx:26-30` constructs `rerunResult` with only `sql`, `data`, `chartConfig` — no `thinking` or `explanation`. And `page.tsx:33` has `.catch(() => {})` which silently eats errors. Combined: metric reruns are both data-incomplete and error-invisible.

### 2.3 External Result Hidden After First Chat

| Auditor | Position |
|---------|----------|
| **kc** | Flags `displayResult && history.length === 0` guard at `ChatPanel.tsx:242` — metric sidebar reruns invisible once user has sent any chat |
| **cw** | Also notes this in conflicts table |
| oc | Does not flag |
| mimo | Does not flag |

**Verdict: KC and CW are correct.** Line 242: `{displayResult && history.length === 0 && (` — once `history` has entries, the external result block never renders. Metric reruns only work on a fresh page.

### 2.4 `require()` in Query Route

| Auditor | Position |
|---------|----------|
| **kc** | Flags `api/query/route.ts:20` uses `require("better-sqlite3")` — not ESM-compatible, may break in edge runtimes |
| Others | Do not flag |

**Verdict: KC is correct.** The route uses CommonJS `require()` while the rest of the codebase uses ESM imports. This is inconsistent and will break if `runtime` is changed from `"nodejs"` to `"edge"`.

### 2.5 Score Estimates

| Auditor | Without Fixes | With Fixes |
|---------|--------------|------------|
| cw | 73–83/105 | — |
| oc | 70/100 | — |
| kc | 58–68/100 | 78–88/100 |
| mimo | — | 78/105 |

**Analysis:** Estimates cluster around **65-75/105 without fixes** and **75-85/105 with fixes**. The 10-point spread reflects different assumptions about judge leniency on innovation and business potential. KC is the most pessimistic; CW and mimo are closest to consensus.

---

## 3. GAPS — What ALL Auditors Missed

I verified these against the actual source code. None of the 4 R1 reports flagged them.

### 🔴 G1: `onResult` Feedback Loop Creates State Corruption

**File:** `page.tsx:92` + `ChatPanel.tsx:107, 134`

```tsx
// page.tsx:91-93
<ChatPanel
  onResult={(r) => setRerunResult(r)}  // ← sets externalResult
  externalResult={rerunResult}          // ← feeds it back
/>

// ChatPanel.tsx:107
const displayResult = externalResult ?? result;  // external wins
```

When a chat completes, `onResult` fires → sets `rerunResult` → which becomes `externalResult` → which overrides `result` via `displayResult`. This means:

1. User sends query #1 → result stored in both `result` AND `rerunResult`
2. User sends query #2 → `setResult(null)` runs at line 120, but `externalResult` (from query #1) still wins via `??` until the API returns
3. During loading, the UI briefly shows query #1's chart instead of the spinner

**Impact:** Brief visual glitch during multi-query demos. Not demo-breaking but looks unpolished.

**Fix:** Remove `onResult` prop or don't set `rerunResult` from chat results. The `onResult` callback should only be used for external metric reruns.

### 🔴 G2: Metric Rerun Completely Broken After First Chat

**File:** `ChatPanel.tsx:242`

```tsx
{displayResult && history.length === 0 && (
```

KC flagged this partially, but the full severity is worse: combined with G1, even on a fresh page, clicking a metric sidebar item sets `rerunResult` → but if the user has already sent ONE chat message, `history.length > 0` → the entire external result block is skipped. The metric sidebar is effectively **non-functional after the first chat message**.

**Impact:** Metric rerun feature is dead beyond the very first interaction. Judges clicking sidebar items after a demo query will see nothing happen.

### 🟡 G3: No SQL Row Limit Enforcement

**File:** `agent.ts` (system prompt), `db.ts:14-16`

The system prompt says "SELECT only" but never instructs the LLM to add `LIMIT`. `queryDb()` returns all rows. If the LLM generates `SELECT * FROM order_items` (25,000 rows), Recharts will attempt to render 25,000 bars — the browser will freeze.

MiMo's R1 mentioned this but the other 3 missed it entirely. The seed has ~10,000 orders × ~2.5 items = ~25,000 order_items rows.

**Fix:** Add "Always add LIMIT 200 unless specifically asked for totals" to the system prompt. Also cap in `queryDb`: `return getDb().prepare(sql.includes('LIMIT') ? sql : sql + ' LIMIT 1000').all()`.

### 🟡 G4: `onResult` + `externalResult` Interaction Makes Metric Sidebar Invisible Mid-Chat

Even if G2's guard is fixed, there's a subtler issue: `ChatPanel` receives `externalResult` as a prop, but `handleSubmit` calls `setResult(null)` at line 120 before the API returns. During this window, `displayResult = externalResult ?? null`. If a metric rerun fires during loading, its result briefly flashes before being overwritten by the chat response.

### 🟡 G5: No Input Length Limit

**File:** `ChatPanel.tsx:299-311`

The textarea has no `maxLength`. A user (or judge testing edge cases) can paste 10,000 characters which go directly to the LLM as the prompt. This wastes tokens, increases latency, and could hit API limits.

**Fix:** Add `maxLength={500}` to the textarea.

### 🟢 G6: Demo Chip Prompts Are Not Validated

**File:** `ChatPanel.tsx:19-24`

The 4 demo chips are Chinese strings hardcoded in the UI. There's no validation that the LLM will produce correct SQL for these specific prompts. If the LLM's behavior changes (temperature, model version), the demo queries could return wrong results or errors.

**Mitigation:** Pre-cache the expected SQL + data for each chip as fallback (aligns with the fallback caching all auditors recommended).

### 🟢 G7: No Health Check / Pre-warm Endpoint

All auditors noted the cold-start risk but none proposed a concrete solution. There's no `/api/health` or `/api/warmup` endpoint that pre-opens the DB connection and optionally makes a cheap LLM call to warm the model.

### 🟢 G8: Stats Bar Hardcoded — Not Derived from DB

**File:** `page.tsx:7-12`

OC flagged this. The stats ("10,000+ 订单", "500 商品") are hardcoded strings. If seed data changes, stats lie. Minor for demo but judges who verify will notice.

---

## 4. PRIORITIZATION — What Must Be Fixed Tonight

### 🔴 P0 — FIX BEFORE DEMO (est. 45 min total)

| # | Fix | Effort | Impact | Owner Notes |
|---|-----|--------|--------|-------------|
| 1 | **Add "保存指标" button to ChatPanel** | 15 min | Unlocks entire MetricSidebar feature. Without this, the sidebar is dead weight that judges will notice. | Add button below chart that calls `writeMetrics([...readMetrics(), { name: result.chartConfig.title, sql: result.sql, chartConfig: result.chartConfig }])` |
| 2 | **Fix `onResult` feedback loop** | 5 min | Prevents state corruption. Remove `onResult={(r) => setRerunResult(r)}` from `page.tsx:92` — chat results should NOT feed back as external results. | The `onResult` prop was likely intended for a different purpose (e.g., saving to sidebar). |
| 3 | **Fix metric rerun visibility guard** | 5 min | Makes sidebar reruns work after first chat. Change line 242 from `history.length === 0` to always render external results when `externalResult` changes. Better: append external results to history. | `displayResult && (history.length === 0 || externalResult)` or just always render. |
| 4 | **Add LLM timeout** | 5 min | Prevents demo hang. Add `maxDuration: 15` or `abortSignal: AbortSignal.timeout(15000)` to `generateText()`. | 15s is generous — typical response is 2-4s. |
| 5 | **Fix `chartTitle` per-item** | 3 min | All history charts show correct title. Move title derivation inside the `history.map()` loop: `(item.r.chartConfig ?? item.r.chart_config)?.title ?? "数据可视化"`. | Replace the global `useMemo` with inline derivation. |
| 6 | **Pre-cache demo chip results** | 15 min | Demo survives API failure. Run each chip once, save the `{ sql, data, chartConfig, explanation }` as JSON. If API fails or takes >5s, serve cached. | Store in `lib/demo-cache.ts` as a static import. |

### 🟡 P1 — FIX IF TIME (est. 1 hr total)

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 7 | Pass `thinking` + `explanation` through metric rerun | 10 min | Rerun results show full context, not just chart |
| 8 | Unify DB singleton in `query/route.ts` | 5 min | Consistent architecture, no connection leaks |
| 9 | Add error feedback in `page.tsx:33` catch | 5 min | Metric rerun failures show error toast, not silence |
| 10 | Normalize `chart_config` keys to camelCase at API boundary | 15 min | Eliminates dual-key fragility (`x_key`/`xKey`) |
| 11 | Add `LIMIT 200` hint to system prompt | 2 min | Prevents accidental 25K-row chart freeze |
| 12 | Delete `Dashboard.tsx` | 0 min | Remove 214 lines of dead code |

### 🟢 P2 — NICE TO HAVE

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 13 | Switch to `streamText` for streaming | 30 min | Impressive demo effect, shows thinking in real-time |
| 14 | Remove unused deps from `package.json` | 5 min | Cleaner `node_modules`, signals engineering discipline |
| 15 | Add input `maxLength={500}` | 1 min | Prevents edge-case LLM abuse |
| 16 | Add data table view below chart | 20 min | Judges can inspect raw data |
| 17 | Add `/api/warmup` health check | 10 min | Pre-opens DB, eliminates cold-start |

---

## 5. SCORING IMPACT — Estimated Scores

### Without Any Fixes (current state)

| Dimension | Max | Est. | Rationale |
|-----------|-----|------|-----------|
| Demo 现场可用 | 25 | 15–17 | Core loop works but: MetricSidebar is dead, chartTitle bug visible on multi-query, metric rerun broken after first chat, no timeout = hang risk |
| 用户价值/PMF | 20 | 12–14 | Good pain point, but dead save feature = no persistence story, single-turn only |
| 技术实现 | 20 | 14–15 | Clean architecture, SQL safety. But: no streaming, duplicated DB/validation logic, dead schema endpoint, `require()` inconsistency |
| 创新性 | 15 | 7–9 | Text-to-SQL is well-known. Single LLM call, no agent loop. Thinking panel is nice but not unique |
| 商业潜力 | 10 | 5–6 | Good market pitch, thin implementation. No auth/multi-tenant/pricing |
| 路演表达 | 10 | 6–7 | 4 demo chips work, clean UI. No fallback plan if API dies |
| **Subtotal** | **100** | **59–68** | |
| ClawHunt 上架 | +3 | +3 | If completed |
| 游园展示 | +2 | +2 | If completed |
| **Total** | **105** | **64–73** | |

### With P0 Fixes (45 min of work)

| Dimension | Max | Est. | Delta |
|-----------|-----|------|-------|
| Demo 现场可用 | 25 | 20–22 | **+5** — MetricSidebar alive, chartTitle fixed, timeout safety, demo fallback |
| 用户价值/PMF | 20 | 14–16 | **+2** — Save metric works, persistence story viable |
| 技术实现 | 20 | 15–16 | **+1** — Timeout shows engineering maturity |
| 创新性 | 15 | 8–10 | **+1** — Working sidebar shows product thinking |
| 商业潜力 | 10 | 6–7 | +0 |
| 路演表达 | 10 | 7–8 | **+1** — Fallback plan = confidence |
| **Subtotal** | **100** | **70–79** | **+9 to +11** |
| **Total** | **105** | **75–84** | |

### With P0 + P1 Fixes (2 hrs of work)

| Dimension | Max | Est. | Delta from P0 |
|-----------|-----|------|---------------|
| Demo 现场可用 | 25 | 22–24 | +2 |
| 用户价值/PMF | 20 | 15–17 | +1 |
| 技术实现 | 20 | 17–18 | +2 |
| 创新性 | 15 | 9–11 | +1 |
| 商业潜力 | 10 | 6–7 | +0 |
| 路演表达 | 10 | 7–8 | +0 |
| **Subtotal** | **100** | **76–85** | |
| **Total** | **105** | **81–90** | |

---

## 6. RISK MATRIX

```
           HIGH IMPACT
               │
    ┌──────────┼──────────┐
    │  A1 Save │ A3 No    │
    │  Metric  │ Timeout  │
    │  (dead)  │ (hang)   │
    │──────────┼──────────│
    │  G2      │ A2 JSON  │
    │  Rerun   │ Regex    │
    │  Broken  │ (fragile)│
    ├──────────┼──────────┤
    │  A5      │  G3      │
    │  Chart   │  No LIMIT│
    │  Title   │  (freeze)│
    │──────────┼──────────│
    │  A6      │  A4      │
    │  No      │  DB Conn │
    │  Stream  │  Dup     │
    └──────────┼──────────┘
     FREQUENT  │  RARE
           LOW IMPACT
```

---

## 7. CROSS-AUDITOR QUALITY ASSESSMENT

| Auditor | Thoroughness | Accuracy | Unique Findings | Missed |
|---------|-------------|----------|-----------------|--------|
| **CodeWhale (cw)** | ★★★★★ | ★★★★★ | Dashboard.tsx dead code, orders.total_amount divergence, unused deps detail | G1 feedback loop |
| **OpenCode (oc)** | ★★★★ | ★★★★ | Mobile sidebar hidden, hardcoded stats, API response shape mismatch | G1, G2 severity |
| **Kilo Code (kc)** | ★★★★★ | ★★★★★ | Metric rerun data loss, external result guard, `require()` ESM issue | G1 feedback loop |
| **MiMo (mimo)** | ★★★★ | ★★★★ | Row limit risk, `@ai-sdk/openai` unused | G1, G2 |

**Best overall audit:** CW and KC (tied). CW caught the most file-level issues; KC caught the most behavioral bugs.

---

## 8. FINAL VERDICT

QueryForge is a well-architected hackathon project with a solid foundation. The core NL→SQL→Chart loop works. The engineering is clean. But it has **3 critical bugs** (dead MetricSidebar, broken metric rerun after first chat, no LLM timeout) and **2 high-impact issues** (fragile JSON parsing, chartTitle bug) that will be immediately apparent during live demo.

**The good news:** All critical issues are fixable in under 45 minutes. The P0 fix list is concrete, small, and high-impact.

**The bad news:** Without fixes, the project scores in the low 60s — below the qualification threshold. The MetricSidebar being completely dead is the most visible flaw: judges will see an empty panel and conclude the feature doesn't work.

**Recommendation:** Execute P0 fixes tonight. The 45-minute investment moves the needle by 10+ points and transforms the project from "has bugs" to "works well."

---

*End of cross-examination.*

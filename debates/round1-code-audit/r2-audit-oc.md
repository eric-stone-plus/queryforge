# QueryForge — R2 Cross-Examination

**Cross-Examiner:** OpenCode (oc)
**Date:** 2026-07-04
**Inputs:** r1-audit-cw.md, r1-audit-oc.md, r1-audit-kc.md, r1-audit-kimi.md

---

## 1. AGREEMENTS — Unanimous Findings

All four auditors independently identified these issues:

| Finding | CW | OC | KC | Kimi | Confidence |
|---------|----|----|----|----|------------|
| **MetricSidebar has no save button** — sidebar is dead weight | ✅ | ✅ | ✅ | ✅ | **UNANIMOUS** |
| **No streaming** — `generateText` blocks, user sees spinner | ✅ | ✅ | ✅ | ✅ | **UNANIMOUS** |
| **No conversation memory** — each query is stateless | ✅ | ✅ | ✅ | ✅ | **UNANIMOUS** |
| **DB connection inconsistency** — singleton vs per-request | ✅ | ✅ | ✅ | ✅ | **UNANIMOUS** |
| **JSON extraction regex is fragile** — greedy `{[\s\S]*}` | ✅ | ✅ | ✅ | ✅ | **UNANIMOUS** |
| **No LLM timeout/retry** — API hang kills demo | ✅ | ✅ | ✅ | ✅ | **UNANIMOUS** |
| **No API fallback** — Kimi down = app dead | ✅ | ✅ | ✅ | ✅ | **UNANIMOUS** |
| **Single LLM call, no agent loop** — shallow "agent" | ✅ | ✅ | ✅ | ✅ | **UNANIMOUS** |
| **Unused dependencies in package.json** | ✅ | ✅ | ✅ | ✅ | **UNANIMOUS** |
| **chartTitle shared across all history items** | ✅ | ✅ | ✅ | ✅ | **UNANIMOUS** |

**Verdict:** These 10 items are the project's confirmed defects. Any fix plan must address them — no auditor disputes them.

---

## 2. DISAGREEMENTS — Where Auditors Conflict

### 2.1 Score Estimates Vary Widely

| Auditor | Total Estimate | Range |
|---------|---------------|-------|
| CW | 73–83/105 | Highest |
| OC | 70/100 (≈74/105) | Mid-high |
| Kimi | 78/105 (post-fix) | Mid |
| KC | 58–68/100 (pre-fix) | Lowest |

**Analysis:** KC is most pessimistic, CW most optimistic. The spread (58–83) suggests scoring is highly sensitive to demo execution. CW's estimate assumes demo chips work; KC assumes visible bugs during multi-query demo. The truth likely sits at **65–75/105 without fixes, 75–85 with P0+P1 fixes**.

### 2.2 Innovation Score Disagreement

| Auditor | Innovation Score | Rationale |
|---------|-----------------|-----------|
| CW | 9–11/15 | Acknowledges thin agent but credits chart variety |
| OC | 10/15 | Pattern is well-known, no unique differentiator |
| Kimi | 8/15 | "Shallow" agent, metric saving is skeleton |
| KC | 7–9/15 | Lowest — "differentiation from ask ChatGPT is thin" |

**Verdict:** Innovation is the weakest dimension across all auditors. Text-to-SQL is not novel. KC and Kimi are right that without multi-step reasoning or self-correction, this scores 7–9/15 max. **This is the ceiling-limiter.**

### 2.3 Specific Bug Priority

| Issue | CW | OC | KC | Kimi |
|-------|----|----|----|----|
| Metric rerun visibility bug (`history.length === 0` guard) | Not found | Found (G4) | Found (P0) | Not found |
| Metric rerun drops thinking + explanation | Not found | Not found | Found (P0) | Not found |
| External result hidden after first chat | Not found | Found | Found | Not found |
| `orders.total_amount` divergence risk | Found (warning) | Not found | Not found | Not found |
| Missing `LIMIT` enforcement on queries | Not found | Not found | Not found | Found (P0) |
| `require()` in query/route.ts (not ESM) | Not found | Not found | Found | Not found |
| Hardcoded stats bar | Not found | Found | Not found | Not found |
| `/api/schema` unused by frontend | Found | Found | Found | Found (partial) |

**Verdict:** KC found 2 unique bugs (metric rerun data loss, `require()` ESM issue). Kimi found the missing `LIMIT`. CW caught the `orders.total_amount` divergence. **No single auditor caught everything.** The combined bug list is more complete than any individual audit.

---

## 3. GAPS — What All Auditors Missed

| Gap | Impact | Why It Matters |
|-----|--------|----------------|
| **No error boundary** | React crash kills entire page | If a chart component throws (bad data, malformed config), the whole app white-screens. No `<ErrorBoundary>` wrapper. |
| **No `LIMIT` in generated SQL** | Chart renders 10K rows | Kimi flagged this but others missed it. Recharts with 25K `order_items` rows = browser freeze. |
| **No data table view** | Judges ask "show raw data" | KC mentioned this; others didn't. Analysts expect tabular fallback. |
| **No build/deploy verification** | Vercel deploy may fail | Nobody checked if the project actually builds (`next build`). SQLite file path issues, `better-sqlite3` native bindings, and env vars could break deployment. |
| **Accessibility is zero** | Keyboard nav, screen readers | No `aria` labels, no focus management, no keyboard shortcuts. Not a scoring dimension but signals unprofessionalism. |
| **No health-check / warm-up endpoint** | Cold start on first demo query | First request loads model + opens DB. Could add 2-5s latency. CW briefly mentioned this; others ignored it. |
| **SQL post-validation of revenue formula** | LLM ignores prompt, uses `orders.total_amount` | CW noted the risk. No auditor suggested actually checking the generated SQL for the forbidden column. |
| **No test suite at all** | Regression risk on any fix | Zero tests. Every fix we recommend could introduce new bugs. |
| **`Dashboard.tsx` is dead code** | Confuses reviewers | CW found this. Other auditors didn't mention it. 214 lines of unused component. |

---

## 4. PRIORITIZATION — Tonight's Fix Plan

### P0 — MUST FIX (Demo will visibly fail without these)

| # | Fix | Effort | Points Saved | Source |
|---|-----|--------|-------------|--------|
| 1 | **Add "保存指标" button to ChatPanel** | 15 min | 3–5 pts (Demo + Innovation) | All 4 auditors |
| 2 | **Pre-cache 4 demo chip results as JSON fallback** | 30 min | 5 pts (Demo safety net) | CW, OC, Kimi |
| 3 | **Add 10s timeout to `generateText`** | 5 min | 3 pts (Demo stability) | All 4 |
| 4 | **Fix chartTitle per-history-item** | 5 min | 2 pts (Demo polish) | All 4 |
| 5 | **Fix MetricSidebar rerun: remove `history.length === 0` guard** | 5 min | 2 pts (Demo) | OC, KC |
| 6 | **Use db.ts singleton in query/route.ts** | 5 min | 1 pt (Tech) | All 4 |

**Total P0 effort: ~65 min. Score impact: +15–20 pts (from ~65 to ~80–85).**

### P1 — SHOULD FIX (Visible on close inspection)

| # | Fix | Effort | Points Saved | Source |
|---|-----|--------|-------------|--------|
| 7 | **Fix `extractJson` — use balanced-brace parser** | 15 min | 2 pts (Demo stability) | All 4 |
| 8 | **Pass thinking + explanation through metric rerun** | 10 min | 1 pt (Demo) | KC |
| 9 | **Add `LIMIT 500` to generated SQL or queryDb** | 10 min | 2 pts (Stability) | Kimi |
| 10 | **Delete `Dashboard.tsx` dead code** | 2 min | 1 pt (Tech cleanliness) | CW |
| 11 | **Remove unused deps from package.json** | 5 min | 0 pts (but signals polish) | All 4 |
| 12 | **Add error feedback in `page.tsx:33` catch block** | 5 min | 1 pt | KC, Kimi |

**Total P1 effort: ~47 min. Score impact: +5–7 pts.**

### P2 — NICE TO HAVE (Impressive but not critical)

| # | Fix | Effort | Points Saved |
|---|-----|--------|-------------|
| 13 | Switch to `streamText` for perceived speed | 1 hr | 2–3 pts |
| 14 | Add data table view below chart | 30 min | 1–2 pts |
| 15 | Fetch schema from `/api/schema` dynamically | 30 min | 1 pt |
| 16 | Add CSV export button | 20 min | 1 pt |
| 17 | Add conversation memory (last 3 queries) | 45 min | 2 pts |

---

## 5. SCORING IMPACT

### Without Any Fixes (current state)

| Dimension | Max | Est. Range | Notes |
|-----------|-----|-----------|-------|
| Demo 现场可用 | 25 | 16–20 | Metric sidebar dead, no fallback, chart title bug |
| 用户价值/PMF | 20 | 12–15 | Good pain point, no persistence, no multi-turn |
| 技术实现 | 20 | 13–16 | Clean arch but duplicated code, no streaming |
| 创新性 | 15 | 7–10 | Thin agent, well-known pattern |
| 商业潜力 | 10 | 5–7 | Good pitch, no auth/multi-tenant |
| 路演表达 | 10 | 6–8 | Depends on presenter |
| **Subtotal** | **100** | **59–76** | |
| Bonus | +5 | +3–5 | ClawHunt + 游园 if done |
| **Total** | **105** | **62–81** | |

### With P0 Fixes Only (~1 hr work)

| Dimension | Max | Est. | Delta |
|-----------|-----|------|-------|
| Demo | 25 | 21–23 | +3–5 (save button works, fallback ready, timeout safe) |
| PMF | 20 | 14–16 | +1–2 (metric save enables persistence story) |
| Tech | 20 | 15–17 | +1 (singleton fix) |
| Innovation | 15 | 8–10 | +1 (metric feature now real) |
| Business | 10 | 6–7 | — |
| Pitch | 10 | 7–8 | — |
| **Total** | **105** | **74–86** | **+10–15 pts** |

### With P0 + P1 Fixes (~2 hrs work)

| Dimension | Est. | Delta from current |
|-----------|------|--------------------|
| Demo | 22–24 | +4–6 |
| PMF | 15–17 | +2–3 |
| Tech | 16–18 | +2–3 |
| Innovation | 9–11 | +1–2 |
| Business | 6–7 | — |
| Pitch | 7–8 | — |
| **Total** | **78–90** | **+15–22 pts** |

---

## 6. FINAL RECOMMENDATION

**Fix P0 items tonight.** The 6 P0 fixes take ~1 hour and move the project from a risky ~65 to a confident ~80. The biggest single win is the **metric save button** — it activates a dead feature that all 4 auditors flagged, and it directly addresses the Innovation and Demo dimensions.

**Do NOT attempt P2 items.** Streaming and conversation memory are high-effort, low-point-return for a 3-minute demo. The demo chips already work — polish the core loop, don't add new features.

**The project's ceiling is ~85–90/105** with all code fixes. Beyond that, the score depends on presentation quality and the "extensibility story" pitch (production architecture, security validation, multi-DB path).

---

*End of cross-examination.*

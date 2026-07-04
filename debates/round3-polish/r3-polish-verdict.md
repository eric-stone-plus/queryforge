# QUINTE R3 Final Verdict: QueryForge Final Polish

## R3: hm + Auditor B

**Date:** 2026-07-04
**Evidence:** 5 R1 artifacts (CW/OC/KC/Kimi/OMP), 5 R2 cross-examinations
**Verdict:** PASS — Execute action plan below

---

## Consensus Findings (5/5 or 4/5 agree)

### Highest-Impact Actions (by score-per-hour)

1. **Wire Dashboard.tsx + KPI cards** — 2-3h, +3-8 pts
   - Component exists (214 lines), just needs import + data source
   - Transforms app from "chatbot" to "SaaS product"
   - All 5 auditors rank this #1 or #2

2. **Fix metric rerun bug** — 15 min, +3-5 pts
   - The "save metric → rerun" demo step is broken
   - Cheapest fix with highest demo impact

3. **Self-correction narrative** — 3-4h, +2-3 pts (创新性)
   - Add SQL error → retry loop to show "agent thinking"
   - Biggest single lever for weakest dimension

4. **Demo rehearsal** — 2-3h, +3-5 pts
   - All 5 agree: "the difference between 75 and 90 is rehearsal, not code"
   - 3-min flow × 5, 5-min flow × 3

5. **Railway deployment** — 1-2h, +3 bonus
   - Needed for ClawHunt +3 bonus
   - better-sqlite3 compatible with Railway (not Vercel)

### Score Projections

| Scenario | Score |
|----------|-------|
| Current state | 62-75 |
| + MUST fixes | 68-80 |
| + Dashboard + KPI | 76-88 |
| + Self-correction narrative | 80-92 |
| + Railway + ClawHunt | 83-95 |
| + Rehearsed demo + PPT | 88-100 |

**Realistic estimate: 85-93/105** after debugging buffer.

---

## Prioritized Action Plan

### Phase 1: Core Fixes (3h) — MUST before anything else

1. Fix metric rerun bug (15 min)
2. Wire Dashboard.tsx into page.tsx (30 min)
3. Add KPI summary cards above chat (1h)
4. Fix extractJson regex fragility (30 min)
5. API key → env var (5 min)
6. Client-side timeout + error boundary (30 min)

### Phase 2: Innovation Layer (3h) — pushes 创新性 from 8 to 12+

7. Self-correction loop: SQL error → show error → retry with correction (2h)
8. Add "Agent Thinking" visible step indicator (1h)

### Phase 3: Deploy + Package (3h)

9. Railway deployment (1-1.5h)
10. ClawHunt platform listing (30 min)
11. Clean dead dependencies (15 min)
12. Data table below chart (1h)

### Phase 4: Presentation (3h)

13. Write PPT/slides (1.5h)
14. Rehearse 3-min flow 5× (45 min)
15. Rehearse 5-min flow 3× (45 min)

**Total: ~12h** (leaving 18h buffer for debugging + sleep)

---

## Residual Closure Ledger

```json
{
  "residuals": [
    {
      "id": "RC-P001",
      "severity": "CRITICAL",
      "type": "execution_mismatch",
      "finding": "Dashboard.tsx exists but not wired into page.tsx",
      "source": "5/5 R1 auditors",
      "disposition": "verified",
      "required_closure": "edit",
      "closure_state": "open",
      "scope": "Import Dashboard.tsx into page.tsx, add data source"
    },
    {
      "id": "RC-P002",
      "severity": "HIGH",
      "type": "evidence_gap",
      "finding": "Metric rerun after save is broken",
      "source": "R1-CW, R1-KC, R2-KC",
      "disposition": "verified",
      "required_closure": "edit",
      "closure_state": "open",
      "scope": "Fix /api/query endpoint or rerun logic in page.tsx"
    },
    {
      "id": "RC-P003",
      "severity": "HIGH",
      "type": "confidence_mismatch",
      "finding": "extractJson regex fragile — greedy match may capture wrong braces",
      "source": "R1-CW, R2-OMP",
      "disposition": "verified",
      "required_closure": "edit",
      "closure_state": "open",
      "scope": "Replace regex with balanced-brace extraction or JSON.parse wrapper"
    },
    {
      "id": "RC-P004",
      "severity": "HIGH",
      "type": "omission",
      "finding": "No client-side timeout for LLM call",
      "source": "R2-OMP, R2-OC",
      "disposition": "verified",
      "required_closure": "edit",
      "closure_state": "open",
      "scope": "Add AbortSignal.timeout or loading timeout in ChatPanel.tsx"
    },
    {
      "id": "RC-P005",
      "severity": "MEDIUM",
      "type": "evidence_gap",
      "finding": "Innovation dimension weak (7-10/15) — Text2SQL not novel",
      "source": "5/5 R1 auditors",
      "disposition": "verified",
      "required_closure": "edit",
      "closure_state": "open",
      "scope": "Add self-correction loop + visible agent thinking steps"
    },
    {
      "id": "RC-P006",
      "severity": "MEDIUM",
      "type": "drift",
      "finding": "API key hardcoded in agent.ts",
      "source": "R1-KC, R1-KIMI",
      "disposition": "verified",
      "required_closure": "edit",
      "closure_state": "open",
      "scope": "Move to process.env.KIMI_API_KEY"
    },
    {
      "id": "RC-P007",
      "severity": "MEDIUM",
      "type": "omission",
      "finding": "Dead dependencies: @ai-sdk/openai, openai, sql.js, faker, clsx, lucide-react, zod",
      "source": "R1-CW, R1-KC, R2-OC",
      "disposition": "verified",
      "required_closure": "command",
      "closure_state": "open",
      "scope": "npm uninstall unused packages"
    },
    {
      "id": "RC-P008",
      "severity": "LOW",
      "type": "omission",
      "finding": "/api/schema endpoint unused, hardcoded stats bar, no dark mode toggle",
      "source": "R1-CW, R1-OC",
      "disposition": "verified",
      "required_closure": "none",
      "closure_state": "not_applicable",
      "scope": "Nice-to-haves, skip for hackathon"
    }
  ]
}
```

---

## Unresolved / Escalated

- **RC-P005 (Innovation)**: Self-correction loop is the highest-risk highest-reward feature. If Kimi doesn't reliably produce correction SQL on error, it could backfire. Recommend: implement but have a fallback (show error gracefully, don't demo the correction if it fails).
- **Deployment risk**: better-sqlite3 native module may have issues on Railway build. Test early, have localhost + localtunnel as backup.

---

*R3 verdict by hm — 2026-07-04. Evidence-based, not consensus-based.*

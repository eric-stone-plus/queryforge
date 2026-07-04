# QUINTE R3 Final Verdict: QueryForge Audit

## R3: hm + Auditor B (synthesized)

## Verdict: CONDITIONAL PASS — Fix P0 items before demo

### Unanimous Defects (5/5 auditors agree)

**P0 — Must fix before demo (blocks scoring):**
1. MetricSidebar save flow dead — add "保存指标" button in ChatPanel
2. No LLM timeout — add 15s timeout, user-friendly error
3. No offline fallback — cache 4 demo results as JSON
4. Chart title bug — fix per-history-item title display
5. DB connection inconsistency — use singleton everywhere

**P1 — Should fix (significant scoring impact):**
6. No streaming response — switch to streamText
7. extractJson regex fragile — use balanced-brace extraction
8. Dead dependencies — remove unused packages
9. No LIMIT enforcement — add automatic LIMIT to prevent browser freeze
10. No error boundary — wrap chart components

**P2 — Nice to have:**
11. No conversation memory (single-turn)
12. No agent loop (single LLM call)
13. Hardcoded stats bar
14. /api/schema unused

### Score Estimate
- Without fixes: 65-75/105
- With P0+P1 fixes: 75-85/105
- With presentation polish: 85-90/105

### Residual Closure Ledger
```json
{
  "residuals": [
    {"id": "RC-001", "severity": "CRITICAL", "type": "execution_mismatch", "finding": "MetricSidebar save flow dead", "disposition": "verified", "closure_state": "open", "required_closure": "edit"},
    {"id": "RC-002", "severity": "CRITICAL", "type": "evidence_gap", "finding": "No LLM timeout/retry", "disposition": "verified", "closure_state": "open", "required_closure": "edit"},
    {"id": "RC-003", "severity": "HIGH", "type": "evidence_gap", "finding": "No offline fallback", "disposition": "verified", "closure_state": "open", "required_closure": "edit"},
    {"id": "RC-004", "severity": "HIGH", "type": "contradiction", "finding": "Chart title shared across history", "disposition": "verified", "closure_state": "open", "required_closure": "edit"},
    {"id": "RC-005", "severity": "HIGH", "type": "execution_mismatch", "finding": "DB connection not singleton", "disposition": "verified", "closure_state": "open", "required_closure": "edit"}
  ]
}
```

### Action Plan (Priority Order)
1. Fix MetricSidebar save (~15 lines)
2. Add LLM timeout + error handling (~10 lines)
3. Cache demo results as fallback (~30 lines)
4. Fix chart title per history item (~5 lines)
5. Unify DB connection (~5 lines)
6. Add LIMIT enforcement (~3 lines)
7. Remove dead dependencies (npm uninstall)
8. Add error boundary (~10 lines)

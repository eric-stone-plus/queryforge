# R1 MiMo — Final Implementation Direction

## Q1: Chat Quality — Making It Feel Like a Real Data Analyst

### Diagnosis

Current `agent.ts` system prompt asks for `"explanation": "brief Chinese explanation"`. This produces 1-2 sentence chart captions, not analyst-level commentary. The user's complaint ("对话框里是正常的对话，不要乱回答") points to a gap between what they expect (a data analyst who talks to you) and what they get (a SQL generator that outputs JSON).

### Recommendations

**1. Expand the explanation instruction in system prompt** (agent.ts:43-44)

Change:
```
"explanation": "brief Chinese explanation"
```
To:
```
"explanation": "2-4 sentence analyst commentary in Chinese: state the key finding, highlight any anomalies or trends, and suggest one actionable insight. Write as if advising a business stakeholder."
```

This single change costs zero extra LLM calls and immediately produces richer output. The LLM already has the SQL and thinking context — it just needs permission to use it.

**2. Add data-aware analysis post-processing** (agent.ts, after line 145)

After successful query execution, count rows, detect extremes (max/min), and append structured analysis bullets to `explanation`:

```typescript
// After result.data is available
if (result.data && result.data.length > 1) {
  const numKeys = Object.keys(result.data[0]).filter(k => typeof result.data[0][k] === 'number');
  const extras: string[] = [];
  for (const key of numKeys.slice(0, 2)) {
    const sorted = [...result.data].sort((a, b) => (b[key] as number) - (a[key] as number));
    extras.push(`最高: ${sorted[0][Object.keys(sorted[0]).find(k => typeof sorted[0][k] === 'string') || '']} (${sorted[0][key]})`);
    extras.push(`最低: ${sorted[sorted.length-1][Object.keys(sorted[sorted.length-1]).find(k => typeof sorted[sorted.length-1][k] === 'string') || '']} (${sorted[sorted.length-1][key]})`);
  }
  result.explanation += '\n\n📊 数据洞察:\n' + extras.map(e => `• ${e}`).join('\n');
}
```

**3. DO NOT add a second LLM call** — it doubles latency and API cost. The single-call approach with a richer prompt instruction is sufficient for demo quality.

**Risk**: Low. Prompt-only change, no structural risk.

---

## Q2: PPT Technical Narrative

### Recommended Technical Section Structure (3 slides)

**Slide A: Backend Architecture**

| Layer | Current (Demo) | Production Roadmap |
|-------|----------------|-------------------|
| DB | SQLite (single file) | PostgreSQL (RDS/Supabase) |
| API | Next.js API routes (serverless) | Dedicated API server + connection pool |
| LLM | Kimi K2.7 direct call | LLM gateway with rate limiting, fallback models |
| Auth | None | NextAuth.js + RBAC (admin/analyst/viewer) |
| Cache | 4 hardcoded demos | Redis for query result cache + semantic dedup |

Key talking point: "SQLite was chosen for hackathon speed — the SQL generation layer is DB-agnostic. Migration to PostgreSQL requires changing only `db.ts` (16 lines of code)."

**Slide B: Data Compliance**

Already implemented:
- ✅ Read-only SQL (`readonly: true` in db.ts:9)
- ✅ SELECT-only enforcement (agent.ts:68-72, node-sql-parser AST validation)
- ✅ LLM sees schema only, never raw data rows
- ✅ Auto LIMIT 500 on unbounded queries (agent.ts:74-76)

Production roadmap:
- 🔒 Role-based access control (who can query what)
- 🔒 Audit logging (every SQL executed, by whom, when)
- 🔒 Data masking (PII columns excluded from LLM schema)
- 🔒 Query result encryption at rest

**Slide C: Production Feasibility**

```
Demo → Production checklist:
1. DB migration: SQLite → PostgreSQL (1 file change)
2. Auth: add NextAuth.js (1-2 days)
3. Rate limiting: Redis-based (1 day)
4. Monitoring: query latency + error rate dashboards
5. Multi-tenant: schema-per-org or row-level security
```

Talking point: "The core value — NL-to-SQL with semantic layer — is production-ready today. What changes is the infrastructure wrapper, not the intelligence."

**Risk**: Medium. Need to keep it accessible for non-technical judges. Avoid jargon; use the "demo → production" comparison table format.

---

## Q3: Implementation Priority (Critical Path)

Given ~8 hours, here's the priority stack:

### MUST DO (Demo will break or look wrong without these)

| # | Task | Time | Why |
|---|------|------|-----|
| 1 | Fix page.tsx user distribution (lines 300-308) | 30 min | Currently shows faker data (1000 users, ¥230K avg spend). Olist has 96K users with ~R$161 avg spend. Judges will see contradictions. |
| 2 | Fix SEGMENT_STATIC (page.tsx:69-74) | 15 min | Shows "vip: 0 users, new: 0 users". Replace with real Olist distribution or remove the segment chart entirely. |
| 3 | Update agent.ts explanation instruction | 10 min | Change "brief Chinese explanation" to analyst-level commentary (see Q1). |
| 4 | Verify build + Railway deploy | 60 min | Push to main, verify Railway auto-deploys, smoke test the live URL. |

### SHOULD DO (Significantly improves demo quality)

| # | Task | Time | Why |
|---|------|------|-----|
| 5 | Update PPT with Olist numbers | 90 min | Current PPT still references old faker data. At minimum update: order count (10K→99K), user count (1K→96K), revenue figures. |
| 6 | Rehearse demo flow | 30 min | Run through the 4 cached demo queries live. Know what each returns. Practice the narrative. |

### NICE TO HAVE (If time permits)

| # | Task | Time |
|---|------|------|
| 7 | Add PPT technical slides (architecture/compliance) | 60 min |
| 8 | Clean up Dashboard.tsx dead code | 5 min |
| 9 | Unify COLORS constant across 3 files | 10 min |

**Total MUST DO time: ~2 hours.** This leaves 6 hours for SHOULD DO and contingency.

**Risk**: Deploy is the highest-risk item. If Railway fails, the demo falls back to cached queries (demo-cache.ts), which already work.

---

## Q4: Data Compliance Narrative

### What to Tell Judges

**The core pitch**: "QueryForge is designed from day one so that business data never leaves the database."

**Three-layer defense**:

1. **SQL Sandbox** (already implemented)
   - `node-sql-parser` validates every query is SELECT-only before execution
   - Auto-appends LIMIT 500 to prevent runaway queries
   - Database opened in `readonly: true` mode — no writes possible
   - This isn't a bolt-on; it's in the architecture (agent.ts:67-77, db.ts:9)

2. **LLM Isolation** (already implemented)
   - LLM receives only the schema (table names, column names, types) — never actual data rows
   - LLM output is JSON with SQL; the SQL is validated and executed server-side
   - User's data never appears in any LLM prompt or response

3. **Production Roadmap** (future features)
   - RBAC: "Marketing team can query campaign metrics but not financial data"
   - Audit log: every query traceable to user + timestamp
   - PII masking: sensitive columns (email, name) excluded from LLM-visible schema
   - Query approval: high-risk queries require manager approval before execution

**Key talking point for judges**: "We didn't add security after building the product. The architecture makes data leaks structurally impossible — the LLM physically cannot see your data, only your schema."

**Risk**: Low risk. All current claims are verifiable in the code. Future roadmap items are clearly labeled as such.

---

## Q5: Railway Deployment Strategy

### Pre-Deploy Checklist

1. **Verify build locally first** — run `npm run build` and fix any TypeScript/build errors
2. **Check environment variables on Railway** — `KIMI_API_KEY`, `KIMI_BASE_URL`, `KIMI_MODEL` must be set
3. **Verify `data/ecommerce.db` is in the repo** — Railway needs the Olist-seeded database file committed

### Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Build fails on Railway (missing deps) | Medium | High | Run `npm run build` locally first |
| DB file too large for git/Railway | Low | High | Olist DB should be <50MB; verify with `du -h data/ecommerce.db` |
| Kimi API rate limit during demo | Low | Medium | demo-cache.ts provides 4 instant fallback queries |
| Railway cold start slow | Medium | Low | Hit the URL 30 seconds before demo starts |
| Old deployment cached | Low | Medium | Force redeploy via Railway dashboard if auto-deploy doesn't trigger |

### Fallback Strategy

**Keep the old deployment as backup.** Before pushing, note the current Railway deployment URL. If the new deployment fails:
1. Railway dashboard → Deployments → redeploy the previous successful build
2. Demo falls back to cached queries (demo-cache.ts) which work without API calls
3. The 4 cached queries already demonstrate core capabilities

### Deployment Steps

```bash
# 1. Local build verification
npm run build

# 2. Commit and push (Railway auto-deploys from main)
git add -A && git commit -m "feat: migrate to Olist dataset" && git push

# 3. Monitor Railway dashboard for deploy status
# 4. Smoke test: hit queryforge-production-8d6f.up.railway.app
# 5. Test one live query from the 4 cached demos
```

**Risk**: Medium. The biggest risk is the build step — if there are TypeScript errors introduced during the partial Olist migration, Railway deploy will fail. Local build verification is essential.

---

## Summary: 8-Hour Critical Path

```
Hour 0-0.5:  Fix page.tsx (SEGMENT_STATIC + user distribution)
Hour 0.5-1:  Update agent.ts explanation prompt
Hour 1-1.5:  npm run build → fix errors → push to Railway
Hour 1.5-2:  Verify Railway deploy, smoke test
Hour 2-3:    Update PPT with Olist numbers
Hour 3-3.5:  Rehearse demo flow (4 cached queries)
Hour 3.5-5:  PPT technical slides (architecture/compliance/production)
Hour 5-6:    Buffer / polish / second rehearsal
Hour 6-8:    Sleep (you need it for Demo Day)
```

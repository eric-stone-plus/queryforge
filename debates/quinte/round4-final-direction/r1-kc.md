QUINTE KC — Implementation Direction Analysis
===============================================

Reviewed: task-r1-final.md, src/lib/agent.ts, src/lib/db.ts, src/lib/demo-cache.ts, src/components/ChatPanel.tsx, src/components/Dashboard.tsx, src/components/MetricSidebar.tsx, src/app/page.tsx, src/app/api/chat/route.ts, src/app/api/query/route.ts, src/app/api/schema/route.ts

---

## Q1: Chat Quality

### Current State Analysis

The agent pipeline (`src/lib/agent.ts:106-190`) does a single LLM call that returns structured JSON with `thinking`, `intent`, `sql`, `chart_config`, `explanation`. The `explanation` field is constrained by the system prompt ("brief Chinese explanation") — this is the root cause of shallow responses.

ChatPanel (`src/components/ChatPanel.tsx:247`) renders explanation as a single `<p>` tag. No narrative structure, no auxiliary analysis.

### Recommendations

**1. Expand the system prompt's explanation instructions (MUST DO — 15 min)**

Change the system prompt in `agent.ts:36-44` to request structured narrative:

```
"explanation": "2-4 sentence analysis: (1) key finding, (2) business insight, (3) anomaly or trend callout. Written as if you are a data analyst presenting to a business stakeholder."
```

This is the highest ROI change — zero code architecture changes, just prompt engineering.

**2. Add a post-query enrichment step (NICE-TO-HAVE — skip if time is tight)**

After SQL execution succeeds, make a second lightweight LLM call with the actual data results to generate richer commentary. Implementation: add an `enrichExplanation()` function in `agent.ts` that takes `(query, data, explanation)` and returns enhanced narrative.

Trade-off: doubles LLM latency per query. For a demo, this hurts the "wow factor" of speed. **Skip this for Demo Day.**

**3. ChatPanel rendering improvement (MUST DO — 20 min)**

In `ChatPanel.tsx`, the explanation renders as plain text. Parse it into structured sections:

```tsx
// Instead of single <p>, split by numbered points or line breaks
{item.r.explanation?.split('\n').map((para, i) => (
  <p key={i} className="mb-2 text-xs leading-relaxed" ...>{para}</p>
))}
```

Also add a "data summary" section above the chart showing row count, top/bottom values, and percentage breakdowns extracted from `data`.

**Risk: LOW** — Prompt changes are safe (self-correction loop handles malformed responses). Rendering changes are cosmetic.

---

## Q2: PPT Technical Narrative

### Architecture Points to Include

Based on the actual codebase, here's what the PPT should cover:

**Backend Architecture (production path)**

| Current (Demo) | Production | Migration Path |
|---|---|---|
| SQLite (`better-sqlite3`) | PostgreSQL / MySQL | Swap `db.ts` — already isolated behind `getDb()`/`queryDb()` interface |
| Single-process Node.js | Containerized on Railway/Fly.io | `Dockerfile` + health checks |
| Kimi K2.7 API | Kimi API with fallback to GPT-4 | `agent.ts:11-15` already supports env-configurable provider |
| File-based DB | Cloud DB (Supabase, Neon, PlanetScale) | Connection string change |
| No auth | NextAuth.js + RBAC | Middleware layer |

**Key architectural advantage to highlight**: The `db.ts` abstraction layer (`src/lib/db.ts:6-16`) is a 16-line file that encapsulates all database access. Swapping SQLite for PostgreSQL requires changing only this file. The `queryDb()` interface is the single chokepoint — this is intentional separation of concerns.

**Data Compliance**

- **LLM isolation**: The system prompt (`agent.ts:33-63`) sends only the schema definition, zero actual data rows. The LLM generates SQL but never sees query results. This is a critical security property.
- **Read-only enforcement**: `db.ts:9` opens with `{ readonly: true }`. Even if SQL injection occurred, writes are impossible at the driver level.
- **SQL validation**: `agent.ts:67-77` uses `node-sql-parser` to enforce SELECT-only. The `/api/query` route (`src/app/api/query/route.ts:10-15`) applies the same validation independently.
- **Defense in depth**: Three layers — parser validation → readonly driver → no data in LLM context.

**Production Feasibility**

Present as a 3-phase roadmap:
1. **Now**: Demo with real Olist data, proves NL→SQL→Viz pipeline works
2. **Next**: Swap SQLite for cloud DB, add auth, deploy containers
3. **Scale**: Multi-tenant, role-based data access, audit logging, query caching

**Risk: MEDIUM** — Don't oversell. Judges will ask "why SQLite?" — answer honestly: "for demo speed, but the architecture is DB-agnostic by design" and show the `db.ts` abstraction.

---

## Q3: Implementation Priority

### Critical Path (MUST DO — ordered by dependency)

| # | Task | Time | Why Critical |
|---|---|---|---|
| 1 | **Verify build compiles** | 10 min | If build fails, nothing else matters. Run `npm run build` NOW. |
| 2 | **Fix page.tsx user distribution** (`page.tsx:299-308`) | 15 min | The "用户分层明细" section shows faker data (1000 users, ¥241K/person). Olist has 96K users with ~R$161 avg. Fix the `SEGMENT_STATIC` and distribution `MetricRow` values. |
| 3 | **Update system prompt for richer explanations** | 15 min | Per Q1 recommendation. Single file change in `agent.ts`. |
| 4 | **Update PPT with Olist numbers** | 45 min | Replace all faker-era numbers. Use real metrics from `page.tsx` KPI cards. |
| 5 | **Push + verify Railway deploy** | 30 min | Push to main, wait for Railway auto-deploy, smoke test the live URL. |
| 6 | **Rehearse demo flow** | 30 min | Run through the 3-4 demo queries end-to-end. Practice the narrative. |

### Nice-to-Have (SKIP if <2 hours remain)

| Task | Time | Risk |
|---|---|---|
| Improve ChatPanel explanation rendering | 20 min | Low impact for demo |
| Add more cached queries to `demo-cache.ts` | 15 min | Only matters if Kimi API is flaky |
| Theme polish | 10 min | Cosmetic |
| Update demo chips in ChatPanel (`DEMO_CHIPS` line 18-23) | 5 min | "复购率最高的用户分析" doesn't match any cache key — either rename to match cache or add the cache entry |

**Total critical path: ~2.5 hours**. This leaves ~5.5 hours buffer for unexpected issues.

**Risk: HIGH on build verification** — If the Olist migration introduced import/type errors, this could eat hours. Run build first.

---

## Q4: Data Compliance Narrative

### What's Already Implemented (use in PPT)

1. **Read-only database connection** — `db.ts:9`: `{ readonly: true, fileMustExist: true }`. The application literally cannot write to the database, even if compromised.

2. **LLM never sees data** — The system prompt (`agent.ts:33-63`) contains only table schemas and column names. Zero data rows are sent to Kimi. The LLM writes SQL "blind" — it knows the structure but not the contents.

3. **SQL injection prevention via AST parsing** — Both `agent.ts:67-77` and `api/query/route.ts:10-15` parse SQL into an AST and reject anything that isn't a single SELECT statement. This isn't regex filtering — it's structural validation.

4. **Automatic LIMIT enforcement** — `agent.ts:73-76` and `api/query/route.ts:57` both cap results at 500 rows, preventing accidental full-table scans.

### Future Features (mention briefly in PPT)

- **Role-based access control (RBAC)**: Different users see different data scopes. Regional managers see only their region's data.
- **Audit logging**: Every SQL query generated and executed is logged with user ID, timestamp, and result row count.
- **Data masking**: PII fields (email, name) can be masked at the query layer before returning to the LLM or user.
- **Query rate limiting**: Prevent abuse by limiting queries per user per minute.

### PPT Narrative Frame

> "QueryForge implements a three-layer data security model: (1) the AI never receives raw data — only schema metadata, (2) the database driver enforces read-only access at the OS level, and (3) every generated query is structurally validated against a SQL parser before execution. This means even if the AI model is compromised or prompt-injected, it cannot exfiltrate data or modify the database."

**Risk: LOW** — This is accurate to the current codebase. No overselling.

---

## Q5: Railway Deployment Strategy

### Pre-Deploy Checklist

1. **Local build test** — `npm run build` must pass. The Olist migration may have broken imports or types. Check especially:
   - `page.tsx` — static data arrays match expected types
   - `agent.ts` — system prompt schema matches actual DB schema
   - `demo-cache.ts` — cached SQL actually executes against Olist data

2. **DB file size** — The Olist SQLite file (99K orders) is likely 10-30MB. Railway has no file size issues, but verify `data/ecommerce.db` is committed or available at runtime. If it's in `.gitignore`, you need a build script to seed it.

3. **Environment variables** — Ensure these are set in Railway:
   - `KIMI_API_KEY` (or `AI_API_KEY`)
   - `KIMI_MODEL` (should be set for K2.7)
   - `KIMI_BASE_URL`

### Risks and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Build fails on Railway | Medium | Test `npm run build` locally first |
| Kimi API timeout during demo | Medium | `demo-cache.ts` handles this — cached queries return instantly. Ensure demo uses cached queries first. |
| DB not available at runtime | Low | Check if `data/` dir is in Railway's filesystem or if you need a volume mount |
| Old deployment cached | Low | Railway auto-deploys on push, but check the deploy log for confirmation |
| Olist data inconsistencies | Low | Run a few test queries via `/api/query` endpoint after deploy |

### Fallback Strategy

**Do NOT keep old faker data as fallback.** The demo narrative is "real Brazilian e-commerce data" — reverting to fake data mid-demo is worse than a brief outage.

Instead, rely on `demo-cache.ts` as the fallback. If Kimi API fails, the 4 cached queries still work with real Olist data. Practice the demo so that the first 2-3 queries use cached entries ("各地区月度销售额趋势", "哪个品类利润率最高？", "Top 10 畅销商品").

### Deploy Sequence

```
1. npm run build                    # verify locally
2. git add . && git commit -m "olist migration complete"
3. git push origin main             # triggers Railway auto-deploy
4. Wait 2-3 min, check Railway dashboard for green status
5. curl https://queryforge-production-8d6f.up.railway.app/api/schema  # smoke test
6. Test cached query via browser devtools or Postman
```

**Risk: MEDIUM** — The main risk is build failure from the migration. Everything else is operational and well-handled by existing fallback mechanisms.

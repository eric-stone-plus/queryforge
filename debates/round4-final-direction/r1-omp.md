# QUINTE R1 — Final Implementation Direction (Pre-Demo)

## Q1: Chat Quality

**Problem:** The current `agent.ts` system prompt treats the LLM as a SQL generator. The `explanation` field is an afterthought — one line of Chinese. The user explicitly wants "文字叙述和辅助分析" (narrative + auxiliary analysis).

**Recommendation: Single LLM call, richer system prompt.** A second LLM call adds latency (already 5-10s per query with Kimi) and complexity. Instead, restructure the system prompt to demand a richer `explanation`.

### Specific changes to `agent.ts` system prompt:

```
Replace the current "explanation" instruction with:

"explanation": "一段完整的分析报告（150-250字中文），包含：
1. 数据结论：用数字说话，给出关键指标
2. 趋势/对比：与什么比较，是高是低
3. 业务建议：基于数据给出1-2条可执行建议
4. 数据局限性：说明任何需要注意的数据特点"
```

This single change transforms the output from a caption into an analyst's note. No architecture change needed — the `explanation` field already exists and is already rendered in `ChatPanel.tsx` (line 247, 290).

**Additional quality improvements:**

1. **Fix `temperature`**: Currently `AI_TEMPERATURE=1`. Lower to `0.3` for more consistent, analytical output. High temperature makes the LLM creative but unreliable for data analysis.

2. **Add `intent` display**: The `intent` field is generated but never shown. Add it as a subtle label above the chart in ChatPanel — gives the user confidence the AI understood their question.

3. **Fix the `thinking` field visibility**: It's hidden behind a `<details>` toggle (line 224). For demo, consider showing it by default — it demonstrates the AI's reasoning chain, which impresses judges.

**Risk:** The Kimi LLM may not consistently produce 200-word explanations. **Mitigation:** The cached queries in `demo-cache.ts` should have polished explanations pre-written. Demo with cached queries first.

---

## Q2: PPT Technical Narrative

**Recommendation: Three-layer architecture story.** Don't try to cover everything. Pick three concrete technical points and make them land.

### Layer 1: Backend Architecture (how it scales beyond SQLite)

**Current state → Production path:**
- **Now:** SQLite + Next.js API routes. Single-file DB, zero config, perfect for demo.
- **Phase 1:** Swap SQLite for PostgreSQL. The `queryDb()` function in `db.ts` is the single point of abstraction — change the driver, nothing else changes.
- **Phase 2:** Add connection pooling (PgBouncer) and read replicas for analytics queries.
- **Phase 3:** Cache layer (Redis) for frequent queries. Current `demo-cache.ts` pattern becomes a production cache invalidation strategy.

**Key point for judges:** "The SQL generation is database-agnostic. The LLM generates standard SQL — we swap the database engine without touching the AI layer."

### Layer 2: Data Compliance

This is where you differentiate from "toy project":

1. **Schema-only exposure**: The LLM sees table/column names, never row data. This is already implemented — the system prompt sends the schema, not the data. **This is your strongest point.**

2. **Read-only enforcement**: `validateSelectOnly()` in agent.ts uses `node-sql-parser` to parse the AST and reject anything that isn't a SELECT. **This is already implemented.** Show the code.

3. **Row-level security (production roadmap)**: PostgreSQL RLS policies restrict which rows a user can query. Example: regional managers only see their region's data.

4. **Audit logging (production roadmap)**: Every generated SQL + execution result gets logged with user ID + timestamp. Compliance requirement for financial/healthcare data.

**Framing:** "QueryForge never touches raw data. The AI generates SQL; the database enforces access. This is the same pattern used by Snowflake Cortex and Databricks AI/BI."

### Layer 3: Production Feasibility

**Concrete numbers:**
- Kimi K2.7 API: ~$0.003/query (input ~2K tokens, output ~500 tokens)
- SQLite → PostgreSQL migration: 1 day (driver swap + connection string)
- Auth layer: NextAuth.js + 2 days
- Total: **1 week to production-ready MVP**

**Risk:** Judges may ask "why not just use Metabase/Superset?" **Answer:** Those require analysts to know SQL or build dashboards. QueryForge lets any business user ask questions in natural language. The AI handles the SQL complexity.

---

## Q3: Implementation Priority (8 hours)

### Critical Path (MUST do — in order):

| Priority | Task | Time | Risk |
|----------|------|------|------|
| **P0** | Verify build compiles (`npm run build`) | 15 min | Build errors block everything |
| **P0** | Fix `SEGMENT_STATIC` in page.tsx (lines 69-74) | 10 min | Currently shows faker data — `vip/new/enterprise` all have 0 users |
| **P0** | Fix user distribution section (lines 299-308) | 15 min | Shows "1,000 人" — should be 96,096 or removed |
| **P0** | Push to GitHub → Railway auto-deploy | 30 min | Need to verify Railway env vars (KIMI_API_KEY) |
| **P1** | Update cached query explanations in demo-cache.ts | 30 min | Makes demo flow smooth |
| **P1** | Update system prompt for richer explanations | 20 min | Improves live demo quality |

### Nice-to-have (skip if time is tight):

| Priority | Task | Why defer |
|----------|------|-----------|
| P2 | Update PPT numbers | Can present verbally if needed |
| P2 | Add intent display in ChatPanel | Minor UX polish |
| P2 | Lower temperature to 0.3 | Cached queries bypass this anyway |

### Recommended sequence:
1. `npm run build` — if it fails, fix that first (30 min budget)
2. Fix `SEGMENT_STATIC` and user distribution section in page.tsx (25 min)
3. Enhance system prompt explanation requirements (20 min)
4. Push to GitHub, verify Railway deployment (45 min)
5. Polish cached query explanations (30 min)
6. Rehearse demo flow with cached queries (30 min)

**Total: ~3 hours.** Leaves 5 hours buffer for unexpected issues.

---

## Q4: Data Compliance Narrative

### What to emphasize (already implemented):

1. **Schema-only LLM exposure** — The system prompt (agent.ts:33-63) sends only table names and column types. The LLM generates SQL without ever seeing customer emails, order amounts, or any PII. This is the core architectural decision.

2. **AST-level SQL validation** — `validateSelectOnly()` (agent.ts:67-77) parses the generated SQL into an AST using `node-sql-parser` and rejects anything that isn't a single SELECT statement. No INSERT, UPDATE, DELETE, DROP, or CREATE possible.

3. **Automatic LIMIT injection** — If the LLM forgets LIMIT, the system appends `LIMIT 500` (agent.ts:74). Prevents accidental full-table scans.

### What to add to the PPT narrative:

4. **Prompt injection defense (future)** — The LLM could be tricked into generating malicious SQL. Mitigation: parameterized queries + SQL firewall (e.g., SqlGlot validation layer).

5. **Data residency** — For Brazilian LGPD compliance: data stays in São Paulo region. For Chinese data: 数据不出境, 本地部署 LLM 或使用国内 API。

6. **Zero-retention API** — Kimi API does not store query logs by default. For extra compliance: use on-premise LLM deployment (already possible with the current architecture — swap `KIMI_BASE_URL`).

### One-liner for judges:
> "The AI sees the blueprint, not the building. It knows there's a table called 'orders' with a 'total_amount' column — but it never sees a single order."

---

## Q5: Railway Deployment Strategy

### Risks and mitigations:

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Build fails on Railway (Node version mismatch) | Medium | High | Pin Node version in `engines` field of package.json |
| KIMI_API_KEY not set in Railway env | Low | Critical | Verify in Railway dashboard before push |
| SQLite file not included in deploy | Medium | Critical | Check `.railwayignore` — ensure `.sqlite` file is included OR use Railway volume |
| API timeout (Kimi slow during demo) | Medium | Medium | Use cached queries for demo flow; live queries as bonus |
| Olist data not seeded on Railway | Medium | Critical | Verify the seed script runs during build or the DB file is committed |

### Deployment checklist:

1. **Before push:**
   - `npm run build` locally — fix any TypeScript/build errors
   - Verify `KIMI_API_KEY` is set in Railway environment variables
   - Check if SQLite DB is committed to repo or needs Railway volume mount

2. **After push:**
   - Wait for Railway build to complete (~2-3 min)
   - Test: open the Railway URL, verify KPI cards show Olist numbers
   - Test: click one cached query chip, verify it returns data
   - Test: type a custom query, verify LLM response works

3. **Fallback strategy:**
   - Keep a `git stash` or branch with the old working code
   - If Railway deploy fails, revert the last commit and re-push
   - **Do NOT keep old data as fallback** — mixed data (old faker + new Olist) will confuse judges more than a clean Olist demo

### Critical: The SQLite file problem.

Railway deploys are ephemeral by default. If the SQLite database file isn't:
- (a) committed to the repo, or
- (b) on a Railway persistent volume

...the deployed app will have an empty database. **Verify this immediately.** Check if there's a `data/` or `db/` directory with a `.sqlite` file in the repo.

---

## Summary: What to do in the next 8 hours

1. **Build verification** — `npm run build`, fix errors (30 min)
2. **Fix page.tsx faker remnants** — SEGMENT_STATIC and user distribution (25 min)
3. **Enhance system prompt** — richer explanations, lower temperature (20 min)
4. **Deploy to Railway** — push, verify, test (45 min)
5. **Polish demo cache** — better explanations for 4 cached queries (30 min)
6. **Rehearse demo** — practice the flow, prepare for "what if it fails" scenario (30 min)

**Skip:** PPT updates (present verbally), ChatPanel UI changes, new features.

The demo should feel like: "I ask a question in Chinese → AI thinks → SQL appears → chart renders → analyst-grade explanation appears." That's the story. Everything else is noise.

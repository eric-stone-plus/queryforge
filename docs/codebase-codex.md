# QueryForge — Codebase Codex

> AI 商业数据分析智能体 · Next.js 14 + MiMo v2.5 Pro + SQLite
> Last updated: 2026-07-04

---

## 1. Project Overview

QueryForge is an AI-powered data analysis platform that converts natural language questions (Chinese) into SQL queries, executes them against a SQLite ecommerce database, and returns visualized results with explanations.

**Core value proposition**: Business users self-serve data queries without waiting for analysts.

**Key features**:
- Natural language → SQL → charts (bar/line/pie/area)
- Self-correction loop (SQL errors auto-fixed by LLM)
- SSE streaming progress updates
- Analyst-defined metric library (save/reuse)
- Offline fallback (demo cache)
- Dark/light theme

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 14.2.35 |
| Language | TypeScript (strict) | 5.x |
| UI | React + Tailwind CSS + Recharts | 18.x / 3.4.x / 3.x |
| AI | MiMo v2.5 Pro via Vercel AI SDK | ai@7.x |
| Database | SQLite via better-sqlite3 | 12.x |
| SQL Safety | node-sql-parser (AST validation) | 5.x |
| Deployment | Railway (cloud) + SwiftUI WebView (desktop) | — |

---

## 3. Directory Structure

```
data-agent/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts        # POST — SSE streaming chat endpoint
│   │   │   ├── query/route.ts       # POST — Direct SQL execution
│   │   │   └── schema/route.ts      # GET  — DB schema metadata
│   │   ├── globals.css              # Tailwind + CSS custom properties
│   │   ├── layout.tsx               # Root layout (zh-CN, dark default)
│   │   └── page.tsx                 # Main dashboard page
│   ├── components/
│   │   ├── ChatPanel.tsx            # Chat UI + SSE parsing + chart rendering
│   │   ├── Dashboard.tsx            # Standalone chart component (UNUSED)
│   │   └── MetricSidebar.tsx        # Saved metrics sidebar
│   └── lib/
│       ├── agent.ts                 # AI agent: LLM + SQL validation + self-correction
│       ├── db.ts                    # SQLite singleton (readonly)
│       └── demo-cache.ts           # Pre-cached demo results
├── data/
│   └── ecommerce.db                # SQLite DB (10K orders, 500 products, 1K users)
├── scripts/
│   ├── seed.ts                     # Database seeder (faker.js)
│   ├── get-metrics.js              # KPI extraction utility
│   ├── gen-ppt.py                  # PPT generation v1
│   └── gen-ppt-v2.py               # PPT generation v2
├── desktop/
│   ├── QueryForge.swift            # macOS SwiftUI wrapper
│   ├── server.js                   # Standalone Node.js server (parallel impl)
│   └── build_macos.sh              # Build script
├── docs/                           # Documentation
├── debates/                        # QUINTE adversarial review transcripts
├── criteria/                       # Scoring criteria
├── assets/                         # Design resources
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs                 # Empty config
└── .env.local                      # API keys (gitignored)
```

---

## 4. Architecture

### 4.1 Data Flow

```
User (natural language, Chinese)
  │
  ▼
POST /api/chat ──→ runAgent() ──→ MiMo v2.5 Pro
  │                      │              │
  │                      │         JSON: { thinking, intent, sql, chart_config, explanation }
  │                      │              │
  │                      ▼              ▼
  │               validateSelectOnly() ← node-sql-parser AST
  │                      │
  │                      ▼
  │               queryDb(sql) → better-sqlite3 (readonly)
  │                      │
  │                 ┌────┴────┐
  │               success    failure
  │                 │          │
  │                 ▼          ▼
  │               done     self-correction loop
  │                         (error + SQL → LLM → retry)
  │                              │
  │                         ┌────┴────┐
  │                       success    failure → throw
  │
  ▼
SSE stream: progress → result (or error)
```

### 4.2 Agent Pipeline (`src/lib/agent.ts`)

Single-function pipeline `runAgent(query, onProgress?)` → `AgentResult`:

1. **Analyze** — Send query + full DB schema to MiMo LLM (30s timeout)
2. **Parse** — Extract JSON from LLM response (handles markdown fences, bracket-depth tracking)
3. **Validate** — AST-parse SQL, enforce SELECT-only, auto-append LIMIT 500
4. **Execute** — Run against SQLite via better-sqlite3
5. **Self-correct** — On failure, send original SQL + error back to LLM for one retry

**Key types**:
- `AgentResult` — `{ thinking, intent, sql, data, chartConfig, explanation, corrected?, correctionNote? }`
- `AgentProgress` — `{ step: "analyzing"|"generating_sql"|"executing"|"correcting"|"done"|"error", message }`

### 4.3 API Routes

| Route | Method | Purpose | Input | Output |
|-------|--------|---------|-------|--------|
| `/api/chat` | POST | AI chat (streaming) | `{ message: string }` | SSE stream |
| `/api/query` | POST | Direct SQL execution | `{ sql: string }` | `{ rows, error }` |
| `/api/schema` | GET | DB schema metadata | — | JSON schema |

### 4.4 Database Schema (ecommerce.db)

```
regions(id, name, country)                              # 8 rows
categories(id, name, parent_id)                         # 20 rows (hierarchical)
products(id, name, category_id, sku, unit_cost, unit_price, created_at)  # 500 rows
users(id, name, email, region_id, segment, registered_at)               # 1000 rows
orders(id, user_id, region_id, order_date, status, total_amount, channel)  # 10000 rows
order_items(id, order_id, product_id, quantity, unit_price, discount)      # ~25000 rows
```

**Join rules** (in LLM system prompt):
- `orders.user_id = users.id`
- `orders.region_id = regions.id`
- `order_items.order_id = orders.id`
- `order_items.product_id = products.id`
- `products.category_id = categories.id`

**Revenue formula** (critical): `SUM(oi.quantity * oi.unit_price * (1 - oi.discount))` — NEVER use `orders.total_amount`.

**User segments**: regular, vip, new, enterprise

---

## 5. Key Patterns & Conventions

### 5.1 Styling

- **CSS custom properties** for theming: `var(--bg)`, `var(--surface)`, `var(--text)`, `var(--border)`, `var(--accent)`, etc.
- **Theme toggle**: `data-theme="dark|light"` on `<html>`, persisted in `localStorage("queryforge-theme")`
- **Tailwind utilities** for layout; inline `style={{}}` for theme-aware colors
- **Design system**: GitHub-inspired dark/light palette in `globals.css`
- **Default theme**: dark

### 5.2 Component Patterns

- **Functional components** with hooks (no class components)
- **`"use client"` directive** on interactive components
- **Inline chart rendering** in `page.tsx` (NOT using `Dashboard.tsx`)
- **Recharts** for all visualizations (Bar, Line, Pie, Area)
- **SSE parsing** in ChatPanel: manual `ReadableStream` + `TextDecoder`

### 5.3 AI Integration

- **Vercel AI SDK** (`ai` package) with `generateText()` — NOT `streamText()`
- **`@ai-sdk/openai-compatible`** provider for MiMo API (OpenAI-compatible endpoint)
- **Structured JSON output** via system prompt instructions (NOT function calling)
- **30-second timeout** via `AbortSignal.timeout(30000)`
- **Offline fallback**: 4 pre-cached demo queries in `demo-cache.ts`

### 5.4 Security

- **Read-only DB**: `new Database(path, { readonly: true, fileMustExist: true })`
- **SELECT-only enforcement**: `node-sql-parser` AST validation
- **Auto LIMIT 500**: Appended if missing
- **No auth/rate limiting**: Open endpoints (hackathon scope)

### 5.5 State Management

- **React `useState`** for local component state
- **`localStorage`** for theme preference and saved metrics
- **No global state manager** (no Redux, Zustand, etc.)
- **Props drilling** from `page.tsx` to children

---

## 6. Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MIMO_API_KEY` | Yes | — | API key for MiMo v2.5 Pro |
| `MIMO_BASE_URL` | No | `https://token-plan-cn.xiaomimimo.com/v1` | MiMo API endpoint |

Create `.env.local`:
```
MIMO_API_KEY=your-key-here
MIMO_BASE_URL=https://token-plan-cn.xiaomimimo.com/v1
```

---

## 7. Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint check (next/core-web-vitals)
npx tsc --noEmit         # TypeScript type check
npx tsx scripts/seed.ts  # Regenerate database from scratch
```

---

## 8. Key Files Reference

### `src/lib/agent.ts` (173 lines)

Core AI agent. Exports `runAgent(query, onProgress?)` → `AgentResult`.

- **LLM setup**: `createOpenAICompatible` provider for MiMo (lines 6-10)
- **System prompt**: Full DB schema + join rules + revenue formula + output format (lines 28-54)
- **`validateSelectOnly(sql)`**: AST-based SQL safety check (lines 58-68)
- **`extractJson(text)`**: Robust JSON extraction from LLM responses (lines 70-85)
- **`tryExecute(sql)`**: Safe SQL execution wrapper (lines 87-95)
- **Self-correction loop**: One retry with error context (lines 133-172)

### `src/app/api/chat/route.ts` (47 lines)

SSE streaming chat endpoint. Calls `runAgent()`, streams progress/result/error. Falls back to `CACHED_RESULTS` on API failure.

### `src/app/api/query/route.ts` (80 lines)

Direct SQL execution. Validates SELECT-only via AST, auto-appends LIMIT 500.

**Known issue**: Creates its own DB connection per request instead of using singleton from `lib/db.ts`.

### `src/app/page.tsx` (293 lines)

Main dashboard page:
- 8 KPI cards (hardcoded values)
- 6 chart panels (region, category, channel, monthly trend, top products, user segments)
- ChatPanel + MetricSidebar integration
- Theme toggle

### `src/components/ChatPanel.tsx` (341 lines)

Chat interface:
- Text input form
- SSE stream parsing
- Progress step visualization (brain → gear → chart → wrench → checkmark)
- Chart rendering (bar/line/pie/area)
- Query history
- Save metric button

### `src/components/MetricSidebar.tsx` (100 lines)

Left sidebar for saved metrics:
- `localStorage` persistence
- 6 pre-seeded default metrics
- Run/delete actions

### `src/lib/db.ts` (16 lines)

SQLite singleton. Exports `getDb()` and `queryDb(sql)`. Readonly connection to `data/ecommerce.db`.

### `src/lib/demo-cache.ts` (31 lines)

Pre-cached results for 4 demo queries: regional trends, category margins, top products, repeat customers.

---

## 9. Known Issues & Tech Debt

| Issue | Severity | Location | Notes |
|-------|----------|----------|-------|
| DB connection leak | Medium | `api/query/route.ts:19-23` | New connection per request, not using singleton |
| `require()` in TS | Low | `api/query/route.ts:20` | Should use ES import |
| Dead component | Medium | `components/Dashboard.tsx` | 214 lines, never imported |
| Duplicate COLORS | Low | 3 files | Different values in each copy |
| Duplicate ChartConfig | Low | 2 files | Different shapes |
| Unused imports | Low | `ChatPanel.tsx`, `page.tsx` | `FormEvent`, `Legend` |
| Zero test coverage | High | — | No test files or framework |
| No Error Boundaries | Medium | — | Component crash = white screen |
| npm audit: 8 vulns | High | `next@14`, `glob`, `minimatch`, `postcss` | Mostly from Next.js 14 |
| Unused dependencies | Low | `package.json` | `@ai-sdk/openai`, `openai`, `sql.js`, `lucide-react` |
| DB file in git | Low | `data/ecommerce.db` | Should be gitignored + seeded |
| Empty next.config | Low | `next.config.mjs` | No security headers, CSP, etc. |
| No `.env.example` | Low | — | Missing template for contributors |
| Hardcoded paths | Low | `scripts/gen-ppt*.py` | Absolute paths to user's machine |

---

## 10. Desktop App

The `desktop/` directory contains a **parallel reimplementation** of the agent pipeline:

- **`server.js`** (255 lines) — Standalone Node.js HTTP server, no Next.js
- **`QueryForge.swift`** — SwiftUI macOS wrapper with WebView
- Same LLM call, same SQL validation, same cached results
- **No code sharing** with the Next.js version
- Runs on port 18000

---

## 11. QUINTE Adversarial Review

The project underwent a 3-round adversarial review (see `debates/`):

1. **Round 1 — Code Audit**: Security, performance, vulnerabilities
2. **Round 2 — Direction**: Product-market fit, feature prioritization
3. **Round 3 — Polish**: UX, design, interaction flow

Each round: 5 independent AI reviewers. Action items in `docs/PROJECT-MEMO.md`.

---

## 12. Deployment

- **Cloud**: Railway (auto-deploy from git, `.railwayignore` present)
- **Desktop**: macOS x86_64 app (SwiftUI WebView → local Node.js on port 18000)
- **Build**: `npm run build` → Next.js output
- **Production URL**: `queryforge-production-8d6f.up.railway.app`

---

## 13. Seed Data

Generated by `scripts/seed.ts` using `@faker-js/faker` with Chinese locale (`fakerZH_CN`):

- 8 regions (西南, 华中, 华南, 西北, 华东, 港澳台, 华北, 东北)
- 20 categories (hierarchical with `parent_id`)
- 500 products (with SKU, cost, price)
- 1000 users (segments: regular, vip, new, enterprise)
- 10,000 orders (date range 2024-2026, statuses: completed/refunded/shipped/pending/cancelled)
- ~25,000 order items

To regenerate: `npx tsx scripts/seed.ts`

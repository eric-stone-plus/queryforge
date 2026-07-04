# QUINTE R1 — CodeWhale Review: Final Direction (Pre-Demo)

**Date:** 2026-07-04
**Reviewer:** CodeWhale
**Scope:** Full source audit of QueryForge codebase + task-r1-final.md questions

---

## Q1: Chat Quality — From SQL Generator to Data Analyst

### Diagnosis

The current `agent.ts` system prompt instructs the model to return a single JSON object with a brief `explanation` field. The problem is structural: the system prompt literally says `"explanation": "brief Chinese explanation"`. This trains the model to output a one-liner, not an analysis.

The ChatPanel.tsx renders the explanation as a single `<p>` tag above the chart (line 247). There's no narrative structure, no insight layer, no actionable takeaway.

### Recommendation: Three-Layer Narrative System

**Layer 1: Enrich the system prompt** (agent.ts, ~15 min)

Replace the `explanation` field instruction with a structured narrative:

```
"narrative": {
  "summary": "一句话结论（如：华东区Q4营收环比增长23%）",
  "insight": "1-2句分析洞察，引用具体数据点，对比历史或环比",
  "recommendation": "1句业务建议（如：建议加大华南区投放）"
}
```

The key change: tell the model to **cite specific numbers from the query results** in its narrative. Currently the model generates explanation before seeing actual data (it's in the same JSON response as the SQL). This is fine — the model knows what the SQL will return from its own reasoning.

**Layer 2: Render structure in ChatPanel.tsx** (~20 min)

Replace the single `<p>{explanation}</p>` with three distinct sections:
- **Summary** (bold, larger font) — the headline finding
- **Insight** (normal, with data points) — the analytical narrative
- **Recommendation** (accent color, actionable) — the "so what"

Each with its own visual treatment. Use a collapsible "详细分析" section for longer insights.

**Layer 3: Add a fallback path** (already exists)

Keep `explanation` as a fallback. If the model returns `explanation` instead of `narrative`, render it as-is. The cached results in `demo-cache.ts` already use `explanation` — update them to use `narrative` format.

### Do NOT Add a Second LLM Call

A second call would double latency (~6-12s total) and cost. The single-call approach with a richer prompt is sufficient. Kimi K2.7 can handle structured narrative generation in one pass — the model just needs better instructions.

### Specific Changes

**agent.ts** — Update system prompt JSON schema:
```diff
- "explanation": "brief Chinese explanation"
+ "narrative": {
+   "summary": "一句话数据结论",
+   "insight": "1-2句分析洞察，引用具体数字",
+   "recommendation": "1句业务建议"
+ }
```

**agent.ts** — Update return type and extractJson mapping:
```diff
- explanation: (obj.explanation as string) ?? "",
+ explanation: (obj.explanation as string) ?? "",
+ narrative: obj.narrative as { summary?: string; insight?: string; recommendation?: string } | undefined,
```

**ChatPanel.tsx** — Add narrative rendering block (before chart):
```tsx
{(item.r.narrative || item.r.explanation) && (
  <div className="mb-3 space-y-1.5 rounded-lg p-3 text-sm" style={{ background: "var(--surface-hover)" }}>
    {item.r.narrative?.summary && (
      <p className="font-medium" style={{ color: "var(--text)" }}>{item.r.narrative.summary}</p>
    )}
    {item.r.narrative?.insight && (
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.r.narrative.insight}</p>
    )}
    {item.r.narrative?.recommendation && (
      <p className="text-xs font-medium" style={{ color: "var(--accent)" }}>💡 {item.r.narrative.recommendation}</p>
    )}
    {!item.r.narrative && item.r.explanation && (
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.r.explanation}</p>
    )}
  </div>
)}
```

**demo-cache.ts** — Update all 4 cached entries to use `narrative` format instead of `explanation`.

### Impact
- **Chat quality:** Transforms from "SQL + chart" to "data analyst briefing"
- **Latency:** Zero increase (same single LLM call)
- **Demo risk:** Low — worst case, model still returns `explanation`, fallback renders it

---

## Q2: PPT Technical Narrative

### Current Problem
The current PPT focuses on features (取数、可视化、纠错、指标库). The user wants a "how would this work as a real product" narrative.

### Recommended Technical Narrative Structure

**Slide 1: Architecture Diagram (Backend)**
```
[用户提问] → [Next.js API Route] → [Kimi K2.7 语义理解] → [SQL生成]
                                                              ↓
[数据看板] ← [Recharts 可视化] ← [JSON结果] ← [SQLite 只读查询]
                                                              ↓
[SQL错误] → [自动纠错循环] → [重新生成] → [重试执行]
```

**Slide 2: From Demo to Production — Scaling Path**

| 组件 | Demo (当前) | Production (扩展) |
|------|------------|-------------------|
| 数据库 | SQLite 单文件 | PostgreSQL / ClickHouse |
| AI模型 | Kimi K2.7 API | 多模型路由 (Kimi + GPT-4 + 本地模型) |
| 部署 | Railway 单实例 | K8s + 读写分离 + CDN |
| 认证 | 无 | NextAuth + RBAC 角色权限 |
| 缓存 | 本地缓存 | Redis + CDN 边缘缓存 |
| 监控 | 无 | Sentry + 自定义指标埋点 |

**Slide 3: Data Compliance Architecture**

核心原则：**LLM不接触业务数据**

```
[用户查询] → [AI只看到Schema] → [生成SQL模板] → [服务端执行] → [结果返回前端]
                 ↑ 不看数据           ↑ 参数化        ↑ 只读连接        ↑ 条数限制
```

- LLM只接收表结构（表名、字段名、类型），不接收任何业务数据
- SQL通过AST解析器校验，只允许SELECT语句
- 数据库连接配置为readonly模式
- 自动追加LIMIT限制（默认500条）

**Slide 4: Production Feasibility Checklist**

- ✅ 已实现：只读SQL、AST安全校验、自动纠错、指标库
- 🔄 近期可做：RBAC角色权限、审计日志、查询缓存
- 📋 中期规划：多数据源接入、API限流、数据脱敏

### Key Talking Points for Judges
1. "我们选择SQLite是因为hackathon场景，但架构是数据库无关的——换PostgreSQL只需改一个连接字符串"
2. "LLM不接触数据是架构层面的安全保障，不是应用层的补丁"
3. "智能纠错不是简单的重试——我们把错误信息反馈给AI，让它理解错误原因并修正"

---

## Q3: Implementation Priority (8 Hours)

### Critical Path (Must Do — 4 hours)

| 序号 | 任务 | 时间 | 依赖 | 风险 |
|------|------|------|------|------|
| 1 | **修复page.tsx用户分布区域** — 当前仍显示faker数据 | 20min | 无 | 低 |
| 2 | **构建验证** — `npm run build`确认编译通过 | 15min | 无 | 中 |
| 3 | **更新agent.ts系统提示词** — 添加narrative结构 | 30min | 无 | 低 |
| 4 | **更新ChatPanel.tsx** — 渲染narrative | 20min | #3 | 低 |
| 5 | **更新demo-cache.ts** — 4条缓存查询适配narrative | 15min | #3 | 低 |
| 6 | **Railway部署** — push + 验证 | 30min | #2 | 高 |
| 7 | **Demo排练** — 3分钟流程×5 | 2h | #1-6 | 中 |

**总时间：~4小时** (不含排练)

### Nice to Have (If Time Permits — 2 hours)

| 任务 | 时间 | 影响 |
|------|------|------|
| 更新PPT数字（Olist真实数据） | 1h | 中 |
| 更新MetricSidebar默认指标说明 | 15min | 低 |
| 添加客户端超时（ChatPanel fetch） | 15min | 低 |
| 清理page.tsx中SEGMENT_STATIC旧数据 | 15min | 中 |

### Skip (时间不够就不做)

- Wiring Dashboard.tsx — page.tsx已有内联图表，Dashboard.tsx是备用组件
- 删除死代码/未使用的依赖
- 添加ErrorBoundary
- 更新/api/schema端点

### Decision Matrix

**"Demo能不能跑通？"** — 这是唯一的评判标准。

如果 `npm run build` 失败，所有其他工作都是零。所以：
1. 先跑build
2. 再修page.tsx的faker残留
3. 然后改chat质量
4. 最后部署

---

## Q4: Data Compliance Narrative

### 核心论点：架构级安全 > 功能级安全

**不要说：** "我们加了安全功能"
**要说：** "我们的架构从设计上就排除了数据泄露的可能"

### 三层安全架构

**第一层：LLM零数据接触**
- AI模型只看到数据库Schema（表名、字段名、数据类型）
- 不看到任何一行业务数据
- 即使模型被攻击，攻击者也拿不到数据

**第二层：SQL执行沙箱**
- AST解析器（node-sql-parser）在语法树级别拦截非SELECT语句
- 只读数据库连接（better-sqlite3 readonly模式）
- 自动行数限制（LIMIT 500）

**第三层：生产级扩展（路线图）**
- RBAC角色权限（分析师定义指标，业务人员查询）
- 审计日志（记录所有查询）
- 数据脱敏（敏感字段自动遮蔽）
- API限流（防滥用）

### 关于Olist数据集的说明

Olist是巴西公开电商数据集（Kaggle），包含真实但匿名化的交易数据。在生产环境中：
- 需要LGPD（巴西数据保护法）合规
- 需要数据脱敏（PII字段如姓名、邮箱、地址）
- 需要访问审计

当前demo展示了架构层面的安全设计，生产部署时只需补充合规层。

---

## Q5: Railway Deployment Strategy

### 风险评估

| 风险 | 概率 | 影响 | 缓解方案 |
|------|------|------|----------|
| better-sqlite3 native module编译失败 | 中 | 高 | Railway支持native modules，但需确认buildpack |
| Olist数据库文件过大 | 低 | 中 | 当前~10MB，应该没问题 |
| Kimi API在Railway环境超时 | 低 | 中 | AI_TIMEOUT_MS已配置为60s |
| 环境变量未设置 | 中 | 高 | 检查Railway dashboard的Variables页面 |
| 部署后缓存问题 | 低 | 低 | Railway每次部署都是全新环境 |

### 部署步骤

1. **确认环境变量**：`AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` 在Railway dashboard中已设置
2. **Push代码**：`git push origin main`（Railway自动部署）
3. **等待构建**：Railway构建通常需要3-5分钟
4. **验证功能**：
   - 访问 https://queryforge-production-8d6f.up.railway.app
   - 确认KPI卡片显示Olist数据
   - 测试一条缓存查询（如"各地区月度销售额趋势"）
   - 测试一条新查询（如"哪个品类利润率最高？"）

### 回滚策略

**不要保留旧数据的fallback。** Olist数据已经seed完成，旧faker数据在同一个数据库文件中已被覆盖。回滚意味着重新seed，这比修复更慢。

如果Railway部署失败：
1. 检查Railway构建日志
2. 如果是native module问题，考虑用 `sql.js` 替代 `better-sqlite3`（纯JS，无native依赖）
3. 如果是环境变量问题，直接在Railway dashboard中添加

### 本地Demo作为Plan B

如果Railway完全不可用，本地运行 `npm run dev` 也是可接受的demo方案。很多hackathon项目都是本地演示。

---

## 总结：8小时行动清单

### 前4小时（核心修复）
1. `npm run build` — 确认编译通过
2. 修复page.tsx用户分布区域（faker残留）
3. 更新agent.ts系统提示词（narrative结构）
4. 更新ChatPanel.tsx（渲染narrative）
5. 更新demo-cache.ts（适配narrative）

### 后4小时（部署+排练）
6. Push到main，触发Railway部署
7. 验证线上功能
8. 更新PPT数字（如果来得及）
9. Demo排练3分钟流程×5次

### 不做
- Dashboard.tsx wiring
- 死代码清理
- ErrorBoundary
- 客户端超时

**核心原则：Demo能跑 > 代码完美。先让系统工作，再优化细节。**

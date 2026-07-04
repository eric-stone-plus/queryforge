# QueryForge — 项目备忘录

## 当前状态
- 位置：~/Downloads/data-agent/
- Server：localhost:3456（需 `npx next dev -p 3456` 启动）
- 公共 URL：待部署 Railway
- QUINTE 审计：3 轮完成（代码审计 + 方向决策 + 打磨策略）

## 已完成
- Next.js 14 + Tailwind + shadcn/ui + Recharts + better-sqlite3 + Kimi K2.7
- 10 个源文件，698 行核心代码
- 4 个 demo 查询全部跑通（Kimi K2.7 / ClawHunt API，带缓存兜底）
- 离线 fallback（4 个查询预缓存，API 挂了自动用缓存）
- MetricSidebar 保存/复用功能
- LLM 30 秒超时 + auto LIMIT + SQL 安全校验
- 种子数据：10K orders, 25K order_items, 500 products, 1000 users, 8 regions
- QUINTE 五方对抗审查：3 轮 × 5 方 = 15 份独立审计报告

## R3 裁决行动清单（r3-polish-verdict.md）

### Phase 1: 核心修复 (3h)
1. 修复 metric rerun bug (15 min)
2. 接入 Dashboard.tsx (30 min)
3. KPI 摘要卡片 (1h)
4. 修复 extractJson 正则 (30 min)
5. API key 移到 env (5 min)
6. 客户端超时 + error boundary (30 min)

### Phase 2: 创新层 (3h)
7. SQL 自纠正循环 (2h)
8. Agent Thinking 可见步骤 (1h)

### Phase 3: 部署 (3h)
9. Railway 部署 (1-1.5h)
10. ClawHunt 上架 (30 min)
11. 清理死依赖 (15 min)
12. 数据表格 (1h)

### Phase 4: 路演 (3h)
13. PPT (1.5h)
14. 排练 3 分钟流程 ×5 (45 min)
15. 排练 5 分钟流程 ×3 (45 min)

## 预期目标

通过 QUINTE 对抗审查持续迭代，将产品从原型推进到准产品级。核心改进：
- 数据可信度：faker → Olist 真实数据（99K 订单）
- 对话质量：一句话摘要 → 分析师级报告
- 架构设计：单体 demo → 三层架构（语义层 + 验证式 Agent + 数据平面）
- 差异化定位：Text2SQL 工具 → 受控对话式分析层

## QUINTE 方法论
见 QUINTE-METHODOLOGY.md — 包含工具清单、成本分析、审查轮次和实际成果。

## 评分标准速查
1. Demo 现场可用 25 — 核心功能跑通，无 bug
2. 用户价值/PMF 20 — 真实痛点，明确用户群
3. 技术实现 20 — AI/Agent 用得到位
4. 创新性 15 — 差异化（最弱项，靠自纠正循环补）
5. 商业潜力 10 — SaaS 模式
6. 路演表达 10 — 故事性
7. 上架 ClawHunt +3，游园展示 +2

## Rules 已同步
- Codex: --sandbox danger-full-access，英文 prompt，默认规则
- QUINTE: 五方 codewhale/opencode/kilocode/kimicode+omp，artifact contract
- OMP: 模型 provider/model ID 需单独验证（无 -p flag）
- Model agents: provider ID 与 model ID 不能按控制台显示名猜测
- OpenCode: 用 cd 切目录，不用 --dir 或 -- 分隔符
- HIGHBALL: interrupt-tolerant dispatch

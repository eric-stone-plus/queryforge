# QueryForge

<p align="center">
  <img src="assets/icon_1024.png" alt="QueryForge" width="128">
</p>

<h3 align="center">让业务部门自助取数，解放数据分析师的重复需求</h3>

<p align="center">
  <a href="https://queryforge-production-8d6f.up.railway.app">在线演示</a> · 
  <a href="https://github.com/eric-stone-plus/queryforge/releases">macOS 桌面版</a> · 
  <a href="docs/DEV-ROADMAP.md">开发路线</a>
</p>

---

## 解决什么问题

数据分析师的日常：

- 业务侧反复提同样的取数需求
- 同一个指标，不同部门问 10 遍，改 10 遍
- 分析师 80% 时间在取数，只有 20% 做深度分析
- 业务等排期，简单需求也要等 1-3 天

**QueryForge 让分析师调整好底层数据和指标后，业务部门自己用自然语言抓取数据、生成看板、做异常分析、获取决策建议。**

分析师从"取数工具人"变成"数据架构师"。

## 产品能力

**自然语言取数** — 业务人员直接用中文提问（如"上个月销售额最高的 Top 10 商品"），系统自动解析意图、生成 SQL、查询数据库并返回可视化图表，无需学习任何查询语法。

**数据看板自动生成** — 8 个核心经营指标（GMV、订单量、客单价等）配合 6 个图表面板，全部从真实数据库实时加载，支持按时间范围筛选，帮助业务人员快速掌握经营全貌。

**指标异常分析** — 当数据出现波动时，系统自动识别异常点并分析可能原因（如"某品类销量下降 30%，可能与促销活动结束有关"），为业务决策提供数据支撑。

**决策建议** — 基于数据趋势和异常分析，系统提供可执行的业务建议，如库存调整、营销策略优化、成本控制方向等，帮助业务人员从数据洞察转化为行动。

**分析师预设指标库** — 分析师预先定义常用指标（如"活跃用户"的计算口径），业务人员在指标库中一键选择即可查询，确保全公司使用统一的指标定义，避免口径混乱。

**智能纠错** — 当查询出错（如 SQL 语法错误、字段名不匹配），系统自动识别错误原因、修正查询并重试，用户看到完整的修正过程和最终结果，无需手动调试。

## 工作原理

```
业务人员提问（自然语言）
       ↓
AI 理解意图，识别指标、时间范围、筛选条件
       ↓
生成 SQL 查询，发送到数据库
       ↓
返回数据 → 生成可视化图表 + 异常分析 + 决策建议
       ↓
若查询出错 → 自动诊断错误原因 → 修正 SQL → 重试查询
```

核心技术：MiMo v2.5 Pro 大模型负责语义理解，Vercel AI SDK 实现流式响应，better-sqlite3 提供安全的数据库访问，智能纠错机制确保查询成功率。

## QUINTE 对抗审查

本项目采用 [QUINTE](https://github.com/eric-stone-plus/QUINTE) 五方对抗审查协议进行质量把关：

- **代码审计** — 审查代码安全性、性能瓶颈、潜在漏洞，确保生产环境稳定可靠
- **方向决策** — 评估产品方向是否符合市场需求，功能优先级是否合理
- **打磨策略** — 优化用户体验、界面设计、交互流程，提升产品易用性

审查过程中发现了 SQL 注入防护不足、错误处理不完善、部分边界条件未处理等问题，均已修复。完整的审查报告见 `debates/` 目录。

## 技术路线

| 层 | 技术 |
|---|---|
| 前端 | Next.js 14 · Tailwind · Recharts · 深色/浅色主题 |
| 后端 | Next.js API Routes · 流式进度推送 |
| AI | MiMo v2.5 Pro · Vercel AI SDK · 智能纠错 |
| 数据 | better-sqlite3 · SQL 安全校验 · 自动限制 |
| 部署 | Railway 云端 24/7 · macOS 桌面版（SwiftUI） |
| 质量 | [QUINTE](https://github.com/eric-stone-plus/QUINTE) 对抗审查协议 |

## 快速开始

```bash
git clone https://github.com/eric-stone-plus/queryforge.git
cd queryforge && npm install

echo "MIMO_API_KEY=your_key" > .env.local
echo "MIMO_BASE_URL=https://token-plan-cn.xiaomimimo.com/v1" >> .env.local

npm run dev
# 访问 http://localhost:3000
```

## 项目结构

```
src/
  app/api/chat/route.ts     # 流式对话 API
  app/api/query/route.ts    # 数据查询 API
  app/page.tsx              # 主页：指标看板 + 对话面板
  components/ChatPanel.tsx   # 对话界面 + 图表渲染
  components/Dashboard.tsx   # 多图面板
  components/MetricSidebar.tsx # 分析师预设指标库
  lib/agent.ts              # AI 推理 + 智能纠错
  lib/db.ts                 # 数据库连接
  lib/demo-cache.ts         # 离线缓存
data/ecommerce.db           # 示例数据（10K 订单 · 500 商品）
desktop/
  QueryForge.swift          # macOS 桌面版
  server.js                 # 内嵌本地服务
docs/                       # 项目文档
  DEV-ROADMAP.md            # 开发路线
  QUINTE-METHODOLOGY.md     # 对抗审查方法论
  PROJECT-MEMO.md           # 项目备忘
assets/                     # 设计资源
  QueryForge-Pitch.pptx     # 路演 PPT
debates/                    # 审计报告
  round1-code-audit/        # 代码审计
  round2-direction/         # 方向决策
  round3-polish/            # 打磨策略
```

## 安全机制

- **只读访问** — 系统仅允许 SELECT 查询，从根源上防止数据被误修改或删除，确保业务数据安全
- **返回条数限制** — 自动限制查询返回行数（默认 1000 行），防止大查询导致数据库卡死或内存溢出
- **数据库只读连接** — 数据库连接配置为只读模式，即使代码出现漏洞也无法执行写操作
- **API Key 安全管理** — 所有密钥通过环境变量注入，不硬编码在代码中，避免泄露风险
- **智能纠错机制** — 查询出错时系统自动修正并重试，不会将原始错误信息暴露给用户，保护系统内部细节

## 使用场景

**电商运营** — 运营人员随时查询商品销量、转化率、库存周转等指标，无需等待分析师排期，快速调整营销策略和库存计划。

**销售管理** — 销售主管查看团队业绩、客户转化漏斗、区域销售对比，实时掌握销售动态，及时发现问题并调整销售策略。

**财务分析** — 财务人员查询收入趋势、成本结构、利润分布等数据，快速生成财务报表，支持预算编制和成本控制决策。

**产品分析** — 产品经理查看用户行为数据、功能使用率、留存率等指标，基于数据驱动产品迭代和功能优化。

## 演示示例

以下是用户可以提问的示例：

- "上个月销售额最高的 Top 10 商品是什么？"
- "最近一周的订单量趋势如何？"
- "哪个品类的退货率最高？"
- "本月新客户的占比是多少？"
- "对比上个月，本月的客单价变化了多少？"

**网页版**：[queryforge-production-8d6f.up.railway.app](https://queryforge-production-8d6f.up.railway.app)

**桌面版**：[Releases](https://github.com/eric-stone-plus/queryforge/releases)（macOS x86_64，双击即用）

## macOS 桌面版

**本地模式** — 桌面版内置本地服务器，无需联网即可使用，数据完全在本地处理，适合对数据安全要求高的场景。

**云端模式** — 连接云端 API，享受持续更新的 AI 能力，适合需要最新功能和更强算力的用户。

**设置面板** — 支持配置 API Key、切换本地/云端模式、调整查询参数、查看历史记录等，界面简洁易用。

**下载地址**：[Releases](https://github.com/eric-stone-plus/queryforge/releases)（macOS x86_64，双击即用）

## License

MIT

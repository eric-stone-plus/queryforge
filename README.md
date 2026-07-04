# QueryForge

> 让业务部门自助取数，解放数据分析师的重复需求

[![Live Demo](https://img.shields.io/badge/demo-live-blue)](https://queryforge-production-8d6f.up.railway.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)

---

## 解决什么问题

数据分析师的日常：

- 业务侧提需求 → 分析师调整口径、增加字段、改看板
- 同一个指标，不同部门问 10 遍，改 10 遍
- 分析师忙于取数，没时间做深度分析
- 业务等排期，分析效率低

**QueryForge 让分析师调整好底层数据和指标后，业务部门自己用自然语言抓取数据、生成看板、做异常分析、获取决策建议。**

分析师从"取数工具人"变成"数据架构师"。

## 产品能力

**自然语言取数** — 业务人员用中文提问，AI 自动生成 SQL，返回可视化图表。不需要会 SQL，不需要等排期。

**数据看板自动生成** — 8 个核心经营指标 + 6 个图表面板，全部从真实数据库实时加载。

**指标异常分析** — AI 自动检测数据异常，给出可能原因和分析方向。

**决策建议** — 基于数据趋势和异常，AI 提供业务决策方向和建议。

**分析师预设指标库** — 分析师预设常用指标和查询口径，业务人员一键复用。口径统一，避免重复沟通。

**自纠正循环** — SQL 报错时 AI 自动修正并重试，用户看到修正过程和结果。

## 工作原理

```
业务人员提问 → AI 理解意图 → 生成 SQL → 安全校验 → 执行查询 → 可视化 + 建议
                    ↑                                          │
                    └──────── SQL 报错则自动修正 ←──────────────┘
```

## 技术路线

| 层 | 技术 |
|---|---|
| 前端 | Next.js 14 · Tailwind · Recharts · 深色/浅色主题 |
| 后端 | Next.js API Routes · SSE 流式推送 |
| AI | MiMo v2.5 Pro · Vercel AI SDK · 自纠正循环 |
| 数据 | better-sqlite3 · SQL AST 安全校验 · 自动 LIMIT |
| 部署 | Railway 云端 24/7 · macOS 桌面版（SwiftUI） |
| 质量 | [QUINTE](https://github.com/eric-stone-plus/QUINTE) 五方对抗审查 |

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
  app/api/chat/route.ts     # 流式 Chat API（SSE 进度推送）
  app/api/query/route.ts    # SQL 执行（AST 安全校验 + LIMIT）
  app/page.tsx              # 主页：KPI 看板 + 图表 + 对话
  components/ChatPanel.tsx   # 对话面板 + 图表 + 流式进度
  components/Dashboard.tsx   # 多图 Grid
  components/MetricSidebar.tsx # 分析师预设指标库
  lib/agent.ts              # AI 推理 + SQL 生成 + 自纠正
  lib/db.ts                 # SQLite 只读连接
  lib/demo-cache.ts         # 离线缓存 fallback
data/ecommerce.db           # 种子数据（10K 订单 · 500 商品）
desktop/QueryForge.swift    # macOS 桌面版
```

## 安全机制

- SQL AST 解析器：只允许 SELECT
- 自动 LIMIT 500：防大查询卡死
- 只读数据库：不允许写入
- API Key 环境变量注入：不硬编码
- 自纠正：报错时自动修正，不给用户返回错误

## 演示

**网页版**：[queryforge-production-8d6f.up.railway.app](https://queryforge-production-8d6f.up.railway.app)

**桌面版**：[Releases](https://github.com/eric-stone-plus/queryforge/releases)（macOS）

## License

MIT

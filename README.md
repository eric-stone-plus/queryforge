# QueryForge

> AI 商业数据分析智能体 — 用自然语言提问，自动生成 SQL，实时可视化

[![Live Demo](https://img.shields.io/badge/demo-live-blue)](https://queryforge-production-8d6f.up.railway.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## 这是什么

QueryForge 让非技术人员用中文提问，AI 自动生成 SQL 查询，执行数据库，返回可视化图表。

不是关键词匹配，不是预设模板。每一个查询都是 MiMo v2.5 Pro 实时推理、生成 SQL、校验安全、执行数据库、可视化结果。

## 核心功能

**自然语言 → SQL → 图表**
用户用中文描述需求，AI 理解意图，生成 SQLite 查询，自动选择最佳图表类型。

**自纠正循环**
SQL 报错时，AI 自动分析错误、修正查询、重新执行。用户看到修正过程和结果。

**流式进度推送**
实时展示 AI 的工作步骤：分析意图 → 生成 SQL → 执行查询 → 修正（如有）→ 完成。

**商业数据仪表盘**
8 个 KPI 指标卡 + 6 个图表面板，全部从真实数据库加载：10,000 订单 · 500 商品 · 1,000 用户 · 8 地区 · 20 品类。

**指标保存与复用**
用户可以保存常用查询到侧边栏，一键复用。支持删除和持久化。

**离线降级**
LLM 不可用时，预设查询自动走缓存 fallback，保证 demo 不中断。

## 技术架构

| 层 | 技术 |
|---|---|
| 前端 | Next.js 14 · Tailwind CSS · Recharts · 深色/浅色主题 |
| 后端 | Next.js API Routes · SSE 流式推送 |
| AI | MiMo v2.5 Pro · Vercel AI SDK · 自纠正循环 |
| 数据 | better-sqlite3 · SQL AST 安全校验 · 自动 LIMIT |
| 部署 | Railway（云端 24/7） · macOS 桌面版（WKWebView） |
| 审查 | QUINTE 五方对抗协议 · 3 轮 × 5 方 = 39 份审计报告 |

## 快速开始

```bash
# 克隆
git clone https://github.com/eric-stone-plus/queryforge.git
cd queryforge

# 安装
npm install

# 配置环境变量
echo "MIMO_API_KEY=your_key" > .env.local
echo "MIMO_BASE_URL=https://token-plan-cn.xiaomimimo.com/v1" >> .env.local

# 启动
npm run dev
# 访问 http://localhost:3000
```

## 项目结构

```
src/
  app/
    api/chat/route.ts    # SSE 流式 Chat API
    api/query/route.ts   # SQL 执行 API（带安全校验）
    api/schema/route.ts  # 数据库 Schema API
    page.tsx             # 主页面：KPI + 图表 + Chat
    globals.css          # 主题变量（深色/浅色）
    layout.tsx           # 根布局
  components/
    ChatPanel.tsx        # 对话面板 + 图表渲染 + 进度展示
    Dashboard.tsx        # 多图 Grid 组件
    MetricSidebar.tsx    # 指标保存/复用侧边栏
  lib/
    agent.ts             # AI 推理 + SQL 生成 + 自纠正循环
    db.ts                # SQLite 连接池
    demo-cache.ts        # 离线缓存 fallback
data/
  ecommerce.db           # 种子数据（10K 订单 · 500 商品）
desktop/
  QueryForge.swift       # macOS 桌面版源码（SwiftUI + WKWebView）
debates/
  round1-code-audit/     # QUINTE R1 代码审计报告
  round2-direction/      # QUINTE R2 技术方向决策
  round3-polish/         # QUINTE R3 打磨策略审计
```

## QUINTE 多智能体对抗审查

QueryForge 的开发过程使用了五方对抗审查协议：

- **R1 独立分析**：5 个 AI 智能体各自独立审查代码，互不通信
- **R2 交叉审查**：5 个智能体匿名审查其他 4 个的输出，标记共识和分歧
- **R3 双路裁决**：人类 + 独立审计方共同裁决，产出残差闭环账本

3 轮审查 × 5 方 = 39 份独立审计报告，发现并修复了 5 个 P0 级缺陷。

详细报告见 `debates/` 目录，方法论见 `QUINTE-METHODOLOGY.md`。

## 评分对标（ClawHunt Builder Camp 2026）

| 维度 | 满分 | 预估 | 依据 |
|------|------|------|------|
| Demo 现场可用 | 25 | 20-22 | 公网部署 + 缓存 fallback + 流式进度 |
| 用户价值/PMF | 20 | 16-18 | 真实痛点 + 自然语言接口 |
| 技术实现 | 20 | 16-18 | AI SDK + AST 校验 + 自纠正 + 对抗审查 |
| 创新性 | 15 | 11-13 | 自纠正循环 + QUINTE 方法论 |
| 商业潜力 | 10 | 7-8 | SaaS 模式 + 真实数据 |
| 路演表达 | 10 | 8-9 | PPT + 排练 |
| 加分 | +5 | +3 | ClawHunt 上架 |

## 演示

**网页版**：[queryforge-production-8d6f.up.railway.app](https://queryforge-production-8d6f.up.railway.app)

**桌面版**：[下载 QueryForge.app](https://github.com/eric-stone-plus/queryforge/releases)（macOS，双击即用）

## License

MIT

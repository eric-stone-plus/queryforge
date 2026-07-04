# QueryForge 开发备忘 — 交接给 Codex

## 当前状态（2026-07-04 23:30）

### 已完成
1. **Olist 数据迁移** — 数据库已切换到 Kaggle Olist 巴西电商真实数据（99,441 订单、96,096 用户、32,951 商品、74 品类）
2. **地区/渠道改名** — 本地数据库已更新为巴西名称（Sudeste/Sul/Nordeste/Centro-Oeste/Norte、Cartão de Crédito/Boleto/Voucher/Cartão de Débito）
3. **源码更新** — page.tsx、demo-cache.ts、agent.ts、MetricSidebar.tsx、seed-olist.js 已改
4. **demo-cache 分析升级** — 参考 Kaggle 社区 Olist 分析范式（RFM 分层、购物篮分析、支付行为分析）
5. **PPT** — 10 页，已加二维码和 speaker notes
6. **讲稿** — assets/speaker-notes.docx，连续 2 分钟版本
7. **README** — 精简版，无模型名、无 localhost、无评分预估
8. **QUINTE 审查** — debates/ 目录归档完整（round1-round5）
9. **hero.svg** — 标签改为 Next.js / TypeScript / AI Agent / Text-to-SQL
10. **.gitignore** — 排除 .env.local、session notes、dispatch scripts、stale 文件

### 未完成（Railway 部署问题）
- **Railway 线上仍然显示旧数据**（faker 数据：¥23,256、100%复购率、朴物婴儿湿巾、华东/天猫等中文名）
- `railway redeploy --yes` 没有生效（只是重启容器，不重新构建）
- `railway up` 已执行，等待构建完成
- **需要验证**：curl https://queryforge-production-8d6f.up.railway.app/ 确认显示 Sudeste、R$1,601、99,441 等新数据

### 需要 Codex 做的事

1. **Railway 部署** — 确认 `railway up` 构建成功，验证线上显示新数据。如果 `railway up` 不行，可能需要通过 Railway Dashboard 手动触发部署，或者检查 GitHub 集成是否正常。

2. **全项目残留检查** — 用 grep 搜索以下关键词，确保 src/、README.md、scripts/、assets/ 中无残留：
   - 中文地区名：华东、华南、华北、华中、西南
   - 中文渠道名：天猫、线下门店、抖音、微信小程序
   - 模型名：Kimi、K2.7、Moonshot、xiaomi、mimo
   - 旧数据：¥23,256、100%复购率、人均10单、朴物、京选、海棠、云启、橙品
   - 评分预估：62-75、85-93、88-95
   - 本地路径：/Users/ericstone

3. **PPT 重新生成** — scripts/gen-ppt-final.py 需要运行重新生成 assets/QueryForge-Pitch.pptx（之前改了内容但可能没重新生成）

4. **Codex 审计报告** — debates/round5-final-audit/codex-audit.md（Codex 上次尝试写了但目录不存在）

## 关键文件清单

| 文件 | 用途 | 状态 |
|------|------|------|
| src/app/page.tsx | 主页面 | ✅ 已更新 |
| src/lib/agent.ts | AI 系统提示词 | ✅ 已更新（变量名通用化） |
| src/lib/demo-cache.ts | 4 个预缓存查询 | ✅ 已更新（巴西名 + 分析升级） |
| src/components/ChatPanel.tsx | 对话面板 + demo chips | ✅ 已更新 |
| src/components/MetricSidebar.tsx | 指标库 | ✅ 已更新 |
| scripts/seed-olist.js | Olist 数据迁移脚本 | ✅ 已更新 |
| scripts/gen-ppt-final.py | PPT 生成脚本 | ✅ 已更新内容 |
| assets/QueryForge-Pitch.pptx | 路演 PPT | ⚠️ 需重新生成 |
| assets/speaker-notes.docx | 讲稿 | ✅ 已完成 |
| assets/devlog-20260704.html | 开发日志 | ✅ 已更新 |
| assets/hero.svg | 项目头图 | ✅ 已更新 |
| README.md | 项目文档 | ✅ 已更新 |
| docs/QUINTE-METHODOLOGY.md | 审查方法论 | ✅ 已完成 |
| .env.example | 环境变量模板 | ✅ 通用化 |
| debates/ | 审查归档 | ✅ 完整 |

## 数据库当前状态

- 地区：Sudeste / Sul / Nordeste / Centro-Oeste / Norte
- 渠道：Cartão de Crédito / Boleto / Voucher / Cartão de Débito
- 订单：99,441 | 用户：96,096 | 商品：32,951 | 品类：74

## Demo Day 信息

- 时间：2026-07-05（明天）
- 地点：深圳龙华区 · 星河先锋科技展厅
- 赛制：3 分钟快讲（赛区预选）→ 5 分钟 Demo + 3 分钟 Q&A（总决选）
- 评分：Demo 25 + 用户价值 20 + 技术实现 20 + 创新性 15 + 商业潜力 10 + 路演表达 10 = 100 + 5 加分

## 4 个 Demo 问题

1. "各地区月度销售额趋势" — 经典趋势分析（有缓存）
2. "各地区客单价差异分析" — Nordeste R$202 vs Sudeste R$150（有缓存）
3. "复购用户的品类跨越路径" — furniture_decor → bed_bath_table 91次（有缓存）
4. "渠道表现对比分析" — Cartão de Crédito 74%（有缓存）

## 不要做的事

- 不要在 repo 里提模型名（Kimi/K2.7/Moonshot）
- 不要在面向用户的文档里提评分预估
- 不要改 debates/ 里的历史记录（它们是审计证据）
- 不要动 .env.local（gitignored）

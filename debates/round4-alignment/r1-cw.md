# QUINTE R1 — 全项目文件一致性审计 (CodeWhale)

**审计方**: CodeWhale (CW)
**日期**: 2026-07-04
**范围**: 11 个指定文件 × 5 个审计维度
**基准**: Olist 巴西电商数据集（99,441 订单）

---

## 1. 一致性检查结果（逐文件）

### 1.1 README.md ✅ 基本一致
- 99,441 订单 / 96,096 用户 / 32,951 商品 / 74 品类 ✓
- R$1,601 万 / R$161 客单价 / 97% 完成率 / 3.1% 复购率 ✓
- "覆盖巴西 5 大地区" — 与 seed 脚本一致（但实际只有 4 个有数据，见 §2）
- 技术栈：Next.js 14 · Kimi K2.7 · Vercel AI SDK · better-sqlite3 · node-sql-parser · Railway ✓
- 无 faker 残留 ✓
- **问题**: 演示示例中"各地区复购率对比如何？"与 demo-cache.ts 的 key "各地区复购率分析" 不完全匹配（"对比" vs "分析"），会导致缓存未命中

### 1.2 src/app/page.tsx ❌ 严重不一致
- **KPI 卡片（行 153-160）**: R$1,601 万 / R$161 / 97% / 3.1% / 96,096 / 32,951 / 74 ✓ — 与 README 一致
- **REGION_STATIC（行 56-59）**: 5 个地区，但西南=0（只有 4 个有数据）
- **CATEGORY_STATIC（行 60-64）**: health_beauty 等英文名 ✓ — 与 Olist 一致
- **CHANNEL_STATIC（行 65-68）**: 天猫/线下门店/抖音/微信小程序 — 与 seed 脚本一致（payment_type 映射）
- **SEGMENT_STATIC（行 69-74）**: regular 96,096 用户, vip/new/enterprise users=0 — 部分更新但结构残留
- **TOP_PRODUCTS（行 81-87）**: health_beauty / watches_gifts 等英文品类名 ✓ — 与 Olist 一致
- **用户分层明细（行 300-308）**: ❌ **全是 faker 残留数据**（详见 §2）

### 1.3 src/lib/agent.ts ✅ 基本一致，有映射问题
- 系统提示词引用 "Brazilian marketplace data (Olist, 99K orders)" ✓
- Schema 定义 6 个表（regions, categories, products, users, orders, order_items）✓
- 与 seed-olist.js 的 CREATE TABLE 语句完全匹配 ✓
- **问题 1**: 区域映射只列 4 个，遗漏华中（详见 §2-I04）
- **问题 2**: channel mapping 在系统提示词中正确（credit_card=天猫 等）✓

### 1.4 src/lib/demo-cache.ts ✅ 一致
- 4 个预缓存查询，SQL 均可在 Olist schema 上执行 ✓
- 区域映射正确：华东(Sudeste), 华南(Sul), 华北(Nordeste) ✓
- 渠道映射正确 ✓
- 解释文本引用真实 Olist 数据特征（marketplace 复购率低等）✓
- 无 faker 残留 ✓

### 1.5 src/components/MetricSidebar.tsx ✅ 一致
- 6 个默认指标，SQL 均可在 Olist schema 上执行 ✓
- 使用正确的表名和列名（orders, regions, products, categories, order_items）✓
- 无 faker 残留 ✓

### 1.6 src/components/ChatPanel.tsx ✅ 一致
- DEMO_CHIPS（行 18-23）: 4 个示例问题，与 demo-cache.ts 的 key 匹配 ✓
- "各地区复购率分析" 与 demo-cache 一致 ✓（但 README 写的是"各地区复购率对比如何？"）
- 无硬编码数据引用 ✓
- 无 faker 残留 ✓

### 1.7 scripts/gen-ppt-final.py ✅ 基本一致
- 封面："基于 Olist 真实电商数据（99,441 笔订单）验证" ✓
- 数据页：99,441 / 96,096 / 74 / R$1,601 万 / R$161 / 97% / 3.1% ✓
- "覆盖巴西5大地区，2016-2018年完整时间序列" ✓
- 三层架构描述与 README 一致 ✓
- **问题**: "核心指标"卡片含"每查询成本 ~$0.003（Kimi K2.7）"— 成本估算，非评分预估，但可能暴露内部信息
- 无 faker 残留 ✓

### 1.8 assets/devlog-20260704.html ❌ 全部过时
- **行 120**: "数据库：10,000 订单 · 500 商品 · 1,000 用户 · 8 地区 · 20 品类" — 全部是 faker 数据
- **行 122-131**: ¥23,256 万 / ¥23,256 客单价 / 46.7% 毛利率 / 100% 复购率 / 66.5% 完成率 — 全部 faker
- **行 128**: "Top 地区：西南 ¥3,348 万" — faker
- **行 129**: "Top 品类：图书文具 ¥1,677 万" — faker
- **行 130**: "Top 渠道：天猫 ¥4,047 万" — faker
- **行 97**: "预估 85-93/105" — 评分预估
- **行 192-206**: 详细的评分预估（88-96/105 + 3 加分）— 评分预估

### 1.9 docs/QUINTE-METHODOLOGY.md ⚠️ 有评分预估
- QUINTE 方法论描述本身准确 ✓
- **行 97**: "预估 85-93/105" — 评分预估，不应出现在面向用户的文档中
- 无数据一致性问题 ✓

### 1.10 docs/PROJECT-MEMO.md ❌ 部分过时
- **行 17**: "种子数据：10K orders, 25K order_items, 500 products, 1000 users, 8 regions" — faker 数据
- **行 47**: "预估 85-93/105" — 评分预估
- 其余内容（行动清单、QUINTE 方法论引用）与当前状态基本一致
- 已被 .gitignore 排除 ✓

### 1.11 debates/round4-competitive-analysis/r3-verdict.md ✅ 一致
- 明确记录 Olist 迁移已完成：99,441 / 96,096 / 32,951 / 74 ✓
- 残差关闭台账引用正确的 Olist 数据 ✓
- 行动清单与实际代码状态对齐 ✓
- 无 faker 残留 ✓

---

## 2. 不一致项清单

| ID | 文件 | 行号 | 严重度 | 问题描述 | 建议修复 |
|----|------|------|--------|----------|----------|
| I01 | src/app/page.tsx | 300-308 | **CRITICAL** | 用户分层明细全部是 faker 数据：1,000 总用户（应为 96,096）、¥货币（应为 R$）、100% 渗透率、Enterprise 160 人 ¥241K/人 等 | 删除整个用户分层明细区块，或替换为真实 Olist 数据查询 |
| I02 | assets/devlog-20260704.html | 120-131 | **CRITICAL** | "真实数据指标"区块全部是 faker 数据：10K 订单、¥23,256 万、100% 复购率、8 地区、20 品类 | 替换为 Olist 真实数据：99,441 订单、R$1,601 万、3.1% 复购率、5 地区、74 品类 |
| I03 | assets/devlog-20260704.html | 192-206 | **HIGH** | 详细评分预估（88-96/105）不应出现在可能对外的文档中 | 删除整个评分预估区块 |
| I04 | src/lib/agent.ts | 系统提示词 | **HIGH** | 区域映射只列 4 个（华东/华南/华北/西南），遗漏华中；且把西南映射到 Norte+Centro-Oeste，但 seed 脚本中华中=Norte+Centro-Oeste（region 4），西南（region 5）无数据 | 更新为 5 个区域映射：华东=Sudeste, 华南=Sul, 华北=Nordeste, 华中=Norte+Centro-Oeste, 西南=无数据/保留 |
| I05 | src/app/page.tsx | 56-59 | **HIGH** | REGION_STATIC 有 5 个地区但西南=0，与"5 大地区"宣传不符 | 要么合并 Norte+Centro-Oeste 到华中并删除西南，要么分配部分州到西南 |
| I06 | docs/PROJECT-MEMO.md | 17 | **MEDIUM** | "种子数据：10K orders, 25K order_items, 500 products, 1000 users, 8 regions" — faker 数据残留 | 更新为 Olist 真实数据 |
| I07 | docs/QUINTE-METHODOLOGY.md | 97 | **MEDIUM** | "预估 85-93/105" — 评分预估 | 删除评分预估，改为"产出 12 小时行动清单" |
| I08 | README.md | 演示示例 | **LOW** | "各地区复购率对比如何？" 与 demo-cache key "各地区复购率分析" 不匹配（"对比" vs "分析"） | 统一为"各地区复购率分析"或更新 demo-cache key |
| I09 | src/app/page.tsx | 65-68 | **LOW** | CHANNEL_STATIC 使用天猫/线下门店/抖音/微信小程序，实际是 payment_type 的中文映射，语义误导 | 在 UI 标注"支付渠道"或改为真实渠道名 |

---

## 3. 遗漏项清单

| ID | 类型 | 描述 | 建议 |
|----|------|------|------|
| O01 | 未更新文件 | devlog-20260704.html 的"真实数据指标"区块完全未更新 | 替换为 Olist 数据 |
| O02 | 未更新文件 | page.tsx 用户分层明细（行 300-308）未更新 | 删除或替换 |
| O03 | 未更新文件 | PROJECT-MEMO.md 种子数据描述未更新 | 更新描述 |
| O04 | 数据库文件 | .gitignore 未排除 `data/ecommerce.db`（只排除了 .db-shm/.db-wal） | 添加 `data/*.db` 到 .gitignore |
| O05 | 评分预估 | devlog 和 QUINTE-METHODOLOGY.md 中的评分预估未清除 | 删除所有评分预估 |

---

## 4. PPT 内容审查

### gen-ppt-final.py（10 页 PPT）

**不应出现的内容**:
- 无评分预估 ✓
- 无缺陷暴露 ✓
- **Slide 8 "核心指标"**: "每查询成本 ~$0.003（Kimi K2.7）"— 成本估算可接受，但暴露了具体模型定价，建议改为"每查询成本极低"

**数据一致性**:
- 所有数字与 README 一致 ✓
- 三层架构描述与 README 一致 ✓
- 数据合规描述与 README 一致 ✓

**叙事质量**:
- 故事线清晰：痛点 → 方案 → 能力 → 数据验证 → 架构 → 合规 → 路径 → 价值 ✓
- "分析师定义一次，业务自助使用" 的核心叙事贯穿始终 ✓

---

## 5. .gitignore 审查

### 已正确排除 ✓
- `.env*.local` / `.env` — API key ✓
- `data/olist/` — 原始 CSV 数据 ✓
- `docs/PROJECT-MEMO.md` — 内部备忘 ✓
- `docs/SESSION-NOTES-*.md` — 会话笔记 ✓
- `debates/*/run-r*.sh` — 调度脚本 ✓
- `debates/*/prompt-r*.md` — 提示词模板 ✓
- `debates/*/stale-*/` — 过期审查 ✓
- `*.db-shm` / `*.db-wal` — SQLite WAL 文件 ✓

### 未排除（应添加）⚠️
| 文件/模式 | 说明 | 建议 |
|-----------|------|------|
| `data/*.db` 或 `data/ecommerce.db` | 编译后的数据库文件，不应入库 | 添加到 .gitignore |
| `assets/QueryForge-Pitch.pptx` | 生成的 PPT 文件，脚本可重建 | 可选：添加或保留 |
| `assets/devlog-20260704.html` | 含评分预估，如果对外发布需清理 | 清理后保留，或添加到 .gitignore |

### 不应排除但已排除 ⚠️
- 无

---

## 总结

### 关键发现

1. **page.tsx 用户分层明细（行 300-308）是最大的 faker 残留风险** — 暴露 1,000 用户、¥货币、100% 渗透率等一眼假数据，评委必追问
2. **devlog-20260704.html 整个"真实数据指标"区块全是旧数据** — 10K 订单、¥23,256 等，如果作为开发日志对外展示会严重损害可信度
3. **agent.ts 区域映射与 seed 脚本不一致** — 西南/华中的 Norte+Centro-Oeste 归属矛盾，可能导致 LLM 生成错误 SQL
4. **评分预估残留在 devlog 和 QUINTE-METHODOLOGY.md 中** — 不应出现在面向用户的文档

### 优先修复顺序

1. **P0**（演示前必须修）: I01（page.tsx faker）、I04（agent.ts 区域映射）
2. **P1**（提交前修）: I02（devlog faker）、I03（devlog 评分预估）、I05（region 西南=0）
3. **P2**（可接受风险）: I06-I09、O01-O05

---

*审计完成。CW · 2026-07-04*

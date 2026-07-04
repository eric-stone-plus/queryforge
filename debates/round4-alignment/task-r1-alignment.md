QUINTE R1 — 全项目文件一致性审计
==================================

你正在审计 QueryForge 项目的所有文件是否与 Olist 数据迁移对齐。

## 背景

项目刚从 faker 生成数据迁移到 Olist 巴西电商真实数据集（99K 订单）。需要检查所有文件中的数据引用、描述、示例是否一致。

## 需要检查的文件

全部读取并交叉验证：

1. README.md — 项目主文档
2. src/app/page.tsx — 主页面（KPI、静态数据、用户分层）
3. src/lib/agent.ts — 系统提示词、schema 定义
4. src/lib/demo-cache.ts — 预缓存查询
5. src/components/MetricSidebar.tsx — 指标库默认值
6. src/components/ChatPanel.tsx — 对话面板、demo chips
7. scripts/gen-ppt-final.py — PPT 生成脚本
8. assets/devlog-20260704.html — 开发日志（HTML）
9. docs/QUINTE-METHODOLOGY.md — QUINTE 方法论文档
10. docs/PROJECT-MEMO.md — 项目备忘（内部，不上传）
11. debates/round4-competitive-analysis/r3-verdict.md — R3 裁决

## 检查维度

### 1. 数据一致性
- 所有文件中的订单数是否都是 99,441？
- 所有文件中的用户数是否都是 96,096？
- 商品数是否都是 32,951？
- 品类数是否都是 74？
- 地区数是否都是 5（华东/华南/华北/华中/西南）？
- 渠道是否都是 4 个（天猫/线下门店/抖音/微信小程序）？
- 营收数字是否一致？
- 是否有残留的 faker 数据（¥23,256、100% 复购率、人均10单、东北、西北、港澳台、京东、官网）？

### 2. Schema 一致性
- agent.ts 的 schema 定义是否与实际数据库表结构一致？
- demo-cache.ts 的 SQL 查询是否能在当前数据库上执行？
- MetricSidebar 的 SQL 是否兼容 Olist schema？

### 3. 描述一致性
- README 中的产品描述是否与实际功能匹配？
- PPT 内容是否与 README 一致？
- devlog 是否更新了最新进展？

### 4. 技术描述准确性
- 模型名称是否一致（Kimi K2.7 / kimi-for-coding）？
- 技术栈描述是否准确？
- 是否有"智能纠错"等模糊描述需要更精确？

### 5. 遗漏检查
- 有哪些文件应该更新但没更新？
- 有哪些文件不应该上传（但 .gitignore 没排除）？
- 有哪些内容在 PPT 里但不应该提（缺陷、评分预估）？

## 已知问题（需要确认）

1. page.tsx 用户分层明细（约 300-308 行）仍有 faker 数据（487人 Regular、188人 New 等）
2. devlog-20260704.html 全部是旧数据（10K 订单、¥23,256 等）
3. 评分预估是否已从所有面向用户的文档中移除？

## 输出格式

写到：debates/round4-alignment/r1-{AGENT_ID}.md

结构：
1. 一致性检查结果（逐文件）
2. 不一致项清单（文件名:行号 → 问题描述 → 建议修复）
3. 遗漏项清单
4. PPT 内容审查（是否有不该出现的内容）
5. .gitignore 审查（是否有敏感文件未排除）

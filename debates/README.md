# QUINTE 对抗审查归档

本目录包含 QueryForge 项目在 ClawHunt Builder Camp 2026 期间的所有 QUINTE 对抗审查记录。

## 目录结构

### 01-code-audit/ — 代码审计
Round 1：5 方独立审查代码安全性、性能瓶颈、潜在漏洞。
发现 6 个 P0 缺陷（Dashboard 死代码、KPI 硬编码、无超时、extractJson 脆弱、API key 泄露、无错误边界），全部修复。

### 02-direction/ — 方向决策
Round 2：5 方交叉审查产品方向、功能优先级。
识别创新性短板，确认 MetricSidebar 为核心差异化，合并为"分析师定义一次，业务团队永久使用"定位。

### 03-polish/ — 打磨策略
Round 3：5 方审查 UX、交互、演示流程。
关键发现："75 分和 90 分的差距不是代码，是排练。"产出 12 小时行动清单。

### 04-competitive-analysis/ — 竞品分析与数据策略
Round 4：5 方审查竞争定位、数据源选择。
调研 Vanna.ai、BlazeSQL、Wren AI、AskYourDatabase 等竞品。决策从 faker 数据迁移到 Olist 真实数据集（99K 订单）。R3 裁决包含残差关闭台账。

### 05-architecture/ — 架构审查
Codex（GPT-5.5）以 Principal Product Engineer 视角审查。
三层架构设计（语义层 + 验证式 Agent + 数据平面）、数据合规方案、对话质量升级建议、生产路径规划。

### 06-readme-review/ — 文档审查
5 方审查 README、GitHub About、技术标签。
精简 README（移除冗余内容），QUINTE 细节移到单独文件，标签对齐 GitHub topics。

### 07-alignment/ — 一致性审计
5 方交叉验证全项目文件是否与 Olist 数据迁移对齐。
发现 page.tsx 用户分层 faker 残留、devlog 全部过时、货币符号错误等问题，全部修复。

## 审查统计

- 总轮次：4 轮（+ 3 轮子审查）
- 总报告数：20+ 份
- 参与方：CodeWhale、OpenCode、Kilo Code、MiMo Code、oh-my-pi
- R3 裁决：hm + Auditor B（Codex GPT-5.5）
- 成本：约 ¥10-20（小米 MiMo token plan）

## 方法论

详细报告：[devlog-20260704.html](../assets/devlog-20260704.html)
方法论文档：[QUINTE-METHODOLOGY.md](../docs/QUINTE-METHODOLOGY.md)

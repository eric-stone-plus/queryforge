# QUINTE 对抗审查归档

本目录保存 QueryForge 在 ClawHunt Builder Camp 2026 期间的 QUINTE 对抗审查记录。这里是过程证据，不是最终路演成品；最终成品口径以 README、PPT、讲稿、线上演示和 handoff 为准。

## 目录结构

### round1-code-audit/ — 代码审计
5 方独立审查代码安全性、性能瓶颈和潜在漏洞。发现 Dashboard 未接入、KPI 硬编码、客户端超时缺失、JSON 解析脆弱、密钥处理不当、错误边界缺失等问题，后续均已处理。

### round2-direction/ — 方向决策
交叉审查产品方向、功能优先级和差异化。最终收敛到“分析师定义一次，业务团队持续复用”的语义层叙事。

### round3-polish/ — 演示打磨
审查 UX、交互和现场演示流程。产出移动端首屏、预设问题、缓存兜底和路演节奏优化清单。

### round4-competitive-analysis/ — 竞品分析与数据策略
调研 Text-to-SQL、self-service BI 和企业数据分析相关竞品。数据基础最终升级为 Kaggle Olist Brazilian E-Commerce Public Dataset，并围绕真实业务分布重写产品叙事。

### round4-final-direction/ — 架构审查
Codex 参与产品工程审查，推动三层架构表达：受控语义层、验证式 Agent 循环、执行与治理边界。

### round4-readme-review/ — 文档审查
审查 README、GitHub About、技术标签和对外表述，避免把方法论细节挤进产品说明。

### final-release-audit/ — 最终一致性审计
检查公开材料、Office 文件、数据库、线上部署、二维码和移动端入口是否与 Olist 当前版本一致。

## 审查统计

- 总轮次：4 轮核心审查 + 最终一致性审计
- 总报告数：20+ 份
- 审查方式：多智能体独立审查、交叉质询、人类裁决
- 当前成品定位：Track C / Business on AI，受治理的自助式商业分析层

## 方法论

- 开发日志：[devlog-20260704.html](../assets/devlog-20260704.html)
- 方法论文档：[QUINTE-METHODOLOGY.md](../docs/QUINTE-METHODOLOGY.md)

# QueryForge

<p align="center">
  <img src="assets/hero.svg" alt="QueryForge" width="100%">
</p>

**QueryForge 是一个通用商业分析工具：面向业务团队的受治理自助式分析层。** 用户用自然语言提出经营问题，系统把问题转成受控 SQL，执行只读查询，并返回图表和分析师级文字报告。

## Why

很多企业不是没有数据，而是分析链路太长：业务先把问题发给数据团队，分析师确认口径、写 SQL、导出图表，再解释结果。这个流程可靠，但对销售、投放、品类运营这类高频决策来说太慢；完全放开自助 BI 又容易出现口径不一致、权限边界模糊和“看起来像答案”的错误结论。

QueryForge 的定位不是替代分析师，而是把分析师定义过的指标、口径和治理边界放进一个可对话的 Agent。业务可以连续追问“为什么”“拆到地区看”“下一步应该做什么”，系统仍然通过 schema、SQL AST、只读执行和自动 LIMIT 把查询约束在可审计范围内。

本次比赛把 [Kaggle Olist Brazilian E-Commerce Public Dataset](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce) 作为一个可公开复现的 demo case。Olist 的 99K 巴西电商订单适合展示区域、品类、渠道和复购路径分析；在真实业务环境里，同一套流程可以接入 CRM、ERP、广告投放、交易明细或企业数据仓库。

## Product

- **自然语言问数**：中文提问，自动生成 SQL、图表和分析报告
- **连续追问**：保留最近对话上下文，支持原因、对比、拆解和下一步建议
- **Agent 验证循环**：SQL 出错后自动诊断、修正、重试
- **经营看板**：核心 KPI、地区、品类、渠道、用户分层同步展示
- **指标资产化**：常用分析可以保存复用，减少重复取数和口径解释
- **数据源可迁移**：demo 连接 Olist case，产品形态面向任意结构化业务数据

## Architecture

1. **受控语义层**：分析师定义指标，系统匹配生成 SQL，不靠模型猜表名。
2. **验证式 Agent 循环**：自然语言 → SQL → AST 验证 → 只读执行 → 结果分析 → 自纠正。
3. **企业数据平面**：模型只看到 schema，不接触原始数据；运行时只允许 SELECT，并自动注入 LIMIT。

这条架构让 Agent 能参与商业分析，但不绕过数据治理。生产化路线包括行级权限、PII 脱敏、审计日志、SSO/SAML 和企业数据仓库连接。

## Demo Case

99,441 订单 · 96,096 用户 · 32,951 商品 · 74 品类 · 5 地区 · R$1,601 万营收

可尝试的问题：

- 各地区月度销售额趋势
- 各地区客单价差异分析
- 复购用户的品类跨越路径
- 渠道表现对比分析

## Project Links

- Live demo: <https://queryforge-production-8d6f.up.railway.app>
- Pitch deck: [assets/QueryForge-Pitch.pptx](assets/QueryForge-Pitch.pptx)
- Speaker notes: [assets/speaker-notes.docx](assets/speaker-notes.docx)
- Review methodology: [docs/QUINTE-METHODOLOGY.md](docs/QUINTE-METHODOLOGY.md)

## Quick Start

```bash
git clone https://github.com/eric-stone-plus/QueryForge.git
cd QueryForge
npm install
cp .env.example .env.local
# Configure AI_API_KEY, AI_BASE_URL, and AI_MODEL in .env.local
npm run dev
```

## Acknowledgements

- Data: Olist Brazilian E-Commerce Public Dataset on Kaggle
- Contributors: Eric Stone, Codex

## License

MIT

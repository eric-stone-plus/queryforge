# QueryForge

<p align="center">
  <img src="assets/hero.svg" alt="QueryForge" width="100%">
</p>

<p align="center">
  <a href="https://queryforge-production-8d6f.up.railway.app">在线演示</a> · 
  <a href="https://github.com/eric-stone-plus/queryforge/releases">macOS 桌面版</a> · 
  <a href="docs/DEV-ROADMAP.md">开发路线</a>
</p>

---

**QueryForge 是一个面向业务团队的 AI 数据分析智能体。** 用自然语言提问，自动生成 SQL 查询，返回可视化图表和分析师级别的文字分析。基于 Olist 真实电商数据集（99K 订单）验证。

## 解决什么问题

数据分析师 80% 时间在重复取数，业务团队等排期要 1-3 天。QueryForge 让分析师定义一次指标口径，业务团队自助使用——从"提需求等三天"到"自己问自己看"。

## 产品能力

- **自然语言取数** — 业务人员直接用中文提问，系统生成 SQL 并返回图表和分析报告
- **数据看板** — 8 个核心经营指标，实时加载，支持时间筛选
- **分析师级分析** — 每次查询返回数据结论、趋势对比、业务建议、数据局限性说明
- **智能纠错** — SQL 出错时自动诊断、修正、重试，用户看到完整修正过程
- **指标库** — 分析师预设指标，业务人员一键查询，全公司口径统一

## 技术架构

**三层设计：从 Demo 到企业级产品**

1. **受控语义层** — 分析师定义指标 → 系统匹配 → SQL 生成。不靠 LLM 猜表名，防止口径不一致
2. **验证式 Agent 循环** — 生成 SQL → AST 验证 → 只读执行 → 结果分析 → 可视化。自纠正机制
3. **企业数据平面** — Schema-only 模型暴露、只读数据库、AST 级 SQL 安全校验、审计日志路线图

核心技术：Next.js 14 · Kimi K2.7 · Vercel AI SDK · better-sqlite3 · node-sql-parser · Railway

## 数据合规

- **Schema-only 模型暴露** — LLM 只看到表名和列名，永远不接触原始数据
- **AST 级 SQL 验证** — node-sql-parser 解析语法树，只允许 SELECT 查询
- **只读数据库连接** — 数据库层面 readonly 模式
- **自动 LIMIT 注入** — 防止全表扫描
- **生产路线图** — 行级安全（RLS）、PII 脱敏、审计日志、SSO/SAML

## 真实数据验证

基于 [Olist Brazilian E-Commerce Dataset](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce)（Kaggle 公开数据集）：

- 99,441 笔真实订单 · 96,096 真实用户 · 32,951 商品 · 74 品类
- 覆盖巴西 5 大地区，2016-2018 年完整时间序列
- 总营收 R$1,601 万 · 客单价 R$161 · 完成率 97% · 复购率 3.1%

## 快速开始

```bash
git clone https://github.com/eric-stone-plus/queryforge.git
cd queryforge && npm install

echo "AI_API_KEY=your_key" > .env.local
echo "AI_BASE_URL=https://api.kimi.com/coding/v1" >> .env.local
echo "AI_MODEL=kimi-for-coding" >> .env.local

npm run dev
# 访问 http://localhost:3000
```

## 演示示例

- "各地区月度销售额趋势如何？"
- "哪个品类利润率最高？"
- "Top 10 营收品类是什么？"
- "各地区复购率分析？"

**网页版**：[queryforge-production-8d6f.up.railway.app](https://queryforge-production-8d6f.up.railway.app)

## 质量保障

采用 [QUINTE](https://github.com/eric-stone-plus/QUINTE) 五方对抗审查协议，4 轮 × 5 方 = 20 份独立审计报告。详见 [docs/QUINTE-METHODOLOGY.md](docs/QUINTE-METHODOLOGY.md)。

## Acknowledgments

- **数据**: [Olist Brazilian E-Commerce Public Dataset](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce)
- **AI 模型**: Kimi K2.7 Code (Moonshot AI)

## License

MIT

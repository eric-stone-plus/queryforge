# QueryForge

<p align="center">
  <img src="assets/hero.svg" alt="QueryForge" width="100%">
</p>

**QueryForge 让电商经营者获得专业数据分析能力。** 它是一个本地优先的商业分析 workbench：用户把订单、商品、渠道、地区等结构化数据放在本机，用自然语言提问；QueryForge 调用用户自己配置的 OpenAI-compatible 模型供应商，把问题转成只读 SQL，执行查询，再生成图表和经营建议。

## Why

很多跨境电商小团队、Amazon/平台卖家、外贸 SOHO 和广交会参展商并没有专职数据分析师。真实痛点通常不是“没有 AI”，而是经营数据散在订单导出、ERP、广告后台和表格里，老板或运营想问“哪个地区值得投放”“哪些品类能组合销售”“复购用户下一步买什么”，却没有一条足够低成本、足够快、又能看得懂数据口径的分析链路。

直接问大模型也不等价于数据分析产品。模型默认没有数据库执行权，不知道你的表结构和指标口径，也不会自动留下 SQL、查询结果和 token 成本记录。QueryForge 的价值是做一层本地 harness：让外部模型在 schema、只读 SQL、结果 grounding、token budget 和本机凭据边界内工作。

本次比赛使用 Kaggle 的 [Olist Brazilian E-Commerce Public Dataset](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce) 作为公开 demo case。Olist 是真实巴西电商订单数据，适合展示地区、品类、渠道、客单价和复购路径分析；产品本身面向更通用的结构化经营数据。

## Product Shape

- **macOS 本地应用是完整产品**：内置本地 SQLite 数据库示例，提供 Settings 下拉菜单，可自助填写 provider endpoint、model、API key/token、月度 token 预算。
- **Railway 是手机扫码演示**：公开地址用于评审和路演，展示 Olist 案例和交互形态；不收集访客 API key，也不承载用户真实数据。
- **自然语言经营问答**：中文提问，自动生成 SQL、执行查询、返回图表和分析报告。
- **连续追问**：保留最近上下文，支持“为什么”“展开说”“和上一个比”等自然追问。
- **只读 SQL 边界**：AST 校验只允许单条 SELECT，禁用通配选择敏感字段，自动 LIMIT。
- **结果 grounding**：报告基于实际查询结果重写，减少脱离数据的泛化回答。
- **token plan**：本地记录 token 用量和月度预算，方便个人用户评估调用成本。
- **指标沉淀**：常用查询可保存为指标，减少重复取数和重复解释。

## Target Users

QueryForge 更适合数据治理不重、但经营决策频繁的小团队：

- 广交会场景中的跨境电商卖家、外贸工厂、贸易公司和 SOHO
- Amazon、TikTok Shop、AliExpress、独立站等平台卖家
- 几个人规模的电商创业团队，需要快速看地区、品类、渠道和复购
- 有订单/商品/广告导出数据，但没有专职数据分析岗位的经营者

## Commercial Path

当前商业化假设是**一次性买断**，而不是按年/按席位的重型销售模式。QueryForge 本身没有云端运维成本，真实模型调用由用户自己的 provider key 承担；对小微电商经营者来说，买断制更容易形成低决策成本。

建议首发价格带为 **¥128-168**。这个区间不是精确定价结论，而是一个落地假设：它低于常见卖家 SaaS 的月费门槛，也低于多数需要团队采购的 BI 工具；同时对广交会地推、卖家微信群、培训社群和服务商渠道来说，足够接近“冲动购买”的价格带。后续应通过现场转化率、退款率和复购推荐来校正。

## Architecture

1. **本地数据平面**：数据库、API token、token plan 和用户配置保存在本机运行环境。
2. **模型 harness**：外部模型只负责理解问题、生成 SQL 和解释结果，不直接拥有数据库写权限。
3. **SQL 安全层**：node-sql-parser 做 AST 校验，只允许 SELECT；查询自动加 LIMIT。
4. **执行与回填**：本地执行 SQL，把结果回填给模型生成经营解释和图表配置。
5. **隐私边界**：公开 GitHub/Railway 只包含公开 demo 数据和产品代码；真实 API key 和用户数据不进入仓库。

## Demo Case

Olist demo case 当前包含：

99,441 订单 · 96,096 用户 · 32,951 商品 · 74 品类 · 5 地区 · R$1,601 万营收

可尝试的问题：

- 哪个地区最值得优先投放？
- 哪些品类适合做组合推荐？
- 复购用户的品类跨越路径
- 渠道表现对比分析

## Project Links

- Railway phone/QR demo: <https://queryforge-production-8d6f.up.railway.app>
- Review methodology: [docs/QUINTE-METHODOLOGY.md](docs/QUINTE-METHODOLOGY.md)

## Quick Start

```bash
git clone https://github.com/eric-stone-plus/QueryForge.git
cd QueryForge
npm install
cp .env.example .env.local
npm run dev
```

本地桌面构建：

```bash
./desktop/build_macos.sh
open QueryForge.app
```

打开应用后，在右上角 `Settings` 下拉菜单中填写你的 provider endpoint、model、API key/token 和月度 token 预算。

## License

Apache-2.0

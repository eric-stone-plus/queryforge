# QueryForge

<p align="center">
  <img src="assets/hero.svg" alt="QueryForge" width="100%">
</p>

**QueryForge 让电商经营者获得专业数据分析能力。** 它是一个面向小微电商经营者的本地优先分析工具包；当前交付的是第一个工具：订单与经营分析 workbench。用户把订单、商品、渠道、地区等结构化数据放在本机，用自然语言提问；QueryForge 调用用户自己配置的模型服务 API，把问题转成只读 SQL，执行查询，再生成图表和经营建议。

## Why

很多跨境电商小团队、Amazon/平台卖家、外贸 SOHO 和广交会参展商并没有专职数据分析师。真实痛点通常不是“没有 AI”，而是经营数据散在订单导出、ERP、广告后台和表格里，老板或运营想问“哪个地区值得投放”“哪些品类能组合销售”“复购用户下一步买什么”，却没有一条足够低成本、足够快、又能看得懂数据口径的分析链路。

直接问大模型也不等价于数据分析产品。模型默认没有数据库执行权，不知道你的表结构和指标口径，也不会自动留下 SQL、查询结果和 token 成本记录。QueryForge 的价值是做一层本地 harness：让外部模型在 schema、只读 SQL、结果 grounding、token budget 和本机凭据边界内工作。

它也不是要替代通用 AI workspace、卖家 SaaS、Excel/BI 或人工报表。通用 AI 强在写作和综合推理，但缺少本机数据执行链路；卖家 SaaS 强在平台连接，但订阅成本和平台绑定更重；Excel 灵活但依赖人手；人工报表有深度但慢且不可连续追问。QueryForge 的切入点更窄：让老板用自己的订单、商品、渠道和地区数据，快速把经营问题跑成可检查的查询、图表和建议。

本次比赛使用 Kaggle 的 [Olist Brazilian E-Commerce Public Dataset](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce) 作为公开 demo case。Olist 是真实巴西电商订单数据，适合展示地区、品类、渠道、客单价和复购路径分析；产品本身面向更通用的结构化经营数据。

## Product Shape

- **本地桌面应用是完整产品路径**：当前预编译 demo 包为 macOS x86_64，产品形态不绑定 macOS；后续可以提供 Windows/macOS 预编译二进制包。Settings 默认只需选择模型服务并填写 API key/token；API URL、backend、model 和 token 预算放在高级设置里。
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

当前商业化假设是**面向小微企业的软件服务**，但不走重型企业 SaaS 的按席位销售。更现实的首发方式是闭源分发预编译桌面软件包：官网售卖、渠道售卖、卖家社群分发，后续用模板更新、数据导入、轻量支持和付费升级形成持续服务。真实模型调用由用户自己的 provider key 承担，QueryForge 不承担云端 token 成本。

建议首发价格带为 **¥128-168**。这个区间不是精确定价结论，而是一个落地假设：它低于常见卖家 SaaS 的月费门槛，也低于一次人工报表或咨询成本；同时对广交会地推、卖家微信群、培训社群和服务商渠道来说，足够接近“冲动购买”的价格带。后续应通过现场转化率、退款率和复购推荐来校正。

## Model And IP Boundary

QueryForge 不转售模型能力，也不把用户 API key 放进公开仓库或托管 demo。真实使用路径是 BYOK：用户在本机 Settings 里配置自己的模型服务 key/token，模型调用费用和服务条款由用户自己的 provider 账户承担。

主流模型服务的公开条款通常会把输入/输出权利、使用责任和限制用途写清楚。例如 OpenAI 条款写明用户保留 Input 权利并在适用法律允许范围内拥有 Output；Anthropic 曾公开说明 API 商业条款允许客户保留输出权利；DeepSeek 和 Kimi/Moonshot 条款也强调用户需要对输入和输出负责，并确保自己有权提交输入。QueryForge 的合规边界是把这些 provider 接入本地工作台，不替用户绕过任何第三方平台条款、个人信息保护义务或知识产权限制。

对目标用户来说，典型场景是老板分析自己的订单、商品、地区和渠道数据，因此“是否有权处理数据”通常更清楚。需要注意的是，如果导入的数据包含平台限制字段、客户个人信息、第三方图片/文案或他人商业秘密，使用者仍应先确认自己有权处理和上传给所选模型服务。

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

## Quick Start

推荐先验收预编译桌面包：

1. 在 [GitHub Releases](https://github.com/eric-stone-plus/QueryForge/releases/latest) 下载 `QueryForge-macOS-x86_64.zip`。
2. 解压后打开 `QueryForge.app`。
3. 右上角 `Settings` 选择模型服务并填写自己的 API key/token。
4. DeepSeek 演示可选择 `DeepSeek`，高级设置里确认 model 为 `deepseek-v4-pro`，然后点击 `保存并测试`。

源码开发路径：

```bash
git clone https://github.com/eric-stone-plus/QueryForge.git
cd QueryForge
npm install
cp .env.example .env.local
npm run dev
```

本地桌面构建（当前 demo 为 macOS 包；产品形态不限制未来 Windows 包）：

```bash
./desktop/build_macos.sh
open desktop/dist/QueryForge.app
```

打开应用后，在右上角 `Settings` 选择模型服务并填写 API key/token。DeepSeek、Moonshot/Kimi、OpenAI、Anthropic 等常见服务会自动带出 URL 和 model；需要时再展开高级设置手动指定 API URL、backend、model 和 token 预算。

现场演示 DeepSeek 路径：

1. 打开 `QueryForge.app`，确认右上角状态为 `未配置`。
2. 打开 `Settings`，选择 `DeepSeek`。
3. 粘贴自己的 API key/token。
4. 高级设置里确认 model，可改为 `deepseek-v4-pro`。
5. 点击 `保存并测试`，通过后直接用自然语言提问。

当前本地版本会把 key 写入用户本机配置文件并设置为 `0600` 权限；商业发行版应迁移到操作系统凭据管理能力，只在配置文件里保留 URL、backend、model 和 token 预算。

## License

Apache-2.0

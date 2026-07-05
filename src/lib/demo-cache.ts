// Pre-cached demo results for instant demo when the AI API is slow or unavailable.
export const CACHED_RESULTS: Record<string, object> = {
  "各地区月度销售额趋势": {
    thinking: "分析 Olist 巴西地区的月度营收趋势。Sudeste 是最大市场，应重点观察其峰值月份、季节性和与其他地区的差距。",
    intent: "查看各地区按月份的销售额变化趋势，识别增长和季节性规律",
    sql: "SELECT r.name AS region, strftime('%Y-%m', o.order_date) AS month, ROUND(SUM(o.total_amount), 0) AS revenue FROM orders o JOIN regions r ON o.region_id = r.id GROUP BY r.name, strftime('%Y-%m', o.order_date) ORDER BY r.name, month LIMIT 500",
    chartConfig: { type: "line", x_key: "month", y_key: "revenue", title: "各地区月度营收趋势（R$）" },
    explanation: "数据结论：Sudeste 贡献 R$1,034 万，约占总营收 64.6%，是核心市场。月度峰值出现在 2018-05（约 R$78.5 万），2017-11 Black Friday 月份也达到约 R$78.1 万。\n\n趋势分析：2017 到 2018 年，Sudeste、Sul、Nordeste、Centro-Oeste、Norte 都呈现增长，Sudeste 的月均营收约 R$43.1 万，显著高于其他地区。\n\n业务建议：把大促预算优先放在 Sudeste，同时用 Nordeste/Norte 的高客单价特点测试高价值品类组合。\n\n数据局限：2016 年样本较少，2018 年后段数据不完整，季节性判断需要结合更多年份验证。",
  },
  "哪个地区最值得优先投放？": {
    thinking: "对跨境电商卖家来说，地区投放要同时看规模、客单价和增长空间。Olist 数据里 Sudeste 是规模核心，Nordeste 是高客单价市场。",
    intent: "判断哪个地区最适合优先投入营销和运营资源",
    sql: "SELECT r.name AS region, COUNT(DISTINCT o.id) AS orders, ROUND(SUM(o.total_amount), 0) AS total_revenue, ROUND(AVG(o.total_amount), 0) AS avg_order FROM orders o JOIN regions r ON o.region_id = r.id WHERE o.status = 'completed' GROUP BY r.name ORDER BY total_revenue DESC",
    chartConfig: { type: "bar", x_key: "region", y_key: "total_revenue", title: "地区投放优先级（营收）" },
    explanation: "数据结论：Sudeste 是最值得优先投放的规模市场，已完成订单约 66,200 单，营收约 R$996 万；Norte 客单价最高，约 R$223，但完成订单仅约 1,796 单。\n\n经营判断：如果目标是快速放量，优先做 Sudeste 的转化和复购；如果目标是测试高价值商品，可以把 Nordeste 和 Norte 作为小流量验证市场。\n\n业务建议：先用 Sudeste 跑主力品类和广告素材，再用 Nordeste/Norte 测试高客单组合包或免邮门槛。\n\n数据局限：Olist 是巴西 demo 数据，真实投放还需要结合你的商品毛利、物流成本和广告渠道数据。",
  },
  "各地区客单价差异分析": {
    thinking: "客单价分析是电商基础 KPI。Olist 数据中，Nordeste 的订单规模低于 Sudeste，但平均订单金额更高，适合用来区分规模市场和价值市场。",
    intent: "对比各地区的平均客单价，识别消费能力差异和定价策略机会",
    sql: "SELECT r.name AS region, COUNT(DISTINCT o.id) AS orders, ROUND(AVG(o.total_amount), 0) AS avg_order, ROUND(SUM(o.total_amount), 0) AS total_revenue FROM orders o JOIN regions r ON o.region_id = r.id WHERE o.status = 'completed' GROUP BY r.name ORDER BY avg_order DESC",
    chartConfig: { type: "bar", x_key: "region", y_key: "avg_order", title: "各地区平均客单价（R$）" },
    explanation: "数据结论：已完成订单中，Norte 客单价最高，约 R$223；Nordeste 约 R$202；Sudeste 客单价约 R$150，但订单量达到 66,200 单，是 Norte 1,796 单的 36.9 倍。\n\n趋势分析：Sudeste 是规模市场，贡献 R$996 万；Norte/Nordeste 是高客单小样本市场，适合看品类结构和利润率。\n\n业务建议：Sudeste 重点做复购和转化效率，Norte/Nordeste 重点测试高价值品类、组合包和免邮门槛。\n\n数据局限：客单价会受到品类、运费和促销影响，下一步应拆到 category 维度验证。",
  },
  "复购用户的品类跨越路径": {
    thinking: "品类关联分析是 Kaggle 社区对 Olist 数据集的经典分析方向。购物篮分析（Market Basket Analysis）可以揭示交叉销售机会。参考 RFM 框架中的 Frequency 维度：复购用户的行为模式比单次购买用户更有价值。通过分析复购用户的首单品类和后续品类，可以发现品类间的消费路径。",
    intent: "分析复购用户的品类迁移路径，发现交叉销售机会",
    sql: "WITH repeat_users AS (SELECT user_id FROM orders GROUP BY user_id HAVING COUNT(*) > 1), first_order AS (SELECT o.user_id, MIN(o.id) as fo FROM orders o JOIN repeat_users r ON o.user_id = r.user_id GROUP BY o.user_id), first_cat AS (SELECT fo.user_id, c.name as first_category FROM first_order fo JOIN order_items oi ON oi.order_id = fo.fo JOIN products p ON p.id = oi.product_id JOIN categories c ON c.id = p.category_id), later_cat AS (SELECT o.user_id, c.name as later_category FROM orders o JOIN repeat_users r ON o.user_id = r.user_id JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id JOIN categories c ON c.id = p.category_id WHERE o.id NOT IN (SELECT fo FROM first_order)) SELECT fc.first_category, lc.later_category, COUNT(*) as cross_count FROM first_cat fc JOIN later_cat lc ON fc.user_id = lc.user_id WHERE fc.first_category != lc.later_category GROUP BY fc.first_category, lc.later_category ORDER BY cross_count DESC LIMIT 10",
    chartConfig: { type: "bar", x_key: "later_category", y_key: "cross_count", title: "复购用户品类跨越 Top 10" },
    explanation: "数据结论：最显著的品类跨越路径是 furniture_decor → bed_bath_table（91次），其次是 bed_bath_table → furniture_decor（67次）。这说明家居品类之间有强关联性——买了家具装饰的用户，后续倾向于购买床品家纺，反之亦然。health_beauty → furniture_decor（22次）是跨大类的典型路径。\n\n购物篮分析视角：家居品类（furniture_decor、bed_bath_table、housewares）形成了一个强关联的「品类簇」。这与 Kaggle 社区对 Olist 的分析一致——家居品类的复购率和交叉购买率在所有品类中最高。\n\n业务建议：针对购买了家具装饰的用户，推荐床品家纺类商品（转化概率最高）；针对美妆用户，推荐家居香薰、收纳等关联品类。可以设计「家居焕新」组合包，覆盖 furniture_decor + bed_bath_table + housewares 三个品类。\n\n数据局限：仅分析了复购用户的品类跨越，未考虑时间间隔因素。部分品类跨越可能间隔数月，需结合 RFM 的 Recency 维度进一步分析。",
  },
  "哪些品类适合做组合推荐？": {
    thinking: "组合推荐应优先从复购和跨品类路径中找强关联。Olist 数据里 furniture_decor、bed_bath_table 和 housewares 形成家居品类簇。",
    intent: "识别适合组合推荐和交叉销售的商品品类",
    sql: "WITH repeat_users AS (SELECT user_id FROM orders GROUP BY user_id HAVING COUNT(*) > 1), first_order AS (SELECT o.user_id, MIN(o.id) as fo FROM orders o JOIN repeat_users r ON o.user_id = r.user_id GROUP BY o.user_id), first_cat AS (SELECT fo.user_id, c.name as first_category FROM first_order fo JOIN order_items oi ON oi.order_id = fo.fo JOIN products p ON p.id = oi.product_id JOIN categories c ON c.id = p.category_id), later_cat AS (SELECT o.user_id, c.name as later_category FROM orders o JOIN repeat_users r ON o.user_id = r.user_id JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id JOIN categories c ON c.id = p.category_id WHERE o.id NOT IN (SELECT fo FROM first_order)) SELECT fc.first_category, lc.later_category, COUNT(*) as cross_count FROM first_cat fc JOIN later_cat lc ON fc.user_id = lc.user_id WHERE fc.first_category != lc.later_category GROUP BY fc.first_category, lc.later_category ORDER BY cross_count DESC LIMIT 10",
    chartConfig: { type: "bar", x_key: "later_category", y_key: "cross_count", title: "组合推荐品类路径 Top 10" },
    explanation: "数据结论：最强路径是 furniture_decor → bed_bath_table（91 次），其次是 bed_bath_table → furniture_decor（67 次）。这说明家居装饰、床品家纺和家用品之间存在明显关联。\n\n经营判断：适合做组合推荐的不是孤立爆品，而是能覆盖同一使用场景的品类簇，例如“家居焕新”场景。\n\n业务建议：购买 furniture_decor 后推荐 bed_bath_table 或 housewares；购买美妆后可测试家居香薰、收纳等轻关联品类。\n\n数据局限：这里只看复购路径，没有加入时间间隔和毛利，真实上架前还要验证利润和库存。",
  },
  "渠道表现对比分析": {
    thinking: "Olist 数据集中的支付方式反映了巴西消费者的支付习惯。需要同时看订单量、客单价和营收，避免只按单量判断渠道价值。",
    intent: "对比各支付渠道的订单量、客单价和总营收，识别渠道策略机会",
    sql: "SELECT o.channel AS channel, COUNT(DISTINCT o.id) AS orders, ROUND(AVG(o.total_amount), 0) AS avg_order, ROUND(SUM(o.total_amount), 0) AS total_revenue FROM orders o WHERE o.status = 'completed' GROUP BY o.channel ORDER BY orders DESC",
    chartConfig: { type: "bar", x_key: "channel", y_key: "total_revenue", title: "支付渠道营收对比（R$）" },
    explanation: "数据结论：已完成订单中，Cartão de Crédito 贡献 73,221 单、R$1,212 万营收，客单价约 R$166；Boleto 贡献 19,191 单、R$277 万营收，客单价约 R$144。\n\n趋势分析：Cartão de Crédito 占完成订单约 75.9%，是主渠道；Voucher 和 Cartão de Débito 规模较小，合计订单占比低于 5%。\n\n业务建议：主渠道优先优化分期付款和高价值品类转化；Boleto 适合用到账提醒或小额激励缩短付款周期。\n\n数据局限：这里的渠道来自 payment_type，不等同于投放渠道或访问来源。",
  },
};

// Pre-cached demo results for instant demo when the AI API is slow or unavailable.
export const CACHED_RESULTS: Record<string, object> = {
  "各地区月度销售额趋势": {
    thinking: "用户想看各地区的月度销售额趋势。需要连接orders和regions表，按地区和月份分组计算收入。华东(Sudeste)是巴西最大市场，应该占主导。",
    intent: "查看各地区按月份的销售额变化趋势，识别增长和季节性规律",
    sql: "SELECT r.name AS region, strftime('%Y-%m', o.order_date) AS month, ROUND(SUM(o.total_amount), 0) AS revenue FROM orders o JOIN regions r ON o.region_id = r.id GROUP BY r.name, strftime('%Y-%m', o.order_date) ORDER BY r.name, month LIMIT 500",
    chartConfig: { type: "line", x_key: "month", y_key: "revenue", title: "各地区月度销售额趋势" },
    explanation: "数据结论：华东地区（Sudeste，含圣保罗、里约）贡献了总营收的约65%，是巴西电商的核心市场。2017年11月出现明显的销售额峰值（约R$120万），与巴西Black Friday促销高度吻合。趋势分析：从2017年初到2018年中，各地区营收呈稳定增长态势，华东地区月均增长率约8%。业务建议：建议重点投放华东市场，同时关注华南（Sul）地区的增长潜力——该地区用户购买力强但渗透率较低。数据局限：2016年数据量较少（平台早期），2018年9月后数据不完整。",
  },
  "各地区客单价差异分析": {
    thinking: "用户想了解不同地区的消费能力差异。客单价 = 平均每单金额。需要连接orders和regions表，按地区聚合。华北(Nordeste)虽然订单量少，但客单价可能更高（高价值品类集中）。",
    intent: "对比各地区的平均客单价，识别消费能力差异和定价策略机会",
    sql: "SELECT r.name AS region, COUNT(DISTINCT o.id) AS orders, ROUND(AVG(o.total_amount), 0) AS avg_order, ROUND(SUM(o.total_amount), 0) AS total_revenue FROM orders o JOIN regions r ON o.region_id = r.id WHERE o.status = 'completed' GROUP BY r.name ORDER BY avg_order DESC",
    chartConfig: { type: "bar", x_key: "region", y_key: "avg_order", title: "各地区平均客单价（R$）" },
    explanation: "数据结论：华北地区（Nordeste）客单价最高（R$202），是华东（R$150）的1.35倍。但华东订单量（66,200单）是华北（9,044单）的7倍。趋势分析：这反映了巴西区域经济差异——东北部消费者倾向于集中购买高价值商品，而东南部购买频次高但单笔金额低。业务建议：针对华北市场可推高客单价策略（组合优惠、满减），针对华东市场可推频次提升策略（会员、复购激励）。数据局限：客单价受品类结构影响，需结合品类分析进一步验证。",
  },
  "复购用户的品类跨越路径": {
    thinking: "用户想了解复购用户的消费行为模式。需要先识别复购用户（COUNT>1），再分析他们的首单品类和后续购买品类的关联。这是购物篮分析的基础。",
    intent: "分析复购用户的品类迁移路径，发现交叉销售机会",
    sql: "WITH repeat_users AS (SELECT user_id FROM orders GROUP BY user_id HAVING COUNT(*) > 1), first_order AS (SELECT o.user_id, MIN(o.id) as fo FROM orders o JOIN repeat_users r ON o.user_id = r.user_id GROUP BY o.user_id), first_cat AS (SELECT fo.user_id, c.name as first_category FROM first_order fo JOIN order_items oi ON oi.order_id = fo.fo JOIN products p ON p.id = oi.product_id JOIN categories c ON c.id = p.category_id), later_cat AS (SELECT o.user_id, c.name as later_category FROM orders o JOIN repeat_users r ON o.user_id = r.user_id JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id JOIN categories c ON c.id = p.category_id WHERE o.id NOT IN (SELECT fo FROM first_order)) SELECT fc.first_category, lc.later_category, COUNT(*) as cross_count FROM first_cat fc JOIN later_cat lc ON fc.user_id = lc.user_id WHERE fc.first_category != lc.later_category GROUP BY fc.first_category, lc.later_category ORDER BY cross_count DESC LIMIT 10",
    chartConfig: { type: "bar", x_key: "later_category", y_key: "cross_count", title: "复购用户品类跨越 Top 10" },
    explanation: "数据结论：最显著的品类跨越路径是 furniture_decor → bed_bath_table（91次），其次是 bed_bath_table → furniture_decor（67次）。这说明家居品类之间有强关联性。趋势分析：health_beauty → furniture_decor（22次）是跨大类的典型路径，美妆用户会延伸到家居消费。业务建议：针对购买了家具装饰的用户，推荐床品家纺类商品（转化率最高）；针对美妆用户，推荐家居香薰、收纳等关联品类。数据局限：仅分析了复购用户的品类跨越，未考虑时间间隔因素。",
  },
  "渠道表现对比分析": {
    thinking: "用户想了解不同销售渠道的表现差异。需要按渠道聚合订单量、平均客单价、总营收。Olist的数据中渠道映射为天猫(credit_card)、线下门店(boleto)、抖音(voucher)、微信小程序(debit_card)。",
    intent: "对比各销售渠道的订单量、客单价和总营收，识别渠道策略机会",
    sql: "SELECT o.channel AS channel, COUNT(DISTINCT o.id) AS orders, ROUND(AVG(o.total_amount), 0) AS avg_order, ROUND(SUM(o.total_amount), 0) AS total_revenue FROM orders o WHERE o.status = 'completed' GROUP BY o.channel ORDER BY orders DESC",
    chartConfig: { type: "bar", x_key: "channel", y_key: "total_revenue", title: "渠道营收对比" },
    explanation: "数据结论：天猫（credit_card）以73,221单贡献了最大营收，客单价R$166。线下门店（boleto）19,191单，客单价R$144。抖音（voucher）订单量最少（2,582单）但客单价最低（R$125）。趋势分析：天猫渠道占绝对主导（74%订单量），这与巴西电商市场信用卡支付占比高的特征一致。线下门店的客单价低于天猫，可能是因为boleto支付方式倾向于小额交易。业务建议：抖音渠道有增长空间，可针对低客单价品类做精准投放；天猫渠道应关注高价值品类的转化率提升。数据局限：渠道映射基于支付方式，非实际销售渠道。",
  },
};

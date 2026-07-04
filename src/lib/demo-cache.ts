// Pre-cached demo results for instant demo when the AI API is slow or unavailable.
export const CACHED_RESULTS: Record<string, object> = {
  "各地区月度销售额趋势": {
    thinking: "分析 Olist 各地区（巴西五大区）的月度营收趋势。Sudeste（东南部，含圣保罗、里约）是巴西经济中心，应占主导。参考 Kaggle 社区的 EDA 方法：按月聚合营收，观察季节性（Black Friday 在11月）和增长趋势。",
    intent: "查看各地区按月份的销售额变化趋势，识别增长和季节性规律",
    sql: "SELECT r.name AS region, strftime('%Y-%m', o.order_date) AS month, ROUND(SUM(o.total_amount), 0) AS revenue FROM orders o JOIN regions r ON o.region_id = r.id GROUP BY r.name, strftime('%Y-%m', o.order_date) ORDER BY r.name, month LIMIT 500",
    chartConfig: { type: "line", x_key: "month", y_key: "revenue", title: "各地区月度营收趋势（R$）" },
    explanation: "数据结论：Sudeste（东南部）贡献了总营收的约65%，月均 R$55万，是巴西电商的核心市场。2017年11月出现明显峰值（约R$120万），与巴西 Black Friday（黑色星期五）促销高度吻合——这是巴西全年最大的电商促销节点，仅次于中国双十一。\n\n趋势分析：从2017年初到2018年中，各地区营收呈稳定增长态势，Sudeste 月均增长率约8%。Nordeste（东北部）虽然基数小（月均R$8万），但增速最快（约12%），反映巴西二三线城市的电商渗透正在加速。\n\n业务建议：建议在 Black Friday 前一个月加大 Sudeste 地区的营销投入（ROI 最高），同时关注 Nordeste 的增长潜力——该地区互联网普及率正在快速提升，是下一个增量市场。\n\n数据局限：2016年数据量较少（Olist 早期），2018年9月后数据不完整。季节性分析仅覆盖两个完整年度，需更多数据验证。",
  },
  "各地区客单价差异分析": {
    thinking: "客单价分析是电商基础 KPI。Olist 数据中，Nordeste（东北部）虽然订单量少，但客单价可能更高——这在 Kaggle 社区的分析中被多次验证，原因是东北部消费者倾向于集中购买高价值商品（家电、家具），而 Sudeste 以高频低客单的日用品为主。这反映了巴西区域经济差异。",
    intent: "对比各地区的平均客单价，识别消费能力差异和定价策略机会",
    sql: "SELECT r.name AS region, COUNT(DISTINCT o.id) AS orders, ROUND(AVG(o.total_amount), 0) AS avg_order, ROUND(SUM(o.total_amount), 0) AS total_revenue FROM orders o JOIN regions r ON o.region_id = r.id WHERE o.status = 'completed' GROUP BY r.name ORDER BY avg_order DESC",
    chartConfig: { type: "bar", x_key: "region", y_key: "avg_order", title: "各地区平均客单价（R$）" },
    explanation: "数据结论：Nordeste（东北部）客单价最高（R$202），是 Sudeste（R$150）的1.35倍。但 Sudeste 订单量（66,200单）是 Nordeste（9,044单）的7倍。这与巴西区域经济结构一致——东南部是消费频次驱动，东北部是客单价驱动。\n\nRFM 视角：从 Monetary 维度看，Nordeste 用户的单次消费能力更强。但从 Frequency 维度看，Sudeste 用户的购买频次是东北部的5倍。这意味着：Sudeste 适合做复购激励（提升 LTV），Nordeste 适合做品类扩展（提升客单价）。\n\n业务建议：针对 Nordeste 市场可推组合优惠、满减策略（利用高客单价优势）；针对 Sudeste 可推会员制、订阅制（利用高频购买习惯）。\n\n数据局限：客单价受品类结构影响，Nordeste 的高客单价可能是因为家具、家电等高价值品类占比更高，需结合品类分析进一步验证。",
  },
  "复购用户的品类跨越路径": {
    thinking: "品类关联分析是 Kaggle 社区对 Olist 数据集的经典分析方向。购物篮分析（Market Basket Analysis）可以揭示交叉销售机会。参考 RFM 框架中的 Frequency 维度：复购用户的行为模式比单次购买用户更有价值。通过分析复购用户的首单品类和后续品类，可以发现品类间的消费路径。",
    intent: "分析复购用户的品类迁移路径，发现交叉销售机会",
    sql: "WITH repeat_users AS (SELECT user_id FROM orders GROUP BY user_id HAVING COUNT(*) > 1), first_order AS (SELECT o.user_id, MIN(o.id) as fo FROM orders o JOIN repeat_users r ON o.user_id = r.user_id GROUP BY o.user_id), first_cat AS (SELECT fo.user_id, c.name as first_category FROM first_order fo JOIN order_items oi ON oi.order_id = fo.fo JOIN products p ON p.id = oi.product_id JOIN categories c ON c.id = p.category_id), later_cat AS (SELECT o.user_id, c.name as later_category FROM orders o JOIN repeat_users r ON o.user_id = r.user_id JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id JOIN categories c ON c.id = p.category_id WHERE o.id NOT IN (SELECT fo FROM first_order)) SELECT fc.first_category, lc.later_category, COUNT(*) as cross_count FROM first_cat fc JOIN later_cat lc ON fc.user_id = lc.user_id WHERE fc.first_category != lc.later_category GROUP BY fc.first_category, lc.later_category ORDER BY cross_count DESC LIMIT 10",
    chartConfig: { type: "bar", x_key: "later_category", y_key: "cross_count", title: "复购用户品类跨越 Top 10" },
    explanation: "数据结论：最显著的品类跨越路径是 furniture_decor → bed_bath_table（91次），其次是 bed_bath_table → furniture_decor（67次）。这说明家居品类之间有强关联性——买了家具装饰的用户，后续倾向于购买床品家纺，反之亦然。health_beauty → furniture_decor（22次）是跨大类的典型路径。\n\n购物篮分析视角：家居品类（furniture_decor、bed_bath_table、housewares）形成了一个强关联的「品类簇」。这与 Kaggle 社区对 Olist 的分析一致——家居品类的复购率和交叉购买率在所有品类中最高。\n\n业务建议：针对购买了家具装饰的用户，推荐床品家纺类商品（转化概率最高）；针对美妆用户，推荐家居香薰、收纳等关联品类。可以设计「家居焕新」组合包，覆盖 furniture_decor + bed_bath_table + housewares 三个品类。\n\n数据局限：仅分析了复购用户的品类跨越，未考虑时间间隔因素。部分品类跨越可能间隔数月，需结合 RFM 的 Recency 维度进一步分析。",
  },
  "渠道表现对比分析": {
    thinking: "Olist 数据集中的支付方式（payment_type）反映了巴西消费者的支付习惯。Kaggle 社区的分析显示：credit_card（信用卡）占绝对主导（约75%），boleto（银行转账单据，巴西特有的线下支付方式）占约20%。这是巴西电商市场的独特特征——boleto 在其他国家几乎不存在。Voucher（代金券）和 debit_card（借记卡）占比较小。",
    intent: "对比各支付渠道的订单量、客单价和总营收，识别渠道策略机会",
    sql: "SELECT o.channel AS channel, COUNT(DISTINCT o.id) AS orders, ROUND(AVG(o.total_amount), 0) AS avg_order, ROUND(SUM(o.total_amount), 0) AS total_revenue FROM orders o WHERE o.status = 'completed' GROUP BY o.channel ORDER BY orders DESC",
    chartConfig: { type: "bar", x_key: "channel", y_key: "total_revenue", title: "支付渠道营收对比（R$）" },
    explanation: "数据结论：Cartão de Crédito（信用卡）以73,221单贡献了最大营收，客单价R$166。Boleto（银行转账单据）19,191单，客单价R$144。Voucher（代金券）订单量最少（2,582单）但客单价最低（R$125）。\n\n巴西支付习惯分析：信用卡占74%订单量，这与巴西电商市场的整体趋势一致——信用卡分期付款（parcelamento）是巴西消费者的核心支付习惯，可以将高价商品拆分为6-12期免息付款。Boleto 作为巴西特有的线下支付方式，主要服务于没有信用卡的用户群体（约占人口的30%）。\n\n业务建议：信用卡渠道应重点推广分期付款功能（提升高价值品类转化率）；Boleto 渠道可推即时到账优惠（缩短回款周期）；Voucher 渠道适合作为促销引流工具（低成本获客）。\n\n数据局限：渠道映射基于支付方式（payment_type），非实际销售渠道（如网站、APP、线下）。实际的渠道分析需要更细粒度的数据。",
  },
};

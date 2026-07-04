// Pre-cached demo results for instant demo when the Kimi API is slow or unavailable.
export const CACHED_RESULTS: Record<string, object> = {
  "各地区月度销售额趋势": {
    thinking: "用户想看各地区的月度销售额趋势。需要连接orders和regions表，按地区和月份分组计算收入。华东(Sudeste)是巴西最大市场，应该占主导。",
    intent: "查看各地区按月份的销售额变化趋势，识别增长和季节性规律",
    sql: "SELECT r.name AS region, strftime('%Y-%m', o.order_date) AS month, ROUND(SUM(o.total_amount), 0) AS revenue FROM orders o JOIN regions r ON o.region_id = r.id GROUP BY r.name, strftime('%Y-%m', o.order_date) ORDER BY r.name, month LIMIT 500",
    chartConfig: { type: "line", x_key: "month", y_key: "revenue", title: "各地区月度销售额趋势" },
    explanation: "数据结论：华东地区（Sudeste，含圣保罗、里约）贡献了总营收的约65%，是巴西电商的核心市场。2017年11月出现明显的销售额峰值（约R$120万），与巴西Black Friday促销高度吻合。趋势分析：从2017年初到2018年中，各地区营收呈稳定增长态势，华东地区月均增长率约8%。业务建议：建议重点投放华东市场，同时关注华南（Sul）地区的增长潜力——该地区用户购买力强但渗透率较低。数据局限：2016年数据量较少（平台早期），2018年9月后数据不完整。",
  },
  "哪个品类利润率最高？": {
    thinking: "用户想知道哪个品类的利润率最高。利润率 = (售价 - 成本) / 售价。需要连接products和categories表。注意：成本数据是估算的（约55%售价），实际利润率差异来自品类特性。",
    intent: "对比各品类的平均利润率，识别高利润品类",
    sql: "SELECT c.name AS category, ROUND(AVG((p.unit_price - p.unit_cost) / p.unit_price) * 100, 2) AS margin_pct FROM products p JOIN categories c ON p.category_id = c.id GROUP BY c.name ORDER BY margin_pct DESC LIMIT 15",
    chartConfig: { type: "bar", x_key: "category", y_key: "margin_pct", title: "品类利润率对比" },
    explanation: "数据结论：所有品类的平均利润率在45%左右，差异不大（因为成本按售价的固定比例估算）。在实际业务中，不同品类的利润率差异会更显著——例如电子产品的利润率通常低于服饰和美妆。业务建议：在真实部署中，建议接入实际成本数据（ERP系统），这样才能做准确的品类利润分析。当前数据的局限：成本是估算值，不能反映真实的品类利润差异。",
  },
  "Top 10 营收品类": {
    thinking: "用户想看营收最高的10个品类。按order_items的unit_price求和排序。health_beauty和watches_gifts是Olist平台的头部品类。",
    intent: "查看营收最高的10个品类，识别核心收入来源",
    sql: "SELECT c.name AS category, COUNT(oi.id) AS order_count, ROUND(SUM(oi.unit_price), 0) AS total_revenue FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN categories c ON p.category_id = c.id GROUP BY c.name ORDER BY total_revenue DESC LIMIT 10",
    chartConfig: { type: "bar", x_key: "category", y_key: "total_revenue", title: "Top 10 营收品类" },
    explanation: "数据结论：健康美容（health_beauty）以R$125.9万营收位居第一，其次是钟表礼品（R$120.5万）和床品家纺（R$103.7万）。Top 3品类合计占总营收约22%。趋势分析：前10品类的营收分布相对均匀，没有极端的头部效应——这反映了Olist作为综合marketplace的特性。业务建议：健康美容品类的订单量（8,836单）远高于钟表礼品（5,624单），但营收接近，说明钟表礼品的客单价更高。可以考虑在钟表礼品品类增加SKU和营销投入。数据局限：品类名称为英文（原始数据为葡萄牙语翻译），部分品类归类可能不够精细。",
  },
  "各地区复购率分析": {
    thinking: "用户想看复购率分析。Olist是marketplace，复购率约3%——这是真实的巴西电商数据。marketplace的复购率通常低于品牌直营电商。",
    intent: "分析各地区的用户复购行为，识别忠诚度差异",
    sql: "SELECT r.name AS region, COUNT(DISTINCT o.user_id) AS users, SUM(CASE WHEN oc.cnt > 1 THEN 1 ELSE 0 END) AS repeat_users, ROUND(SUM(CASE WHEN oc.cnt > 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT o.user_id), 1) AS repeat_rate FROM orders o JOIN regions r ON o.region_id = r.id JOIN (SELECT user_id, COUNT(*) AS cnt FROM orders GROUP BY user_id) oc ON oc.user_id = o.user_id GROUP BY r.name ORDER BY repeat_rate DESC",
    chartConfig: { type: "bar", x_key: "region", y_key: "repeat_rate", title: "各地区复购率(%)" },
    explanation: "数据结论：Olist平台整体复购率约3.1%，各地区差异不大。这个数字看起来低，但对于marketplace平台是正常的——Amazon的复购率也在类似水平。趋势分析：96,096个用户中，约3,000个用户有多次购买记录。复购用户的平均订单数约为2-3单。业务建议：提升复购率的关键是品类交叉推荐——买过健康美容的用户可能对服饰感兴趣。建议在PPT中将复购率定位为'增长机会'而非'问题'。数据局限：Olist是开放marketplace，用户购买行为分散在不同卖家，不像品牌电商那样容易建立忠诚度。",
  },
};

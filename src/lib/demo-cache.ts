// Pre-cached demo results for instant demo (MiMo API fallback)
export const CACHED_RESULTS: Record<string, object> = {
  "各地区月度销售额趋势": {
    thinking: "用户想看各地区的月度销售额趋势。需要连接orders、regions和order_items表，按地区和月份分组计算收入。",
    intent: "查看各地区按月份的销售额变化趋势",
    sql: "SELECT r.name AS region, strftime('%Y-%m', o.order_date) AS month, SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) AS revenue FROM orders o JOIN regions r ON o.region_id = r.id JOIN order_items oi ON oi.order_id = o.id GROUP BY r.name, strftime('%Y-%m', o.order_date) ORDER BY r.name, month LIMIT 500",
    chartConfig: { type: "line", x_key: "month", y_key: "revenue", title: "各地区月度销售额趋势" },
    explanation: "展示各地区每月的销售额变化趋势，通过折线图可以直观观察不同地区的销售走势和季节性变化规律。",
  },
  "哪个品类利润率最高？": {
    thinking: "用户想知道哪个品类的利润率最高。利润率 = (售价 - 成本) / 售价。需要连接products和categories表。",
    intent: "查看各品类的平均利润率对比",
    sql: "SELECT c.name AS category, ROUND(AVG((p.unit_price - p.unit_cost) / p.unit_price) * 100, 2) AS margin_pct FROM products p JOIN categories c ON p.category_id = c.id GROUP BY c.name ORDER BY margin_pct DESC LIMIT 20",
    chartConfig: { type: "bar", x_key: "category", y_key: "margin_pct", title: "品类利润率对比" },
    explanation: "对比各品类的平均利润率，帮助识别高利润品类，优化产品组合策略。",
  },
  "Top 10 畅销商品": {
    thinking: "用户想看最畅销的10个商品。按销售额排序，取前10。",
    intent: "查看销售额最高的10个商品",
    sql: "SELECT p.name AS product, SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) AS revenue FROM order_items oi JOIN products p ON oi.product_id = p.id GROUP BY p.name ORDER BY revenue DESC LIMIT 10",
    chartConfig: { type: "bar", x_key: "product", y_key: "revenue", title: "Top 10 畅销商品" },
    explanation: "展示销售额最高的10个商品，帮助识别核心产品和爆款商品。",
  },
  "复购率最高的用户分析": {
    thinking: "用户想看复购率最高的用户。按用户购买次数排序，取前20。",
    intent: "查看购买次数最多的用户",
    sql: "SELECT u.name, COUNT(DISTINCT o.id) AS order_count, ROUND(SUM(oi.quantity * oi.unit_price * (1 - oi.discount)), 2) AS total_spent FROM users u JOIN orders o ON o.user_id = u.id JOIN order_items oi ON oi.order_id = o.id GROUP BY u.name ORDER BY order_count DESC LIMIT 20",
    chartConfig: { type: "bar", x_key: "name", y_key: "order_count", title: "复购率最高的Top20用户（按购买次数）" },
    explanation: "展示购买次数最多的用户，识别高价值客户和复购行为模式。",
  },
};

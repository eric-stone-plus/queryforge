const Database = require('better-sqlite3');
const db = new Database('./data/ecommerce.db', { readonly: true });

const metrics = db.prepare(`
  SELECT
    (SELECT COUNT(*) FROM orders) as total_orders,
    (SELECT ROUND(SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) / 10000, 0) FROM order_items oi) as revenue_wan,
    (SELECT ROUND(AVG(sub.r), 0) FROM (SELECT SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) as r FROM orders o JOIN order_items oi ON oi.order_id = o.id GROUP BY o.id) sub) as avg_order,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM products) as total_products,
    (SELECT COUNT(*) FROM categories) as total_categories,
    (SELECT COUNT(DISTINCT region_id) FROM orders) as regions,
    (SELECT COUNT(*) FROM orders WHERE status = 'completed') as completed,
    (SELECT COUNT(*) FROM orders WHERE status = 'refunded') as refunded,
    (SELECT COUNT(*) FROM orders WHERE status = 'shipped') as shipped,
    (SELECT COUNT(DISTINCT user_id) FROM orders) as buyers,
    (SELECT ROUND(1.0 * COUNT(*) / COUNT(DISTINCT user_id), 1) FROM orders) as orders_per_user,
    (SELECT ROUND(AVG((unit_price - unit_cost) / unit_price) * 100, 1) FROM products) as gross_margin,
    (SELECT COUNT(DISTINCT product_id) FROM order_items) as sold_products,
    (SELECT ROUND(1.0 * COUNT(*) / COUNT(DISTINCT order_id), 1) FROM order_items) as items_per_order
`).get();

// Repeat purchase rate
const repeatRate = db.prepare(`
  SELECT ROUND(100.0 * COUNT(DISTINCT CASE WHEN cnt > 1 THEN user_id END) / COUNT(DISTINCT user_id), 1) as val
  FROM (SELECT user_id, COUNT(*) as cnt FROM orders GROUP BY user_id)
`).get().val;

// Top region share
const topRegionShare = db.prepare(`
  SELECT ROUND(100.0 * MAX(region_rev) / total_rev, 1) as val
  FROM (SELECT SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) as region_rev FROM orders o JOIN order_items oi ON oi.order_id = o.id GROUP BY o.region_id)
  CROSS JOIN (SELECT SUM(quantity * unit_price * (1 - discount)) as total_rev FROM order_items)
`).get().val;

console.log(JSON.stringify({
  ...metrics,
  repeat_rate: repeatRate,
  top_region_share: topRegionShare,
  completion_rate: Math.round(100 * metrics.completed / metrics.total_orders * 10) / 10,
  refund_rate: Math.round(100 * metrics.refunded / metrics.total_orders * 10) / 10,
  active_buyers: metrics.buyers,
  penetration: Math.round(100 * metrics.buyers / metrics.total_users * 10) / 10,
}, null, 2));

# R1-OC: 4 个 Hackathon Demo 精选问题

## 设计原则

现有 4 个 chip 覆盖了基础维度（趋势、利润率、营收排名、复购率）。以下 4 个问题需要更深层的 SQL 能力，展示 AI 从"会写 SQL"到"会做分析"的跨越。

---

## Q1: 复购用户的月均客单价趋势

**中文问题**: "复购用户的月均客单价呈什么趋势？是越来越高还是越来越低？"

**为什么 impressive**:
- 展示 AI 理解"复购"概念（COUNT(DISTINCT order_id) > 1）
- 需要先识别复购用户，再按月聚合计算客单价，最后排序看趋势
- 时间序列 + 用户分群 + 趋势判断，三层分析一步到位
- 比现有"各地区复购率"更深——从"谁复购"到"复购者行为变化"

**预期 SQL**:
```sql
WITH repeat_users AS (
  SELECT user_id
  FROM orders
  GROUP BY user_id
  HAVING COUNT(DISTINCT id) > 1
),
monthly_stats AS (
  SELECT
    strftime('%Y-%m', o.order_date) AS month,
    COUNT(DISTINCT o.id) AS order_count,
    SUM(o.total_amount) AS total_revenue,
    ROUND(SUM(o.total_amount) * 1.0 / COUNT(DISTINCT o.id), 2) AS avg_order_value
  FROM orders o
  INNER JOIN repeat_users r ON o.user_id = r.user_id
  WHERE o.status = 'completed'
  GROUP BY month
)
SELECT month, order_count, total_revenue, avg_order_value
FROM monthly_stats
ORDER BY month
```

**分析亮点**:
- 如果客单价逐月上升 → 高价值用户粘性增强，平台值得加大复购激励
- 如果客单价下降 → 复购用户在"薅羊毛"，需警惕促销依赖
- 图表：折线图，X 轴月份，Y 轴客单价，同时叠加订单量柱状图

---

## Q2: 区域品类偏好热力图

**中文问题**: "华东和华南的用户品类偏好有什么差异？哪些品类在一个地区热销但在另一个地区遇冷？"

**为什么 impressive**:
- 需要 4 表 JOIN：orders → users → regions + order_items → products → categories
- 展示 AI 能做"对比分析"而非单一聚合
- 结果是品类×地区的交叉矩阵，可渲染为热力图
- 非直觉洞察：同一品类在不同地区表现可能完全相反

**预期 SQL**:
```sql
WITH region_category_sales AS (
  SELECT
    r.name AS region,
    c.name AS category,
    SUM(oi.quantity) AS total_qty,
    ROUND(SUM(oi.quantity * oi.unit_price * (1 - oi.discount)), 2) AS total_revenue
  FROM orders o
  INNER JOIN users u ON o.user_id = u.id
  INNER JOIN regions r ON u.region_id = r.id
  INNER JOIN order_items oi ON o.id = oi.order_id
  INNER JOIN products p ON oi.product_id = p.id
  INNER JOIN categories c ON p.category_id = c.id
  WHERE r.name IN ('华东', '华南')
  GROUP BY r.name, c.name
),
ranked AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY region ORDER BY total_revenue DESC) AS rank
  FROM region_category_sales
)
SELECT region, category, total_qty, total_revenue, rank
FROM ranked
WHERE rank <= 10
ORDER BY region, rank
```

**分析亮点**:
- 两个地区 Top 10 品类重叠度低 → 说明区域运营需差异化选品
- 某品类在华东 Top 3 但华南 Top 10 开外 → 潜在的华南市场空白
- 图表：分组柱状图，左右对比华东/华南各品类营收

---

## Q3: 跨品类关联购买分析

**中文问题**: "购买了 bed_bath_table 的用户还会买什么其他品类？有哪些隐藏的品类关联？"

**为什么 impressive**:
- 需要自连接 order_items 表，同一订单内找不同品类
- 展示 AI 理解"关联购买"概念（类似购物篮分析 Apriori）
- 需要 3 层 JOIN：order_items → products → categories，再自连接
- 结果揭示跨品类机会，可直接指导捆绑销售策略

**预期 SQL**:
```sql
WITH target_orders AS (
  SELECT DISTINCT oi.order_id
  FROM order_items oi
  INNER JOIN products p ON oi.product_id = p.id
  INNER JOIN categories c ON p.category_id = c.id
  WHERE c.name = 'bed_bath_table'
),
cross_category AS (
  SELECT
    c.name AS related_category,
    COUNT(DISTINCT oi.order_id) AS co_occurrence,
    ROUND(AVG(oi.unit_price), 2) AS avg_price
  FROM order_items oi
  INNER JOIN products p ON oi.product_id = p.id
  INNER JOIN categories c ON p.category_id = c.id
  WHERE oi.order_id IN (SELECT order_id FROM target_orders)
    AND c.name != 'bed_bath_table'
  GROUP BY c.name
)
SELECT related_category, co_occurrence, avg_price
FROM cross_category
WHERE co_occurrence >= 5
ORDER BY co_occurrence DESC
LIMIT 15
```

**分析亮点**:
- bed_bath_table + furniture_decor 高频共现 → 家居场景捆绑机会
- 某些看似无关的品类强关联（如 electronics + office_furniture）→ 隐性需求场景
- 图表：柱状图展示 Top 15 关联品类的共现次数

---

## Q4: 折扣策略有效性诊断

**中文问题**: "高折扣商品是否带来了更高的复购率？我们的折扣策略有效吗？"

**为什么 impressive**:
- 需要计算折扣分组（高/中/低/无折扣），再关联复购行为
- 展示 AI 能做"策略诊断"而非简单数据查询
- 需要 3 表 JOIN + CASE WHEN 分组 + 子查询计算复购
- 结果直接回答商业决策问题，而非展示数据

**预期 SQL**:
```sql
WITH order_discount AS (
  SELECT
    oi.order_id,
    CASE
      WHEN AVG(oi.discount) >= 0.20 THEN '高折扣(≥20%)'
      WHEN AVG(oi.discount) >= 0.10 THEN '中折扣(10-20%)'
      WHEN AVG(oi.discount) > 0 THEN '低折扣(<10%)'
      ELSE '无折扣'
    END AS discount_tier,
    AVG(oi.discount) AS avg_discount_rate
  FROM order_items oi
  GROUP BY oi.order_id
),
user_discount_repurchase AS (
  SELECT
    o.user_id,
    od.discount_tier,
    COUNT(DISTINCT o.id) AS order_count
  FROM orders o
  INNER JOIN order_discount od ON o.id = od.order_id
  WHERE o.status = 'completed'
  GROUP BY o.user_id, od.discount_tier
)
SELECT
  discount_tier,
  COUNT(*) AS user_count,
  ROUND(AVG(order_count), 2) AS avg_orders_per_user,
  ROUND(SUM(CASE WHEN order_count > 1 THEN 1.0 ELSE 0 END) * 100.0 / COUNT(*), 1) AS repeat_rate_pct
FROM user_discount_repurchase
GROUP BY discount_tier
ORDER BY repeat_rate_pct DESC
```

**分析亮点**:
- 如果高折扣组复购率最高 → 折扣策略有效，可加大投入
- 如果高折扣组复购率反而低 → 折扣吸引了价格敏感用户，策略需调整
- 对比各组"人均订单数"，看折扣是否真的提升了消费频次
- 图表：分组柱状图，X 轴折扣档位，Y 轴复购率 + 人均订单数双轴

---

## 与现有 Chip 的差异化

| 现有 Chip | 覆盖维度 | 新问题 | 进阶能力 |
|-----------|---------|--------|---------|
| 各地区月度销售额趋势 | 时间×地区 | Q1 复购客单价趋势 | 用户分群 + 时间序列 |
| 哪个品类利润率最高？ | 品类×利润 | Q2 区域品类偏好 | 多表 JOIN + 对比分析 |
| Top 10 营收品类 | 品类排名 | Q3 跨品类关联 | 自连接 + 关联规则 |
| 各地区复购率分析 | 地区×复购 | Q4 折扣策略诊断 | 分组聚合 + 策略评估 |

## 演示建议

1. **开场用 Q1**：展示 AI 理解复杂用户分群概念，折线图直观
2. **中间用 Q2 + Q3**：展示多表 JOIN 能力，热力图/柱状图视觉冲击
3. **收尾用 Q4**：展示 AI 回答商业决策问题，而非仅仅展示数据

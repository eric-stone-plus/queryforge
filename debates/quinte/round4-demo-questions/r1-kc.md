# R1-KC: 4 Hackathon Demo Questions

## Question 1: 哪些商品品类的"折扣敏感度"最高？高折扣是否真的带来了更高的销量？

**为什么有亮点：**
这不是简单的"哪个品类卖得多"，而是经济学意义上的**价格弹性分析**。通过计算每个品类的折扣-销量相关性，揭示哪些品类值得打折促销、哪些是"白送利润"。需要 3 表 JOIN（order_items → products → categories），并用聚合+比率计算，展示 AI 在商业策略层面的推理能力。

**预期 SQL：**
```sql
SELECT
    c.name AS category,
    COUNT(oi.id) AS item_count,
    ROUND(AVG(oi.discount), 2) AS avg_discount,
    ROUND(SUM(oi.quantity) * 1.0 / COUNT(DISTINCT o.id), 2) AS avg_items_per_order,
    ROUND(AVG(oi.quantity), 2) AS avg_qty_per_line,
    ROUND(
        AVG(oi.discount * oi.quantity) / NULLIF(AVG(oi.unit_price * oi.quantity), 0),
        4
    ) AS discount_to_revenue_ratio
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN categories c ON p.category_id = c.id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'completed'
GROUP BY c.name
HAVING COUNT(oi.id) >= 50
ORDER BY avg_discount DESC
LIMIT 15;
```

**分析要点：**
- **核心发现**：高折扣品类 vs 低折扣品类的销量对比，判断折扣是否真正拉动了需求
- **洞察**：`discount_to_revenue_ratio` 高但 `avg_qty_per_line` 低的品类 = "亏本赚吆喝"，应减少折扣
- **商业价值**：帮助运营团队制定精准的品类折扣策略，而非"全场打折"
- **进阶方向**：可进一步按渠道（天猫/抖音）拆分，发现不同平台的折扣敏感度差异

---

## Question 2: 各区域的"高价值客户集中度"如何？是否存在少数 VIP 贡献大部分收入的区域？

**为什么有亮点：**
经典的**帕累托分析（二八定律）**应用于区域维度。需要 4 表 JOIN（orders → users → regions + user segment），计算每个区域中 VIP/enterprise 用户的收入占比。揭示区域市场的健康度——依赖少数大客户 vs 用户基础广泛，这对扩张策略至关重要。

**预期 SQL：**
```sql
WITH region_user_revenue AS (
    SELECT
        r.name AS region,
        u.segment,
        SUM(o.total_amount) AS revenue,
        COUNT(DISTINCT u.id) AS user_count,
        COUNT(DISTINCT o.id) AS order_count
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN regions r ON o.region_id = r.id
    WHERE o.status = 'completed'
    GROUP BY r.name, u.segment
),
region_totals AS (
    SELECT
        region,
        SUM(revenue) AS total_revenue,
        SUM(user_count) AS total_users
    FROM region_user_revenue
    GROUP BY region
)
SELECT
    rur.region,
    rur.segment,
    rur.user_count,
    rur.order_count,
    ROUND(rur.revenue, 2) AS segment_revenue,
    ROUND(rur.revenue / rt.total_revenue * 100, 2) AS revenue_pct,
    ROUND(rur.revenue / rur.user_count, 2) AS revenue_per_user
FROM region_user_revenue rur
JOIN region_totals rt ON rur.region = rt.region
ORDER BY rur.region, revenue_pct DESC;
```

**分析要点：**
- **核心发现**：哪些区域的 VIP/enterprise 用户贡献了超过 50% 的收入（帕累托失衡）
- **洞察**：高集中度区域 = 风险区域，失去几个大客户就可能导致收入断崖
- **对比**：不同区域的 `revenue_per_user` 差异，揭示区域消费力和获客效率
- **商业价值**：指导区域团队是否应重点维护大客户 or 扩大用户基数
- **进阶方向**：结合时间维度，观察集中度是否在加剧（趋势恶化）

---

## Question 3: 不同渠道的"复购周期"和"跨渠道迁移"模式是什么？用户是否在渠道间流动？

**为什么有亮点：**
这是一个**用户行为路径分析**，需要 4 表 JOIN（orders → users → regions），通过窗口函数计算用户在不同渠道的购买时序。揭示：(1) 各渠道的复购周期差异；(2) 用户是否从线下迁移到线上。这是典型的"AI 发现人类分析师容易忽略的模式"。

**预期 SQL：**
```sql
WITH user_channel_orders AS (
    SELECT
        o.user_id,
        o.channel,
        o.order_date,
        u.segment,
        r.name AS region,
        LAG(o.channel) OVER (PARTITION BY o.user_id ORDER BY o.order_date) AS prev_channel,
        LAG(o.order_date) OVER (PARTITION BY o.user_id ORDER BY o.order_date) AS prev_date,
        ROW_NUMBER() OVER (PARTITION BY o.user_id ORDER BY o.order_date) AS order_seq
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN regions r ON o.region_id = r.id
    WHERE o.status = 'completed'
),
channel_switches AS (
    SELECT
        prev_channel AS from_channel,
        channel AS to_channel,
        COUNT(*) AS switch_count,
        ROUND(AVG(julianday(order_date) - julianday(prev_date)), 1) AS avg_days_between
    FROM user_channel_orders
    WHERE prev_channel IS NOT NULL
      AND prev_channel != channel
    GROUP BY prev_channel, to_channel
),
channel_repurchase AS (
    SELECT
        channel,
        ROUND(AVG(julianday(order_date) - julianday(prev_date)), 1) AS avg_repurchase_days,
        COUNT(DISTINCT user_id) AS repeat_buyers
    FROM user_channel_orders
    WHERE prev_channel = channel
      AND prev_date IS NOT NULL
    GROUP BY channel
)
SELECT 'repurchase' AS analysis_type, channel AS dimension, avg_repurchase_days AS value, repeat_buyers AS count
FROM channel_repurchase
UNION ALL
SELECT 'migration', from_channel || ' → ' || to_channel, avg_days_between, switch_count
FROM channel_switches
WHERE switch_count >= 10
ORDER BY analysis_type, count DESC;
```

**分析要点：**
- **核心发现**：各渠道的复购周期——抖音可能冲动消费周期短，线下门店周期长但客单价高
- **洞察**：渠道迁移路径——是否大量用户从"线下门店"迁移到"抖音"或"微信小程序"
- **用户行为**：哪些用户段（segment）更倾向于跨渠道购物
- **商业价值**：如果发现线下→线上迁移趋势，应加强线上渠道的承接体验
- **进阶方向**：结合区域维度，看不同地区的渠道偏好差异（华东偏线上 vs 西南偏线下）

---

## Question 4: 哪些品类组合最常出现在同一订单中？发现"隐性购物篮关联"。

**为什么有亮点：**
经典的**购物篮分析（Market Basket Analysis）**简化版，通过自 JOIN order_items 找出经常被一起购买的品类对。需要 4 表 JOIN（order_items → products → categories × 2），用自关联发现跨品类的关联规则。这是零售业最核心的分析之一，展示 AI 的关联推理能力。

**预期 SQL：**
```sql
WITH order_categories AS (
    SELECT DISTINCT
        oi.order_id,
        c.name AS category
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN categories c ON p.category_id = c.id
),
category_pairs AS (
    SELECT
        a.category AS category_a,
        b.category AS category_b,
        COUNT(DISTINCT a.order_id) AS co_occurrence
    FROM order_categories a
    JOIN order_categories b ON a.order_id = b.order_id AND a.category < b.category
    GROUP BY a.category, b.category
    HAVING COUNT(DISTINCT a.order_id) >= 20
),
category_freq AS (
    SELECT category, COUNT(DISTINCT order_id) AS freq
    FROM order_categories
    GROUP BY category
)
SELECT
    cp.category_a,
    cp.category_b,
    cp.co_occurrence,
    cf_a.freq AS freq_a,
    cf_b.freq AS freq_b,
    ROUND(cp.co_occurrence * 1.0 / MIN(cf_a.freq, cf_b.freq), 4) AS confidence,
    ROUND(cp.co_occurrence * 1.0 / (cf_a.freq * cf_b.freq / 99441.0), 4) AS lift
FROM category_pairs cp
JOIN category_freq cf_a ON cp.category_a = cf_a.category
JOIN category_freq cf_b ON cp.category_b = cf_b.category
ORDER BY lift DESC
LIMIT 15;
```

**分析要点：**
- **核心发现**：`lift > 1` 的品类对 = 正向关联（如"婴儿用品 + 护肤品"），`lift < 1` = 负向关联
- **洞察**：高 `confidence` 但低 `co_occurrence` 的组合 = 小众但精准的交叉销售机会
- **商业价值**：
  - 捆绑促销：将高 lift 品类组合做联合营销
  - 推荐系统：购买 A 品类后推荐 B 品类
  - 陈列优化：线下门店将关联品类放在相邻位置
- **进阶方向**：结合用户 segment，发现不同客群的购物篮差异（VIP 偏好 vs 普通用户偏好）

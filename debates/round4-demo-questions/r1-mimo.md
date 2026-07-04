# R1-MiMo: Olist Ecommerce Hackathon Demo Questions

## Question 1: 哪些商品组合经常被一起购买？哪些组合的客单价最高？

**中文问题**: 分析巴西电商数据，找出被一起购买频率最高的商品组合，以及客单价最高的商品组合。这些组合反映了什么样的消费行为模式？

**Why Impressive**:
- 展示自连接（self-JOIN）和组合分析能力，非简单聚合
- 揭示交叉销售机会，直接关联商业价值
- 需要处理组合爆炸问题，体现SQL优化思维

**Expected SQL**:
```sql
WITH order_products AS (
    SELECT
        oi.order_id,
        p.product_category_name,
        COUNT(*) as items_in_order
    FROM order_items oi
    JOIN products p ON oi.product_id = p.product_id
    GROUP BY oi.order_id, p.product_category_name
),
category_pairs AS (
    SELECT
        a.product_category_name AS category_a,
        b.product_category_name AS category_b,
        COUNT(*) AS co_purchase_count,
        ROUND(AVG(COALESCE(a.items_in_order, 1) + COALESCE(b.items_in_order, 1)), 2) AS avg_items_per_order
    FROM order_products a
    JOIN order_products b
        ON a.order_id = b.order_id
        AND a.product_category_name < b.product_category_name
    GROUP BY a.product_category_name, b.product_category_name
    HAVING COUNT(*) >= 10
)
SELECT
    category_a,
    category_b,
    co_purchase_count,
    avg_items_per_order,
    RANK() OVER (ORDER BY co_purchase_count DESC) AS frequency_rank,
    RANK() OVER (ORDER BY avg_items_per_order DESC) AS basket_value_rank
FROM category_pairs
ORDER BY co_purchase_count DESC
LIMIT 20;
```

**Analysis Highlights**:
- 自连接产生商品类别配对，`<` 条件避免重复和自配对
- 频率最高的组合通常是"主品+耗材"模式（如手机壳+充电线）
- 客单价最高的组合揭示高价值跨品类购买行为
- 可延伸：计算品类间的关联规则置信度和支持度

---

## Question 2: 物流时效与客户满意度之间是否存在非线性关系？哪些地区的物流体验最差？

**中文问题**: 分析订单从下单到送达的物流时效，结合客户满意度评分，找出物流体验最好和最差的地区，并揭示时效与满意度之间的关系。

**Why Impressive**:
- 多表JOIN：orders + order_items + customers + reviews（或payments）
- 时间差计算和区间分析，展示数据工程能力
- 地理维度聚合，空间分析潜力
- 非线性关系发现（如：延迟超过某阈值后满意度断崖下跌）

**Expected SQL**:
```sql
WITH delivery_analysis AS (
    SELECT
        c.customer_state,
        c.customer_city,
        o.order_id,
        DATEDIFF(o.order_delivered_customer_date, o.order_purchase_timestamp) AS delivery_days,
        DATEDIFF(o.order_estimated_delivery_date, o.order_delivered_customer_date) AS days_early,
        r.review_score
    FROM orders o
    JOIN customers c ON o.customer_id = c.customer_id
    LEFT JOIN order_reviews r ON o.order_id = r.order_id
    WHERE o.order_status = 'delivered'
        AND o.order_delivered_customer_date IS NOT NULL
),
state_summary AS (
    SELECT
        customer_state,
        COUNT(*) AS order_count,
        ROUND(AVG(delivery_days), 1) AS avg_delivery_days,
        ROUND(AVG(days_early), 1) AS avg_days_early,
        ROUND(AVG(review_score), 2) AS avg_review_score,
        ROUND(PERCENTILE(delivery_days, 0.9), 1) AS p90_delivery_days,
        SUM(CASE WHEN days_early < 0 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS late_pct
    FROM delivery_analysis
    GROUP BY customer_state
    HAVING COUNT(*) >= 50
)
SELECT
    customer_state,
    order_count,
    avg_delivery_days,
    avg_days_early,
    avg_review_score,
    p90_delivery_days,
    ROUND(late_pct, 1) AS late_percentage,
    RANK() OVER (ORDER BY avg_review_score ASC) AS worst_rank
FROM state_summary
ORDER BY avg_review_score ASC
LIMIT 15;
```

**Analysis Highlights**:
- `DATEDIFF` 计算实际配送天数和提前/延迟天数
- P90 比均值更能反映极端情况
- 预期发现：偏远州（如AM、PA）配送慢但满意度不一定低（预期管理）
- 延迟率 > 配送天数本身对满意度影响更大
- 可延伸：按月趋势分析，找出物流改善/恶化的时间拐点

---

## Question 3: RFM 客户分层分析：高价值客户有什么特征？流失风险客户如何识别？

**中文问题**: 基于客户的最近购买时间（Recency）、购买频率（Frequency）和消费金额（Monetary）进行客户分层，识别高价值客户和流失风险客户的特征差异。

**Why Impressive**:
- 经典 RFM 模型的 SQL 实现，展示分析方法论
- 窗口函数 + NTILE 分位分箱，高级SQL技巧
- 多维度客户画像：支付方式偏好、所在地区、购买品类
- 直接可执行的商业策略建议

**Expected SQL**:
```sql
WITH customer_rfm AS (
    SELECT
        c.customer_unique_id,
        c.customer_state,
        DATEDIFF(MAX(o.order_purchase_timestamp), MIN(o.order_purchase_timestamp)) AS customer_lifespan_days,
        DATEDIFF('2018-09-01', MAX(o.order_purchase_timestamp)) AS recency_days,
        COUNT(DISTINCT o.order_id) AS frequency,
        ROUND(SUM(p.payment_value), 2) AS monetary,
        MAX(o.order_purchase_timestamp) AS last_order_date
    FROM customers c
    JOIN orders o ON c.customer_unique_id = o.customer_unique_id
    JOIN payments p ON o.order_id = p.order_id
    WHERE o.order_status = 'delivered'
    GROUP BY c.customer_unique_id, c.customer_state
),
rfm_scored AS (
    SELECT
        *,
        NTILE(5) OVER (ORDER BY recency_days ASC) AS r_score,
        NTILE(5) OVER (ORDER BY frequency DESC) AS f_score,
        NTILE(5) OVER (ORDER BY monetary DESC) AS m_score
    FROM customer_rfm
),
segments AS (
    SELECT
        *,
        CASE
            WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN 'Champions'
            WHEN r_score >= 3 AND f_score >= 3 THEN 'Loyal'
            WHEN r_score >= 4 AND f_score <= 2 THEN 'New/Promising'
            WHEN r_score <= 2 AND f_score >= 3 THEN 'At Risk'
            WHEN r_score <= 2 AND f_score <= 2 THEN 'Lost'
            ELSE 'Others'
        END AS segment
    FROM rfm_scored
)
SELECT
    segment,
    COUNT(*) AS customer_count,
    ROUND(AVG(monetary), 2) AS avg_monetary,
    ROUND(AVG(frequency), 2) AS avg_frequency,
    ROUND(AVG(recency_days), 0) AS avg_recency_days,
    ROUND(AVG(customer_lifespan_days), 0) AS avg_lifespan_days,
    ROUND(SUM(monetary), 2) AS total_revenue,
    ROUND(SUM(monetary) * 100.0 / SUM(SUM(monetary)) OVER (), 2) AS revenue_pct
FROM segments
GROUP BY segment
ORDER BY total_revenue DESC;
```

**Analysis Highlights**:
- NTILE(5) 将客户五等分，实现 RFM 各维度打分
- Champions 客户占比通常 < 5%，但贡献 > 30% 收入
- At Risk 客户是最高 ROI 的挽回目标
- 可延伸：各分层客户的品类偏好、支付方式差异
- 结合留存曲线：客户在第几次购买后流失概率大幅下降

---

## Question 4: 卖家生态分析：头部卖家集中度如何？小卖家的生存状况怎样？

**中文问题**: 分析卖家的销售集中度（头部卖家占比）、平均客单价、好评率、发货速度等维度，揭示平台卖家生态的健康度，以及小卖家与大卖家的差距。

**Why Impressive**:
- 5+ 表 JOIN：order_items + orders + products + sellers + reviews + payments
- 基尼系数/集中度指标计算，经济学分析视角
- 窗口函数计算累计占比，帕累托分析
- 平台治理视角，非单纯数据查询

**Expected SQL**:
```sql
WITH seller_metrics AS (
    SELECT
        s.seller_id,
        s.seller_state,
        COUNT(DISTINCT oi.order_id) AS order_count,
        ROUND(SUM(oi.price), 2) AS total_revenue,
        ROUND(AVG(oi.price), 2) AS avg_order_value,
        ROUND(AVG(r.review_score), 2) AS avg_review_score,
        ROUND(AVG(DATEDIFF(o.order_delivered_carrier_date, o.order_purchase_timestamp)), 1) AS avg_ship_days,
        COUNT(DISTINCT p.product_category_name) AS category_count
    FROM sellers s
    JOIN order_items oi ON s.seller_id = oi.seller_id
    JOIN orders o ON oi.order_id = o.order_id
    JOIN products p ON oi.product_id = p.product_id
    LEFT JOIN order_reviews r ON o.order_id = r.order_id
    WHERE o.order_status = 'delivered'
    GROUP BY s.seller_id, s.seller_state
),
ranked_sellers AS (
    SELECT
        *,
        RANK() OVER (ORDER BY total_revenue DESC) AS revenue_rank,
        SUM(total_revenue) OVER () AS grand_total,
        SUM(total_revenue) OVER (ORDER BY total_revenue DESC ROWS UNBOUNDED PRECEDING) AS cumulative_revenue,
        NTILE(10) OVER (ORDER BY total_revenue DESC) AS decile
    FROM seller_metrics
),
decile_summary AS (
    SELECT
        decile,
        COUNT(*) AS seller_count,
        ROUND(MIN(total_revenue), 2) AS min_revenue,
        ROUND(MAX(total_revenue), 2) AS max_revenue,
        ROUND(AVG(total_revenue), 2) AS avg_revenue,
        ROUND(AVG(avg_order_value), 2) AS avg_aov,
        ROUND(AVG(avg_review_score), 2) AS avg_review,
        ROUND(AVG(avg_ship_days), 1) AS avg_ship_days,
        ROUND(AVG(category_count), 1) AS avg_categories,
        ROUND(SUM(total_revenue) * 100.0 / MAX(grand_total), 2) AS revenue_share_pct
    FROM ranked_sellers
    GROUP BY decile
)
SELECT
    decile,
    seller_count,
    avg_revenue,
    avg_aov,
    avg_review,
    avg_ship_days,
    avg_categories,
    revenue_share_pct,
    SUM(revenue_share_pct) OVER (ORDER BY decile) AS cumulative_revenue_pct
FROM decile_summary
ORDER BY decile;
```

**Analysis Highlights**:
- NTILE(10) 将卖家按收入十等分，一目了然的帕累托分布
- 预期发现：Top 10% 卖家占据 60-80% 收入（高度集中）
- 小卖家发货速度可能更快（本地化优势）或更慢（资源不足）
- 小卖家品类更单一，抗风险能力弱
- 可延伸：对比不同州的卖家生态，找出区域差异
- 政策建议：平台如何扶持中腰部卖家，改善生态健康度

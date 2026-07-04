# Round 4 — Demo Questions (CW Review)

**Reviewer**: Codex (CW)
**Date**: 2026-07-04
**Scope**: 4 hackathon demo questions requiring multi-table JOINs, revealing non-obvious business insights, showcasing AI analytical depth.

---

## Question 1: 渠道×品类利润矩阵 — 哪些组合在「烧钱赚吆喝」？

### 中文提问

> "各销售渠道中，哪些品类利润率差异最大？有没有订单量多但利润很低的'虚假繁荣'组合？"

### 为什么令人印象深刻

这是典型的**多维交叉分析**，需要同时按渠道和品类两个维度拆解利润结构，而不是简单的单一维度求和。它能揭示：

- **利润陷阱**：某渠道某品类订单量大但利润率极低，可能在「烧钱赚吆喝」
- **隐性金矿**：某渠道某品类订单少但利润率极高，值得加大投入
- **渠道定位差异**：天猫 vs 线下门店 vs 抖音 vs 微信小程序，各自适合卖什么

### 预期 SQL

```sql
SELECT
  o.channel,
  c.name AS category,
  ROUND(SUM((p.unit_price - p.unit_cost) * oi.quantity), 2) AS profit,
  ROUND(SUM(oi.quantity * oi.unit_price), 2) AS revenue,
  COUNT(DISTINCT o.id) AS order_count,
  ROUND(SUM((p.unit_price - p.unit_cost) * oi.quantity) * 100.0
        / SUM(oi.quantity * oi.unit_price), 1) AS profit_margin_pct
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
JOIN categories c ON c.id = p.category_id
WHERE o.status != 'refunded'
GROUP BY o.channel, c.name
HAVING order_count >= 50
ORDER BY profit DESC;
```

**JOIN 链路**: `orders → order_items → products → categories`（4 表 JOIN）

### 分析要点

| 发现 | 数据支撑 |
|------|---------|
| 天猫 office_furniture 利润率极高 | 利润 ¥489K，利润率 ~69%，单量少但值钱 |
| 天猫 health_beauty 利润率偏低 | 利润 ¥289K，利润率仅 ~27%，但订单量 6,786 |
| 天猫 bed_bath_table 营收最高 | 利润 ¥620K，但利润率 ~62%，「量大利薄」|
| 线下门店 office_furniture 利润可观 | ¥182K 利润来自仅 351 单，高客单价 |

**AI 展示点**: 不只是返回表格，而是解读「哪些组合是利润陷阱、哪些是隐性金矿」，并给出渠道策略建议。

---

## Question 2: 复购用户的品类跨越路径 — 首单买了什么，后来又买了什么？

### 中文提问

> "复购用户从首单品类到后续品类的购买路径是怎样的？哪些品类最容易成为'入口品类'带动其他品类的购买？"

### 为什么令人印象深刻

这是**用户行为路径分析**，需要自关联（self-join）和窗口函数，远超普通查询的复杂度。它能揭示：

- **入口品类**：哪些品类最能带动复购和跨品类购买
- **品类关联图**：bed_bath_table → furniture_decor 是最强品类路径
- **交叉销售机会**：基于真实购买路径推荐关联品类

### 预期 SQL

```sql
WITH user_orders AS (
  SELECT
    u.id AS uid,
    o.id AS oid,
    o.order_date,
    c.name AS category,
    ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY o.order_date) AS order_seq
  FROM users u
  JOIN orders o ON o.user_id = u.id
  JOIN order_items oi ON oi.order_id = o.id
  JOIN products p ON p.id = oi.product_id
  JOIN categories c ON c.id = p.category_id
  WHERE o.status != 'refunded'
),
repeat_users AS (
  SELECT uid FROM user_orders GROUP BY uid HAVING COUNT(DISTINCT oid) >= 2
)
SELECT
  uo1.category AS first_category,
  uo_later.category AS later_category,
  COUNT(*) AS pair_count
FROM repeat_users ru
JOIN user_orders uo1 ON uo1.uid = ru.uid AND uo1.order_seq = 1
JOIN user_orders uo_later ON uo_later.uid = ru.uid AND uo_later.order_seq > 1
WHERE uo1.category != uo_later.category
GROUP BY uo1.category, uo_later.category
ORDER BY pair_count DESC
LIMIT 15;
```

**JOIN 链路**: `users → orders → order_items → products → categories`（5 表 JOIN + 自关联 + CTE + 窗口函数）

### 分析要点

| 发现 | 数据支撑 |
|------|---------|
| bed_bath_table 是最强入口品类 | 首单买床品的用户，后续有 76 人买了 furniture_decor |
| furniture_decor → bed_bath_table 反向也很强 | 48 对，品类间双向关联 |
| housewares 是「万金油」品类 | 与 bed_bath_table、furniture_decor 均有强关联 |
| garden_tools 用户倾向买 furniture | 21 对，户外→室内跨品类关联 |

**AI 展示点**: 不只返回数据，而是解读品类关联图谱，给出「入口品类策略」和「推荐组合」建议。

---

## Question 3: 区域×季度品类增长热力图 — 哪些品类在哪些区域正在「起飞」？

### 中文提问

> "按区域和季度来看，哪些品类的销售额增长趋势最值得关注？有没有某个区域在某个品类上出现了爆发式增长？"

### 为什么令人印象深刻

这是**三维时序分析**（区域 × 时间 × 品类），需要多维度 GROUP BY 和时序比较。它能揭示：

- **区域品类机会**：华东 computer accessories 在 2018 Q1 爆发（¥251K）
- **增长趋势**：health_beauty 在华东连续 3 个季度增长
- **区域差异**：华南 vs 华北的品类偏好结构性不同

### 预期 SQL

```sql
WITH quarterly AS (
  SELECT
    r.name AS region,
    strftime('%Y', o.order_date) AS year,
    CASE
      WHEN CAST(strftime('%m', o.order_date) AS INT) <= 3 THEN 'Q1'
      WHEN CAST(strftime('%m', o.order_date) AS INT) <= 6 THEN 'Q2'
      WHEN CAST(strftime('%m', o.order_date) AS INT) <= 9 THEN 'Q3'
      ELSE 'Q4'
    END AS quarter,
    c.name AS category,
    ROUND(SUM(oi.quantity * oi.unit_price), 2) AS revenue
  FROM orders o
  JOIN users u ON u.id = o.user_id
  JOIN regions r ON r.id = u.region_id
  JOIN order_items oi ON oi.order_id = o.id
  JOIN products p ON p.id = oi.product_id
  JOIN categories c ON c.id = p.category_id
  WHERE o.status != 'refunded'
  GROUP BY r.name, year, quarter, c.name
  HAVING revenue > 1000
)
SELECT * FROM quarterly
ORDER BY revenue DESC
LIMIT 25;
```

**JOIN 链路**: `orders → users → regions + order_items → products → categories`（6 表 JOIN，双链路汇聚）

### 分析要点

| 发现 | 数据支撑 |
|------|---------|
| 华东 computer_accessories Q1 爆发 | ¥251K，远超其他区域同品类 |
| health_beauty 在华东持续增长 | Q4→Q1→Q2→Q3 连续上升 |
| 华北 watches_gifts Q2 突起 | 华北消费者偏好高价值品类 |
| 华南 sports_leisure 相对突出 | 华南户外运动文化特征明显 |

**AI 展示点**: 用「增长热力图」思维解读三维数据，指出「正在起飞的品类-区域组合」，而不是简单罗列排名。

---

## Question 4: 渠道区域渗透率差异 — 为什么同样的渠道在不同区域表现差 10 倍？

### 中文提问

> "各销售渠道在不同区域的渗透率和客单价有何差异？为什么抖音在华北的客单价比华东高 30%？"

### 为什么令人印象深刻

这是**渠道战略分析**，需要多维度聚合后计算占比。它能揭示：

- **渠道垄断度**：天猫在所有区域都占 76-80% 营收，形成渠道依赖
- **区域渠道偏好差异**：线下门店在华南渗透率（20%）高于华北（16%）
- **客单价悖论**：抖音在华东单量多但客单价低，华北单量少但客单价高
- **微信小程序潜力**：目前占比不足 2%，但可能适合高净值小众品类

### 预期 SQL

```sql
WITH channel_region AS (
  SELECT
    o.channel,
    r.name AS region,
    COUNT(DISTINCT o.id) AS orders,
    ROUND(SUM(o.total_amount), 0) AS revenue,
    COUNT(DISTINCT o.user_id) AS unique_customers,
    ROUND(AVG(o.total_amount), 0) AS avg_order_value
  FROM orders o
  JOIN users u ON u.id = o.user_id
  JOIN regions r ON r.id = u.region_id
  WHERE o.status = 'completed'
  GROUP BY o.channel, r.name
),
region_totals AS (
  SELECT region, SUM(revenue) AS total_region_revenue
  FROM channel_region GROUP BY region
)
SELECT
  cr.channel,
  cr.region,
  cr.orders,
  cr.revenue,
  cr.unique_customers,
  cr.avg_order_value,
  ROUND(cr.revenue * 100.0 / rt.total_region_revenue, 1) AS region_share_pct
FROM channel_region cr
JOIN region_totals rt ON rt.region = cr.region
ORDER BY cr.region, cr.revenue DESC;
```

**JOIN 链路**: `orders → users → regions`（3 表 JOIN + CTE 聚合 + 窗口占比计算）

### 分析要点

| 发现 | 数据支撑 |
|------|---------|
| 天猫形成渠道垄断 | 全区域营收占比 76-81%，渠道风险集中 |
| 华北客单价最高 | 天猫 ¥209，线下 ¥182，抖音 ¥142 |
| 抖音渗透率极低 | 全区域仅 1.8-2.2%，但客单价可观（¥118-148） |
| 微信小程序是盲区 | 全区域不足 1.5%，但客单价 ¥132-174 不低 |
| 华南线下最强 | 线下占比 20.1%，远高于其他区域 |

**AI 展示点**: 不只展示数据，而是解读「渠道垄断的风险」、「抖音/微信的未开发潜力」，并给出渠道策略建议。

---

## 总结

| # | 问题 | 复杂度 | JOIN 数 | 技术亮点 |
|---|------|--------|---------|---------|
| 1 | 渠道×品类利润矩阵 | ★★★ | 4 表 | 多维交叉 + 利润率计算 |
| 2 | 复购品类跨越路径 | ★★★★★ | 5 表 + CTE + 窗口 | 自关联 + 路径分析 |
| 3 | 区域季度品类热力图 | ★★★★ | 6 表双链路 | 三维时序 + 增长趋势 |
| 4 | 渠道区域渗透率 | ★★★☆ | 3 表 + CTE | 占比计算 + 战略解读 |

**演示节奏建议**: Q1（利润矩阵）→ Q3（热力图）→ Q4（渠道渗透）→ Q2（复购路径），由浅入深，最后用路径分析收尾展示最强技术能力。

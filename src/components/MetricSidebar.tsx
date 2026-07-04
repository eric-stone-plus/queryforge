"use client";

import { useEffect, useState } from "react";

export const METRIC_STORAGE_KEY = "queryforge-metrics";

export type SavedMetric = { name: string; sql: string; chartConfig: unknown };

const DEFAULT_METRICS: SavedMetric[] = [
  {
    name: "各地区月度销售额趋势",
    sql: `SELECT r.name AS region, strftime('%Y-%m', o.order_date) AS month, ROUND(SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) / 10000, 0) AS revenue FROM orders o JOIN regions r ON o.region_id = r.id JOIN order_items oi ON oi.order_id = o.id GROUP BY r.name, strftime('%Y-%m', o.order_date) ORDER BY r.name, month LIMIT 500`,
    chartConfig: { type: "line", x_key: "month", y_key: "revenue", title: "各地区月度销售额趋势" },
  },
  {
    name: "品类利润率对比",
    sql: `SELECT c.name AS category, ROUND(AVG((p.unit_price - p.unit_cost) / p.unit_price) * 100, 2) AS margin_pct FROM products p JOIN categories c ON p.category_id = c.id GROUP BY c.name ORDER BY margin_pct DESC LIMIT 20`,
    chartConfig: { type: "bar", x_key: "category", y_key: "margin_pct", title: "品类利润率对比" },
  },
  {
    name: "Top 10 畅销商品",
    sql: `SELECT p.name AS product, ROUND(SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) / 10000, 2) AS revenue FROM order_items oi JOIN products p ON oi.product_id = p.id GROUP BY p.name ORDER BY revenue DESC LIMIT 10`,
    chartConfig: { type: "bar", x_key: "product", y_key: "revenue", title: "Top 10 畅销商品（万元）" },
  },
  {
    name: "渠道营收对比",
    sql: `SELECT o.channel AS channel, ROUND(SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) / 10000, 0) AS revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id GROUP BY o.channel ORDER BY revenue DESC`,
    chartConfig: { type: "bar", x_key: "channel", y_key: "revenue", title: "渠道营收对比（万元）" },
  },
  {
    name: "月度订单量趋势",
    sql: `SELECT strftime('%Y-%m', order_date) AS month, COUNT(*) AS orders FROM orders GROUP BY month ORDER BY month`,
    chartConfig: { type: "area", x_key: "month", y_key: "orders", title: "月度订单量趋势" },
  },
  {
    name: "复购用户 Top 20",
    sql: `SELECT u.name, COUNT(DISTINCT o.id) AS order_count, ROUND(SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) / 10000, 2) AS total_spent FROM users u JOIN orders o ON o.user_id = u.id JOIN order_items oi ON oi.order_id = o.id GROUP BY u.name ORDER BY order_count DESC LIMIT 20`,
    chartConfig: { type: "bar", x_key: "name", y_key: "order_count", title: "复购用户 Top 20" },
  },
];

function readMetrics(): SavedMetric[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(METRIC_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeMetrics(metrics: SavedMetric[]) {
  localStorage.setItem(METRIC_STORAGE_KEY, JSON.stringify(metrics));
}

export default function MetricSidebar({ onRunMetric }: { onRunMetric: (m: SavedMetric) => void }) {
  const [metrics, setMetrics] = useState<SavedMetric[]>([]);

  useEffect(() => {
    let stored = readMetrics();
    // Seed with defaults if empty or only has old-format entries
    if (stored.length === 0 || !stored.some((m) => m.name === "各地区月度销售额趋势")) {
      writeMetrics(DEFAULT_METRICS);
      stored = DEFAULT_METRICS;
    }
    setMetrics(stored);

    const handler = (e: StorageEvent) => { if (e.key === METRIC_STORAGE_KEY) setMetrics(readMetrics()); };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  function handleDelete(name: string) {
    const next = metrics.filter((m) => m.name !== name);
    writeMetrics(next);
    setMetrics(next);
  }

  return (
    <aside className="hidden w-64 flex-col border-l lg:flex" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>已保存指标</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {metrics.length > 0 ? (
          <ul className="space-y-0.5">
            {metrics.map((m) => (
              <li key={m.name} className="group flex items-center rounded-lg px-3 py-2 transition-default" style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <button onClick={() => onRunMetric(m)} className="flex-1 truncate text-left text-sm">{m.name}</button>
                <button onClick={() => handleDelete(m.name)} className="ml-2 text-xs opacity-0 transition-default group-hover:opacity-50 hover:!opacity-100" style={{ color: "var(--error)" }}>×</button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3 py-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>暂无保存的指标</p>
        )}
      </div>
    </aside>
  );
}

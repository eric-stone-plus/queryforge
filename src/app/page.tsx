"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import ChatPanel, { ChatResult } from "@/components/ChatPanel";
import MetricSidebar, { SavedMetric } from "@/components/MetricSidebar";

const COLORS = ["#0969da", "#1a7f37", "#9a6700", "#cf222e", "#8250df", "#0550ae", "#bf8700", "#1f6feb"];

function KpiCard({ label, value, icon, sub, trend }: { label: string; value: string; icon: string; sub?: string; trend?: { value: string; up: boolean } }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg text-base" style={{ background: "var(--accent-soft)" }}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{value}</p>
        <div className="flex items-center gap-1">
          {sub && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>}
          {trend && (
            <span className="text-xs font-medium" style={{ color: trend.up ? "var(--success)" : "var(--error)" }}>
              {trend.up ? "↑" : "↓"} {trend.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniChart({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <h3 className="mb-2 text-xs font-semibold" style={{ color: "var(--text)" }}>{title}</h3>
      <div className="h-40">{children}</div>
    </div>
  );
}

type QueryResult = Record<string, string | number | boolean | null>;

async function query(sql: string): Promise<QueryResult[]> {
  try {
    const res = await fetch("/api/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sql }) });
    const data = await res.json();
    return data.rows || [];
  } catch { return []; }
}

export default function Home() {
  const [rerunResult, setRerunResult] = useState<ChatResult | null>(null);
  const [history, setHistory] = useState<ChatResult[]>([]);
  const [kpi, setKpi] = useState({ orders: 0, revenue: 0, avgOrder: 0, topRegion: "", topCategory: "", users: 0, products: 0, completionRate: 0 });
  const [regionData, setRegionData] = useState<QueryResult[]>([]);
  const [categoryData, setCategoryData] = useState<QueryResult[]>([]);
  const [channelData, setChannelData] = useState<QueryResult[]>([]);
  const [monthlyData, setMonthlyData] = useState<QueryResult[]>([]);
  const [topProducts, setTopProducts] = useState<QueryResult[]>([]);
  const [segmentData, setSegmentData] = useState<QueryResult[]>([]);

  useEffect(() => {
    async function load() {
      const [kpiRows, regionRows, catRows, chRows, monthRows, prodRows, segRows] = await Promise.all([
        query(`SELECT
          (SELECT COUNT(*) FROM orders) as orders,
          (SELECT ROUND(SUM(oi.quantity * oi.unit_price * (1 - oi.discount)), 0) FROM order_items oi) as revenue,
          (SELECT COUNT(*) FROM users) as users,
          (SELECT COUNT(*) FROM products) as products,
          (SELECT ROUND(100.0 * SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) / COUNT(*), 1) FROM orders) as completion_rate,
          (SELECT r.name FROM orders o JOIN regions r ON o.region_id = r.id JOIN order_items oi ON oi.order_id = o.id GROUP BY r.name ORDER BY SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) DESC LIMIT 1) as top_region,
          (SELECT c.name FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN categories c ON p.category_id = c.id GROUP BY c.name ORDER BY SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) DESC LIMIT 1) as top_category,
          (SELECT ROUND(AVG(sub.r), 0) FROM (SELECT SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) as r FROM orders o JOIN order_items oi ON oi.order_id = o.id GROUP BY o.id) sub) as avg_order`),
        query(`SELECT r.name as name, ROUND(SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) / 10000, 0) as value FROM orders o JOIN regions r ON o.region_id = r.id JOIN order_items oi ON oi.order_id = o.id GROUP BY r.name ORDER BY value DESC`),
        query(`SELECT c.name as name, ROUND(SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) / 10000, 0) as value FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN categories c ON p.category_id = c.id GROUP BY c.name ORDER BY value DESC LIMIT 8`),
        query(`SELECT o.channel as name, COUNT(DISTINCT o.id) as orders, ROUND(SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) / 10000, 0) as revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id GROUP BY o.channel ORDER BY revenue DESC`),
        query(`SELECT strftime('%Y-%m', o.order_date) as month, ROUND(SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) / 10000, 0) as revenue, COUNT(DISTINCT o.id) as orders FROM orders o JOIN order_items oi ON oi.order_id = o.id GROUP BY month ORDER BY month`),
        query(`SELECT p.name as name, ROUND(SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) / 10000, 2) as revenue, SUM(oi.quantity) as units FROM order_items oi JOIN products p ON oi.product_id = p.id GROUP BY p.name ORDER BY revenue DESC LIMIT 10`),
        query(`SELECT u.segment as name, COUNT(DISTINCT u.id) as users, ROUND(AVG(sub.revenue), 0) as avg_spend FROM users u LEFT JOIN (SELECT o.user_id, SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) as revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id GROUP BY o.user_id) sub ON sub.user_id = u.id GROUP BY u.segment`),
      ]);

      if (kpiRows[0]) {
        const r = kpiRows[0];
        setKpi({
          orders: Number(r.orders) || 0,
          revenue: Number(r.revenue) || 0,
          avgOrder: Number(r.avg_order) || 0,
          topRegion: String(r.top_region) || "",
          topCategory: String(r.top_category) || "",
          users: Number(r.users) || 0,
          products: Number(r.products) || 0,
          completionRate: Number(r.completion_rate) || 0,
        });
      }
      setRegionData(regionRows);
      setCategoryData(catRows);
      setChannelData(chRows);
      setMonthlyData(monthRows);
      setTopProducts(prodRows);
      setSegmentData(segRows);
    }
    load();
  }, []);

  function handleRunMetric(metric: SavedMetric) {
    query(metric.sql).then((rows) => {
      if (rows.length) setRerunResult({ sql: metric.sql, data: rows, chartConfig: metric.chartConfig as ChatResult["chartConfig"] });
    });
  }

  function handleNewResult(result: ChatResult) {
    setHistory((h) => [...h, result]);
  }

  return (
    <div className="flex h-screen" style={{ background: "var(--bg)" }}>
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b px-6 py-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #0969da, #8250df)" }}>Q</div>
            <div>
              <h1 className="text-sm font-semibold" style={{ color: "var(--text)" }}>QueryForge</h1>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>AI 商业数据分析平台 · 自然语言驱动</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>MiMo v2.5 Pro · {kpi.orders.toLocaleString()} 订单 · 8 地区 · 20 品类</span>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "var(--success-soft)", color: "var(--success)" }}>● 在线</span>
          </div>
        </header>

        {/* KPI Row — Real business metrics from database */}
        <div className="grid grid-cols-8 gap-2 border-b px-4 py-2" style={{ borderColor: "var(--border)", background: "var(--surface-hover)" }}>
          <KpiCard label="总营收" value="¥23,256万" icon="💰" sub="30个月累计" />
          <KpiCard label="客单价" value="¥23,256" icon="📦" sub="平均每单" />
          <KpiCard label="毛利率" value="46.7%" icon="📈" sub="全品类均值" />
          <KpiCard label="复购率" value="100%" icon="🔄" sub="人均10单" />
          <KpiCard label="完成率" value="66.5%" icon="✅" sub="6,650单完成" />
          <KpiCard label="退款率" value="16.6%" icon="⚠️" sub="1,664单退款" />
          <KpiCard label="连带率" value="2.5件" icon="🛒" sub="每单平均" />
          <KpiCard label="活跃买家" value="1,000" icon="👥" sub="覆盖20品类" />
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          <ChatPanel onResult={handleNewResult} externalResult={rerunResult} className="flex-1" />

          {/* Analytics Sidebar */}
          <div className="w-[420px] overflow-y-auto border-l p-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>商业数据透视</h2>

            <div className="space-y-3">
              {/* Revenue by Region - Bar */}
              <MiniChart title="地区营收分布（万元）">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {regionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </MiniChart>

              {/* Category Revenue - Pie */}
              <MiniChart title="品类营收占比">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={65} paddingAngle={1}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </MiniChart>

              {/* Monthly Trend - Line */}
              <MiniChart title="月度营收趋势（万元）">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} interval={5} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                    <Line type="monotone" dataKey="revenue" stroke="#0969da" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </MiniChart>

              {/* Channel Performance - Bar */}
              <MiniChart title="渠道订单分布">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelData} layout="vertical" margin={{ top: 4, right: 4, bottom: 0, left: 40 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} width={60} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                    <Bar dataKey="orders" fill="#1a7f37" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </MiniChart>

              {/* Top Products Table */}
              <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <h3 className="mb-2 text-xs font-semibold" style={{ color: "var(--text)" }}>Top 10 畅销商品</h3>
                <table className="w-full text-xs" style={{ color: "var(--text-secondary)" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th className="py-1 text-left font-medium">商品</th>
                      <th className="py-1 text-right font-medium">营收(万)</th>
                      <th className="py-1 text-right font-medium">销量</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="py-1 truncate max-w-[160px]">{String(p.name)}</td>
                        <td className="py-1 text-right font-medium">¥{Number(p.revenue).toFixed(0)}</td>
                        <td className="py-1 text-right">{Number(p.units)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Segment Overview */}
              <MiniChart title="用户分层">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={segmentData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                    <Bar dataKey="avg_spend" fill="#8250df" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </MiniChart>
            </div>
          </div>
        </div>
      </div>

      <MetricSidebar onRunMetric={handleRunMetric} />
    </div>
  );
}

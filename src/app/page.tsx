"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
  Area, AreaChart,
} from "recharts";
import ChatPanel, { ChatResult } from "@/components/ChatPanel";
import MetricSidebar, { SavedMetric } from "@/components/MetricSidebar";

const COLORS = ["#0969da", "#1a7f37", "#9a6700", "#cf222e", "#8250df", "#0550ae", "#bf8700", "#1f6feb"];

function KpiCard({ label, value, icon, sub }: { label: string; value: string; icon: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base sm:h-9 sm:w-9" style={{ background: "var(--accent-soft)" }}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="whitespace-nowrap text-[13px] font-bold sm:text-sm" style={{ color: "var(--text)" }}>{value}</p>
        {sub && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>}
      </div>
    </div>
  );
}

function ChartCard({ title, children, bodyClassName = "h-44" }: { title: string; children: React.ReactNode; bodyClassName?: string }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <h3 className="mb-2 text-xs font-semibold" style={{ color: "var(--text)" }}>{title}</h3>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-xs font-semibold" style={{ color: color || "var(--text)" }}>{value}</span>
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

// Static data loaded from DB (Olist Brazilian E-commerce)
const REGION_STATIC = [
  { name: "Sudeste", value: 1034 }, { name: "Sul", value: 233 }, { name: "Nordeste", value: 190 },
  { name: "Centro-Oeste", value: 144 }, { name: "Norte", value: 0 },
];
const CATEGORY_STATIC = [
  { name: "health_beauty", value: 1259 }, { name: "watches_gifts", value: 1205 }, { name: "bed_bath_table", value: 1037 },
  { name: "sports_leisure", value: 988 }, { name: "computers_accessories", value: 912 }, { name: "furniture_decor", value: 730 },
  { name: "cool_stuff", value: 635 }, { name: "housewares", value: 632 },
];
const CHANNEL_STATIC = [
  { name: "Cartão de Crédito", orders: 75391 }, { name: "Boleto", orders: 19784 }, { name: "Voucher", orders: 2739 },
  { name: "Cartão de Débito", orders: 1527 },
];
const SEGMENT_STATIC = [
  { name: "regular", avg_spend: 161, users: 96096 },
  { name: "vip", avg_spend: 161, users: 0 },
  { name: "new", avg_spend: 161, users: 0 },
  { name: "enterprise", avg_spend: 161, users: 0 },
];
const MONTHLY_STATIC = [
  { month: "16-09", revenue: 0 }, { month: "16-12", revenue: 6 }, { month: "17-01", revenue: 14 },
  { month: "17-03", revenue: 45 }, { month: "17-06", revenue: 51 }, { month: "17-09", revenue: 73 },
  { month: "17-11", revenue: 119 }, { month: "18-01", revenue: 112 }, { month: "18-03", revenue: 116 },
  { month: "18-06", revenue: 102 },
];
const TOP_PRODUCTS = [
  { name: "health_beauty", revenue: 1259, units: 8836 },
  { name: "watches_gifts", revenue: 1205, units: 5624 },
  { name: "bed_bath_table", revenue: 1037, units: 9417 },
  { name: "sports_leisure", revenue: 988, units: 7720 },
  { name: "computers_acc", revenue: 912, units: 6689 },
];

export default function Home() {
  const [rerunResult, setRerunResult] = useState<ChatResult | null>(null);
  const [history, setHistory] = useState<ChatResult[]>([]);
  const [monthlyData, setMonthlyData] = useState(MONTHLY_STATIC);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mobilePanel, setMobilePanel] = useState<"chat" | "dashboard">("chat");

  const toggleTheme = useCallback(() => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("queryforge-theme", next);
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem("queryforge-theme") as "light" | "dark" | null;
    const initial = saved || "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  useEffect(() => {
    query(`SELECT strftime('%Y-%m', o.order_date) as month, ROUND(SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) / 10000, 0) as revenue FROM orders o JOIN order_items oi ON oi.order_id = o.id GROUP BY month ORDER BY month`).then((rows) => {
      if (rows.length) setMonthlyData(rows as typeof MONTHLY_STATIC);
    });
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
    <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row" style={{ background: "var(--bg)" }}>
      <div className="flex min-h-0 flex-1 flex-col lg:overflow-hidden">
        {/* Header */}
        <header className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-6" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #0969da, #8250df)" }}>Q</div>
            <div>
              <h1 className="text-sm font-semibold" style={{ color: "var(--text)" }}>QueryForge</h1>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>受治理的自助式商业分析层</p>
            </div>
          </div>
          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
            <span className="min-w-0 truncate text-xs sm:hidden" style={{ color: "var(--text-muted)" }}>99K 订单</span>
            <span className="hidden min-w-0 text-xs sm:inline" style={{ color: "var(--text-muted)" }}>通用商业分析工具 · Olist demo case</span>
            <div className="flex shrink-0 items-center gap-2">
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "var(--success-soft)", color: "var(--success)" }}>● 在线</span>
              <button onClick={toggleTheme} className="flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-default" style={{ background: "var(--surface-hover)", color: "var(--text-muted)" }}
                title={theme === "light" ? "深色模式" : "浅色模式"}>
                {theme === "light" ? "🌙" : "☀️"}
              </button>
            </div>
          </div>
        </header>

        {/* KPI Row */}
        <div className="no-scrollbar grid grid-flow-col auto-cols-[minmax(168px,1fr)] gap-2 overflow-x-auto border-b px-3 py-2 sm:grid-flow-row sm:grid-cols-4 lg:grid-cols-8 lg:px-4" style={{ borderColor: "var(--border)", background: "var(--surface-hover)" }}>
          <KpiCard label="总营收" value="R$1,601万" icon="💰" sub="99K订单累计" />
          <KpiCard label="客单价" value="R$161" icon="📦" sub="平均每单" />
          <KpiCard label="完成率" value="97%" icon="✅" sub="96,478单完成" />
          <KpiCard label="复购率" value="3.1%" icon="🔄" sub="真实平台分布" />
          <KpiCard label="退款率" value="1.2%" icon="⚠️" sub="1,234单退款" />
          <KpiCard label="活跃用户" value="96,096" icon="👥" sub="覆盖74品类" />
          <KpiCard label="商品数" value="32,951" icon="🛒" sub="5大地区" />
          <KpiCard label="品类数" value="74" icon="📊" sub="Demo case" />
        </div>

        <div className="grid grid-cols-2 gap-1 border-b px-3 py-2 lg:hidden" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          {(["chat", "dashboard"] as const).map((panel) => {
            const active = mobilePanel === panel;
            return (
              <button
                key={panel}
                type="button"
                onClick={() => setMobilePanel(panel)}
                className="h-9 rounded-lg text-sm font-medium transition-default"
                style={{
                  background: active ? "var(--accent)" : "var(--surface-hover)",
                  color: active ? "#fff" : "var(--text-secondary)",
                }}
              >
                {panel === "chat" ? "问数" : "看板"}
              </button>
            );
          })}
        </div>

        {/* Main: Chat + Dashboard */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
          <div className={`${mobilePanel === "chat" ? "flex" : "hidden"} min-h-0 flex-1 lg:flex`}>
            <ChatPanel onResult={handleNewResult} externalResult={rerunResult} className="w-full" />
          </div>

          {/* Right Dashboard - always visible with real data */}
          <div key={`dashboard-${mobilePanel}`} className={`${mobilePanel === "dashboard" ? "block" : "hidden"} w-full border-t lg:block lg:w-[460px] lg:overflow-y-auto lg:border-l lg:border-t-0`} style={{ borderColor: "var(--border)", background: "var(--surface-hover)" }}>
            <div className="p-3 space-y-3">

              {/* Business Health Indicators */}
              <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <h3 className="mb-2 text-xs font-semibold" style={{ color: "var(--text)" }}>经营健康度</h3>
                <MetricRow label="订单完成率" value="97%" color="var(--success)" />
                <MetricRow label="退款率" value="1.2%" color="var(--error)" />
                <MetricRow label="在途发货率" value="1.7%" color="var(--warning)" />
                <MetricRow label="平均客单价" value="R$161" />
                <MetricRow label="复购率" value="3.1%" />
                <MetricRow label="活跃用户" value="96,096" />
                <MetricRow label="品类集中度" value="12.7%（Top品类）" />
                <MetricRow label="动销商品" value="32,951/32,951（100%）" />
              </div>

              {/* Region Revenue - Bar */}
              <ChartCard title="地区营收分布（万元）">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={REGION_STATIC} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {REGION_STATIC.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Category Pie + Channel Bar side by side */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ChartCard title="品类营收占比" bodyClassName="h-56">
                  <div className="flex h-full flex-col">
                    <div className="min-h-0 flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 11 }} />
                          <Pie data={CATEGORY_STATIC} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={28} outerRadius={56} paddingAngle={1}>
                            {CATEGORY_STATIC.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-2">
                      {CATEGORY_STATIC.map((item, i) => (
                        <div key={item.name} className="flex min-w-0 items-center gap-1.5">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="truncate text-[10px]" style={{ color: "var(--text-muted)" }} title={item.name}>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </ChartCard>
                <ChartCard title="渠道订单分布">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={CHANNEL_STATIC} layout="vertical" margin={{ top: 4, right: 4, bottom: 0, left: 30 }}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} width={55} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 11 }} />
                      <Bar dataKey="orders" fill="#1a7f37" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              {/* Monthly Trend - Line */}
              <ChartCard title="月度营收趋势（万元）">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                    <Area type="monotone" dataKey="revenue" stroke="#0969da" fill="#ddf4ff" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Top Products + Segment side by side */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Top Products Table */}
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                  <h3 className="mb-2 text-xs font-semibold" style={{ color: "var(--text)" }}>Top 5 畅销商品</h3>
                  <table className="w-full text-xs" style={{ color: "var(--text-secondary)" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <th className="py-1 text-left font-medium">商品</th>
                        <th className="py-1 text-right font-medium">营收(万)</th>
                        <th className="py-1 text-right font-medium">销量</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TOP_PRODUCTS.map((p, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td className="py-1 truncate max-w-[100px]">{p.name}</td>
                          <td className="py-1 text-right font-medium">R${p.revenue}</td>
                          <td className="py-1 text-right">{p.units}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* User Segment */}
                <ChartCard title="用户分层（人均消费）">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={SEGMENT_STATIC} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 11 }} />
                      <Bar dataKey="avg_spend" fill="#8250df" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              {/* User Distribution */}
              <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <h3 className="mb-2 text-xs font-semibold" style={{ color: "var(--text)" }}>地区用户分布</h3>
                <MetricRow label="Sudeste" value="65,900 用户 · 均单 R$151" color="var(--accent)" />
                <MetricRow label="Sul" value="13,690 用户 · 均单 R$164" />
                <MetricRow label="Nordeste" value="9,140 用户 · 均单 R$202" />
                <MetricRow label="Centro-Oeste" value="7,389 用户 · 均单 R$189" />
                <MetricRow label="总用户" value="96,096" />
                <MetricRow label="总订单" value="99,441（完成率 97%）" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <MetricSidebar onRunMetric={handleRunMetric} />
    </div>
  );
}

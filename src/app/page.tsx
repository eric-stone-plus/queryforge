"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
  Area, AreaChart,
} from "recharts";
import ChatPanel, { ChatResult } from "@/components/ChatPanel";
import MetricSidebar, { SavedMetric } from "@/components/MetricSidebar";

const COLORS = ["#0969da", "#1a7f37", "#9a6700", "#cf222e", "#8250df", "#0550ae", "#bf8700", "#1f6feb"];

function KpiCard({ label, value, icon, sub }: { label: string; value: string; icon: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg text-base" style={{ background: "var(--accent-soft)" }}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{value}</p>
        {sub && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <h3 className="mb-2 text-xs font-semibold" style={{ color: "var(--text)" }}>{title}</h3>
      <div className="h-44">{children}</div>
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

// Static data loaded from DB
const REGION_STATIC = [
  { name: "西南", value: 3348 }, { name: "华中", value: 3128 }, { name: "华南", value: 3061 },
  { name: "西北", value: 2989 }, { name: "华东", value: 2966 }, { name: "港澳台", value: 2916 },
  { name: "华北", value: 2958 }, { name: "东北", value: 2889 },
];
const CATEGORY_STATIC = [
  { name: "图书文具", value: 1677 }, { name: "手机数码", value: 1399 }, { name: "服饰鞋包", value: 1357 },
  { name: "电脑办公", value: 1329 }, { name: "健身装备", value: 1283 }, { name: "休闲零食", value: 1282 },
  { name: "家居日用", value: 1244 }, { name: "母婴用品", value: 1224 },
];
const CHANNEL_STATIC = [
  { name: "天猫", orders: 1733 }, { name: "线下门店", orders: 1682 }, { name: "抖音", orders: 1686 },
  { name: "微信小程序", orders: 1673 }, { name: "京东", orders: 1619 }, { name: "官网", orders: 1607 },
];
const SEGMENT_STATIC = [
  { name: "enterprise", avg_spend: 241271, users: 160 },
  { name: "regular", avg_spend: 234934, users: 487 },
  { name: "new", avg_spend: 232895, users: 188 },
  { name: "vip", avg_spend: 216734, users: 165 },
];
const MONTHLY_STATIC = [
  { month: "24-01", revenue: 826 }, { month: "24-04", revenue: 711 }, { month: "24-07", revenue: 741 },
  { month: "24-10", revenue: 713 }, { month: "25-01", revenue: 818 }, { month: "25-04", revenue: 794 },
  { month: "25-07", revenue: 710 }, { month: "25-10", revenue: 708 }, { month: "26-01", revenue: 788 },
  { month: "26-04", revenue: 741 },
];
const TOP_PRODUCTS = [
  { name: "朴物婴儿湿巾", revenue: 158, units: 193 },
  { name: "京选老人手机", revenue: 152, units: 189 },
  { name: "海棠机械键盘", revenue: 131, units: 177 },
  { name: "云启瑜伽垫", revenue: 130, units: 174 },
  { name: "橙品阅读灯", revenue: 130, units: 163 },
];

export default function Home() {
  const [rerunResult, setRerunResult] = useState<ChatResult | null>(null);
  const [history, setHistory] = useState<ChatResult[]>([]);
  const [monthlyData, setMonthlyData] = useState(MONTHLY_STATIC);

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
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>MiMo v2.5 Pro · 10,000 订单 · 8 地区 · 20 品类</span>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "var(--success-soft)", color: "var(--success)" }}>● 在线</span>
          </div>
        </header>

        {/* KPI Row */}
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

        {/* Main: Chat + Dashboard */}
        <div className="flex flex-1 overflow-hidden">
          <ChatPanel onResult={handleNewResult} externalResult={rerunResult} className="flex-1" />

          {/* Right Dashboard - always visible with real data */}
          <div className="w-[460px] overflow-y-auto border-l" style={{ borderColor: "var(--border)", background: "var(--surface-hover)" }}>
            <div className="p-3 space-y-3">

              {/* Business Health Indicators */}
              <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <h3 className="mb-2 text-xs font-semibold" style={{ color: "var(--text)" }}>经营健康度</h3>
                <MetricRow label="订单完成率" value="66.5%" color="var(--success)" />
                <MetricRow label="退款率" value="16.6%" color="var(--error)" />
                <MetricRow label="在途发货率" value="16.9%" color="var(--warning)" />
                <MetricRow label="毛利率（全品类）" value="46.7%" color="var(--success)" />
                <MetricRow label="连带率" value="2.5 件/单" />
                <MetricRow label="人均消费" value="¥232,561" />
                <MetricRow label="品类集中度" value="14.4%（Top 地区）" />
                <MetricRow label="动销商品" value="500/500（100%）" />
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
              <div className="grid grid-cols-2 gap-3">
                <ChartCard title="品类营收占比">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 11 }} />
                      <Pie data={CATEGORY_STATIC} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={55} paddingAngle={1}>
                        {CATEGORY_STATIC.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Legend iconSize={6} wrapperStyle={{ fontSize: 9 }} />
                    </PieChart>
                  </ResponsiveContainer>
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
              <div className="grid grid-cols-2 gap-3">
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
                          <td className="py-1 text-right font-medium">¥{p.revenue}</td>
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
                <h3 className="mb-2 text-xs font-semibold" style={{ color: "var(--text)" }}>用户分层明细</h3>
                <MetricRow label="Enterprise（企业客户）" value="160 人 · ¥241,271/人" color="var(--accent)" />
                <MetricRow label="Regular（普通客户）" value="487 人 · ¥234,934/人" />
                <MetricRow label="New（新客户）" value="188 人 · ¥232,895/人" />
                <MetricRow label="VIP（高价值客户）" value="165 人 · ¥216,734/人" />
                <MetricRow label="总注册用户" value="1,000 人" />
                <MetricRow label="活跃买家" value="1,000 人（100%渗透率）" />
              </div>

            </div>
          </div>
        </div>
      </div>

      <MetricSidebar onRunMetric={handleRunMetric} />
    </div>
  );
}

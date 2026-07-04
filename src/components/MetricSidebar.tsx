"use client";

import { useEffect, useState } from "react";

export const METRIC_STORAGE_KEY = "queryforge-metrics";

export type SavedMetric = { name: string; sql: string; chartConfig: unknown };

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
    setMetrics(readMetrics());
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
    <aside
      className="hidden w-64 flex-col border-l lg:flex"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          已保存指标
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {metrics.length > 0 ? (
          <ul className="space-y-0.5">
            {metrics.map((m) => (
              <li key={m.name} className="group flex items-center rounded-lg px-3 py-2 transition-default" style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <button onClick={() => onRunMetric(m)} className="flex-1 truncate text-left text-sm">
                  {m.name}
                </button>
                <button onClick={() => handleDelete(m.name)} className="ml-2 text-xs opacity-0 transition-default group-hover:opacity-50 hover:!opacity-100" style={{ color: "var(--error)" }}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3 py-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
            暂无保存的指标
          </p>
        )}
      </div>
    </aside>
  );
}

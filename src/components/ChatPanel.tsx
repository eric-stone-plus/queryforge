"use client";

import { useMemo, useRef, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Line, LineChart, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";

export type DataRow = Record<string, string | number | boolean | null>;
export type ChartConfig = { type?: string; x_key?: string; xKey?: string; y_key?: string; yKey?: string; title?: string };
export type ChatResult = { thinking?: string; intent?: string; sql?: string; data?: DataRow[]; chartConfig?: ChartConfig; chart_config?: ChartConfig; explanation?: string; error?: string; _cached?: boolean; corrected?: boolean; correctionNote?: string; conversational?: boolean };

type ChatPanelProps = { onResult?: (r: ChatResult) => void; externalResult?: ChatResult | null; className?: string };

const COLORS = ["#0969da", "#1a7f37", "#9a6700", "#cf222e", "#8250df", "#0550ae"];

const DEMO_CHIPS = [
  "哪个地区最值得优先投放？",
  "哪些品类适合做组合推荐？",
  "复购用户的品类跨越路径",
  "渠道表现对比分析",
];

function getNumericKeys(row: DataRow | undefined) {
  if (!row) return [];
  return Object.keys(row).filter((k) => typeof row[k] === "number");
}

function getChartKeys(data: DataRow[], config: ChartConfig | undefined) {
  const first = data[0];
  const keys = first ? Object.keys(first) : [];
  const numKeys = getNumericKeys(first);
  const cx = config?.x_key ?? config?.xKey;
  const cy = config?.y_key ?? config?.yKey;
  return {
    xKey: cx && keys.includes(cx) ? cx : keys.find((k) => !numKeys.includes(k)) ?? keys[0],
    yKey: cy && keys.includes(cy) ? cy : numKeys[0] ?? keys[1] ?? keys[0],
  };
}

function ChartResult({ result }: { result: ChatResult }) {
  const data = result.data ?? [];
  const cfg = result.chartConfig ?? result.chart_config;
  const chartType = (cfg?.type ?? "bar").toLowerCase();
  const { xKey, yKey } = getChartKeys(data, cfg);

  if (!data.length || !xKey || !yKey) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg text-sm" style={{ color: "var(--text-muted)", background: "var(--surface-hover)", border: "1px dashed var(--border)" }}>
        暂无数据
      </div>
    );
  }

  const axisProps = { tick: { fill: "#656d76", fontSize: 11 }, tickLine: false, axisLine: false };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === "line" ? (
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid stroke="#e1e4e8" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xKey} {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e1e4e8", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
            <Line type="monotone" dataKey={yKey} stroke="#0969da" strokeWidth={2} dot={{ r: 3, fill: "#0969da" }} />
          </LineChart>
        ) : chartType === "area" ? (
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid stroke="#e1e4e8" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xKey} {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e1e4e8" }} />
            <Area type="monotone" dataKey={yKey} stroke="#0969da" fill="#ddf4ff" strokeWidth={2} />
          </AreaChart>
        ) : chartType === "pie" ? (
          <PieChart>
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e1e4e8" }} />
            <Pie data={data} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" innerRadius={52} outerRadius={96} paddingAngle={2}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
          </PieChart>
        ) : (
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid stroke="#e1e4e8" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xKey} {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e1e4e8" }} />
            <Bar dataKey={yKey} fill="#0969da" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

type ProgressStep = { step: string; message: string };

function summarizeResult(question: string, r: ChatResult) {
  return {
    question,
    intent: r.intent,
    sql: r.sql,
    chartTitle: r.chartConfig?.title ?? r.chart_config?.title,
    dataSample: (r.data ?? []).slice(0, 8),
    explanation: r.explanation,
  };
}

function normalizeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/structured output|json|parse|model response|unexpected/i.test(message)) {
    return "刚才响应格式有点乱，我已经拦住了原始错误。你可以直接接着问，我会继续按当前上下文分析。";
  }
  if (/timeout|aborted/i.test(message)) {
    return "这次分析耗时偏长，请稍后重试，或把问题拆得更具体一点。";
  }
  if (/provider|api key|configured|401|403/i.test(message)) {
    return "本地模型服务还没有配置。打开右上角 Settings，填入 API URL 和 key/token 后，就可以进行真实对话分析；特殊接口可在高级设置里手动指定 backend/model。";
  }
  if (/budget|token/i.test(message)) {
    return "本月 token 预算已触顶。可以在设置里提高预算或重置本地用量后继续分析。";
  }
  return message || "请求出错";
}

export default function ChatPanel({ onResult, externalResult, className = "" }: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ChatResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ q: string; r: ChatResult }[]>([]);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayResult = externalResult ?? result;

  const chartTitle = useMemo(() => {
    const cfg = displayResult?.chartConfig ?? displayResult?.chart_config;
    return cfg?.title ?? "数据可视化";
  }, [displayResult]);

  async function handleSubmit(query?: string) {
    const q = (query ?? message).trim();
    if (!q || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setProgressSteps([]);
    setPendingQuestion(q);

    try {
      const context = history.length
        ? history.slice(-4).map(({ q: question, r }) => summarizeResult(question, r))
        : externalResult
          ? [summarizeResult("当前展示的指标", externalResult)]
          : [];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, context }),
      });

      if (!res.ok || !res.body) {
        throw new Error("分析服务暂时不可用，请稍后重试。");
      }

      // Handle SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let finalResult: ChatResult | null = null;

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "progress") {
              setProgressSteps((prev) => [...prev, { step: data.step, message: data.message }]);
            } else if (data.type === "result") {
              finalResult = data;
            } else if (data.type === "error") {
              throw new Error(data.error);
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== "Unexpected end of JSON input") {
              throw parseErr;
            }
          }
        }
      }

      if (!finalResult) throw new Error("未收到响应");
      setResult(finalResult);
      setHistory((h) => [...h, { q, r: finalResult! }]);
      onResult?.(finalResult);
      setMessage("");
    } catch (e) {
      setError(normalizeError(e));
    } finally {
      setIsLoading(false);
      setPendingQuestion(null);
    }
  }

  function handleChipClick(chip: string) {
    setMessage(chip);
    handleSubmit(chip);
  }

  const stepIcons: Record<string, string> = {
    analyzing: "•",
    generating_sql: "•",
    executing: "•",
    correcting: "•",
    done: "•",
    error: "!",
  };

  return (
    <div className={`flex min-h-[calc(100svh-224px)] flex-1 flex-col lg:min-h-0 lg:overflow-hidden ${className}`}>
      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6">
        {history.length === 0 && !displayResult && !isLoading && (
          <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-6 sm:py-20">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-white sm:mb-5 sm:h-16 sm:w-16 sm:text-2xl" style={{ background: "linear-gradient(135deg, #0969da, #8250df)" }}>QF</div>
            <h2 className="mb-2 text-lg font-semibold sm:text-xl" style={{ color: "var(--text)" }}>电商经营分析助手</h2>
            <p className="mb-3 text-center text-sm leading-relaxed sm:mb-4" style={{ color: "var(--text-secondary)" }}>用 Olist 巴西电商案例分析地区、品类、渠道和复购，把经营问题拆成可执行的查询与建议。</p>
            <p className="mb-5 rounded-full px-3 py-1 text-center text-xs sm:mb-8" style={{ color: "var(--text-muted)", background: "var(--surface-hover)" }}>Settings 填 API URL 和 key/token，高级设置可手动指定 backend/model</p>
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
              {DEMO_CHIPS.map((chip) => (
                <button key={chip} onClick={() => handleChipClick(chip)} className="rounded-full px-4 py-2 text-sm font-medium transition-default" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mx-auto max-w-3xl space-y-6">
          {history.map((item, i) => (
            <div key={i} className="space-y-4">
              <div className="flex justify-end">
                <div className="max-w-[92%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm sm:max-w-[80%]" style={{ background: "var(--accent)", color: "#fff" }}>{item.q}</div>
              </div>
              <div className="space-y-3">
                {item.r.corrected && item.r.correctionNote && (
                  <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>🔧 {item.r.correctionNote}</div>
                )}
                {item.r.thinking && (
                  <details className="group">
                    <summary className="cursor-pointer text-xs font-medium transition-default" style={{ color: "var(--text-muted)" }}>
                      <span className="group-open:hidden">▸ 查看推理过程</span>
                      <span className="hidden group-open:inline">▾ 推理过程</span>
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap rounded-lg p-3 text-xs leading-relaxed" style={{ background: "var(--surface-hover)", color: "var(--text-secondary)" }}>{item.r.thinking}</p>
                  </details>
                )}
                {item.r.sql && (
                  <details className="group">
                    <summary className="cursor-pointer text-xs font-medium transition-default" style={{ color: "var(--text-muted)" }}>
                      <span className="group-open:hidden">▸ SQL 查询</span>
                      <span className="hidden group-open:inline">▾ SQL 查询</span>
                    </summary>
                    <pre className="mt-2 overflow-x-auto rounded-lg p-3 text-xs leading-relaxed" style={{ background: "#24292f", color: "#e6edf3" }}><code>{item.r.sql}</code></pre>
                  </details>
                )}
                <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                  {!item.r.conversational && (
                    <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {item.r.chartConfig?.title ?? item.r.chart_config?.title ?? "数据可视化"}
                      {item.r._cached && <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>样例结果</span>}
                      {item.r.corrected && <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>AI 自纠正</span>}
                    </h3>
                  )}
                  {item.r.explanation && <div className="mb-3 rounded-lg p-3 text-xs leading-relaxed" style={{ background: "var(--surface-hover)", color: "var(--text-secondary)" }}><p className="whitespace-pre-wrap">{item.r.explanation}</p></div>}
                  {!item.r.conversational && <ChartResult result={item.r} />}
                  {item.r.sql && (
                    <button onClick={() => {
                      const metrics = JSON.parse(localStorage.getItem("queryforge-metrics") || "[]");
                      const name = item.r.chartConfig?.title ?? item.q.slice(0, 20);
                      metrics.unshift({ name, sql: item.r.sql, chartConfig: item.r.chartConfig ?? item.r.chart_config });
                      localStorage.setItem("queryforge-metrics", JSON.stringify(metrics));
                      window.dispatchEvent(new StorageEvent("storage", { key: "queryforge-metrics" }));
                    }} className="mt-3 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-default" style={{ background: "var(--accent)" }}>保存指标</button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {displayResult && history.length === 0 && (
            <div className="space-y-3">
              {displayResult.corrected && displayResult.correctionNote && (
                <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>🔧 {displayResult.correctionNote}</div>
              )}
              {displayResult.thinking && (
                <details className="group">
                  <summary className="cursor-pointer text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    <span className="group-open:hidden">▸ 查看推理过程</span>
                    <span className="hidden group-open:inline">▾ 推理过程</span>
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap rounded-lg p-3 text-xs leading-relaxed" style={{ background: "var(--surface-hover)", color: "var(--text-secondary)" }}>{displayResult.thinking}</p>
                </details>
              )}
              {displayResult.sql && (
                <details className="group">
                  <summary className="cursor-pointer text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    <span className="group-open:hidden">▸ SQL 查询</span>
                    <span className="hidden group-open:inline">▾ SQL 查询</span>
                  </summary>
                  <pre className="mt-2 overflow-x-auto rounded-lg p-3 text-xs leading-relaxed" style={{ background: "#24292f", color: "#e6edf3" }}><code>{displayResult.sql}</code></pre>
                </details>
              )}
              <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                {!displayResult.conversational && (
                  <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--text)" }}>{chartTitle}
                    {displayResult._cached && <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>样例结果</span>}
                  </h3>
                )}
                {displayResult.explanation && <div className="mb-3 rounded-lg p-3 text-xs leading-relaxed" style={{ background: "var(--surface-hover)", color: "var(--text-secondary)" }}><p className="whitespace-pre-wrap">{displayResult.explanation}</p></div>}
                {!displayResult.conversational && <ChartResult result={displayResult} />}
              </div>
            </div>
          )}

          {pendingQuestion && (
            <div className="flex justify-end">
              <div className="max-w-[92%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm sm:max-w-[80%]" style={{ background: "var(--accent)", color: "#fff" }}>{pendingQuestion}</div>
            </div>
          )}

          {/* Loading with progress steps */}
          {isLoading && (
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              {progressSteps.length > 0 ? (
                <div className="space-y-2">
                  {progressSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs" style={{ color: i === progressSteps.length - 1 ? "var(--text)" : "var(--text-muted)" }}>
                      <span>{stepIcons[step.step] || "•"}</span>
                      <span>{step.message}</span>
                      {i === progressSteps.length - 1 && <div className="h-3 w-3 animate-spin rounded-full border-2" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>AI 正在分析数据...</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--error)", background: "var(--error-soft)", color: "var(--error)" }}>{error}</div>
          )}
        </div>
      </div>

      <div className="border-t px-3 py-3 sm:px-6 sm:py-4" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="mx-auto flex max-w-3xl items-end gap-2 sm:gap-3">
          <textarea ref={textareaRef} value={message} onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder="直接问：哪个地区最值得投放？" rows={1}
            className="flex-1 resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-default"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)", minHeight: 44, maxHeight: 120 }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(9,105,218,0.12)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
            disabled={isLoading} />
          <button type="submit" disabled={isLoading || !message.trim()} className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-medium text-white transition-default disabled:opacity-40 sm:px-5" style={{ background: isLoading || !message.trim() ? "var(--text-muted)" : "var(--accent)" }}>
            {isLoading ? "分析中..." : "发送"}
          </button>
        </form>
      </div>
    </div>
  );
}

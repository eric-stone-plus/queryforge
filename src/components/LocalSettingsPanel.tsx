"use client";

import { useEffect, useState } from "react";

type PublicSettings = {
  mode: "desktop" | "web-demo";
  writable: boolean;
  provider: {
    providerName: string;
    baseURL: string;
    model: string;
    timeoutMs: number;
    temperature: number;
    source: "local" | "env" | "default";
    configured: boolean;
    apiKeyConfigured: boolean;
  };
  tokenPlan: {
    monthlyBudget: number;
  };
  usage: {
    period: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    requestCount: number;
    remainingTokens: number;
    budgetPercent: number;
  };
};

const EMPTY_SETTINGS: PublicSettings = {
  mode: "web-demo",
  writable: false,
  provider: {
    providerName: "openai-compatible",
    baseURL: "",
    model: "",
    timeoutMs: 60000,
    temperature: 0.2,
    source: "default",
    configured: false,
    apiKeyConfigured: false,
  },
  tokenPlan: { monthlyBudget: 100000 },
  usage: {
    period: "",
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    requestCount: 0,
    remainingTokens: 100000,
    budgetPercent: 0,
  },
};

function formatInt(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

function SettingInput({
  label,
  value,
  type = "text",
  placeholder,
  disabled,
  onChange,
}: {
  label: string;
  value: string | number;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-lg border px-3 text-sm outline-none transition-default disabled:opacity-60"
        style={{ borderColor: "var(--border)", background: "var(--surface-hover)", color: "var(--text)" }}
      />
    </label>
  );
}

const PROVIDER_PRESETS = [
  { id: "custom", label: "Custom endpoint", providerName: "openai-compatible", baseURL: "", model: "" },
  { id: "moonshot", label: "Moonshot compatible", providerName: "moonshot-compatible", baseURL: "https://api.moonshot.cn/v1", model: "moonshot-v1-8k" },
  { id: "deepseek", label: "DeepSeek compatible", providerName: "deepseek-compatible", baseURL: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  { id: "openai", label: "OpenAI compatible", providerName: "openai-compatible", baseURL: "https://api.openai.com/v1", model: "gpt-4o-mini" },
];

export default function LocalSettingsPanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const [settings, setSettings] = useState<PublicSettings>(EMPTY_SETTINGS);
  const [draft, setDraft] = useState({
    providerName: "openai-compatible",
    baseURL: "",
    model: "",
    apiKey: "",
    timeoutMs: 60000,
    temperature: 0.2,
    monthlyBudget: 100000,
  });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function loadSettings() {
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json() as PublicSettings;
      setSettings(data);
      setDraft((current) => ({
        ...current,
        providerName: data.provider.providerName || "openai-compatible",
        baseURL: data.provider.baseURL || "",
        model: data.provider.model || "",
        timeoutMs: data.provider.timeoutMs || 60000,
        temperature: data.provider.temperature ?? 0.2,
        monthlyBudget: data.tokenPlan.monthlyBudget || 100000,
      }));
    } catch {
      // Settings are non-critical for the dashboard shell.
    }
  }

  useEffect(() => {
    loadSettings();
  }, [refreshKey]);

  async function saveSettings() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: {
            providerName: draft.providerName,
            baseURL: draft.baseURL,
            model: draft.model,
            apiKey: draft.apiKey,
            timeoutMs: draft.timeoutMs,
            temperature: draft.temperature,
          },
          tokenPlan: {
            monthlyBudget: draft.monthlyBudget,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "设置保存失败");
      setSettings(data as PublicSettings);
      setDraft((current) => ({ ...current, apiKey: "" }));
      setStatus("已保存到本机配置");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "设置保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function clearApiKey() {
    if (!confirm("清除本机保存的 API key？")) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: {
            providerName: draft.providerName,
            baseURL: draft.baseURL,
            model: draft.model,
            clearApiKey: true,
            timeoutMs: draft.timeoutMs,
            temperature: draft.temperature,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "清除失败");
      setSettings(data as PublicSettings);
      setDraft((current) => ({ ...current, apiKey: "" }));
      setStatus("本机 API key 已清除");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "清除失败");
    } finally {
      setSaving(false);
    }
  }

  async function resetUsage() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/token-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });
      const usage = await res.json();
      if (!res.ok) throw new Error(usage.error || "重置失败");
      await loadSettings();
      setStatus("本地 token 用量已重置");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "重置失败");
    } finally {
      setSaving(false);
    }
  }

  function applyPreset(presetId: string) {
    const preset = PROVIDER_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    setDraft((current) => ({
      ...current,
      providerName: preset.providerName,
      baseURL: preset.baseURL || current.baseURL,
      model: preset.model || current.model,
    }));
  }

  const modeLabel = settings.mode === "desktop" ? "本地应用" : "扫码演示";
  const providerLabel = settings.provider.configured ? "模型已配置" : "模型未配置";
  const statusColor = settings.provider.configured ? "var(--success)" : "var(--text-muted)";
  const writable = settings.writable;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-7 items-center gap-2 rounded-lg border px-2.5 text-xs font-medium transition-default"
        style={{
          borderColor: "var(--border)",
          background: "var(--surface-hover)",
          color: "var(--text-secondary)",
        }}
        title="Settings"
      >
        <span>Settings</span>
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor }} />
        <span className="hidden sm:inline" style={{ color: statusColor }}>{providerLabel}</span>
        <span aria-hidden="true" style={{ color: "var(--text-muted)" }}>{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 max-h-[calc(100svh-88px)] w-[min(92vw,460px)] overflow-y-auto rounded-xl border shadow-2xl"
          role="menu"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
            <div className="flex items-start justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Settings</h2>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {writable ? "填写模型 endpoint、model 和 API key/token。凭证只保存在本机。" : "公开扫码页为只读演示，不保存访客凭证。"}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="h-8 w-8 rounded-lg text-sm" style={{ color: "var(--text-muted)", background: "var(--surface-hover)" }}>×</button>
            </div>

            <div className="space-y-4 px-4 py-4" role="none">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-hover)" }}>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>运行模式</p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: "var(--text)" }}>{modeLabel}</p>
                </div>
                <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-hover)" }}>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>调用次数</p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: "var(--text)" }}>{formatInt(settings.usage.requestCount)}</p>
                </div>
                <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-hover)" }}>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>预算占用</p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: "var(--text)" }}>{settings.usage.budgetPercent}%</p>
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>{formatInt(settings.usage.totalTokens)} / {formatInt(settings.tokenPlan.monthlyBudget)} tokens</span>
                  <span>{settings.usage.period || "当前周期"}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-hover)" }}>
                  <div className="h-full rounded-full" style={{ width: `${settings.usage.budgetPercent}%`, background: settings.usage.budgetPercent > 85 ? "var(--warning)" : "var(--accent)" }} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>Endpoint preset</span>
                  <select
                    disabled={!writable}
                    defaultValue="custom"
                    onChange={(event) => applyPreset(event.target.value)}
                    className="h-9 w-full rounded-lg border px-3 text-sm outline-none transition-default disabled:opacity-60"
                    style={{ borderColor: "var(--border)", background: "var(--surface-hover)", color: "var(--text)" }}
                  >
                    {PROVIDER_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>{preset.label}</option>
                    ))}
                  </select>
                </label>
                <SettingInput label="Provider" value={draft.providerName} disabled={!writable} onChange={(value) => setDraft((d) => ({ ...d, providerName: value }))} />
                <SettingInput label="Model" value={draft.model} disabled={!writable} placeholder="provider-model-name" onChange={(value) => setDraft((d) => ({ ...d, model: value }))} />
                <div className="sm:col-span-2">
                  <SettingInput label="Base URL" value={draft.baseURL} disabled={!writable} placeholder="https://api.example.com/v1" onChange={(value) => setDraft((d) => ({ ...d, baseURL: value }))} />
                </div>
                <div className="sm:col-span-2">
                  <SettingInput label={settings.provider.apiKeyConfigured ? "API key / token（已配置，留空则不覆盖）" : "API key / token"} value={draft.apiKey} disabled={!writable} type="password" placeholder="只保存在本机" onChange={(value) => setDraft((d) => ({ ...d, apiKey: value }))} />
                  {settings.provider.apiKeyConfigured && writable && (
                    <button
                      type="button"
                      onClick={clearApiKey}
                      disabled={saving}
                      className="mt-2 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                      style={{ background: "var(--surface-hover)", color: "var(--text-muted)" }}
                    >
                      清除本机 API key
                    </button>
                  )}
                </div>
                <SettingInput label="Timeout ms" value={draft.timeoutMs} disabled={!writable} type="number" onChange={(value) => setDraft((d) => ({ ...d, timeoutMs: Number(value) || 60000 }))} />
                <SettingInput label="Temperature" value={draft.temperature} disabled={!writable} type="number" onChange={(value) => setDraft((d) => ({ ...d, temperature: Number(value) }))} />
                <div className="sm:col-span-2">
                  <SettingInput label="Monthly token budget" value={draft.monthlyBudget} disabled={!writable} type="number" onChange={(value) => setDraft((d) => ({ ...d, monthlyBudget: Number(value) || 100000 }))} />
                </div>
              </div>

              {status && <p className="rounded-lg px-3 py-2 text-xs" style={{ background: "var(--surface-hover)", color: "var(--text-secondary)" }}>{status}</p>}
            </div>

            <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: "var(--border)" }}>
              <button type="button" onClick={resetUsage} disabled={!writable || saving} className="rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-50" style={{ background: "var(--surface-hover)", color: "var(--text-secondary)" }}>重置用量</button>
              <div className="flex gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-xs font-medium" style={{ background: "var(--surface-hover)", color: "var(--text-secondary)" }}>关闭</button>
                <button type="button" onClick={saveSettings} disabled={!writable || saving} className="rounded-lg px-3 py-2 text-xs font-medium text-white disabled:opacity-50" style={{ background: "var(--accent)" }}>{saving ? "保存中..." : "保存"}</button>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}

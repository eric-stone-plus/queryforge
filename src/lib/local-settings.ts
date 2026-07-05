import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import os from "os";
import path from "path";

type ProviderSource = "local" | "env" | "default";
export type ProviderBackend = "auto" | "openai-compatible" | "anthropic";
export type ProviderConnectionStatus = "missing" | "untested" | "ok" | "error";

export type StoredProviderSettings = {
  backend: ProviderBackend;
  providerName: string;
  baseURL: string;
  model: string;
  apiKey: string;
  timeoutMs: number;
  temperature: number;
  connectionStatus: ProviderConnectionStatus;
  connectionMessage: string;
  testedAt: string;
};

export type TokenPlan = {
  monthlyBudget: number;
};

export type TokenUsage = {
  period: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requestCount: number;
  updatedAt?: string;
};

export type TokenUsageDelta = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  requestCount?: number;
};

type SettingsFile = {
  provider?: Partial<StoredProviderSettings>;
  tokenPlan?: Partial<TokenPlan>;
  usage?: Partial<TokenUsage>;
};

type LocalSettings = {
  provider: StoredProviderSettings;
  tokenPlan: TokenPlan;
  usage: TokenUsage;
};

export type EffectiveProviderSettings = StoredProviderSettings & {
  source: ProviderSource;
  ready: boolean;
  configured: boolean;
  testable: boolean;
};

export type PublicSettings = {
  mode: "desktop" | "web-demo";
  writable: boolean;
  provider: {
    backend: ProviderBackend;
    backendLabel: string;
    providerName: string;
    baseURL: string;
    model: string;
    timeoutMs: number;
    temperature: number;
    source: ProviderSource;
    ready: boolean;
    configured: boolean;
    testable: boolean;
    apiKeyConfigured: boolean;
    connectionStatus: ProviderConnectionStatus;
    connectionMessage: string;
    testedAt: string;
  };
  tokenPlan: TokenPlan;
  usage: TokenUsage & {
    remainingTokens: number;
    budgetPercent: number;
  };
};

export type LocalSettingsUpdate = {
  provider?: {
    backend?: unknown;
    providerName?: unknown;
    baseURL?: unknown;
    model?: unknown;
    apiKey?: unknown;
    clearApiKey?: unknown;
    timeoutMs?: unknown;
    temperature?: unknown;
  };
  tokenPlan?: {
    monthlyBudget?: unknown;
  };
};

const CONFIG_DIR = process.env.QUERYFORGE_CONFIG_DIR || path.join(os.homedir(), ".queryforge");
const SETTINGS_PATH = path.join(CONFIG_DIR, "settings.json");
const DEFAULT_PROVIDER: StoredProviderSettings = {
  backend: "auto",
  providerName: "openai-compatible",
  baseURL: "",
  model: "",
  apiKey: "",
  timeoutMs: 60000,
  temperature: 0.2,
  connectionStatus: "missing",
  connectionMessage: "请选择模型服务并填写 API key/token。",
  testedAt: "",
};
const DEFAULT_TOKEN_PLAN: TokenPlan = {
  monthlyBudget: 100000,
};

function isProviderBackend(value: unknown): value is ProviderBackend {
  return value === "auto" || value === "openai-compatible" || value === "anthropic";
}

function inferProviderFromBaseURL(baseURL: string, preferredBackend: ProviderBackend = "auto") {
  const lower = baseURL.toLowerCase();

  if (preferredBackend === "anthropic" || lower.includes("anthropic.com")) {
    return {
      backend: "anthropic" as ProviderBackend,
      providerName: "anthropic",
      model: "claude-sonnet-4-5",
      label: "Anthropic Messages API",
    };
  }
  if (lower.includes("deepseek.com")) {
    return {
      backend: "openai-compatible" as ProviderBackend,
      providerName: DEFAULT_PROVIDER.providerName,
      model: "deepseek-v4-pro",
      label: "Chat Completions-compatible",
    };
  }
  if (lower.includes("moonshot.cn")) {
    return {
      backend: "openai-compatible" as ProviderBackend,
      providerName: DEFAULT_PROVIDER.providerName,
      model: "moonshot-v1-8k",
      label: "Chat Completions-compatible",
    };
  }
  if (lower.includes("openai.com")) {
    return {
      backend: "openai-compatible" as ProviderBackend,
      providerName: DEFAULT_PROVIDER.providerName,
      model: "gpt-4o-mini",
      label: "Chat Completions-compatible",
    };
  }

  return {
    backend: preferredBackend === "openai-compatible" ? "openai-compatible" as ProviderBackend : "auto" as ProviderBackend,
    providerName: DEFAULT_PROVIDER.providerName,
    model: "",
    label: "Auto / generic model API",
  };
}

function backendLabel(backend: ProviderBackend, baseURL: string) {
  const inferred = inferProviderFromBaseURL(baseURL, backend);
  return inferred.label;
}

export function isSettingsWritable() {
  return process.env.QUERYFORGE_DESKTOP === "1" || process.env.NODE_ENV !== "production";
}

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function cleanString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeBaseURL(value: unknown, fallback = "") {
  let baseURL = cleanString(value, fallback);
  if (!baseURL) return "";
  if (!/^https?:\/\//i.test(baseURL)) baseURL = `https://${baseURL}`;
  baseURL = baseURL.replace(/\/+$/, "");
  baseURL = baseURL.replace(/\/chat\/completions?$/i, "");
  return baseURL;
}

function finiteNumber(value: unknown, fallback: number) {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function positiveInt(value: unknown, fallback: number) {
  const n = Math.round(finiteNumber(value, fallback));
  return n > 0 ? n : fallback;
}

function clampTemperature(value: unknown, fallback: number) {
  const n = finiteNumber(value, fallback);
  if (n < 0) return 0;
  if (n > 2) return 2;
  return n;
}

function isConnectionStatus(value: unknown): value is ProviderConnectionStatus {
  return value === "missing" || value === "untested" || value === "ok" || value === "error";
}

function providerReady(provider: Pick<StoredProviderSettings, "apiKey" | "baseURL" | "model">) {
  return Boolean(provider.apiKey && provider.baseURL && provider.model);
}

function providerTestable(provider: Pick<StoredProviderSettings, "apiKey" | "baseURL">) {
  return Boolean(provider.apiKey && provider.baseURL);
}

function readRawSettings(): SettingsFile {
  if (!existsSync(SETTINGS_PATH)) return {};

  try {
    return JSON.parse(readFileSync(SETTINGS_PATH, "utf8")) as SettingsFile;
  } catch {
    return {};
  }
}

function normalizeProvider(provider: Partial<StoredProviderSettings> | undefined): StoredProviderSettings {
  const baseURL = normalizeBaseURL(provider?.baseURL, DEFAULT_PROVIDER.baseURL);
  const requestedBackend = isProviderBackend(provider?.backend) ? provider.backend : DEFAULT_PROVIDER.backend;
  const inferred = inferProviderFromBaseURL(baseURL, requestedBackend);
  const normalized = {
    backend: requestedBackend === "auto" ? inferred.backend : requestedBackend,
    providerName: cleanString(provider?.providerName, inferred.providerName) || inferred.providerName,
    baseURL,
    model: cleanString(provider?.model, inferred.model),
    apiKey: cleanString(provider?.apiKey, DEFAULT_PROVIDER.apiKey),
    timeoutMs: positiveInt(provider?.timeoutMs, DEFAULT_PROVIDER.timeoutMs),
    temperature: clampTemperature(provider?.temperature, DEFAULT_PROVIDER.temperature),
    connectionStatus: isConnectionStatus(provider?.connectionStatus) ? provider.connectionStatus : DEFAULT_PROVIDER.connectionStatus,
    connectionMessage: cleanString(provider?.connectionMessage, DEFAULT_PROVIDER.connectionMessage),
    testedAt: cleanString(provider?.testedAt, DEFAULT_PROVIDER.testedAt),
  };

  if (!providerReady(normalized)) {
    normalized.connectionStatus = "missing";
    normalized.connectionMessage = normalized.baseURL && !normalized.model
      ? "已保存 API URL。该地址无法自动识别模型，请在高级设置里填写 model。"
      : "请选择模型服务并填写 API key/token。";
    normalized.testedAt = "";
  } else if (normalized.connectionStatus === "missing") {
    normalized.connectionStatus = "untested";
    normalized.connectionMessage = "配置已保存，尚未测试连接。";
  }

  return normalized;
}

function normalizeTokenPlan(tokenPlan: Partial<TokenPlan> | undefined): TokenPlan {
  return {
    monthlyBudget: positiveInt(tokenPlan?.monthlyBudget, DEFAULT_TOKEN_PLAN.monthlyBudget),
  };
}

function normalizeUsage(usage: Partial<TokenUsage> | undefined): TokenUsage {
  const period = currentPeriod();
  if (usage?.period !== period) {
    return {
      period,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      requestCount: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    period,
    promptTokens: Math.max(0, Math.round(finiteNumber(usage.promptTokens, 0))),
    completionTokens: Math.max(0, Math.round(finiteNumber(usage.completionTokens, 0))),
    totalTokens: Math.max(0, Math.round(finiteNumber(usage.totalTokens, 0))),
    requestCount: Math.max(0, Math.round(finiteNumber(usage.requestCount, 0))),
    updatedAt: typeof usage.updatedAt === "string" ? usage.updatedAt : undefined,
  };
}

function writeSettings(settings: LocalSettings) {
  mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(SETTINGS_PATH, `${JSON.stringify(settings, null, 2)}\n`, { mode: 0o600 });
  try {
    chmodSync(SETTINGS_PATH, 0o600);
  } catch {
    // Best effort only; Windows and some filesystems may not support chmod.
  }
}

function readSettings(): LocalSettings {
  const raw = readRawSettings();
  const settings = {
    provider: normalizeProvider(raw.provider),
    tokenPlan: normalizeTokenPlan(raw.tokenPlan),
    usage: normalizeUsage(raw.usage),
  };

  if (raw.usage?.period && raw.usage.period !== settings.usage.period) {
    writeSettings(settings);
  }

  return settings;
}

function envProvider(): StoredProviderSettings {
  if (process.env.QUERYFORGE_DESKTOP === "1" && process.env.QUERYFORGE_ALLOW_ENV_PROVIDER !== "1") {
    return { ...DEFAULT_PROVIDER };
  }

  const baseURL = normalizeBaseURL(process.env.AI_BASE_URL || "");
  const requestedBackend = isProviderBackend(process.env.AI_BACKEND) ? process.env.AI_BACKEND : DEFAULT_PROVIDER.backend;
  const inferred = inferProviderFromBaseURL(baseURL, requestedBackend);
  return {
    backend: requestedBackend === "auto" ? inferred.backend : requestedBackend,
    providerName: process.env.AI_PROVIDER_NAME || inferred.providerName,
    baseURL,
    model: process.env.AI_MODEL || inferred.model,
    apiKey: process.env.AI_API_KEY || "",
    timeoutMs: positiveInt(process.env.AI_TIMEOUT_MS, DEFAULT_PROVIDER.timeoutMs),
    temperature: clampTemperature(process.env.AI_TEMPERATURE, DEFAULT_PROVIDER.temperature),
    connectionStatus: hasEnvProvider({
      backend: requestedBackend === "auto" ? inferred.backend : requestedBackend,
      providerName: process.env.AI_PROVIDER_NAME || inferred.providerName,
      baseURL,
      model: process.env.AI_MODEL || inferred.model,
      apiKey: process.env.AI_API_KEY || "",
      timeoutMs: positiveInt(process.env.AI_TIMEOUT_MS, DEFAULT_PROVIDER.timeoutMs),
      temperature: clampTemperature(process.env.AI_TEMPERATURE, DEFAULT_PROVIDER.temperature),
      connectionStatus: "untested",
      connectionMessage: "",
      testedAt: "",
    }) ? "untested" : "missing",
    connectionMessage: process.env.AI_API_KEY ? "环境变量配置尚未在本机测试。" : DEFAULT_PROVIDER.connectionMessage,
    testedAt: "",
  };
}

function hasLocalProvider(provider: StoredProviderSettings) {
  return Boolean(
    provider.baseURL ||
    provider.model ||
    provider.apiKey ||
    provider.backend !== DEFAULT_PROVIDER.backend ||
    provider.providerName !== DEFAULT_PROVIDER.providerName
  );
}

function hasEnvProvider(provider: StoredProviderSettings) {
  return Boolean(provider.baseURL || provider.model || provider.apiKey);
}

function withUsageSummary(settings: LocalSettings): PublicSettings["usage"] {
  const remainingTokens = Math.max(0, settings.tokenPlan.monthlyBudget - settings.usage.totalTokens);
  const budgetPercent = settings.tokenPlan.monthlyBudget > 0
    ? Math.min(100, Math.round((settings.usage.totalTokens / settings.tokenPlan.monthlyBudget) * 100))
    : 0;

  return {
    ...settings.usage,
    remainingTokens,
    budgetPercent,
  };
}

export function getEffectiveProviderSettings(): EffectiveProviderSettings {
  const settings = readSettings();
  const env = envProvider();
  const source: ProviderSource = hasLocalProvider(settings.provider) ? "local" : hasEnvProvider(env) ? "env" : "default";
  const selected = source === "local" ? settings.provider : source === "env" ? env : DEFAULT_PROVIDER;
  const effective = {
    backend: selected.backend,
    providerName: selected.providerName || DEFAULT_PROVIDER.providerName,
    baseURL: selected.baseURL,
    model: selected.model,
    apiKey: selected.apiKey,
    timeoutMs: selected.timeoutMs,
    temperature: selected.temperature,
  };
  const ready = Boolean(effective.apiKey && effective.baseURL && effective.model);
  const testable = providerTestable(effective);
  const connectionStatus = ready
    ? selected.connectionStatus
    : "missing";

  return {
    ...effective,
    source,
    connectionStatus,
    connectionMessage: ready
      ? selected.connectionMessage
      : DEFAULT_PROVIDER.connectionMessage,
    testedAt: ready && source === "local" ? selected.testedAt : "",
    ready,
    configured: ready,
    testable,
  };
}

export function getPublicSettings(): PublicSettings {
  const settings = readSettings();
  const provider = getEffectiveProviderSettings();
  const isDesktop = process.env.QUERYFORGE_DESKTOP === "1";
  const exposeProvider = isDesktop || process.env.NODE_ENV !== "production";

  return {
    mode: isDesktop ? "desktop" : "web-demo",
    writable: isSettingsWritable(),
    provider: {
      backend: exposeProvider ? provider.backend : DEFAULT_PROVIDER.backend,
      backendLabel: exposeProvider ? backendLabel(provider.backend, provider.baseURL) : backendLabel(DEFAULT_PROVIDER.backend, ""),
      providerName: exposeProvider ? provider.providerName : DEFAULT_PROVIDER.providerName,
      baseURL: exposeProvider ? provider.baseURL : "",
      model: exposeProvider ? provider.model : "",
      timeoutMs: exposeProvider ? provider.timeoutMs : DEFAULT_PROVIDER.timeoutMs,
      temperature: exposeProvider ? provider.temperature : DEFAULT_PROVIDER.temperature,
      source: exposeProvider ? provider.source : "default",
      ready: exposeProvider ? provider.ready : false,
      configured: exposeProvider ? provider.configured : false,
      testable: exposeProvider ? provider.testable : false,
      apiKeyConfigured: exposeProvider ? Boolean(provider.apiKey) : false,
      connectionStatus: exposeProvider ? provider.connectionStatus : "missing",
      connectionMessage: exposeProvider ? provider.connectionMessage : DEFAULT_PROVIDER.connectionMessage,
      testedAt: exposeProvider ? provider.testedAt : "",
    },
    tokenPlan: settings.tokenPlan,
    usage: withUsageSummary(settings),
  };
}

export function updateLocalSettings(update: LocalSettingsUpdate): PublicSettings {
  const settings = readSettings();

  if (update.provider) {
    const previous = settings.provider;
    const apiKey = cleanString(update.provider.apiKey);
    const shouldClearApiKey = update.provider.clearApiKey === true;
    const requestedBackend = isProviderBackend(update.provider.backend) ? update.provider.backend : previous.backend;
    const baseURL = update.provider.baseURL === undefined
      ? settings.provider.baseURL
      : normalizeBaseURL(update.provider.baseURL, settings.provider.baseURL);
    const inferred = inferProviderFromBaseURL(baseURL, requestedBackend);
    const baseURLChanged = baseURL !== previous.baseURL;
    const incomingModel = update.provider.model === undefined
      ? baseURLChanged || requestedBackend !== previous.backend ? inferred.model : settings.provider.model
      : cleanString(update.provider.model, "");
    const nextProvider = normalizeProvider({
      ...settings.provider,
      backend: requestedBackend === "auto" ? inferred.backend : requestedBackend,
      providerName: cleanString(update.provider.providerName, inferred.providerName),
      baseURL,
      model: incomingModel || inferred.model,
      apiKey: shouldClearApiKey ? "" : apiKey || settings.provider.apiKey,
      timeoutMs: update.provider.timeoutMs === undefined
        ? settings.provider.timeoutMs
        : positiveInt(update.provider.timeoutMs, settings.provider.timeoutMs),
      temperature: update.provider.temperature === undefined
        ? settings.provider.temperature
        : clampTemperature(update.provider.temperature, settings.provider.temperature),
    });

    const connectionChanged = shouldClearApiKey
      || Boolean(apiKey)
      || nextProvider.backend !== previous.backend
      || nextProvider.providerName !== previous.providerName
      || nextProvider.baseURL !== previous.baseURL
      || nextProvider.model !== previous.model;

    if (connectionChanged) {
      nextProvider.connectionStatus = providerReady(nextProvider) ? "untested" : "missing";
      nextProvider.connectionMessage = providerReady(nextProvider)
        ? "配置已保存，尚未测试连接。"
        : DEFAULT_PROVIDER.connectionMessage;
      nextProvider.testedAt = "";
    }

    settings.provider = nextProvider;
  }

  if (update.tokenPlan) {
    settings.tokenPlan = normalizeTokenPlan({
      ...settings.tokenPlan,
      monthlyBudget: update.tokenPlan.monthlyBudget === undefined
        ? settings.tokenPlan.monthlyBudget
        : positiveInt(update.tokenPlan.monthlyBudget, settings.tokenPlan.monthlyBudget),
    });
  }

  writeSettings(settings);
  return getPublicSettings();
}

export function canTestProviderSettings() {
  return providerTestable(getEffectiveProviderSettings());
}

export function updateProviderConnectionStatus(
  status: Exclude<ProviderConnectionStatus, "missing">,
  message: string,
): PublicSettings {
  const settings = readSettings();
  if (!providerReady(settings.provider)) {
    settings.provider.connectionStatus = "missing";
    settings.provider.connectionMessage = DEFAULT_PROVIDER.connectionMessage;
    settings.provider.testedAt = "";
  } else {
    settings.provider.connectionStatus = status;
    settings.provider.connectionMessage = cleanString(message, status === "ok" ? "连接可用。" : "连接失败。");
    settings.provider.testedAt = new Date().toISOString();
  }
  writeSettings(settings);
  return getPublicSettings();
}

export function getTokenUsageSnapshot() {
  const settings = readSettings();
  return {
    tokenPlan: settings.tokenPlan,
    usage: withUsageSummary(settings),
  };
}

export function resetTokenUsage() {
  const settings = readSettings();
  settings.usage = normalizeUsage(undefined);
  writeSettings(settings);
  return getTokenUsageSnapshot();
}

export function updateTokenPlan(monthlyBudget: unknown) {
  const settings = readSettings();
  settings.tokenPlan = normalizeTokenPlan({
    monthlyBudget: positiveInt(monthlyBudget, settings.tokenPlan.monthlyBudget),
  });
  writeSettings(settings);
  return getTokenUsageSnapshot();
}

export function assertTokenBudgetAvailable() {
  const settings = readSettings();
  if (settings.usage.totalTokens >= settings.tokenPlan.monthlyBudget) {
    throw new Error(`Token budget exhausted for ${settings.usage.period}`);
  }
}

export function estimateTokenCount(text: string) {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 3));
}

export function recordTokenUsage(delta: TokenUsageDelta) {
  const promptTokens = Math.max(0, Math.round(finiteNumber(delta.promptTokens, 0)));
  const completionTokens = Math.max(0, Math.round(finiteNumber(delta.completionTokens, 0)));
  const totalTokens = Math.max(0, Math.round(finiteNumber(delta.totalTokens, promptTokens + completionTokens)));
  const requestCount = Math.max(1, Math.round(finiteNumber(delta.requestCount, 1)));

  if (!totalTokens) return;

  try {
    const settings = readSettings();
    settings.usage.promptTokens += promptTokens;
    settings.usage.completionTokens += completionTokens;
    settings.usage.totalTokens += totalTokens;
    settings.usage.requestCount += requestCount;
    settings.usage.updatedAt = new Date().toISOString();
    writeSettings(settings);
  } catch {
    // Usage accounting should never make the chat flow fail.
  }
}

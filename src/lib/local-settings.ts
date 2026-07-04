import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import os from "os";
import path from "path";

type ProviderSource = "local" | "env" | "default";

export type StoredProviderSettings = {
  providerName: string;
  baseURL: string;
  model: string;
  apiKey: string;
  timeoutMs: number;
  temperature: number;
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
  configured: boolean;
};

export type PublicSettings = {
  mode: "desktop" | "web-demo";
  writable: boolean;
  provider: {
    providerName: string;
    baseURL: string;
    model: string;
    timeoutMs: number;
    temperature: number;
    source: ProviderSource;
    configured: boolean;
    apiKeyConfigured: boolean;
  };
  tokenPlan: TokenPlan;
  usage: TokenUsage & {
    remainingTokens: number;
    budgetPercent: number;
  };
};

export type LocalSettingsUpdate = {
  provider?: {
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
  providerName: "openai-compatible",
  baseURL: "",
  model: "",
  apiKey: "",
  timeoutMs: 60000,
  temperature: 0.2,
};
const DEFAULT_TOKEN_PLAN: TokenPlan = {
  monthlyBudget: 100000,
};

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

function readRawSettings(): SettingsFile {
  if (!existsSync(SETTINGS_PATH)) return {};

  try {
    return JSON.parse(readFileSync(SETTINGS_PATH, "utf8")) as SettingsFile;
  } catch {
    return {};
  }
}

function normalizeProvider(provider: Partial<StoredProviderSettings> | undefined): StoredProviderSettings {
  return {
    providerName: cleanString(provider?.providerName, DEFAULT_PROVIDER.providerName) || DEFAULT_PROVIDER.providerName,
    baseURL: cleanString(provider?.baseURL, DEFAULT_PROVIDER.baseURL),
    model: cleanString(provider?.model, DEFAULT_PROVIDER.model),
    apiKey: cleanString(provider?.apiKey, DEFAULT_PROVIDER.apiKey),
    timeoutMs: positiveInt(provider?.timeoutMs, DEFAULT_PROVIDER.timeoutMs),
    temperature: clampTemperature(provider?.temperature, DEFAULT_PROVIDER.temperature),
  };
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
  return {
    providerName: process.env.AI_PROVIDER_NAME || DEFAULT_PROVIDER.providerName,
    baseURL: process.env.AI_BASE_URL || "",
    model: process.env.AI_MODEL || "",
    apiKey: process.env.AI_API_KEY || "",
    timeoutMs: positiveInt(process.env.AI_TIMEOUT_MS, DEFAULT_PROVIDER.timeoutMs),
    temperature: clampTemperature(process.env.AI_TEMPERATURE, DEFAULT_PROVIDER.temperature),
  };
}

function hasLocalProvider(provider: StoredProviderSettings) {
  return Boolean(provider.baseURL || provider.model || provider.apiKey || provider.providerName !== DEFAULT_PROVIDER.providerName);
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
  const effective = {
    providerName: settings.provider.providerName || env.providerName || DEFAULT_PROVIDER.providerName,
    baseURL: settings.provider.baseURL || env.baseURL,
    model: settings.provider.model || env.model,
    apiKey: settings.provider.apiKey || env.apiKey,
    timeoutMs: settings.provider.timeoutMs || env.timeoutMs,
    temperature: settings.provider.temperature ?? env.temperature,
  };

  return {
    ...effective,
    source,
    configured: Boolean(effective.apiKey && effective.baseURL && effective.model),
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
      providerName: exposeProvider ? provider.providerName : DEFAULT_PROVIDER.providerName,
      baseURL: exposeProvider ? provider.baseURL : "",
      model: exposeProvider ? provider.model : "",
      timeoutMs: exposeProvider ? provider.timeoutMs : DEFAULT_PROVIDER.timeoutMs,
      temperature: exposeProvider ? provider.temperature : DEFAULT_PROVIDER.temperature,
      source: exposeProvider ? provider.source : "default",
      configured: exposeProvider ? provider.configured : false,
      apiKeyConfigured: exposeProvider ? Boolean(provider.apiKey) : false,
    },
    tokenPlan: settings.tokenPlan,
    usage: withUsageSummary(settings),
  };
}

export function updateLocalSettings(update: LocalSettingsUpdate): PublicSettings {
  const settings = readSettings();

  if (update.provider) {
    const apiKey = cleanString(update.provider.apiKey);
    const shouldClearApiKey = update.provider.clearApiKey === true;
    const nextProvider: Partial<StoredProviderSettings> = {
      ...settings.provider,
      providerName: cleanString(update.provider.providerName, settings.provider.providerName),
      baseURL: cleanString(update.provider.baseURL, settings.provider.baseURL),
      model: cleanString(update.provider.model, settings.provider.model),
      apiKey: shouldClearApiKey ? "" : apiKey || settings.provider.apiKey,
      timeoutMs: update.provider.timeoutMs === undefined
        ? settings.provider.timeoutMs
        : positiveInt(update.provider.timeoutMs, settings.provider.timeoutMs),
      temperature: update.provider.temperature === undefined
        ? settings.provider.temperature
        : clampTemperature(update.provider.temperature, settings.provider.temperature),
    };
    settings.provider = normalizeProvider(nextProvider);
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

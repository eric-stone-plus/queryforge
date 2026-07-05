import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { NextResponse } from "next/server";
import {
  estimateTokenCount,
  getEffectiveProviderSettings,
  getPublicSettings,
  isSettingsWritable,
  recordTokenUsage,
  updateProviderConnectionStatus,
} from "@/lib/local-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function compactProviderError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  return raw
    .replace(/sk-[A-Za-z0-9_-]+/g, "sk-***")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer ***")
    .slice(0, 240);
}

export async function POST() {
  if (!isSettingsWritable()) {
    return NextResponse.json(
      { error: "Settings are writable only in the local desktop app." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const settings = getEffectiveProviderSettings();
  if (!settings.ready) {
    return NextResponse.json(
      { ok: false, error: "缺少 API URL、API key/token 或 model。", settings: getPublicSettings() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const provider = settings.backend === "anthropic"
    ? createAnthropic({
      name: settings.providerName || "anthropic",
      baseURL: settings.baseURL,
      apiKey: settings.apiKey,
    })
    : createOpenAICompatible({
      name: settings.providerName || "openai-compatible",
      baseURL: settings.baseURL,
      apiKey: settings.apiKey,
    });
  const system = "You are a connection probe. Reply with OK only.";
  const prompt = "Return OK.";

  try {
    const { text, usage } = await generateText({
      model: provider(settings.model),
      system,
      prompt,
      temperature: 0,
      maxOutputTokens: 12,
      abortSignal: AbortSignal.timeout(Math.min(settings.timeoutMs, 15000)),
    });
    recordTokenUsage({
      promptTokens: usage?.inputTokens ?? estimateTokenCount(`${system}\n${prompt}`),
      completionTokens: usage?.outputTokens ?? estimateTokenCount(text),
      totalTokens: usage?.totalTokens,
    });

    const publicSettings = updateProviderConnectionStatus("ok", `连接可用：${settings.model}`);
    return NextResponse.json(
      { ok: true, message: "连接可用", settings: publicSettings },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = compactProviderError(error) || "连接失败。";
    const publicSettings = updateProviderConnectionStatus("error", message);
    return NextResponse.json(
      { ok: false, error: message, settings: publicSettings },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}

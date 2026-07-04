import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getPublicSettings } from "@/lib/local-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    getDb().prepare("SELECT 1").get();
    const settings = getPublicSettings();
    return NextResponse.json(
      {
        status: "ok",
        db: "ready",
        mode: settings.mode,
        providerConfigured: settings.provider.configured,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown health check error",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

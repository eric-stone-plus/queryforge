import { NextResponse } from "next/server";
import { getPublicSettings, isSettingsWritable, updateLocalSettings } from "@/lib/local-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getPublicSettings(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  try {
    if (!isSettingsWritable()) {
      return NextResponse.json(
        { error: "Settings are writable only in the local desktop app." },
        { status: 403 },
      );
    }

    const body = await request.json();
    return NextResponse.json(updateLocalSettings(body), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { getTokenUsageSnapshot, isSettingsWritable, resetTokenUsage, updateTokenPlan } from "@/lib/local-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getTokenUsageSnapshot(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  try {
    if (!isSettingsWritable()) {
      return NextResponse.json(
        { error: "Token plan is writable only in the local desktop app." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as { monthlyBudget?: unknown; reset?: unknown };

    if (body.reset === true) {
      return NextResponse.json(resetTokenUsage(), {
        headers: { "Cache-Control": "no-store" },
      });
    }

    return NextResponse.json(updateTokenPlan(body.monthlyBudget), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Invalid token usage payload" }, { status: 400 });
  }
}

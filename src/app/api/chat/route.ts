import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agent";
import { queryDb } from "@/lib/db";
import { CACHED_RESULTS } from "@/lib/demo-cache";

export async function POST(request: Request) {
  try {
    const { message } = (await request.json()) as { message: string };

    // Try real API first
    try {
      const result = await runAgent(message);
      return NextResponse.json(result);
    } catch (apiError) {
      // Fallback: execute cached SQL against DB
      const cached = CACHED_RESULTS[message] as { sql: string; thinking: string; intent: string; chartConfig: object; explanation: string } | undefined;
      if (cached) {
        try {
          const data = queryDb(cached.sql);
          return NextResponse.json({ ...cached, data, _cached: true });
        } catch {
          // If SQL fails, return cached without data
          return NextResponse.json({ ...cached, data: [], _cached: true });
        }
      }
      throw apiError;
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Chat API error:", errMsg);
    return NextResponse.json(
      { error: errMsg.includes("timeout") ? "分析超时，请重试" : errMsg },
      { status: 500 },
    );
  }
}

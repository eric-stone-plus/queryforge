import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agent";
import { queryDb } from "@/lib/db";
import { CACHED_RESULTS } from "@/lib/demo-cache";

export async function POST(request: Request) {
  try {
    const { message } = (await request.json()) as { message: string };

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function send(data: Record<string, unknown>) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        }

        try {
          const result = await runAgent(message, (progress) => {
            send({ type: "progress", ...progress });
          });
          send({ type: "result", ...result });
        } catch (apiError) {
          const cached = CACHED_RESULTS[message] as { sql: string; thinking: string; intent: string; chartConfig: object; explanation: string } | undefined;
          if (cached) {
            try {
              const data = queryDb(cached.sql);
              send({ type: "result", ...cached, data, _cached: true });
            } catch {
              send({ type: "result", ...cached, data: [], _cached: true });
            }
          } else {
            const errMsg = apiError instanceof Error ? apiError.message : String(apiError);
            send({ type: "error", error: errMsg.includes("timeout") ? "分析超时，请重试" : errMsg });
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

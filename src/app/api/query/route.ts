import { NextResponse } from "next/server";
import { Parser, type AST } from "node-sql-parser";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parser = new Parser();

function isSelectOnly(sql: string) {
  const ast = parser.astify(sql, { database: "sqlite" });
  const statements = Array.isArray(ast) ? ast : [ast];

  return statements.length === 1 && statements.every((statement: AST) => statement.type === "select");
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

function withDefaultLimit(sql: string) {
  const normalized = sql.trim().replace(/;+\s*$/, "");
  return normalized.toUpperCase().includes("LIMIT") ? normalized : `${normalized} LIMIT 500`;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { rows: [], error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const sql = typeof body === "object" && body !== null && "sql" in body ? body.sql : undefined;

  if (typeof sql !== "string" || sql.trim().length === 0) {
    return NextResponse.json(
      { rows: [], error: "Request body must include a non-empty sql string" },
      { status: 400 },
    );
  }

  try {
    if (!isSelectOnly(sql)) {
      return NextResponse.json(
        { rows: [], error: "Only SELECT statements are allowed" },
        { status: 400 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      { rows: [], error: `Invalid SQL: ${errorMessage(error)}` },
      { status: 400 },
    );
  }

  try {
    const rows = getDb().prepare(withDefaultLimit(sql)).all();
    return NextResponse.json({ rows, error: null });
  } catch (error) {
    return NextResponse.json(
      { rows: [], error: errorMessage(error) },
      { status: 500 },
    );
  }
}

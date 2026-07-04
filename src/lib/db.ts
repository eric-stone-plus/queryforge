import Database from "better-sqlite3";
import { existsSync } from "fs";
import { join, resolve } from "path";

let db: Database.Database | null = null;

function resolveDbPath() {
  const configured = process.env.DB_PATH?.trim();
  if (configured) return resolve(configured);

  const candidates = [
    join(process.cwd(), "data", "ecommerce.db"),
    join(process.cwd(), "..", "data", "ecommerce.db"),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = resolveDbPath();
    db = new Database(dbPath, { readonly: true, fileMustExist: true });
  }
  return db;
}

export function queryDb(sql: string): Record<string, unknown>[] {
  return getDb().prepare(sql).all() as Record<string, unknown>[];
}

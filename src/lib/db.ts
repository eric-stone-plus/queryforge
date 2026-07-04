import Database from "better-sqlite3";
import { join } from "path";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = join(process.cwd(), "data", "ecommerce.db");
    db = new Database(dbPath, { readonly: true, fileMustExist: true });
  }
  return db;
}

export function queryDb(sql: string): Record<string, unknown>[] {
  return getDb().prepare(sql).all() as Record<string, unknown>[];
}

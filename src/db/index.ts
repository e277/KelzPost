import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  // prepare: false — required by connection poolers in transaction mode (e.g. Neon's pooled URL).
  // A small pool suits serverless functions, which each hold their own connections.
  return postgres(url, { prepare: false, max: process.env.NODE_ENV === "production" ? 5 : 10 });
}

// Reuse one client across hot reloads in development.
const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };
const sql = globalForDb.sql ?? createClient();
if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

export const db = drizzle(sql, { schema });
export * from "./schema";

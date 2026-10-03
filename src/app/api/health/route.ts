import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

/**
 * Deployment self-check: which required settings this deployment can see and
 * whether the database is reachable. Reports only yes/no, never values.
 */
export async function GET() {
  let database: string;
  try {
    await db.execute(sql`select 1`);
    database = "connected";
  } catch (e) {
    database = `error: ${e instanceof Error ? e.message.split("\n")[0].slice(0, 200) : "unknown"}`;
  }

  const env = {
    SESSION_SECRET: Boolean(process.env.SESSION_SECRET),
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    DATABASE_URL_UNPOOLED: Boolean(process.env.DATABASE_URL_UNPOOLED),
  };

  return NextResponse.json(
    {
      ok: env.SESSION_SECRET && database === "connected",
      deployment: {
        environment: process.env.VERCEL_ENV ?? "local",
        branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
        commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      },
      env,
      database,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

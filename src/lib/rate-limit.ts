import { eq, lt, sql } from "drizzle-orm";
import { db, loginAttempts } from "@/db";

// Fixed-window rate limiter backed by the LoginAttempt table, so limits are
// shared by every serverless instance.

export async function rateLimit(key: string, limit: number, windowMs: number) {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  // Dates inside raw sql fragments must be passed as strings (and cast) for the postgres driver.
  const nowSql = sql`${now.toISOString()}::timestamp(3)`;
  const resetAtSql = sql`${resetAt.toISOString()}::timestamp(3)`;

  // One atomic statement: start a new window if there is none or it expired, otherwise count up.
  const [attempt] = await db
    .insert(loginAttempts)
    .values({ key, count: 1, resetAt })
    .onConflictDoUpdate({
      target: loginAttempts.key,
      set: {
        count: sql`CASE WHEN ${loginAttempts.resetAt} <= ${nowSql} THEN 1 ELSE ${loginAttempts.count} + 1 END`,
        resetAt: sql`CASE WHEN ${loginAttempts.resetAt} <= ${nowSql} THEN ${resetAtSql} ELSE ${loginAttempts.resetAt} END`,
      },
    })
    .returning();

  // Opportunistically clear out stale rows.
  if (Math.random() < 0.05) {
    await db.delete(loginAttempts).where(lt(loginAttempts.resetAt, now)).catch(() => null);
  }

  return {
    allowed: attempt.count <= limit,
    retryAfterSec: Math.max(1, Math.ceil((attempt.resetAt.getTime() - now.getTime()) / 1000)),
  };
}

export async function resetRateLimit(key: string) {
  await db.delete(loginAttempts).where(eq(loginAttempts.key, key)).catch(() => null);
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}

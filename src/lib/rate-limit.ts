import { prisma } from "@/lib/prisma";

// Fixed-window rate limiter backed by the LoginAttempt table, so limits are
// shared by every serverless instance.

export async function rateLimit(key: string, limit: number, windowMs: number) {
  const now = new Date();
  const existing = await prisma.loginAttempt.findUnique({ where: { key } });

  const attempt =
    !existing || existing.resetAt <= now
      ? await prisma.loginAttempt.upsert({
          where: { key },
          create: { key, count: 1, resetAt: new Date(now.getTime() + windowMs) },
          update: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
        })
      : await prisma.loginAttempt.update({ where: { key }, data: { count: { increment: 1 } } });

  // Opportunistically clear out stale rows.
  if (Math.random() < 0.05) {
    await prisma.loginAttempt.deleteMany({ where: { resetAt: { lt: now } } }).catch(() => null);
  }

  return {
    allowed: attempt.count <= limit,
    retryAfterSec: Math.max(1, Math.ceil((attempt.resetAt.getTime() - now.getTime()) / 1000)),
  };
}

export async function resetRateLimit(key: string) {
  await prisma.loginAttempt.delete({ where: { key } }).catch(() => null);
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}

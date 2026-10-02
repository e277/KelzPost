import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, adminUsers } from "@/db";
import { createSessionToken, hasSessionSecret, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

// Compared against when the username doesn't exist, so response time doesn't
// reveal which usernames are valid.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function POST(req: NextRequest) {
  if (!hasSessionSecret()) {
    return NextResponse.json(
      { error: "The server is missing its SESSION_SECRET setting. Add it in Vercel (Settings → Environment Variables) and redeploy." },
      { status: 500 }
    );
  }

  const key = `login:${clientIp(req.headers)}`;
  const limit = await rateLimit(key, MAX_ATTEMPTS, WINDOW_MS);
  if (!limit.allowed) {
    const minutes = Math.ceil(limit.retryAfterSec / 60);
    return NextResponse.json(
      { error: `Too many login attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const remember = body.remember !== false;

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  const user = await db.query.adminUsers.findFirst({ where: eq(adminUsers.username, username) });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  await resetRateLimit(key);
  const token = await createSessionToken(user.username);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Without "remember me" the cookie ends with the browser session (token still expires server-side).
    ...(remember ? { maxAge: SESSION_MAX_AGE } : {}),
  });
  return res;
}

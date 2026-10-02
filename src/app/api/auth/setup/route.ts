import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { count, sql } from "drizzle-orm";
import { db, adminUsers, categories, settings } from "@/db";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from "@/lib/defaults";

/**
 * First-run setup: creates the admin account. Only works while no admin
 * account exists, so it can't be used to take over an existing blog.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) {
    return NextResponse.json({ error: "Username must be 3–32 letters, numbers, dots, dashes or underscores." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await db.transaction(async (tx) => {
    // Serialize concurrent setup attempts so only one admin can ever be created here.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('admin-setup'))`);
    const [{ admins }] = await tx.select({ admins: count() }).from(adminUsers);
    if (admins > 0) return null;

    const [user] = await tx.insert(adminUsers).values({ username, passwordHash }).returning();
    await tx.insert(settings).values({ id: 1, ...DEFAULT_SETTINGS }).onConflictDoNothing();
    const [{ cats }] = await tx.select({ cats: count() }).from(categories);
    if (cats === 0 && DEFAULT_CATEGORIES.length > 0) {
      await tx.insert(categories).values(DEFAULT_CATEGORIES.map((name, order) => ({ name, order })));
    }
    return user;
  });

  if (!created) {
    return NextResponse.json({ error: "Setup has already been completed. Please sign in." }, { status: 409 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(created.username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

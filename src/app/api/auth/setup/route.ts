import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
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
  const created = await prisma.$transaction(async (tx) => {
    if ((await tx.adminUser.count()) > 0) return null;
    const user = await tx.adminUser.create({ data: { username, passwordHash } });
    await tx.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1, ...DEFAULT_SETTINGS } });
    if ((await tx.category.count()) === 0) {
      await tx.category.createMany({ data: DEFAULT_CATEGORIES.map((name, order) => ({ name, order })) });
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

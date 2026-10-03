import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { adminUsers, db } from "@/db";
import { requireUser, type Role } from "@/lib/current-user";
import { PROFILE_LIMITS, USERNAME_PATTERN, uniqueAuthorSlug } from "@/lib/team";

/** Adds a team member (admins only). They sign in with the username and password given here. */
export async function POST(req: NextRequest) {
  const { error } = await requireUser("admin");
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim().replace(/\s+/g, " ") : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role: Role = body.role === "admin" ? "admin" : "author";

  if (!displayName || displayName.length > PROFILE_LIMITS.displayName) {
    return NextResponse.json({ error: "Enter the name readers will see on their posts (up to 60 characters)." }, { status: 400 });
  }
  if (!USERNAME_PATTERN.test(username)) {
    return NextResponse.json({ error: "Username must be 3–32 letters, numbers, dots, dashes or underscores." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (await db.query.adminUsers.findFirst({ where: eq(adminUsers.username, username), columns: { id: true } })) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }

  const [created] = await db
    .insert(adminUsers)
    .values({
      username,
      displayName,
      role,
      passwordHash: await bcrypt.hash(password, 10),
      slug: await uniqueAuthorSlug(displayName),
    })
    .returning({ id: adminUsers.id, username: adminUsers.username, displayName: adminUsers.displayName, role: adminUsers.role });

  return NextResponse.json(created, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { adminUsers, db, posts } from "@/db";
import { requireUser } from "@/lib/current-user";
import { refreshPublicPages } from "@/lib/revalidate";
import { getSettings } from "@/lib/site";
import { memberName } from "@/lib/team";

type Params = { params: Promise<{ id: string }> };

const otherAdmins = (id: string) => db.$count(adminUsers, and(eq(adminUsers.role, "admin"), ne(adminUsers.id, id)));

/** Changes a team member's role or sets them a new password (admins only). */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { user, error } = await requireUser("admin");
  if (error) return error;

  const { id } = await params;
  const member = await db.query.adminUsers.findFirst({ where: eq(adminUsers.id, id) });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const changes: Partial<typeof adminUsers.$inferInsert> = {};

  if (body.role === "admin" || body.role === "author") {
    if (member.id === user.id && body.role !== member.role) {
      return NextResponse.json({ error: "You can't change your own role. Ask another admin." }, { status: 400 });
    }
    changes.role = body.role;
  }
  if (typeof body.password === "string") {
    if (body.password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    changes.passwordHash = await bcrypt.hash(body.password, 10);
  }
  if (Object.keys(changes).length === 0) return NextResponse.json({ error: "Nothing to change." }, { status: 400 });

  await db.update(adminUsers).set(changes).where(eq(adminUsers.id, id));
  return NextResponse.json({ ok: true });
}

/**
 * Removes a team member (admins only). Their posts stay up and keep showing
 * their name; the posts just aren't linked to an account any more.
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const { user, error } = await requireUser("admin");
  if (error) return error;

  const { id } = await params;
  if (id === user.id) return NextResponse.json({ error: "You can't remove your own account." }, { status: 400 });
  const member = await db.query.adminUsers.findFirst({ where: eq(adminUsers.id, id) });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (member.role === "admin" && (await otherAdmins(id)) === 0) {
    return NextResponse.json({ error: "The blog needs at least one admin." }, { status: 400 });
  }

  const settings = await getSettings();
  await db.transaction(async (tx) => {
    await tx
      .update(posts)
      .set({ author: memberName(member, settings.authorName) })
      .where(and(eq(posts.authorId, id), eq(posts.author, "")));
    await tx.delete(adminUsers).where(eq(adminUsers.id, id));
  });

  refreshPublicPages();
  return NextResponse.json({ ok: true });
}

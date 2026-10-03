import { cache } from "react";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, adminUsers, type AdminUser } from "@/db";
import { getSession } from "@/lib/auth";

export type Role = "admin" | "author";

export const ROLES: { value: Role; label: string; description: string }[] = [
  { value: "admin", label: "Admin", description: "Everything, including settings, pages, comments, the newsletter and the team." },
  { value: "author", label: "Author", description: "Writes, publishes and manages their own posts only." },
];

export const isAdmin = (user: Pick<AdminUser, "role">) => user.role === "admin";

/**
 * The signed-in team member, read fresh from the database on every request so
 * a removed account or a changed role takes effect straight away.
 */
export const getCurrentUser = cache(async (): Promise<AdminUser | null> => {
  const session = await getSession();
  if (!session) return null;
  return (await db.query.adminUsers.findFirst({ where: eq(adminUsers.username, session.username) })) ?? null;
});

/** For route handlers: the signed-in user, or the 401/403 response to send instead. */
export async function requireUser(
  role: Role = "author"
): Promise<{ user: AdminUser; error: null } | { user: null; error: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (role === "admin" && !isAdmin(user)) {
    return { user: null, error: NextResponse.json({ error: "Only admins can do that." }, { status: 403 }) };
  }
  return { user, error: null };
}

/** For admin pages: the signed-in user, sending anyone else to sign in (or authors back to the dashboard). */
export async function requirePageUser(role: Role = "author"): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (role === "admin" && !isAdmin(user)) redirect("/admin");
  return user;
}

/** Admins can change any post; authors only their own. */
export const canEditPost = (user: Pick<AdminUser, "id" | "role">, post: { authorId: string | null }) =>
  isAdmin(user) || post.authorId === user.id;

/** The name shown for a team member: their display name, else their username. */
export const userDisplayName = (user: Pick<AdminUser, "displayName" | "username">) => user.displayName.trim() || user.username;

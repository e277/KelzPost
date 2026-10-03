import { asc, eq } from "drizzle-orm";
import { adminUsers, db, type AdminUser } from "@/db";
import { slugify } from "@/lib/utils";

/**
 * The name a team member's posts show. Admins without a display name write as
 * the blog's author from Settings (so a one-person blog works as before).
 */
export const memberName = (user: Pick<AdminUser, "displayName" | "username" | "role">, siteAuthorName: string) =>
  user.displayName.trim() || (user.role === "admin" ? siteAuthorName : user.username);

/** Everyone who can be credited with a post, oldest account first. */
export async function teamMembers(siteAuthorName: string): Promise<{ id: string; name: string }[]> {
  const users = await db.query.adminUsers.findMany({
    columns: { id: true, username: true, displayName: true, role: true },
    orderBy: asc(adminUsers.createdAt),
  });
  return users.map((u) => ({ id: u.id, name: memberName(u, siteAuthorName) }));
}

/** A free /author/<slug> for this display name (null when there's no name). */
export async function uniqueAuthorSlug(displayName: string, userId?: string): Promise<string | null> {
  const base = slugify(displayName);
  if (!base) return null;
  let slug = base;
  for (let n = 2; ; n++) {
    const taken = await db.query.adminUsers.findFirst({ where: eq(adminUsers.slug, slug), columns: { id: true } });
    if (!taken || taken.id === userId) return slug;
    slug = `${base}-${n}`;
  }
}

export const PROFILE_LIMITS = { displayName: 60, bio: 600 };
export const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,32}$/;

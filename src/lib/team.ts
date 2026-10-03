import { asc } from "drizzle-orm";
import { adminUsers, db, type AdminUser } from "@/db";

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

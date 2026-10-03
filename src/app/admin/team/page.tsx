import { asc, count } from "drizzle-orm";
import { adminUsers, db, posts } from "@/db";
import { getSettings } from "@/lib/site";
import { requirePageUser } from "@/lib/current-user";
import { memberName } from "@/lib/team";
import { AdminShell } from "@/components/admin/admin-shell";
import { TeamManager, type TeamRow } from "@/components/admin/team-manager";

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  const user = await requirePageUser("admin");
  const [settings, users, postCounts] = await Promise.all([
    getSettings(),
    db.query.adminUsers.findMany({ orderBy: asc(adminUsers.createdAt) }),
    db.select({ authorId: posts.authorId, n: count() }).from(posts).groupBy(posts.authorId),
  ]);
  const countFor = new Map(postCounts.map((r) => [r.authorId, r.n]));

  const team: TeamRow[] = users.map((u) => ({
    id: u.id,
    username: u.username,
    name: memberName(u, settings.authorName),
    hasDisplayName: !!u.displayName.trim(),
    role: u.role === "admin" ? "admin" : "author",
    slug: u.slug,
    posts: countFor.get(u.id) ?? 0,
    joined: u.createdAt,
    isYou: u.id === user.id,
  }));

  return (
    <AdminShell blogTitle={settings.blogTitle} active="team" title="Team">
      <TeamManager team={team} />
    </AdminShell>
  );
}

import Link from "next/link";
import bcrypt from "bcryptjs";
import { db, categories } from "@/db";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/site";
import { getReadershipStats } from "@/lib/stats";
import { wordCount } from "@/lib/utils";
import { AdminShell } from "@/components/admin/admin-shell";
import { DashboardContent, type DashboardPost } from "@/components/admin/dashboard-content";
import { ReadershipPanel } from "@/components/admin/readership-panel";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [settings, session, allPosts, categoryCount, stats] = await Promise.all([
    getSettings(),
    getSession(),
    db.query.posts.findMany({ with: { category: true }, orderBy: (p, { desc }) => desc(p.updatedAt) }),
    db.$count(categories),
    getReadershipStats(),
  ]);

  const user = session ? await db.query.adminUsers.findFirst({ where: (u, { eq }) => eq(u.username, session.username) }) : null;
  const usingDefaultPassword = user ? await bcrypt.compare("admin123", user.passwordHash) : false;

  // Only what the dashboard shows, so post bodies aren't sent to the browser.
  const posts: DashboardPost[] = allPosts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    status: p.status,
    category: p.category ? { name: p.category.name } : null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    publishedAt: p.publishedAt,
    words: wordCount(p.content),
    views: stats.byPost[p.id]?.total ?? 0,
    recentViews: stats.byPost[p.id]?.recent ?? 0,
  }));

  const topPosts = posts
    .filter((p) => p.recentViews > 0)
    .sort((a, b) => b.recentViews - a.recentViews)
    .slice(0, 5)
    .map((p) => ({ id: p.id, title: p.title, slug: p.slug, views: p.recentViews }));

  return (
    <AdminShell
      blogTitle={settings.blogTitle}
      active="dashboard"
      title="Dashboard"
      actions={
        <Link href="/admin/posts/new" className="btn btn--primary btn--sm">
          + New Post
        </Link>
      }
    >
      {usingDefaultPassword && (
        <div className="admin-alert" role="alert">
          <strong>You&apos;re still using the default password.</strong> Anyone who knows it can sign in.{" "}
          <Link href="/admin/settings#security">Change it now →</Link>
        </div>
      )}
      <DashboardContent
        posts={posts}
        categoryCount={categoryCount}
        username={session?.username || "admin"}
        readership={
          <ReadershipPanel days={stats.days} last30={stats.last30} previous30={stats.previous30} allTime={stats.allTime} topPosts={topPosts} />
        }
      />
    </AdminShell>
  );
}

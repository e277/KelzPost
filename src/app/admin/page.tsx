import Link from "next/link";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/site";
import { AdminShell } from "@/components/admin/admin-shell";
import { DashboardContent } from "@/components/admin/dashboard-content";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [settings, session, posts, categories] = await Promise.all([
    getSettings(),
    getSession(),
    prisma.post.findMany({ include: { category: true }, orderBy: { updatedAt: "desc" } }),
    prisma.category.count(),
  ]);

  const user = session ? await prisma.adminUser.findUnique({ where: { username: session.username } }) : null;
  const usingDefaultPassword = user ? await bcrypt.compare("admin123", user.passwordHash) : false;

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
      <DashboardContent posts={posts} categoryCount={categories} username={session?.username || "admin"} />
    </AdminShell>
  );
}

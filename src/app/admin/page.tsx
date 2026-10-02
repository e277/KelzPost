import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { DashboardContent } from "@/components/admin/dashboard-content";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const settings = await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  const posts = await prisma.post.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

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
      <DashboardContent posts={posts} />
    </AdminShell>
  );
}

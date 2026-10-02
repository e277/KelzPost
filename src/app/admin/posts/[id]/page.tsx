import { notFound } from "next/navigation";
import { db } from "@/db";
import { getSettings } from "@/lib/site";
import { AdminShell } from "@/components/admin/admin-shell";
import { PostEditor } from "@/components/admin/post-editor";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [settings, categories, post] = await Promise.all([
    getSettings(),
    db.query.categories.findMany({ orderBy: (c, { asc }) => asc(c.order) }),
    db.query.posts.findFirst({ where: (p, { eq }) => eq(p.id, id), with: { category: true } }),
  ]);

  if (!post) notFound();

  return (
    <AdminShell blogTitle={settings.blogTitle} active="dashboard" title="Edit Post">
      <PostEditor categories={categories} defaultAuthor={settings.authorName} post={post} />
    </AdminShell>
  );
}

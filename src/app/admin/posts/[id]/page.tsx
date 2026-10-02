import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/site";
import { AdminShell } from "@/components/admin/admin-shell";
import { PostEditor } from "@/components/admin/post-editor";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [settings, categories, post] = await Promise.all([
    getSettings(),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.post.findUnique({ where: { id }, include: { category: true } }),
  ]);

  if (!post) notFound();

  return (
    <AdminShell blogTitle={settings.blogTitle} active="dashboard" title="Edit Post">
      <PostEditor categories={categories} defaultAuthor={settings.authorName} post={post} />
    </AdminShell>
  );
}

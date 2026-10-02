import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { PostEditor } from "@/components/admin/post-editor";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [settings, categories, post] = await Promise.all([
    prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.post.findUnique({ where: { id }, include: { category: true } }),
  ]);

  if (!post) notFound();

  return (
    <AdminShell blogTitle={settings.blogTitle} active="editor" title="Edit Post">
      <PostEditor categories={categories} defaultAuthor={settings.authorName} post={post} />
    </AdminShell>
  );
}

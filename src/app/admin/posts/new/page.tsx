import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { PostEditor } from "@/components/admin/post-editor";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const [settings, categories] = await Promise.all([
    prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <AdminShell blogTitle={settings.blogTitle} active="editor" title="New Post">
      <PostEditor categories={categories} defaultAuthor={settings.authorName} post={null} />
    </AdminShell>
  );
}

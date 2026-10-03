import { notFound } from "next/navigation";
import { db } from "@/db";
import { getSettings } from "@/lib/site";
import { getPostTags } from "@/lib/posts";
import { AdminShell } from "@/components/admin/admin-shell";
import { PostEditor } from "@/components/admin/post-editor";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [settings, categories, post, postTags, allTags] = await Promise.all([
    getSettings(),
    db.query.categories.findMany({ orderBy: (c, { asc }) => asc(c.order) }),
    db.query.posts.findFirst({ where: (p, { eq }) => eq(p.id, id), with: { category: true } }),
    getPostTags(id),
    db.query.tags.findMany({ orderBy: (t, { asc }) => asc(t.name) }),
  ]);

  if (!post) notFound();

  return (
    <AdminShell blogTitle={settings.blogTitle} active="dashboard" title="Edit Post">
      <PostEditor categories={categories} defaultAuthor={settings.authorName} post={post} tags={postTags.map((t) => t.name)} allTags={allTags.map((t) => t.name)} />
    </AdminShell>
  );
}

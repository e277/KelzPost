import { db } from "@/db";
import { getSettings } from "@/lib/site";
import { AdminShell } from "@/components/admin/admin-shell";
import { PostEditor } from "@/components/admin/post-editor";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const [settings, categories, allTags] = await Promise.all([
    getSettings(),
    db.query.categories.findMany({ orderBy: (c, { asc }) => asc(c.order) }),
    db.query.tags.findMany({ orderBy: (t, { asc }) => asc(t.name) }),
  ]);

  return (
    <AdminShell blogTitle={settings.blogTitle} active="editor" title="New Post">
      <PostEditor categories={categories} defaultAuthor={settings.authorName} post={null} allTags={allTags.map((t) => t.name)} />
    </AdminShell>
  );
}

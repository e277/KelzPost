import { notFound } from "next/navigation";
import { db } from "@/db";
import { getSettings } from "@/lib/site";
import { getPostTags } from "@/lib/posts";
import { canEditPost, isAdmin, requirePageUser } from "@/lib/current-user";
import { memberName, teamMembers } from "@/lib/team";
import { AdminShell } from "@/components/admin/admin-shell";
import { PostEditor } from "@/components/admin/post-editor";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser();

  const [settings, categories, post, postTags, allTags] = await Promise.all([
    getSettings(),
    db.query.categories.findMany({ orderBy: (c, { asc }) => asc(c.order) }),
    db.query.posts.findFirst({ where: (p, { eq }) => eq(p.id, id), with: { category: true } }),
    getPostTags(id),
    db.query.tags.findMany({ orderBy: (t, { asc }) => asc(t.name) }),
  ]);

  if (!post || !canEditPost(user, post)) notFound();
  const team = isAdmin(user) ? await teamMembers(settings.authorName) : [{ id: user.id, name: memberName(user, settings.authorName) }];

  return (
    <AdminShell blogTitle={settings.blogTitle} active="dashboard" title="Edit Post">
      <PostEditor
        categories={categories}
        post={post}
        tags={postTags.map((t) => t.name)}
        allTags={allTags.map((t) => t.name)}
        team={team}
        canChooseAuthor={isAdmin(user)}
        currentUserId={user.id}
        siteAuthorName={settings.authorName}
      />
    </AdminShell>
  );
}

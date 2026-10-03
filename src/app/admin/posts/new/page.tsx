import { db } from "@/db";
import { getSettings } from "@/lib/site";
import { isAdmin, requirePageUser } from "@/lib/current-user";
import { memberName, teamMembers } from "@/lib/team";
import { AdminShell } from "@/components/admin/admin-shell";
import { PostEditor } from "@/components/admin/post-editor";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const user = await requirePageUser();
  const [settings, categories, allTags] = await Promise.all([
    getSettings(),
    db.query.categories.findMany({ orderBy: (c, { asc }) => asc(c.order) }),
    db.query.tags.findMany({ orderBy: (t, { asc }) => asc(t.name) }),
  ]);
  const team = isAdmin(user) ? await teamMembers(settings.authorName) : [{ id: user.id, name: memberName(user, settings.authorName) }];

  return (
    <AdminShell blogTitle={settings.blogTitle} active="editor" title="New Post">
      <PostEditor
        categories={categories}
        post={null}
        allTags={allTags.map((t) => t.name)}
        team={team}
        canChooseAuthor={isAdmin(user)}
        currentUserId={user.id}
        siteAuthorName={settings.authorName}
      />
    </AdminShell>
  );
}

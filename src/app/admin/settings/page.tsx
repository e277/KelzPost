import { asc, count, eq } from "drizzle-orm";
import { db, postTags, tags } from "@/db";
import { getSettings } from "@/lib/site";
import { AdminShell } from "@/components/admin/admin-shell";
import { SettingsForm } from "@/components/admin/settings-form";
import { requirePageUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requirePageUser("admin");
  const [settings, categories, tagRows] = await Promise.all([
    getSettings(),
    db.query.categories.findMany({ orderBy: (c, { asc }) => asc(c.order) }),
    db
      .select({ id: tags.id, name: tags.name, posts: count(postTags.postId) })
      .from(tags)
      .leftJoin(postTags, eq(postTags.tagId, tags.id))
      .groupBy(tags.id)
      .orderBy(asc(tags.name)),
  ]);

  return (
    <AdminShell blogTitle={settings.blogTitle} active="settings" title="Settings">
      <SettingsForm settings={settings} categories={categories} tags={tagRows} />
    </AdminShell>
  );
}

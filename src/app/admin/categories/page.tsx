import { asc, count, eq } from "drizzle-orm";
import { db, postTags, tags } from "@/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import { requirePageUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requirePageUser("admin");
  const [categories, tagRows] = await Promise.all([
    db.query.categories.findMany({ orderBy: (c, { asc }) => asc(c.order) }),
    db
      .select({ id: tags.id, name: tags.name, posts: count(postTags.postId) })
      .from(tags)
      .leftJoin(postTags, eq(postTags.tagId, tags.id))
      .groupBy(tags.id)
      .orderBy(asc(tags.name)),
  ]);

  return (
    <AdminShell active="categories" title="Categories & Tags">
      <TaxonomyManager categories={categories} tags={tagRows} />
    </AdminShell>
  );
}

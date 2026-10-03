import { asc, count, eq } from "drizzle-orm";
import { categories, db, postCategories, postTags, tags } from "@/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import { requirePageUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requirePageUser("admin");
  const [categoryRows, tagRows] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name, posts: count(postCategories.postId) })
      .from(categories)
      .leftJoin(postCategories, eq(postCategories.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(asc(categories.order)),
    db
      .select({ id: tags.id, name: tags.name, posts: count(postTags.postId) })
      .from(tags)
      .leftJoin(postTags, eq(postTags.tagId, tags.id))
      .groupBy(tags.id)
      .orderBy(asc(tags.name)),
  ]);

  return (
    <AdminShell active="categories" title="Categories & Tags">
      <TaxonomyManager categories={categoryRows} tags={tagRows} />
    </AdminShell>
  );
}

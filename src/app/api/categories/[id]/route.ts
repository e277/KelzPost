import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db, categories, postCategories, posts } from "@/db";
import { requireUser } from "@/lib/current-user";
import { refreshPublicPages } from "@/lib/revalidate";
import { slugify } from "@/lib/utils";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser("admin");
  if (error) return error;

  const { id } = await params;
  const { name, order } = await req.json();

  const data: { name?: string; order?: number } = {};
  if (typeof name === "string" && name.trim()) {
    data.name = name.trim().replace(/\s+/g, " ");
    // Category addresses come from the name, so two can't share one.
    const all = await db.select({ id: categories.id, name: categories.name }).from(categories);
    if (all.some((c) => c.id !== id && slugify(c.name) === slugify(data.name!))) {
      return NextResponse.json({ error: "Another category already has that name." }, { status: 409 });
    }
  }
  if (typeof order === "number") data.order = order;

  const [category] = Object.keys(data).length
    ? await db.update(categories).set(data).where(eq(categories.id, id)).returning()
    : await db.select().from(categories).where(eq(categories.id, id));
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
  refreshPublicPages();
  return NextResponse.json(category);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser("admin");
  if (error) return error;

  const { id } = await params;
  // The foreign keys take the category off its posts (ON DELETE SET NULL / CASCADE).
  // A post whose main category this was falls back to one of its other categories.
  const affected = await db.select({ id: posts.id }).from(posts).where(eq(posts.categoryId, id));
  await db.delete(categories).where(eq(categories.id, id));
  for (const { id: postId } of affected) {
    await db
      .update(posts)
      .set({ categoryId: sql`(select ${postCategories.categoryId} from ${postCategories} where ${postCategories.postId} = ${postId} limit 1)` })
      .where(and(eq(posts.id, postId), isNull(posts.categoryId)));
  }
  refreshPublicPages();

  return NextResponse.json({ ok: true });
}

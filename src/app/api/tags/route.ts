import { NextRequest, NextResponse } from "next/server";
import { asc, count, eq } from "drizzle-orm";
import { db, postTags, tags } from "@/db";
import { requireUser } from "@/lib/current-user";
import { slugify } from "@/lib/utils";

/** All tags with how many posts use each. */
export async function GET() {
  const rows = await db
    .select({ id: tags.id, name: tags.name, slug: tags.slug, posts: count(postTags.postId) })
    .from(tags)
    .leftJoin(postTags, eq(postTags.tagId, tags.id))
    .groupBy(tags.id)
    .orderBy(asc(tags.name));
  return NextResponse.json(rows);
}

/** Adds a tag. (The post editor creates tags as part of saving a post.) */
export async function POST(req: NextRequest) {
  const { error } = await requireUser("admin");
  if (error) return error;

  const { name } = await req.json().catch(() => ({}));
  const trimmed = (typeof name === "string" ? name : "").trim().replace(/\s+/g, " ").slice(0, 40);
  const slug = slugify(trimmed);
  if (!slug) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (await db.query.tags.findFirst({ where: eq(tags.slug, slug) })) {
    return NextResponse.json({ error: "That tag already exists." }, { status: 409 });
  }

  const [tag] = await db.insert(tags).values({ name: trimmed, slug }).returning();
  return NextResponse.json({ ...tag, posts: 0 }, { status: 201 });
}

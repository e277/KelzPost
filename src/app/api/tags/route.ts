import { NextResponse } from "next/server";
import { asc, count, eq } from "drizzle-orm";
import { db, postTags, tags } from "@/db";

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

import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, postRevisions, posts } from "@/db";
import { canEditPost, requireUser } from "@/lib/current-user";
import { wordCount } from "@/lib/utils";

/** A post's saved versions, newest first (without their bodies). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const post = await db.query.posts.findFirst({ where: eq(posts.id, id), columns: { authorId: true } });
  if (!post || !canEditPost(user, post)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await db.query.postRevisions.findMany({
    where: eq(postRevisions.postId, id),
    orderBy: desc(postRevisions.createdAt),
  });
  return NextResponse.json(
    rows.map((r) => ({ id: r.id, title: r.title, savedBy: r.savedBy, createdAt: r.createdAt, words: wordCount(r.content) }))
  );
}

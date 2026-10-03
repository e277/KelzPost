import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, postRevisions, posts } from "@/db";
import { canEditPost, requireUser } from "@/lib/current-user";

/** One saved version in full, for restoring into the editor. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; revisionId: string }> }) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { id, revisionId } = await params;
  const post = await db.query.posts.findFirst({ where: eq(posts.id, id), columns: { authorId: true } });
  if (!post || !canEditPost(user, post)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const revision = await db.query.postRevisions.findFirst({
    where: and(eq(postRevisions.id, revisionId), eq(postRevisions.postId, id)),
  });
  if (!revision) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(revision);
}

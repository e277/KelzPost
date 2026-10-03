import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { comments, db } from "@/db";
import { requireUser } from "@/lib/current-user";
import { refreshPublicPages } from "@/lib/revalidate";
import { COMMENT_LIMITS, isCommentStatus } from "@/lib/comments";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser("admin");
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  // Moderation changes the status; editing fixes the text (e.g. a typo or a link to remove).
  const changes: { status?: string; content?: string } = {};
  if (body.status !== undefined) {
    if (!isCommentStatus(body.status)) return NextResponse.json({ error: "Unknown status." }, { status: 400 });
    changes.status = body.status;
  }
  if (body.content !== undefined) {
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) return NextResponse.json({ error: "A comment can't be empty." }, { status: 400 });
    if (content.length > COMMENT_LIMITS.content) {
      return NextResponse.json({ error: `Comments can be up to ${COMMENT_LIMITS.content} characters.` }, { status: 400 });
    }
    changes.content = content;
  }
  if (!changes.status && !changes.content) return NextResponse.json({ error: "Nothing to change." }, { status: 400 });

  const [updated] = await db.update(comments).set(changes).where(eq(comments.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  refreshPublicPages();
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser("admin");
  if (error) return error;

  const { id } = await params;
  // Replies to the comment go with it (ON DELETE CASCADE on parentId).
  await db.delete(comments).where(eq(comments.id, id));
  refreshPublicPages();
  return NextResponse.json({ ok: true });
}

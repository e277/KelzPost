import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { comments, db } from "@/db";
import { requireUser } from "@/lib/current-user";
import { refreshPublicPages } from "@/lib/revalidate";
import { isCommentStatus } from "@/lib/comments";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser("admin");
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!isCommentStatus(body.status)) return NextResponse.json({ error: "Unknown status." }, { status: 400 });

  const [updated] = await db.update(comments).set({ status: body.status }).where(eq(comments.id, id)).returning();
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

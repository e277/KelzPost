import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { comments, db } from "@/db";
import { getSession } from "@/lib/auth";
import { isCommentStatus } from "@/lib/comments";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!isCommentStatus(body.status)) return NextResponse.json({ error: "Unknown status." }, { status: 400 });

  const [updated] = await db.update(comments).set({ status: body.status }).where(eq(comments.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  // Replies to the comment go with it (ON DELETE CASCADE on parentId).
  await db.delete(comments).where(eq(comments.id, id));
  return NextResponse.json({ ok: true });
}

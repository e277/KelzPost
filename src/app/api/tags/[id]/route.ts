import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, tags } from "@/db";
import { getSession } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  // Removes the tag from every post too (ON DELETE CASCADE on PostTag).
  await db.delete(tags).where(eq(tags.id, id));

  return NextResponse.json({ ok: true });
}

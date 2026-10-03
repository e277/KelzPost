import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, tags } from "@/db";
import { requireUser } from "@/lib/current-user";
import { refreshPublicPages } from "@/lib/revalidate";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser("admin");
  if (error) return error;

  const { id } = await params;
  // Removes the tag from every post too (ON DELETE CASCADE on PostTag).
  await db.delete(tags).where(eq(tags.id, id));
  refreshPublicPages();

  return NextResponse.json({ ok: true });
}

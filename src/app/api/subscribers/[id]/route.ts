import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, subscribers } from "@/db";
import { getSession } from "@/lib/auth";

/** Permanently removes a subscriber from the list. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(subscribers).where(eq(subscribers.id, id));
  return NextResponse.json({ ok: true });
}

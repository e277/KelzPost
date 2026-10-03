import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, subscribers } from "@/db";
import { requireUser } from "@/lib/current-user";

/** Permanently removes a subscriber from the list. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser("admin");
  if (error) return error;

  const { id } = await params;
  await db.delete(subscribers).where(eq(subscribers.id, id));
  return NextResponse.json({ ok: true });
}

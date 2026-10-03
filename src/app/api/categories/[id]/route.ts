import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, categories } from "@/db";
import { requireUser } from "@/lib/current-user";
import { refreshPublicPages } from "@/lib/revalidate";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser("admin");
  if (error) return error;

  const { id } = await params;
  const { name, order } = await req.json();

  const data: { name?: string; order?: number } = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (typeof order === "number") data.order = order;

  const [category] = Object.keys(data).length
    ? await db.update(categories).set(data).where(eq(categories.id, id)).returning()
    : await db.select().from(categories).where(eq(categories.id, id));
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
  refreshPublicPages();
  return NextResponse.json(category);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser("admin");
  if (error) return error;

  const { id } = await params;
  // Posts in this category are detached by the foreign key (ON DELETE SET NULL).
  await db.delete(categories).where(eq(categories.id, id));
  refreshPublicPages();

  return NextResponse.json({ ok: true });
}

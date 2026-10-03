import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, tags } from "@/db";
import { requireUser } from "@/lib/current-user";
import { refreshPublicPages } from "@/lib/revalidate";
import { slugify } from "@/lib/utils";

/** Renames a tag; its page moves to the new name's address. */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser("admin");
  if (error) return error;

  const { id } = await params;
  const { name } = await req.json().catch(() => ({}));
  const trimmed = (typeof name === "string" ? name : "").trim().replace(/\s+/g, " ").slice(0, 40);
  const slug = slugify(trimmed);
  if (!slug) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const clash = await db.query.tags.findFirst({ where: eq(tags.slug, slug) });
  if (clash && clash.id !== id) return NextResponse.json({ error: "Another tag already has that name." }, { status: 409 });

  const [tag] = await db.update(tags).set({ name: trimmed, slug }).where(eq(tags.id, id)).returning();
  if (!tag) return NextResponse.json({ error: "Not found" }, { status: 404 });
  refreshPublicPages();
  return NextResponse.json(tag);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser("admin");
  if (error) return error;

  const { id } = await params;
  // Removes the tag from every post too (ON DELETE CASCADE on PostTag).
  await db.delete(tags).where(eq(tags.id, id));
  refreshPublicPages();

  return NextResponse.json({ ok: true });
}

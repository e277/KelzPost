import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, pages } from "@/db";
import { requireUser } from "@/lib/current-user";
import { removePageNavLink, syncPageNavLink } from "@/lib/navigation";
import { refreshPublicPages } from "@/lib/revalidate";
import { isBuiltInPage, readPageText } from "@/lib/site-pages";
import { RESERVED_PAGE_SLUGS, slugify } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await db.query.pages.findFirst({ where: eq(pages.id, id) });
  if (!page) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(page);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser("admin");
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { title, content, slug: rawSlug, showInNav } = body;
  if (!title?.trim()) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const before = await db.query.pages.findFirst({ where: eq(pages.id, id), columns: { slug: true, kind: true } });
  if (!before) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Home and About keep their addresses; custom pages can move.
  let slug = before.slug;
  if (!isBuiltInPage(before)) {
    slug = rawSlug?.trim() ? slugify(rawSlug.trim()) : slugify(title.trim());
    if (!slug || RESERVED_PAGE_SLUGS.has(slug)) {
      return NextResponse.json({ error: `/${slug} is already used by the blog. Pick another address.` }, { status: 409 });
    }
    const existing = await db.query.pages.findFirst({ where: eq(pages.slug, slug) });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "That slug is already in use." }, { status: 409 });
    }
  }

  const [page] = await db
    .update(pages)
    .set({ title: title.trim(), slug, content: content || "", ...readPageText(body) })
    .where(eq(pages.id, id))
    .returning();
  // The header link follows the page's title and address.
  const inNav = await syncPageNavLink(page, typeof showInNav === "boolean" ? showInNav : undefined, before.slug);
  refreshPublicPages();
  return NextResponse.json({ ...page, inNav });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser("admin");
  if (error) return error;

  const { id } = await params;
  const page = await db.query.pages.findFirst({ where: eq(pages.id, id), columns: { kind: true } });
  if (page && isBuiltInPage(page)) {
    return NextResponse.json({ error: "Home and About are built in and can't be deleted." }, { status: 400 });
  }
  const [deleted] = await db.delete(pages).where(eq(pages.id, id)).returning({ id: pages.id, slug: pages.slug });
  if (deleted) await removePageNavLink(deleted);
  refreshPublicPages();
  return NextResponse.json({ ok: true });
}

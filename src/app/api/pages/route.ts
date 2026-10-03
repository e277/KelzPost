import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db, pages } from "@/db";
import { requireUser } from "@/lib/current-user";
import { syncPageNavLink } from "@/lib/navigation";
import { refreshPublicPages } from "@/lib/revalidate";
import { RESERVED_PAGE_SLUGS, slugify } from "@/lib/utils";
import { readPageText } from "@/lib/site-pages";

export async function GET() {
  const rows = await db.select().from(pages).orderBy(asc(pages.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { error } = await requireUser("admin");
  if (error) return error;

  const body = await req.json();
  const { title, content, showInNav } = body;
  if (!title?.trim()) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const baseSlug = slugify(title.trim()) || "page";
  let slug = baseSlug;
  let attempt = 1;
  while (RESERVED_PAGE_SLUGS.has(slug) || (await db.query.pages.findFirst({ where: eq(pages.slug, slug) }))) {
    slug = `${baseSlug}-${attempt++}`;
  }

  const [page] = await db
    .insert(pages)
    .values({ kind: "custom", title: title.trim(), slug, content: content || "", ...readPageText(body) })
    .returning();
  // New pages go in the header menu unless the editor unticked "Show in navigation".
  const inNav = await syncPageNavLink(page, showInNav !== false);
  refreshPublicPages();
  return NextResponse.json({ ...page, inNav }, { status: 201 });
}

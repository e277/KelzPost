import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db, pages } from "@/db";
import { requireUser } from "@/lib/current-user";
import { refreshPublicPages } from "@/lib/revalidate";
import { slugify } from "@/lib/utils";

export async function GET() {
  const rows = await db.select().from(pages).orderBy(asc(pages.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { error } = await requireUser("admin");
  if (error) return error;

  const { title, content } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const baseSlug = slugify(title.trim());
  let slug = baseSlug;
  let attempt = 1;
  while (await db.query.pages.findFirst({ where: eq(pages.slug, slug) })) {
    slug = `${baseSlug}-${attempt++}`;
  }

  const [page] = await db.insert(pages).values({ title: title.trim(), slug, content: content || "" }).returning();
  refreshPublicPages();
  return NextResponse.json(page, { status: 201 });
}

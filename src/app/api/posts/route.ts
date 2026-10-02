import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, posts } from "@/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const requested = req.nextUrl.searchParams.get("status");
  const session = await getSession();

  // Signed-out visitors only ever see published posts.
  const status = !session ? "published" : requested === "published" || requested === "draft" ? requested : null;

  const rows = await db.query.posts.findMany({
    where: status ? eq(posts.status, status) : undefined,
    with: { category: true },
    orderBy: (p, { desc }) => desc(p.createdAt),
  });

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const title = (body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const status = body.status === "published" ? "published" : "draft";
  const baseSlug = slugify(typeof body.slug === "string" && body.slug.trim() ? body.slug : title) || "post";
  let slug = baseSlug;
  let n = 1;
  while (await db.query.posts.findFirst({ where: eq(posts.slug, slug), columns: { id: true } })) {
    slug = `${baseSlug}-${++n}`;
  }

  const [created] = await db
    .insert(posts)
    .values({
      title,
      slug,
      excerpt: body.excerpt || "",
      content: body.content || "",
      coverImage: body.coverImage || "",
      status,
      author: body.author || "",
      categoryId: body.categoryId || null,
      publishedAt: status === "published" ? new Date() : null,
    })
    .returning();

  const post = await db.query.posts.findFirst({ where: eq(posts.id, created.id), with: { category: true } });
  return NextResponse.json(post, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, posts } from "@/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { isLive, parsePublishDate, parseTagNames, setPostTags } from "@/lib/posts";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  const post = await db.query.posts.findFirst({ where: eq(posts.id, id), with: { category: true } });

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isLive(post) && !session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.query.posts.findFirst({ where: eq(posts.id, id) });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const title = (body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const status = body.status === "published" ? "published" : "draft";
  const publishDate = parsePublishDate(body.publishedAt);

  let slug = existing.slug;
  if (typeof body.slug === "string" && body.slug.trim()) {
    slug = slugify(body.slug);
    if (!slug) return NextResponse.json({ error: "Slug must contain letters or numbers." }, { status: 400 });
    const clash = await db.query.posts.findFirst({ where: eq(posts.slug, slug), columns: { id: true } });
    if (clash && clash.id !== id) {
      return NextResponse.json({ error: `Another post already uses the URL "/post/${slug}".` }, { status: 409 });
    }
  }

  await db
    .update(posts)
    .set({
      title,
      slug,
      excerpt: body.excerpt || "",
      content: body.content || "",
      coverImage: body.coverImage || "",
      status,
      author: body.author || "",
      categoryId: body.categoryId || null,
      ...(typeof body.seoTitle === "string" && { seoTitle: body.seoTitle.trim() }),
      ...(typeof body.seoDescription === "string" && { seoDescription: body.seoDescription.trim() }),
      ...(typeof body.ogImage === "string" && { ogImage: body.ogImage.trim() }),
      publishedAt: publishDate ?? (status === "published" ? existing.publishedAt || new Date() : existing.publishedAt),
    })
    .where(eq(posts.id, id));

  const tagNames = parseTagNames(body.tags);
  if (tagNames) await setPostTags(id, tagNames);

  const post = await db.query.posts.findFirst({ where: eq(posts.id, id), with: { category: true } });
  return NextResponse.json(post);
}

/** Quick status change from the dashboard: { status: "published" | "draft" }. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.query.posts.findFirst({ where: eq(posts.id, id) });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  if (body.status !== "published" && body.status !== "draft") {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const [post] = await db
    .update(posts)
    .set({
      status: body.status,
      publishedAt: body.status === "published" ? (existing.publishedAt || new Date()) : existing.publishedAt,
    })
    .where(eq(posts.id, id))
    .returning();
  return NextResponse.json(post);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(posts).where(eq(posts.id, id));

  return NextResponse.json({ ok: true });
}

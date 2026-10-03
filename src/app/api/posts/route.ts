import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, posts } from "@/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { sanitizePostHtml } from "@/lib/sanitize";
import { livePosts, parsePublishDate, parseTagNames, setPostTags } from "@/lib/posts";

export async function GET(req: NextRequest) {
  const requested = req.nextUrl.searchParams.get("status");
  const session = await getSession();

  // Signed-out visitors only ever see posts that are live (published, not scheduled).
  const status = requested === "published" || requested === "draft" ? requested : null;
  const where = !session ? livePosts() : status ? eq(posts.status, status) : undefined;

  const rows = await db.query.posts.findMany({
    where,
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
  const publishDate = parsePublishDate(body.publishedAt);
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
      content: sanitizePostHtml(typeof body.content === "string" ? body.content : ""),
      coverImage: body.coverImage || "",
      status,
      author: body.author || "",
      categoryId: body.categoryId || null,
      seoTitle: typeof body.seoTitle === "string" ? body.seoTitle.trim() : "",
      seoDescription: typeof body.seoDescription === "string" ? body.seoDescription.trim() : "",
      ogImage: typeof body.ogImage === "string" ? body.ogImage.trim() : "",
      publishedAt: publishDate ?? (status === "published" ? new Date() : null),
    })
    .returning();

  const tagNames = parseTagNames(body.tags);
  if (tagNames) await setPostTags(created.id, tagNames);

  const post = await db.query.posts.findFirst({ where: eq(posts.id, created.id), with: { category: true } });
  return NextResponse.json(post, { status: 201 });
}

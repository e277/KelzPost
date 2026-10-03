import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { adminUsers, db, posts } from "@/db";
import { getCurrentUser, isAdmin, requireUser, userDisplayName } from "@/lib/current-user";
import { slugify } from "@/lib/utils";
import { sanitizePostHtml } from "@/lib/sanitize";
import { recordRevision } from "@/lib/revisions";
import { refreshPublicPages } from "@/lib/revalidate";
import { livePosts, parsePublishDate, parseTagNames, setPostTags } from "@/lib/posts";

export async function GET(req: NextRequest) {
  const requested = req.nextUrl.searchParams.get("status");
  const user = await getCurrentUser();

  // Visitors only ever see posts that are live (published, not scheduled); authors see their own.
  const status = requested === "published" || requested === "draft" ? requested : null;
  const where = !user
    ? livePosts()
    : and(status ? eq(posts.status, status) : undefined, isAdmin(user) ? undefined : eq(posts.authorId, user.id));

  const rows = await db.query.posts.findMany({
    where,
    with: { category: true },
    orderBy: (p, { desc }) => desc(p.createdAt),
  });

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const title = (typeof body.title === "string" ? body.title : "").trim();
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const status = body.status === "published" ? "published" : "draft";
  const publishDate = parsePublishDate(body.publishedAt);
  const baseSlug = slugify(typeof body.slug === "string" && body.slug.trim() ? body.slug : title) || "post";
  let slug = baseSlug;
  let n = 1;
  while (await db.query.posts.findFirst({ where: eq(posts.slug, slug), columns: { id: true } })) {
    slug = `${baseSlug}-${++n}`;
  }

  const content = sanitizePostHtml(typeof body.content === "string" ? body.content : "");
  const excerpt = typeof body.excerpt === "string" ? body.excerpt : "";

  // New posts are credited to whoever writes them; admins may credit someone else (or no one).
  let authorId: string | null = user.id;
  if (isAdmin(user) && typeof body.authorId === "string" && body.authorId !== user.id) {
    authorId = body.authorId
      ? ((await db.query.adminUsers.findFirst({ where: eq(adminUsers.id, body.authorId), columns: { id: true } }))?.id ?? user.id)
      : null;
  }

  const [created] = await db
    .insert(posts)
    .values({
      title,
      slug,
      excerpt,
      content,
      coverImage: body.coverImage || "",
      status,
      author: typeof body.author === "string" ? body.author.trim() : "",
      authorId,
      categoryId: body.categoryId || null,
      seoTitle: typeof body.seoTitle === "string" ? body.seoTitle.trim() : "",
      seoDescription: typeof body.seoDescription === "string" ? body.seoDescription.trim() : "",
      ogImage: typeof body.ogImage === "string" ? body.ogImage.trim() : "",
      publishedAt: publishDate ?? (status === "published" ? new Date() : null),
    })
    .returning();

  const tagNames = parseTagNames(body.tags);
  if (tagNames) await setPostTags(created.id, tagNames);

  await recordRevision(created.id, { title, excerpt, content }, { savedBy: userDisplayName(user) });
  if (status === "published") refreshPublicPages();

  const post = await db.query.posts.findFirst({ where: eq(posts.id, created.id), with: { category: true } });
  return NextResponse.json(post, { status: 201 });
}

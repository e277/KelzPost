import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { adminUsers, db, posts } from "@/db";
import { canEditPost, getCurrentUser, isAdmin, requireUser, userDisplayName } from "@/lib/current-user";
import { slugify } from "@/lib/utils";
import { sanitizePostHtml } from "@/lib/sanitize";
import { recordRevision } from "@/lib/revisions";
import { refreshPublicPages } from "@/lib/revalidate";
import { isLive, parseCategoryNames, parsePublishDate, parseTagNames, setPostCategories, setPostTags } from "@/lib/posts";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentUser();

  const post = await db.query.posts.findFirst({ where: eq(posts.id, id), with: { category: true } });

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isLive(post) && !(user && canEditPost(user, post))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

/**
 * Saves the whole post from the editor. With `autosave: true` (sent by the
 * editor while someone is writing) only drafts are saved, and the version
 * history gets an entry at most every few minutes.
 */
export async function PUT(req: NextRequest, { params }: Params) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const existing = await db.query.posts.findFirst({ where: eq(posts.id, id) });
  if (!existing || !canEditPost(user, existing)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const autosave = body.autosave === true;
  const title = (typeof body.title === "string" ? body.title : "").trim();
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const status = body.status === "published" ? "published" : "draft";
  // Autosaving a published post would put half-finished edits live.
  if (autosave && (existing.status !== "draft" || status !== "draft")) {
    return NextResponse.json({ error: "Only drafts are saved automatically." }, { status: 409 });
  }
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

  // Only admins can credit a post to someone else on the team.
  let authorId = existing.authorId;
  if (isAdmin(user) && typeof body.authorId === "string") {
    if (!body.authorId) authorId = null;
    else if (await db.query.adminUsers.findFirst({ where: eq(adminUsers.id, body.authorId), columns: { id: true } })) {
      authorId = body.authorId;
    }
  }

  const content = sanitizePostHtml(typeof body.content === "string" ? body.content : "");
  const excerpt = typeof body.excerpt === "string" ? body.excerpt : "";

  await db
    .update(posts)
    .set({
      title,
      slug,
      excerpt,
      content,
      coverImage: body.coverImage || "",
      status,
      author: typeof body.author === "string" ? body.author.trim() : "",
      authorId,
      ...(typeof body.seoTitle === "string" && { seoTitle: body.seoTitle.trim() }),
      ...(typeof body.seoDescription === "string" && { seoDescription: body.seoDescription.trim() }),
      ...(typeof body.ogImage === "string" && { ogImage: body.ogImage.trim() }),
      publishedAt: publishDate ?? (status === "published" ? existing.publishedAt || new Date() : existing.publishedAt),
    })
    .where(eq(posts.id, id));

  const tagNames = parseTagNames(body.tags);
  if (tagNames) await setPostTags(id, tagNames);
  // Only admins can create new categories from the post editor.
  const categoryNames = parseCategoryNames(body.categories);
  if (categoryNames) await setPostCategories(id, categoryNames, isAdmin(user));

  await recordRevision(id, { title, excerpt, content }, { savedBy: userDisplayName(user), autosave, before: existing });
  if (existing.status === "published" || status === "published") refreshPublicPages();

  const post = await db.query.posts.findFirst({ where: eq(posts.id, id), with: { category: true } });
  return NextResponse.json(post);
}

/** Quick status change from the dashboard: { status: "published" | "draft" }. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const existing = await db.query.posts.findFirst({ where: eq(posts.id, id) });
  if (!existing || !canEditPost(user, existing)) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
  refreshPublicPages();
  return NextResponse.json(post);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const existing = await db.query.posts.findFirst({ where: eq(posts.id, id), columns: { authorId: true, status: true } });
  if (!existing || !canEditPost(user, existing)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(posts).where(eq(posts.id, id));
  if (existing.status === "published") refreshPublicPages();

  return NextResponse.json({ ok: true });
}

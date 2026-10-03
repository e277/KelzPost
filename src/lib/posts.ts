import { and, eq, inArray, lte, sql } from "drizzle-orm";
import { db, posts, postTags, tags, type AdminUser, type Category, type Post, type Tag } from "@/db";
import { readingTime, slugify, summarize } from "@/lib/utils";

/**
 * SQL condition for posts visitors can see: published, with a publish date
 * that has arrived. A published post dated in the future is "scheduled" and
 * appears on its own once that time passes.
 */
export const livePosts = () => and(eq(posts.status, "published"), lte(posts.publishedAt, sql`now()`));

export function isLive(post: Pick<Post, "status" | "publishedAt">, now = new Date()): boolean {
  return post.status === "published" && !!post.publishedAt && post.publishedAt <= now;
}

export function isScheduled(post: Pick<Post, "status" | "publishedAt">, now = new Date()): boolean {
  return post.status === "published" && !!post.publishedAt && post.publishedAt > now;
}

/** Parses an optional publish date from a request body; undefined when absent or invalid. */
export function parsePublishDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Normalises tag names from a request body: trimmed, deduplicated by slug, at most 10. */
export function parseTagNames(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const seen = new Set<string>();
  const names: string[] = [];
  for (const raw of value) {
    if (typeof raw !== "string") continue;
    const name = raw.trim().replace(/\s+/g, " ").slice(0, 40);
    const slug = slugify(name);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    names.push(name);
  }
  return names.slice(0, 10);
}

/** Replaces a post's tags with the given names, creating tags that don't exist yet. */
export async function setPostTags(postId: string, names: string[]): Promise<void> {
  await db.delete(postTags).where(eq(postTags.postId, postId));
  if (names.length === 0) return;

  const wanted = names.map((name) => ({ name, slug: slugify(name) }));
  await db.insert(tags).values(wanted).onConflictDoNothing({ target: tags.slug });
  const rows = await db.select({ id: tags.id }).from(tags).where(inArray(tags.slug, wanted.map((t) => t.slug)));
  await db.insert(postTags).values(rows.map((t) => ({ postId, tagId: t.id }))).onConflictDoNothing();
}

export async function getPostTags(postId: string): Promise<Tag[]> {
  const rows = await db.query.postTags.findMany({ where: eq(postTags.postId, postId), with: { tag: true } });
  return rows.map((r) => r.tag).sort((a, b) => a.name.localeCompare(b.name));
}

export type TocItem = { id: string; text: string; level: 2 | 3 };

/**
 * Gives every h2/h3 in the post body an id (so it can be linked to) and
 * returns the headings for a table of contents.
 */
export function withHeadingAnchors(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const used = new Set<string>();
  const out = html.replace(/<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi, (match, level: string, attrs = "", inner: string) => {
    const text = inner
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    if (!text) return match;

    const existing = /\sid=["']([^"']+)["']/i.exec(attrs)?.[1];
    let id = existing || slugify(text) || "section";
    if (!existing) {
      const base = id;
      for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    }
    used.add(id);
    toc.push({ id, text, level: level === "2" ? 2 : 3 });
    return existing ? match : `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });
  return { html: out, toc };
}

export const ARCHIVE_PAGE_SIZE = 9;

/** Reads ?page= as a positive integer (1 when absent or invalid). */
export function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

/** Who a post is shown as written by, and their author page if they have one. */
export type Byline = { name: string; href: string | null };

type BylineUser = Pick<AdminUser, "displayName" | "slug"> | null | undefined;

/**
 * A guest author typed on the post wins; then the team member who wrote it,
 * if they've set a display name; then the blog's author from Settings.
 */
export function postByline(post: { author: string; authorUser?: BylineUser }, defaultName: string): Byline {
  const guest = post.author.trim();
  if (guest) return { name: guest, href: null };
  const user = post.authorUser;
  if (user?.displayName.trim()) return { name: user.displayName.trim(), href: user.slug ? `/author/${user.slug}` : null };
  return { name: defaultName, href: null };
}

/** Relations to load for post cards (pass as `with` to db.query.posts). */
export const cardRelations = {
  category: true,
  authorUser: { columns: { displayName: true, slug: true } },
} as const;

/** What a post card needs, without the post body. */
export type PostSummary = {
  id: string;
  slug: string;
  title: string;
  /** The excerpt, or the opening of the post, up to 240 characters. */
  summary: string;
  coverImage: string;
  category: { id: string; name: string } | null;
  date: Date;
  readingMinutes: number;
  byline: Byline;
};

export function toPostSummary(
  post: Post & { category: Category | null; authorUser?: BylineUser },
  defaultAuthor: string
): PostSummary {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    summary: summarize(post.excerpt, post.content, 240),
    coverImage: post.coverImage,
    category: post.category ? { id: post.category.id, name: post.category.name } : null,
    date: post.publishedAt || post.createdAt,
    readingMinutes: readingTime(post.content),
    byline: postByline(post, defaultAuthor),
  };
}

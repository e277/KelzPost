import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { db, posts, postTags } from "@/db";
import { absoluteUrl, getSettings } from "@/lib/site";
import { ARCHIVE_PAGE_SIZE, cardRelations, livePosts, parsePage, toPostSummary } from "@/lib/posts";
import { ArchiveListing } from "@/components/archive-listing";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string | string[] }> };

const findTag = (slug: string) => db.query.tags.findFirst({ where: (t, { eq }) => eq(t.slug, slug) });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [settings, tag] = await Promise.all([getSettings(), findTag(slug)]);
  if (!tag) return { title: `Not Found — ${settings.blogTitle}` };
  const url = absoluteUrl(`/tag/${slug}`);
  return {
    title: `#${tag.name} — ${settings.blogTitle}`,
    description: `Articles tagged “${tag.name}” on ${settings.blogTitle}.`,
    alternates: { canonical: url },
    openGraph: { title: `#${tag.name} — ${settings.blogTitle}`, url, images: [absoluteUrl("/og")] },
  };
}

export default async function TagPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const [settings, categories, tag] = await Promise.all([
    getSettings(),
    db.query.categories.findMany({ orderBy: (c, { asc }) => asc(c.order) }),
    findTag(slug),
  ]);
  if (!tag) notFound();

  const where = and(
    livePosts(),
    inArray(posts.id, db.select({ id: postTags.postId }).from(postTags).where(eq(postTags.tagId, tag.id)))
  );
  const total = await db.$count(posts, where);
  const pageCount = Math.max(1, Math.ceil(total / ARCHIVE_PAGE_SIZE));
  const page = Math.min(parsePage(query.page), pageCount);
  const rows = await db.query.posts.findMany({
    where,
    with: cardRelations,
    orderBy: (p, { desc }) => [desc(p.publishedAt), desc(p.createdAt)],
    limit: ARCHIVE_PAGE_SIZE,
    offset: (page - 1) * ARCHIVE_PAGE_SIZE,
  });

  return (
    <ArchiveListing
      settings={settings}
      categories={categories}
      kind="Tag"
      name={tag.name}
      basePath={`/tag/${slug}`}
      posts={rows.map((p) => toPostSummary(p, settings.authorName))}
      total={total}
      page={page}
      pageCount={pageCount}
    />
  );
}

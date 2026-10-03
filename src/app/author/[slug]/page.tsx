import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { adminUsers, db, posts } from "@/db";
import { absoluteUrl, getSettings } from "@/lib/site";
import { ARCHIVE_PAGE_SIZE, cardRelations, livePosts, parsePage, toPostSummary } from "@/lib/posts";
import { ArchiveListing } from "@/components/archive-listing";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string | string[] }> };

async function findAuthor(slug: string) {
  const user = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.slug, slug),
    columns: { id: true, displayName: true, bio: true, avatar: true },
  });
  // Only people who've set a public name have an author page.
  return user?.displayName.trim() ? user : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [settings, author] = await Promise.all([getSettings(), findAuthor(slug)]);
  if (!author) return { title: `Not Found — ${settings.blogTitle}` };
  const url = absoluteUrl(`/author/${slug}`);
  const description = author.bio || `Articles by ${author.displayName} on ${settings.blogTitle}.`;
  return {
    title: `${author.displayName} — ${settings.blogTitle}`,
    description,
    alternates: { canonical: url },
    openGraph: { type: "profile", title: author.displayName, description, url, images: [absoluteUrl("/og")] },
  };
}

export default async function AuthorPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const [settings, categories, author] = await Promise.all([
    getSettings(),
    db.query.categories.findMany({ orderBy: (c, { asc }) => asc(c.order) }),
    findAuthor(slug),
  ]);
  if (!author) notFound();

  // Posts they wrote under their own name (guest posts they published don't count).
  const where = and(livePosts(), eq(posts.authorId, author.id), eq(posts.author, ""));
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
      kind="Author"
      name={author.displayName}
      bio={author.bio}
      avatar={author.avatar}
      basePath={`/author/${slug}`}
      posts={rows.map((p) => toPostSummary(p, settings))}
      total={total}
      page={page}
      pageCount={pageCount}
    />
  );
}

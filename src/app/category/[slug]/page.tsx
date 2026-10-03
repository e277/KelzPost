import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, posts } from "@/db";
import { absoluteUrl, getSettings } from "@/lib/site";
import { ARCHIVE_PAGE_SIZE, cardRelations, livePosts, parsePage, toPostSummary } from "@/lib/posts";
import { slugify } from "@/lib/utils";
import { ArchiveListing } from "@/components/archive-listing";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string | string[] }> };

async function findCategory(slug: string) {
  const categories = await db.query.categories.findMany({ orderBy: (c, { asc }) => asc(c.order) });
  return { categories, category: categories.find((c) => slugify(c.name) === slug) ?? null };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [settings, { category }] = await Promise.all([getSettings(), findCategory(slug)]);
  if (!category) return { title: `Not Found — ${settings.blogTitle}` };
  const url = absoluteUrl(`/category/${slug}`);
  return {
    title: `${category.name} — ${settings.blogTitle}`,
    description: `Articles about ${category.name} from ${settings.blogTitle}.`,
    alternates: { canonical: url },
    openGraph: { title: `${category.name} — ${settings.blogTitle}`, url, images: [absoluteUrl("/og")] },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const [settings, { categories, category }] = await Promise.all([getSettings(), findCategory(slug)]);
  if (!category) notFound();

  const where = and(livePosts(), eq(posts.categoryId, category.id));
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
      kind="Category"
      name={category.name}
      basePath={`/category/${slug}`}
      posts={rows.map((p) => toPostSummary(p, settings.authorName))}
      total={total}
      page={page}
      pageCount={pageCount}
    />
  );
}

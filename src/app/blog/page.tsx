import { permanentRedirect } from "next/navigation";

type Props = { searchParams: Promise<{ category?: string | string[]; page?: string | string[] }> };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// The Blog page was merged into the home page; keep old /blog links (and their
// category filter and page number) working.
export default async function OldBlogPage({ searchParams }: Props) {
  const query = await searchParams;
  const slug = readCategory(query.category);
  const [settings, { categories, category }, counts] = await Promise.all([
    getSettings(),
    loadCategories(slug),
    db.select({ categoryId: posts.categoryId, posts: count() }).from(posts).where(livePosts()).groupBy(posts.categoryId),
  ]);
  if (slug && !category) notFound();

  const postsIn = new Map(counts.map((c) => [c.categoryId, c.posts]));
  const allCount = counts.reduce((sum, c) => sum + c.posts, 0);

  const where = category ? and(livePosts(), eq(posts.categoryId, category.id)) : livePosts();
  const total = category ? postsIn.get(category.id) ?? 0 : allCount;
  const pageCount = Math.max(1, Math.ceil(total / ARCHIVE_PAGE_SIZE));
  const page = Math.min(parsePage(query.page), pageCount);
  const rows = await db.query.posts.findMany({
    where,
    with: cardRelations,
    orderBy: (p, { desc }) => [desc(p.publishedAt), desc(p.createdAt)],
    limit: ARCHIVE_PAGE_SIZE,
    offset: (page - 1) * ARCHIVE_PAGE_SIZE,
  });

  // Categories with no published posts stay out of the filter bar.
  const filters = (
    <div className="blog-controls">
      <nav className="blog-filter" aria-label="Categories">
        <Link href="/blog" className={`filter-btn${category ? "" : " active"}`} aria-current={category ? undefined : "page"}>
          All <span className="filter-btn__count">{allCount}</span>
        </Link>
        {categories
          .filter((c) => postsIn.get(c.id))
          .map((c) => (
            <Link
              key={c.id}
              href={categoryHref(c.name)}
              className={`filter-btn${category?.id === c.id ? " active" : ""}`}
              aria-current={category?.id === c.id ? "page" : undefined}
            >
              {c.name} <span className="filter-btn__count">{postsIn.get(c.id)}</span>
            </Link>
          ))}
      </nav>
    </div>
  );

  return (
    <ArchiveListing
      settings={settings}
      categories={categories}
      kind="Blog"
      name={category ? category.name : "All Articles"}
      basePath={category ? categoryHref(category.name) : "/blog"}
      filters={filters}
      posts={rows.map((p) => toPostSummary(p, settings))}
      total={total}
      page={page}
      pageCount={pageCount}
    />
  );
}

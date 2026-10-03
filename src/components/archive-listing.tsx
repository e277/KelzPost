import Link from "next/link";
import type { Category, PostWithCategory, Settings } from "@/db/schema";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { PostCard } from "./post-card";

/** Shared layout for category and tag archives: banner, post grid and pagination. */
export function ArchiveListing({
  settings,
  categories,
  kind,
  name,
  basePath,
  posts,
  total,
  page,
  pageCount,
}: {
  settings: Settings;
  categories: Category[];
  kind: "Category" | "Tag";
  name: string;
  basePath: string;
  posts: PostWithCategory[];
  total: number;
  page: number;
  pageCount: number;
}) {
  const href = (n: number) => (n <= 1 ? basePath : `${basePath}?page=${n}`);

  return (
    <>
      <SiteHeader settings={settings} />

      <section className="archive-hero">
        <div className="archive-hero__inner">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span>{kind === "Tag" ? "Tags" : "Categories"}</span>
          </nav>
          <span className="blog-hero__tag">{kind}</span>
          <h1 className="archive-hero__title">{kind === "Tag" ? `#${name}` : name}</h1>
          <p className="archive-hero__count">
            {total} {total === 1 ? "article" : "articles"}
          </p>
        </div>
      </section>

      <main className="blog-main">
        {posts.length === 0 ? (
          <div className="posts-grid">
            <div className="posts-grid--empty">
              <p>No articles here yet.</p>
              <p style={{ marginTop: 12 }}>
                <Link href="/" className="link-btn">
                  Browse all articles
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} categories={categories} authorName={settings.authorName} />
            ))}
          </div>
        )}

        {pageCount > 1 && (
          <nav className="pagination" aria-label="Pagination">
            {page > 1 ? (
              <Link href={href(page - 1)} className="pagination__link" rel="prev">
                ← Newer
              </Link>
            ) : (
              <span className="pagination__link is-disabled">← Newer</span>
            )}
            <span className="pagination__status">
              Page {page} of {pageCount}
            </span>
            {page < pageCount ? (
              <Link href={href(page + 1)} className="pagination__link" rel="next">
                Older →
              </Link>
            ) : (
              <span className="pagination__link is-disabled">Older →</span>
            )}
          </nav>
        )}
      </main>

      <SiteFooter settings={settings} />
    </>
  );
}

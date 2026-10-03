import Link from "next/link";
import type { ReactNode } from "react";
import type { Category, Settings } from "@/db/schema";
import type { PostSummary } from "@/lib/posts";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { PostCard } from "./post-card";
import { AuthorAvatar } from "./author-avatar";

const CRUMBS = { Blog: "Blog", Tag: "Tags", Author: "Authors" } as const;

/** Shared layout for the Blog page and the tag and author archives: banner, post grid and pagination. */
export function ArchiveListing({
  settings,
  categories,
  kind,
  name,
  bio,
  avatar,
  basePath,
  filters,
  posts,
  total,
  page,
  pageCount,
}: {
  settings: Settings;
  categories: Category[];
  kind: keyof typeof CRUMBS;
  name: string;
  /** Author archives only. */
  bio?: string;
  avatar?: string;
  /** Address of page 1; may already carry a query string. */
  basePath: string;
  /** Shown between the banner and the posts, like the Blog page's category filters. */
  filters?: ReactNode;
  posts: PostSummary[];
  total: number;
  page: number;
  pageCount: number;
}) {
  const href = (n: number) => (n <= 1 ? basePath : `${basePath}${basePath.includes("?") ? "&" : "?"}page=${n}`);

  return (
    <>
      <SiteHeader settings={settings} />

      <section className="archive-hero">
        <div className="archive-hero__inner">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span>{CRUMBS[kind]}</span>
          </nav>
          {kind === "Author" && <AuthorAvatar name={name} src={avatar ?? ""} className="archive-hero__avatar" />}
          <span className="blog-hero__tag">{kind}</span>
          <h1 className="archive-hero__title">{kind === "Tag" ? `#${name}` : name}</h1>
          {bio && <p className="archive-hero__bio">{bio}</p>}
          <p className="archive-hero__count">
            {total} {total === 1 ? "article" : "articles"}
          </p>
        </div>
      </section>

      {filters}

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
              <PostCard key={post.id} post={post} categories={categories} />
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

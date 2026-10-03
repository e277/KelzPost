import Link from "next/link";
import type { Category } from "@/db/schema";
import type { PostSummary } from "@/lib/posts";
import type { SiteText } from "@/lib/site-text";
import { PostCard } from "./post-card";

/** A page of post cards with Newer/Older links, shared by the home page and the tag and author archives. */
export function PostListing({
  posts,
  categories,
  text,
  layout = "grid",
  featureFirst = false,
  empty,
  page,
  pageCount,
  pageHref,
}: {
  posts: PostSummary[];
  categories: Pick<Category, "name">[];
  text: Pick<SiteText, "readMore" | "newerPosts" | "olderPosts">;
  layout?: "grid" | "list";
  /** Show the first card large (grid layout only, when there's more than one post). */
  featureFirst?: boolean;
  /** Shown instead of the cards when there are no posts. */
  empty: React.ReactNode;
  page: number;
  pageCount: number;
  pageHref: (page: number) => string;
}) {
  return (
    <main className="blog-main">
      {posts.length === 0 ? (
        <div className="posts-grid">
          <div className="posts-grid--empty">{empty}</div>
        </div>
      ) : (
        <div className={layout === "list" ? "posts-list" : "posts-grid"}>
          {posts.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              categories={categories}
              layout={layout}
              featured={featureFirst && layout === "grid" && i === 0 && posts.length > 1}
              readMore={text.readMore}
            />
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <nav className="pagination" aria-label="Pagination">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="pagination__link" rel="prev">
              {text.newerPosts}
            </Link>
          ) : (
            <span className="pagination__link is-disabled">{text.newerPosts}</span>
          )}
          <span className="pagination__status">
            Page {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={pageHref(page + 1)} className="pagination__link" rel="next">
              {text.olderPosts}
            </Link>
          ) : (
            <span className="pagination__link is-disabled">{text.olderPosts}</span>
          )}
        </nav>
      )}
    </main>
  );
}

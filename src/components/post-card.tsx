import Link from "next/link";
import type { Category } from "@/db/schema";
import type { PostSummary } from "@/lib/posts";
import { formatDate, categoryBadgeClass, slugify, summarize } from "@/lib/utils";

export function PostCard({
  post,
  categories,
  featured,
  layout = "grid",
}: {
  post: PostSummary;
  categories: Pick<Category, "name">[];
  featured?: boolean;
  layout?: "grid" | "list";
}) {
  const excerpt = featured ? post.summary : summarize(post.summary, "", 150);
  return (
    <article className={`post-card${featured ? " post-card--featured" : ""}${layout === "list" ? " post-card--list" : ""}`}>
      <div className="post-card__image">
        {post.coverImage ? (
          <img src={post.coverImage} alt="" loading="lazy" />
        ) : (
          <div className="post-card__image-placeholder">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.5} width="40" height="40">
              <rect x="4" y="8" width="40" height="32" rx="3" />
              <circle cx="18" cy="20" r="4" />
              <path d="m4 34 10-10 8 6 8-8 14 10" />
            </svg>
          </div>
        )}
        {post.category && (
          <Link
            href={`/category/${slugify(post.category.name)}`}
            className={`post-card__category badge ${categoryBadgeClass(post.category.name, categories)}`}
          >
            {post.category.name}
          </Link>
        )}
      </div>
      <div className="post-card__body">
        <div className="post-card__meta">
          <span>{formatDate(post.date)}</span>
          <span className="post-card__meta-dot" />
          <span>{post.readingMinutes} min read</span>
        </div>
        <h2 className="post-card__title">
          <Link href={`/post/${post.slug}`}>{post.title}</Link>
        </h2>
        {excerpt && <p className="post-card__excerpt">{excerpt}</p>}
        <div className="post-card__footer">
          <span className="post-card__author">
            By {post.byline.href ? <Link href={post.byline.href}>{post.byline.name}</Link> : post.byline.name}
          </span>
          <Link href={`/post/${post.slug}`} className="post-card__read-more" aria-label={`Read more: ${post.title}`}>
            Read More →
          </Link>
        </div>
      </div>
    </article>
  );
}

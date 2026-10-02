import Link from "next/link";
import type { Category, Post } from "@/db/schema";
import { formatDate, categoryBadgeClass, readingTime, summarize } from "@/lib/utils";

type PostWithCategory = Post & { category: Category | null };

export function PostCard({
  post,
  categories,
  featured,
  authorName,
  layout = "grid",
}: {
  post: PostWithCategory;
  categories: Category[];
  featured?: boolean;
  authorName: string;
  layout?: "grid" | "list";
}) {
  const excerpt = summarize(post.excerpt, post.content, featured ? 240 : 150);
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
          <span className={`post-card__category badge ${categoryBadgeClass(post.category.name, categories)}`}>
            {post.category.name}
          </span>
        )}
      </div>
      <div className="post-card__body">
        <div className="post-card__meta">
          <span>{formatDate(post.publishedAt || post.createdAt)}</span>
          <span className="post-card__meta-dot" />
          <span>{readingTime(post.content)} min read</span>
        </div>
        <h2 className="post-card__title">
          <Link href={`/post/${post.slug}`}>{post.title}</Link>
        </h2>
        {excerpt && <p className="post-card__excerpt">{excerpt}</p>}
        <div className="post-card__footer">
          <span className="post-card__author">By {post.author || authorName}</span>
          <Link href={`/post/${post.slug}`} className="post-card__read-more" aria-label={`Read more: ${post.title}`}>
            Read More →
          </Link>
        </div>
      </div>
    </article>
  );
}

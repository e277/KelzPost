import Link from "next/link";
import type { Category, Post } from "@prisma/client";
import { formatDate, categoryBadgeClass } from "@/lib/utils";

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
  return (
    <article className={`post-card${featured ? " post-card--featured" : ""}${layout === "list" ? " post-card--list" : ""}`}>
      <div className="post-card__image">
        {post.coverImage ? (
          <img src={post.coverImage} alt={post.title} loading="lazy" />
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
          {post.author && (
            <>
              <span className="post-card__meta-dot" />
              <span>{post.author}</span>
            </>
          )}
        </div>
        <h2 className="post-card__title">
          <Link href={`/post/${post.slug}`}>{post.title}</Link>
        </h2>
        {post.excerpt && <p className="post-card__excerpt">{post.excerpt}</p>}
        <div className="post-card__footer">
          <span className="post-card__author">By {post.author || authorName}</span>
          <Link href={`/post/${post.slug}`} className="post-card__read-more">
            Read More →
          </Link>
        </div>
      </div>
    </article>
  );
}

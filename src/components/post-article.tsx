import type { Category, Post } from "@prisma/client";
import { formatDate, categoryBadgeClass, readingTime } from "@/lib/utils";

type PostWithCategory = Post & { category: Category | null };

/** The body of a single post: cover, header and content. Shared by the public page and admin preview. */
export function PostArticle({
  post,
  categories,
  authorName,
}: {
  post: PostWithCategory;
  categories: Category[];
  authorName: string;
}) {
  const minutes = readingTime(post.content);
  const updated = post.publishedAt && post.updatedAt.getTime() - post.publishedAt.getTime() > 60_000;

  return (
    <article>
      {post.coverImage && <img src={post.coverImage} alt="" className="post-cover" />}

      <header className="post-header">
        {post.category && (
          <span className={`badge ${categoryBadgeClass(post.category.name, categories)}`}>{post.category.name}</span>
        )}
        <h1 className="post-title">{post.title}</h1>
        {post.excerpt && <p className="post-lede">{post.excerpt}</p>}
        <div className="post-meta">
          <span>
            By <strong>{post.author || authorName}</strong>
          </span>
          <span className="post-meta-divider" />
          <time dateTime={(post.publishedAt || post.createdAt).toISOString()}>
            {formatDate(post.publishedAt || post.createdAt)}
          </time>
          <span className="post-meta-divider" />
          <span>{minutes} min read</span>
          {updated && (
            <>
              <span className="post-meta-divider" />
              <span>Updated {formatDate(post.updatedAt)}</span>
            </>
          )}
        </div>
      </header>

      <div className="post-body" dangerouslySetInnerHTML={{ __html: post.content || "<p>No content available.</p>" }} />
    </article>
  );
}

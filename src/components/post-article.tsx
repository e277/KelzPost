import Link from "next/link";
import type { Category, Post, Tag } from "@/db/schema";
import type { Byline, TocItem } from "@/lib/posts";
import { formatDate, categoryBadgeClass, readingTime, categoryHref } from "@/lib/utils";

type PostWithCategory = Post & { category: Category | null };

/** The body of a single post: cover, header and content. Shared by the public page and admin preview. */
export function PostArticle({
  post,
  categories,
  postCategories,
  byline,
  tags = [],
  bodyHtml,
  toc = [],
}: {
  post: PostWithCategory;
  categories: Category[];
  /** Every category the post is filed under; defaults to its main category. */
  postCategories?: Category[];
  byline: Byline;
  tags?: Tag[];
  /** Content to render instead of post.content (e.g. with heading anchors added). */
  bodyHtml?: string;
  toc?: TocItem[];
}) {
  const minutes = readingTime(post.content);
  const updated = post.publishedAt && post.updatedAt.getTime() - post.publishedAt.getTime() > 60_000;
  const html = bodyHtml ?? post.content;

  return (
    <article>
      {post.coverImage && <img src={post.coverImage} alt="" className="post-cover" />}

      <header className="post-header">
        {(postCategories ?? (post.category ? [post.category] : [])).map((category) => (
          <Link
            key={category.id}
            href={categoryHref(category.name)}
            className={`badge ${categoryBadgeClass(category.name, categories)}`}
          >
            {category.name}
          </Link>
        ))}
        <h1 className="post-title">{post.title}</h1>
        {post.excerpt && <p className="post-lede">{post.excerpt}</p>}
        <div className="post-meta">
          <span>
            By <strong>{byline.href ? <Link href={byline.href}>{byline.name}</Link> : byline.name}</strong>
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

      {toc.length >= 3 && (
        <details className="post-toc" open>
          <summary>In this article</summary>
          <ol>
            {toc.map((item) => (
              <li key={item.id} className={item.level === 3 ? "post-toc__sub" : undefined}>
                <a href={`#${item.id}`}>{item.text}</a>
              </li>
            ))}
          </ol>
        </details>
      )}

      <div className="post-body" dangerouslySetInnerHTML={{ __html: html || "<p>No content available.</p>" }} />

      {tags.length > 0 && (
        <ul className="post-tags" aria-label="Tags">
          {tags.map((t) => (
            <li key={t.id}>
              <Link href={`/tag/${t.slug}`}>#{t.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

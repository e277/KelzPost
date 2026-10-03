import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, asc, eq } from "drizzle-orm";
import { comments as commentsTable, db } from "@/db";
import { getSettings, absoluteUrl } from "@/lib/site";
import { isMailerConfigured } from "@/lib/mailer";
import { formatDate, summarize, readingTime } from "@/lib/utils";
import { getPostTags, isLive, livePosts, withHeadingAnchors } from "@/lib/posts";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PostArticle } from "@/components/post-article";
import { PostCard } from "@/components/post-card";
import { ShareButtons } from "@/components/share-buttons";
import { ReadingProgress } from "@/components/reading-progress";
import { AuthorBox } from "@/components/author-box";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { PostComments, type PublicComment } from "@/components/post-comments";
import { ViewTracker } from "@/components/view-tracker";

async function getPublishedPost(slug: string) {
  const post = await db.query.posts.findFirst({ where: (p, { eq }) => eq(p.slug, slug), with: { category: true } });
  return post && isLive(post) ? post : null;
}

/** Approved comments, oldest first, with replies nested under the comment they answer. */
async function getComments(postId: string): Promise<{ threads: PublicComment[]; count: number }> {
  const rows = await db
    .select()
    .from(commentsTable)
    .where(and(eq(commentsTable.postId, postId), eq(commentsTable.status, "approved")))
    .orderBy(asc(commentsTable.createdAt));

  // Only what visitors may see: the commenter's email stays on the server.
  const toPublic = (c: (typeof rows)[number]): PublicComment => ({
    id: c.id,
    authorName: c.authorName,
    content: c.content,
    isAuthor: c.isAuthor,
    date: formatDate(c.createdAt),
    iso: c.createdAt.toISOString(),
  });
  const threads = new Map<string, PublicComment & { replies: PublicComment[] }>();
  for (const c of rows) if (!c.parentId) threads.set(c.id, { ...toPublic(c), replies: [] });
  // A reply whose parent isn't approved has nothing to hang from, so it stays hidden.
  const replies = rows.filter((c) => c.parentId && threads.has(c.parentId));
  for (const c of replies) threads.get(c.parentId!)!.replies.push(toPublic(c));
  return { threads: [...threads.values()], count: threads.size + replies.length };
}

/** Share image: the post's own, then a hosted cover image, then the generated card. */
function shareImage(post: { slug: string; ogImage: string; coverImage: string }): string {
  if (post.ogImage) return post.ogImage;
  // Data-URL images can't be used as Open Graph images.
  if (post.coverImage && !post.coverImage.startsWith("data:")) return post.coverImage;
  return absoluteUrl(`/post/${post.slug}/og`);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [settings, post] = await Promise.all([getSettings(), getPublishedPost(slug)]);
  if (!post) return { title: `Not Found — ${settings.blogTitle}` };

  const description = summarize(post.seoDescription || post.excerpt, post.content);
  const title = post.seoTitle || post.title;
  const url = absoluteUrl(`/post/${post.slug}`);
  const image = shareImage(post);
  const tags = await getPostTags(post.id);

  return {
    title: `${title} — ${settings.blogTitle}`,
    description,
    keywords: tags.length ? tags.map((t) => t.name) : undefined,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: settings.blogTitle,
      publishedTime: (post.publishedAt || post.createdAt).toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author || settings.authorName],
      section: post.category?.name,
      tags: tags.map((t) => t.name),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [settings, categories, post] = await Promise.all([
    getSettings(),
    db.query.categories.findMany({ orderBy: (c, { asc }) => asc(c.order) }),
    getPublishedPost(slug),
  ]);

  if (!post) notFound();

  const [tags, comments] = await Promise.all([getPostTags(post.id), getComments(post.id)]);
  const { html, toc } = withHeadingAnchors(post.content);

  // Chronological neighbours and up to 3 related posts (same category first, then most recent).
  const published = await db.query.posts.findMany({
    where: livePosts(),
    with: { category: true },
    orderBy: (p, { desc }) => [desc(p.publishedAt), desc(p.createdAt)],
  });
  const index = published.findIndex((p) => p.id === post.id);
  const newer = index > 0 ? published[index - 1] : null;
  const older = index >= 0 && index < published.length - 1 ? published[index + 1] : null;
  const others = published.filter((p) => p.id !== post.id);
  const related = [
    ...others.filter((p) => post.categoryId && p.categoryId === post.categoryId),
    ...others.filter((p) => !post.categoryId || p.categoryId !== post.categoryId),
  ].slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: summarize(post.seoDescription || post.excerpt, post.content),
    image: shareImage(post),
    keywords: tags.map((t) => t.name).join(", ") || undefined,
    articleSection: post.category?.name,
    datePublished: (post.publishedAt || post.createdAt).toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: post.author || settings.authorName, url: absoluteUrl("/about") },
    publisher: { "@type": "Organization", name: settings.blogTitle, url: absoluteUrl("/") },
    mainEntityOfPage: absoluteUrl(`/post/${post.slug}`),
    timeRequired: `PT${readingTime(post.content)}M`,
    commentCount: comments.count,
  };

  return (
    <>
      <ReadingProgress />
      <ViewTracker postId={post.id} />
      <SiteHeader settings={settings} />

      <main>
        <div className="post-wrapper">
          <Link href="/" className="post-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="16" height="16">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Blog
          </Link>

          <PostArticle post={post} categories={categories} authorName={settings.authorName} tags={tags} bodyHtml={html} toc={toc} />

          <AuthorBox settings={settings} name={post.author || settings.authorName} />

          {isMailerConfigured() && <NewsletterSignup blogTitle={settings.blogTitle} />}

          <footer className="post-footer">
            <Link href="/" className="post-footer__back">
              ← Back to Blog
            </Link>
            <ShareButtons title={post.title} />
          </footer>

          {(newer || older) && (
            <nav className="post-nav" aria-label="More posts">
              {older ? (
                <Link href={`/post/${older.slug}`} className="post-nav__link">
                  <span className="post-nav__dir">← Previous</span>
                  <span className="post-nav__title">{older.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {newer && (
                <Link href={`/post/${newer.slug}`} className="post-nav__link post-nav__link--next">
                  <span className="post-nav__dir">Next →</span>
                  <span className="post-nav__title">{newer.title}</span>
                </Link>
              )}
            </nav>
          )}

          <PostComments postId={post.id} comments={comments.threads} count={comments.count} />
        </div>

        {related.length > 0 && (
          <section className="related">
            <h2 className="related__title">Keep reading</h2>
            <div className="posts-grid related__grid">
              {related.map((p) => (
                <PostCard key={p.id} post={p} categories={categories} authorName={settings.authorName} />
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter settings={settings} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}

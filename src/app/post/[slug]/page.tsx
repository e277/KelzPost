import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSettings, absoluteUrl } from "@/lib/site";
import { summarize, readingTime } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PostArticle } from "@/components/post-article";
import { PostCard } from "@/components/post-card";
import { ShareButtons } from "@/components/share-buttons";
import { ReadingProgress } from "@/components/reading-progress";

async function getPublishedPost(slug: string) {
  const post = await prisma.post.findUnique({ where: { slug }, include: { category: true } });
  return post?.status === "published" ? post : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [settings, post] = await Promise.all([getSettings(), getPublishedPost(slug)]);
  if (!post) return { title: `Not Found — ${settings.blogTitle}` };

  const description = summarize(post.excerpt, post.content);
  const url = absoluteUrl(`/post/${post.slug}`);
  // Data-URL images can't be used as Open Graph images.
  const image = post.coverImage && !post.coverImage.startsWith("data:") ? post.coverImage : undefined;

  return {
    title: `${post.title} — ${settings.blogTitle}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url,
      siteName: settings.blogTitle,
      publishedTime: (post.publishedAt || post.createdAt).toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author || settings.authorName],
      section: post.category?.name,
      images: image ? [image] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [settings, categories, post] = await Promise.all([
    getSettings(),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    getPublishedPost(slug),
  ]);

  if (!post) notFound();

  // Chronological neighbours and up to 3 related posts (same category first, then most recent).
  const published = await prisma.post.findMany({
    where: { status: "published" },
    include: { category: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
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
    description: summarize(post.excerpt, post.content),
    datePublished: (post.publishedAt || post.createdAt).toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: post.author || settings.authorName },
    mainEntityOfPage: absoluteUrl(`/post/${post.slug}`),
    timeRequired: `PT${readingTime(post.content)}M`,
  };

  return (
    <>
      <ReadingProgress />
      <SiteHeader settings={settings} />

      <main>
        <div className="post-wrapper">
          <Link href="/" className="post-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="16" height="16">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Blog
          </Link>

          <PostArticle post={post} categories={categories} authorName={settings.authorName} />

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

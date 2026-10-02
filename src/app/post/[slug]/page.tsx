import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CopyLinkButton } from "@/components/copy-link-button";
import { formatDate, categoryBadgeClass } from "@/lib/utils";

async function getData(slug: string) {
  const [settings, categories, post] = await Promise.all([
    prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.post.findUnique({ where: { slug }, include: { category: true } }),
  ]);
  return { settings, categories, post };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { settings, post } = await getData(slug);
  if (!post || post.status !== "published") {
    return { title: `Not Found — ${settings.blogTitle}` };
  }
  return { title: `${post.title} — ${settings.blogTitle}` };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { settings, categories, post } = await getData(slug);

  return (
    <>
      <SiteHeader settings={settings} />

      <main>
        {!post || post.status !== "published" ? (
          <div className="post-wrapper" style={{ textAlign: "center", paddingTop: 80 }}>
            <svg
              viewBox="0 0 48 48"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              width="56"
              height="56"
              style={{ margin: "0 auto 24px", opacity: 0.3 }}
            >
              <circle cx="24" cy="24" r="20" />
              <path d="M15 24h18M24 15v18" strokeWidth={2} />
            </svg>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--navy)", marginBottom: 12 }}>
              Post Not Found
            </h1>
            <p style={{ color: "var(--gray-400)", marginBottom: 32 }}>
              This article doesn&apos;t exist or hasn&apos;t been published yet.
            </p>
            <Link href="/" className="btn btn--navy">
              ← Back to Blog
            </Link>
          </div>
        ) : (
          <div className="post-wrapper">
            <Link href="/" className="post-back">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="16" height="16">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to Blog
            </Link>

            {post.coverImage && <img src={post.coverImage} alt={post.title} className="post-cover" />}

            <header className="post-header">
              {post.category && (
                <span className={`badge ${categoryBadgeClass(post.category.name, categories)}`}>{post.category.name}</span>
              )}
              <h1 className="post-title">{post.title}</h1>
              <div className="post-meta">
                <span>
                  By <strong>{post.author || settings.authorName}</strong>
                </span>
                <span className="post-meta-divider" />
                <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                {post.updatedAt && post.updatedAt.getTime() !== post.createdAt.getTime() && (
                  <>
                    <span className="post-meta-divider" />
                    <span>Updated {formatDate(post.updatedAt)}</span>
                  </>
                )}
              </div>
            </header>

            <div className="post-body" dangerouslySetInnerHTML={{ __html: post.content || "<p>No content available.</p>" }} />

            <footer className="post-footer">
              <Link href="/" className="post-footer__back">
                ← Back to Blog
              </Link>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: ".82rem", color: "var(--gray-400)" }}>Share:</span>
                <CopyLinkButton />
              </div>
            </footer>
          </div>
        )}
      </main>

      <SiteFooter settings={settings} />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/site";
import { searchPosts } from "@/lib/search";
import { formatDate, slugify } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

type Props = { searchParams: Promise<{ q?: string | string[] }> };

const readQuery = (q: string | string[] | undefined) => (Array.isArray(q) ? q[0] : q || "").trim().slice(0, 200);

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [settings, { q }] = await Promise.all([getSettings(), searchParams]);
  const query = readQuery(q);
  return {
    title: query ? `Search: ${query} — ${settings.blogTitle}` : `Search — ${settings.blogTitle}`,
    // Result pages are endless and change constantly; keep them out of search engines.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const [settings, { q }] = await Promise.all([getSettings(), searchParams]);
  const query = readQuery(q);
  const results = query ? await searchPosts(query, settings.authorName) : [];

  return (
    <>
      <SiteHeader settings={settings} />

      <section className="archive-hero">
        <div className="archive-hero__inner">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span>Search</span>
          </nav>
          <span className="blog-hero__tag">Search</span>
          <h1 className="archive-hero__title">{query ? `“${query}”` : "Search the blog"}</h1>
          {query && (
            <p className="archive-hero__count">
              {results.length === 0 ? "No articles found" : `${results.length} ${results.length === 1 ? "article" : "articles"}`}
            </p>
          )}
        </div>
      </section>

      <main className="blog-main search-page">
        <form className="blog-search search-page__form" action="/search" role="search">
          <svg className="blog-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="16" height="16">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="search" name="q" defaultValue={query} placeholder="Search articles…" aria-label="Search articles" autoFocus={!query} required />
        </form>
        {!query && (
          <p className="search-page__hint">Search every article by words in its title, summary or text. Use &quot;quotes&quot; for an exact phrase.</p>
        )}

        {query && results.length === 0 && (
          <div className="posts-grid--empty">
            <p>Nothing matches “{query}”. Try fewer or different words.</p>
            <p style={{ marginTop: 12 }}>
              <Link href="/" className="link-btn">
                Browse all articles
              </Link>
            </p>
          </div>
        )}

        {results.length > 0 && (
          <ol className="search-results">
            {results.map((r) => (
              <li key={r.id} className="search-result">
                {r.coverImage && (
                  <Link href={`/post/${r.slug}`} className="search-result__thumb" tabIndex={-1} aria-hidden="true">
                    <img src={r.coverImage} alt="" loading="lazy" />
                  </Link>
                )}
                <div>
                  <h2 className="search-result__title">
                    <Link href={`/post/${r.slug}`}>{r.title}</Link>
                  </h2>
                  <p className="search-result__meta">
                    {formatDate(r.date)}
                    {r.category && (
                      <>
                        {" · "}
                        <Link href={`/category/${slugify(r.category.name)}`}>{r.category.name}</Link>
                      </>
                    )}
                    {` · ${r.readingMinutes} min read · By ${r.byline.name}`}
                  </p>
                  <p className="search-result__snippet" dangerouslySetInnerHTML={{ __html: r.snippet }} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </main>

      <SiteFooter settings={settings} />
    </>
  );
}

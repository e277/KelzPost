import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, eq } from "drizzle-orm";
import { db, postCategories, posts } from "@/db";
import { ARCHIVE_PAGE_SIZE, cardRelations, inCategory, livePosts, parsePage, toPostSummary } from "@/lib/posts";
import { absoluteUrl, getSettings } from "@/lib/site";
import { getBuiltInPage, pageBanner } from "@/lib/site-pages";
import { getSiteText } from "@/lib/site-text";
import { categoryHref, slugify } from "@/lib/utils";
import { highlightCodeBlocks } from "@/lib/highlight";
import { isMailerConfigured } from "@/lib/mailer";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PostListing } from "@/components/post-listing";
import { NewsletterSignup } from "@/components/newsletter-signup";

// The home page is the blog: the hero and intro from Admin → Pages → Home, then
// every post with the categories as filters (/?category=…) and page numbers.
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ category?: string | string[]; page?: string | string[] }> };

const readParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) || "";

async function loadCategories(slug: string) {
  const categories = await db.query.categories.findMany({ orderBy: (c, { asc }) => asc(c.order) });
  return { categories, category: slug ? categories.find((c) => slugify(c.name) === slug) ?? null : null };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const slug = readParam((await searchParams).category);
  const [settings, home, { category }] = await Promise.all([getSettings(), getBuiltInPage("home"), loadCategories(slug)]);
  const title = category
    ? `${category.name} — ${settings.blogTitle}`
    : home.seoTitle.trim() || settings.blogTitle;
  const description = category
    ? `Articles about ${category.name} from ${settings.blogTitle}.`
    : home.seoDescription.trim() || settings.tagline;
  const url = absoluteUrl(category ? categoryHref(category.name) : "/");
  return {
    // The home page's title stands alone rather than "… — Blog title".
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: [absoluteUrl("/og")] },
  };
}

export default async function HomePage({ searchParams }: Props) {
  const query = await searchParams;
  const slug = readParam(query.category);
  // A post filed under several categories counts (and shows) under each of them.
  const [settings, home, { categories, category }, counts, allCount] = await Promise.all([
    getSettings(),
    getBuiltInPage("home"),
    loadCategories(slug),
    db
      .select({ categoryId: postCategories.categoryId, posts: count() })
      .from(postCategories)
      .innerJoin(posts, eq(posts.id, postCategories.postId))
      .where(livePosts())
      .groupBy(postCategories.categoryId),
    db.$count(posts, livePosts()),
  ]);
  // Cards only need a summary; post bodies stay on the server.
  const posts = rows.map((p) => toPostSummary(p, settings));

  const text = getSiteText(settings);
  const banner = pageBanner(home, { heading: settings.blogTitle, subheading: settings.tagline });
  const postsIn = new Map(counts.map((c) => [c.categoryId, c.posts]));

  const total = category ? postsIn.get(category.id) ?? 0 : allCount;
  const pageCount = Math.max(1, Math.ceil(total / ARCHIVE_PAGE_SIZE));
  const page = Math.min(parsePage(query.page), pageCount);
  const rows = await db.query.posts.findMany({
    where: category ? and(livePosts(), inCategory(category.id)) : livePosts(),
    with: cardRelations,
    orderBy: (p, { desc }) => [desc(p.publishedAt), desc(p.createdAt)],
    limit: ARCHIVE_PAGE_SIZE,
    offset: (page - 1) * ARCHIVE_PAGE_SIZE,
  });

  const basePath = category ? categoryHref(category.name) : "/";
  const pageHref = (n: number) => (n <= 1 ? basePath : `${basePath}${basePath.includes("?") ? "&" : "?"}page=${n}`);
  const heroLayout = settings.heroLayout === "split" ? "split" : "centered";
  const layout = settings.postsLayout === "list" ? "list" : "grid";
  // Only the very first page of the unfiltered list shows the intro and the big first card.
  const isFront = !category && page === 1;

  return (
    <>
      <SiteHeader settings={settings} />

      <section className={`blog-hero blog-hero--${heroLayout}`}>
        <div className="blog-hero__content">
          {banner.eyebrow && <span className="blog-hero__tag">{banner.eyebrow}</span>}
          <h1 className="blog-hero__title">{banner.heading}</h1>
          {banner.subheading && <p className="blog-hero__sub">{banner.subheading}</p>}
        </div>
      </section>

      {isFront && home.content && (
        <section className="home-intro">
          <div className="post-body" dangerouslySetInnerHTML={{ __html: highlightCodeBlocks(home.content) }} />
        </section>
      )}

      <div className="blog-controls" id="posts">
        {/* Searches every post on the server (see /search). */}
        <form className="blog-search" action="/search" role="search">
          <svg className="blog-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="16" height="16" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="search" name="q" placeholder={text.searchPlaceholder} aria-label={text.searchPlaceholder} required />
        </form>
        {/* Categories with no published posts stay out of the filter bar. */}
        <nav className="blog-filter" aria-label="Categories">
          <Link href="/#posts" className={`filter-btn${category ? "" : " active"}`} aria-current={category ? undefined : "page"}>
            {text.filterAll} <span className="filter-btn__count">{allCount}</span>
          </Link>
          {categories
            .filter((c) => postsIn.get(c.id))
            .map((c) => (
              <Link
                key={c.id}
                href={`${categoryHref(c.name)}#posts`}
                className={`filter-btn${category?.id === c.id ? " active" : ""}`}
                aria-current={category?.id === c.id ? "page" : undefined}
              >
                {c.name} <span className="filter-btn__count">{postsIn.get(c.id)}</span>
              </Link>
            ))}
        </nav>
      </div>

      <PostListing
        posts={rows.map((p) => toPostSummary(p, settings.authorName))}
        categories={categories}
        text={text}
        layout={layout}
        featureFirst={isFront}
        page={page}
        pageCount={pageCount}
        pageHref={(n) => `${pageHref(n)}#posts`}
        empty={
          allCount === 0 ? (
            <p>{text.noPosts}</p>
          ) : (
            <>
              <p>{text.emptyListing}</p>
              <p style={{ marginTop: 12 }}>
                <Link href="/#posts" className="link-btn">
                  Browse all articles
                </Link>
              </p>
            </>
          )
        }
      />

      {isMailerConfigured() && (
        <div className="newsletter-band">
          <NewsletterSignup text={text} />
        </div>
      )}

      <SiteFooter settings={settings} />
    </>
  );
}

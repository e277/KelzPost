import Link from "next/link";
import type { Category, Settings } from "@/db/schema";
import type { PostSummary } from "@/lib/posts";
import { getSiteText } from "@/lib/site-text";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { PostListing } from "./post-listing";
import { AuthorAvatar } from "./author-avatar";

const CRUMBS = { Tag: "Tags", Author: "Authors" } as const;

/** Shared layout for the tag and author archives: banner, post grid and pagination. */
export function ArchiveListing({
  settings,
  categories,
  kind,
  name,
  bio,
  avatar,
  basePath,
  posts,
  total,
  page,
  pageCount,
}: {
  settings: Settings;
  categories: Category[];
  kind: keyof typeof CRUMBS;
  name: string;
  /** Author archives only. */
  bio?: string;
  avatar?: string;
  /** Address of page 1. */
  basePath: string;
  posts: PostSummary[];
  total: number;
  page: number;
  pageCount: number;
}) {
  const text = getSiteText(settings);
  const href = (n: number) => (n <= 1 ? basePath : `${basePath}${basePath.includes("?") ? "&" : "?"}page=${n}`);

  return (
    <>
      <SiteHeader settings={settings} />

      <section className="archive-hero">
        <div className="archive-hero__inner">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span>{CRUMBS[kind]}</span>
          </nav>
          {kind === "Author" && <AuthorAvatar name={name} src={avatar ?? ""} className="archive-hero__avatar" />}
          <span className="blog-hero__tag">{kind}</span>
          <h1 className="archive-hero__title">{kind === "Tag" ? `#${name}` : name}</h1>
          {bio && <p className="archive-hero__bio">{bio}</p>}
          <p className="archive-hero__count">
            {total} {total === 1 ? "article" : "articles"}
          </p>
        </div>
      </section>

      <PostListing
        posts={posts}
        categories={categories}
        text={text}
        page={page}
        pageCount={pageCount}
        pageHref={href}
        empty={
          <>
            <p>{text.emptyListing}</p>
            <p style={{ marginTop: 12 }}>
              <Link href="/" className="link-btn">
                Browse all articles
              </Link>
            </p>
          </>
        }
      />

      <SiteFooter settings={settings} />
    </>
  );
}

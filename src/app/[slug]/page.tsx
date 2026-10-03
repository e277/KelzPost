import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { getSettings } from "@/lib/site";
import { pageBanner } from "@/lib/site-pages";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { highlightCodeBlocks } from "@/lib/highlight";

// Served from cache and rebuilt in the background at most once a minute (so
// scheduled posts appear on time); edits in the admin refresh it straight away.
export const revalidate = 60;

// Pages are built the first time they're visited, then cached (see revalidate).
export function generateStaticParams() {
  return [];
}

// Only custom pages live here; Home and About have their own routes.
const findPage = (slug: string) =>
  db.query.pages.findFirst({ where: (p, { and, eq }) => and(eq(p.slug, slug), eq(p.kind, "custom")) });

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [settings, page] = await Promise.all([getSettings(), findPage(slug)]);
  if (!page) return { title: `Not Found — ${settings.blogTitle}` };
  return {
    title: page.seoTitle.trim() || `${page.title} — ${settings.blogTitle}`,
    description: page.seoDescription.trim() || page.subheading.trim() || undefined,
  };
}

export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [settings, page] = await Promise.all([getSettings(), findPage(slug)]);

  if (!page) notFound();
  const banner = pageBanner(page);

  return (
    <>
      <SiteHeader settings={settings} />

      <main>
        <div className="about-wrapper">
          <div className="about-header">
            {banner.eyebrow && <span className="blog-hero__tag about-eyebrow">{banner.eyebrow}</span>}
            <h1 className="about-title">{banner.heading}</h1>
            {banner.subheading && <p className="about-subheading">{banner.subheading}</p>}
          </div>
          {page.content ? (
            <div className="about-body post-body" dangerouslySetInnerHTML={{ __html: highlightCodeBlocks(page.content) }} />
          ) : (
            <div className="about-empty">This page has no content yet.</div>
          )}
        </div>
      </main>

      <SiteFooter settings={settings} />
    </>
  );
}

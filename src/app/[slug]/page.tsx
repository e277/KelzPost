import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { getSettings } from "@/lib/site";
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [settings, page] = await Promise.all([
    getSettings(),
    db.query.pages.findFirst({ where: (p, { eq }) => eq(p.slug, slug) }),
  ]);
  if (!page) return { title: `Not Found — ${settings.blogTitle}` };
  return { title: `${page.title} — ${settings.blogTitle}` };
}

export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [settings, page] = await Promise.all([
    getSettings(),
    db.query.pages.findFirst({ where: (p, { eq }) => eq(p.slug, slug) }),
  ]);

  if (!page) notFound();

  return (
    <>
      <SiteHeader settings={settings} />

      <main>
        <div className="about-wrapper">
          <div className="about-header">
            <h1 className="about-title">{page.title}</h1>
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

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [settings, page] = await Promise.all([
    getSettings(),
    prisma.page.findUnique({ where: { slug } }),
  ]);
  if (!page) return { title: `Not Found — ${settings.blogTitle}` };
  return { title: `${page.title} — ${settings.blogTitle}` };
}

export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [settings, page] = await Promise.all([
    getSettings(),
    prisma.page.findUnique({ where: { slug } }),
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
            <div className="about-body" dangerouslySetInnerHTML={{ __html: page.content }} />
          ) : (
            <div className="about-empty">This page has no content yet.</div>
          )}
        </div>
      </main>

      <SiteFooter settings={settings} />
    </>
  );
}

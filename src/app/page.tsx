import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HomeContent } from "@/components/home-content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSettings();

  const [posts, categories] = await Promise.all([
    prisma.post.findMany({
      where: { status: "published" },
      include: { category: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  const heroLayout = settings.heroLayout === "split" ? "split" : "centered";

  return (
    <>
      <SiteHeader settings={settings} />

      <section className={`blog-hero blog-hero--${heroLayout}`}>
        <div className="blog-hero__content">
          {settings.heroTag && <span className="blog-hero__tag">{settings.heroTag}</span>}
          <h1 className="blog-hero__title">{settings.blogTitle}</h1>
          <p className="blog-hero__sub">{settings.tagline}</p>
        </div>
      </section>

      <HomeContent posts={posts} categories={categories} settings={settings} />

      <SiteFooter settings={settings} />
    </>
  );
}

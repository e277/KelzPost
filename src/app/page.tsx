import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HomeContent } from "@/components/home-content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  const [posts, categories] = await Promise.all([
    prisma.post.findMany({
      where: { status: "published" },
      include: { category: true },
      orderBy: { createdAt: "desc" },
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

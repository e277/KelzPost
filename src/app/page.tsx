import { db } from "@/db";
import { livePosts } from "@/lib/posts";
import { getSettings } from "@/lib/site";
import { isMailerConfigured } from "@/lib/mailer";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HomeContent } from "@/components/home-content";
import { NewsletterSignup } from "@/components/newsletter-signup";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSettings();

  const [posts, categories] = await Promise.all([
    db.query.posts.findMany({
      where: livePosts(),
      with: { category: true },
      orderBy: (p, { desc }) => [desc(p.publishedAt), desc(p.createdAt)],
    }),
    db.query.categories.findMany({ orderBy: (c, { asc }) => asc(c.order) }),
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

      {isMailerConfigured() && (
        <div className="newsletter-band">
          <NewsletterSignup blogTitle={settings.blogTitle} />
        </div>
      )}

      <SiteFooter settings={settings} />
    </>
  );
}

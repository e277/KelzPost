import type { Metadata } from "next";
import { getSettings } from "@/lib/site";
import { getBuiltInPage, pageBanner } from "@/lib/site-pages";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { highlightCodeBlocks } from "@/lib/highlight";

// Served from cache and rebuilt in the background at most once a minute (so
// scheduled posts appear on time); edits in the admin refresh it straight away.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [settings, page] = await Promise.all([getSettings(), getBuiltInPage("about")]);
  return {
    title: page.seoTitle.trim() || `${page.title} — ${settings.blogTitle}`,
    description: page.seoDescription.trim() || page.subheading.trim() || settings.authorBio || undefined,
  };
}

// The built-in About page: the blog author's photo, name and bio (Settings) above
// the page's own heading and content (Admin → Pages → About).
export default async function AboutPage() {
  const [settings, page] = await Promise.all([getSettings(), getBuiltInPage("about")]);
  const banner = pageBanner(page);

  return (
    <>
      <SiteHeader settings={settings} />

      <main>
        <div className="about-wrapper">
          <div className="about-header">
            {settings.authorAvatar ? (
              <img src={settings.authorAvatar} alt={settings.authorName} className="about-avatar" />
            ) : (
              <div className="about-avatar-placeholder">{(settings.authorName || "A")[0]?.toUpperCase()}</div>
            )}
            {banner.eyebrow && <span className="blog-hero__tag about-eyebrow">{banner.eyebrow}</span>}
            <h1 className="about-title">{banner.heading}</h1>
            {banner.subheading && <p className="about-subheading">{banner.subheading}</p>}
            <p className="about-name">{settings.authorName}</p>
            {settings.authorBio && <p className="about-bio">{settings.authorBio}</p>}
          </div>

          {page.content ? (
            <div className="about-body post-body" dangerouslySetInnerHTML={{ __html: highlightCodeBlocks(page.content) }} />
          ) : (
            <div className="about-empty">Nothing here yet. Add some content under Admin → Pages → About.</div>
          )}
        </div>
      </main>

      <SiteFooter settings={settings} />
    </>
  );
}

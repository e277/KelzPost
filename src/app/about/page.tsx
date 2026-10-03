import type { Metadata } from "next";
import { getSettings } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { highlightCodeBlocks } from "@/lib/highlight";

// Served from cache and rebuilt in the background at most once a minute (so
// scheduled posts appear on time); edits in the admin refresh it straight away.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return { title: `${settings.aboutTitle || "About"} — ${settings.blogTitle}` };
}

export default async function AboutPage() {
  const settings = await getSettings();

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
            <h1 className="about-title">{settings.aboutTitle || "About"}</h1>
            <p className="about-name">{settings.authorName}</p>
            {settings.authorBio && <p className="about-bio">{settings.authorBio}</p>}
          </div>

          {settings.aboutContent ? (
            <div className="about-body post-body" dangerouslySetInnerHTML={{ __html: highlightCodeBlocks(settings.aboutContent) }} />
          ) : (
            <div className="about-empty">Nothing here yet. Add some content under Admin → Pages → About.</div>
          )}
        </div>
      </main>

      <SiteFooter settings={settings} />
    </>
  );
}

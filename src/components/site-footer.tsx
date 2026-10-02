import type { Settings } from "@/db/schema";

const SOCIAL_ICONS: Record<string, string> = {
  twitter:
    '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M23 4.5c-.85.38-1.76.63-2.7.74a4.7 4.7 0 0 0 2.06-2.6 9.4 9.4 0 0 1-2.98 1.14 4.68 4.68 0 0 0-7.97 4.27A13.28 13.28 0 0 1 1.64 3.16a4.67 4.67 0 0 0 1.45 6.24A4.65 4.65 0 0 1 1 8.84v.06a4.68 4.68 0 0 0 3.75 4.59 4.7 4.7 0 0 1-2.11.08 4.69 4.69 0 0 0 4.37 3.25A9.4 9.4 0 0 1 .5 18.57 13.25 13.25 0 0 0 7.67 20.7c8.6 0 13.3-7.13 13.3-13.31 0-.2 0-.4-.02-.6A9.4 9.4 0 0 0 23 4.5z"/></svg>',
  instagram:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  linkedin:
    '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>',
  rss:
    '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><circle cx="5" cy="19" r="2.2"/><path d="M3 10.5v3a7.5 7.5 0 0 1 7.5 7.5h3A10.5 10.5 0 0 0 3 10.5zm0-6v3A13.5 13.5 0 0 1 16.5 21h3A16.5 16.5 0 0 0 3 4.5z"/></svg>',
  github:
    '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.13-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.74.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.24 2.75.12 3.04.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.15 0 1.55-.01 2.8-.01 3.18 0 .3.21.66.79.55A10.52 10.52 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5z"/></svg>',
};

export function SiteFooter({ settings }: { settings: Settings }) {
  const title = settings.blogTitle || "The Journal";
  const words = title.trim().split(/\s+/);
  const last = words.pop() || "";
  const lead = words.join(" ");

  const socials = [
    { key: "twitter", url: settings.socialTwitter },
    { key: "instagram", url: settings.socialInstagram },
    { key: "linkedin", url: settings.socialLinkedin },
    { key: "github", url: settings.socialGithub },
  ].filter((s) => s.url);
  const labels: Record<string, string> = { twitter: "X / Twitter", instagram: "Instagram", linkedin: "LinkedIn", github: "GitHub" };

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <div className="blog-logo">
            <div className="blog-logo__mark">{title[0]?.toUpperCase() || "J"}</div>
            <div className="blog-logo__text">
              {lead ? `${lead} ` : ""}
              <span>{last}</span>
            </div>
          </div>
          <p className="site-footer__tagline">{settings.tagline}</p>
        </div>
        <div className="site-footer__social">
          {socials.map((s) => (
            <a
              key={s.key}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              title={labels[s.key]}
              aria-label={labels[s.key]}
              dangerouslySetInnerHTML={{ __html: SOCIAL_ICONS[s.key] }}
            />
          ))}
          <a href="/feed.xml" title="RSS feed" aria-label="RSS feed" dangerouslySetInnerHTML={{ __html: SOCIAL_ICONS.rss }} />
        </div>
      </div>
      <div className="site-footer__bottom">
        {settings.footerText?.trim()
          ? settings.footerText
          : `© ${new Date().getFullYear()} ${settings.authorName || "Author"}. All rights reserved.`}
      </div>
    </footer>
  );
}

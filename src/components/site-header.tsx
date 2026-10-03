import Link from "next/link";
import type { Settings } from "@/db/schema";
import { NavLinks } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

import { parseNavLinks } from "@/lib/nav-links";

export function SiteHeader({ settings }: { settings: Settings }) {
  const displayTitle = settings.logoText?.trim() || settings.blogTitle || "The Journal";
  const words = displayTitle.trim().split(/\s+/);
  const last = words.pop() || "";
  const lead = words.join(" ");
  const navLinks = parseNavLinks(settings.navLinks);

  return (
    <header className="blog-header">
      <nav className="blog-nav">
        <Link href="/" className="blog-logo">
          <div className="blog-logo__mark">{displayTitle[0]?.toUpperCase() || "J"}</div>
          <div className="blog-logo__text">
            {lead ? `${lead} ` : ""}
            <span>{last}</span>
          </div>
        </Link>
        <div className="blog-nav__end">
          <NavLinks links={navLinks} />
          <Link href="/search" className="theme-toggle" aria-label="Search articles" title="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="18" height="18" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}

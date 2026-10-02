import Link from "next/link";
import type { Settings } from "@/db/schema";
import { NavLinks } from "./nav-links";

type NavLink = { label: string; href: string };

function parseNavLinks(raw: string): NavLink[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((l) => l.label && l.href);
  } catch {}
  return [{ label: "Home", href: "/" }, { label: "About", href: "/about" }];
}

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
        <NavLinks links={navLinks} />
      </nav>
    </header>
  );
}

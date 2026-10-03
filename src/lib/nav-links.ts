/**
 * The header menu, stored as JSON in settings.navLinks. A link to one of the
 * blog's own pages carries that page's id ("about" for the built-in About page),
 * so its address and label follow the page and it goes away with the page.
 * Links without a pageId point anywhere else (Home, a category, another site).
 */
export type NavLink = { label: string; href: string; pageId?: string };

export const ABOUT_PAGE_ID = "about";

const DEFAULT_NAV: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about", pageId: ABOUT_PAGE_ID },
];

export function parseNavLinks(raw: string): NavLink[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((l) => l && typeof l.label === "string" && typeof l.href === "string" && l.label && l.href)
        .map((l) => (typeof l.pageId === "string" && l.pageId ? { label: l.label, href: l.href, pageId: l.pageId } : { label: l.label, href: l.href }));
    }
  } catch {}
  return DEFAULT_NAV.map((l) => ({ ...l }));
}

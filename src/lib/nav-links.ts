/**
 * The header menu, stored as JSON in settings.navLinks. Every link belongs to one of
 * the blog's pages and carries that page's id ("home", "blog" and "about" for the
 * built-in pages), so its address and label follow the page and it goes away with
 * the page. Pages are put in the menu and ordered from Admin → Pages. Links saved
 * before that without a pageId are matched to their page by address.
 */
export type NavLink = { label: string; href: string; pageId?: string };

export const HOME_PAGE_ID = "home";
export const ABOUT_PAGE_ID = "about";
export const BLOG_PAGE_ID = "blog";

const DEFAULT_NAV: NavLink[] = [
  { label: "Home", href: "/", pageId: HOME_PAGE_ID },
  { label: "Blog", href: "/blog", pageId: BLOG_PAGE_ID },
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

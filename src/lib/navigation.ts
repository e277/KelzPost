import { eq, sql } from "drizzle-orm";
import { db, settings as settingsTable } from "@/db";
import { getSettings } from "@/lib/site";
import { parseNavLinks, type NavLink } from "@/lib/nav-links";
import { ensureBuiltInPages } from "@/lib/site-pages";

type NavPage = { id: string; title: string; slug: string };

const hrefFor = (page: Pick<NavPage, "slug">) => `/${page.slug}`;

async function saveNavLinks(links: NavLink[]) {
  await db.update(settingsTable).set({ navLinks: JSON.stringify(links) }).where(eq(settingsTable.id, 1));
}

/**
 * Keeps a page's header link in step with the page: its address and label follow
 * the page, `show` adds or removes it (undefined leaves that as it is), and an older
 * link typed by hand to the page's address is adopted as the page's link.
 * Returns whether the page is in the menu afterwards.
 */
export async function syncPageNavLink(page: NavPage, show?: boolean, previousSlug?: string): Promise<boolean> {
  const links = parseNavLinks((await getSettings()).navLinks);
  const addresses = new Set([hrefFor(page), previousSlug ? `/${previousSlug}` : ""]);
  let found = false;
  const next: NavLink[] = [];
  for (const link of links) {
    const isPage = link.pageId === page.id || (!link.pageId && addresses.has(link.href));
    if (!isPage) {
      next.push(link);
    } else if (!found && show !== false) {
      next.push({ label: page.title, href: hrefFor(page), pageId: page.id });
      found = true;
    }
  }
  if (!found && show) {
    next.push({ label: page.title, href: hrefFor(page), pageId: page.id });
    found = true;
  }
  if (JSON.stringify(next) !== JSON.stringify(links)) await saveNavLinks(next);
  return found;
}

/** Takes a deleted page's link out of the header menu. */
export async function removePageNavLink(page: Pick<NavPage, "id" | "slug">): Promise<void> {
  const links = parseNavLinks((await getSettings()).navLinks);
  const next = links.filter((l) => l.pageId !== page.id && !(!l.pageId && l.href === `/${page.slug}`));
  if (next.length !== links.length) await saveNavLinks(next);
}

/** Whether the page has a link in the header menu. */
export function isPageInNav(navLinks: string, page: NavPage): boolean {
  return parseNavLinks(navLinks).some((l) => l.pageId === page.id || (!l.pageId && l.href === hrefFor(page)));
}

/** A page that can be in the header menu: the built-in Home and About, or a custom page. */
export type MenuPage = { id: string; title: string; href: string };

/** Every page, built-in ones (Home, then About) first, then custom pages oldest first. */
export async function listMenuPages(): Promise<MenuPage[]> {
  await ensureBuiltInPages();
  const pages = await db.query.pages.findMany({
    columns: { id: true, title: true, slug: true },
    orderBy: (p, { asc }) => [asc(sql`case ${p.kind} when 'home' then 0 when 'about' then 1 else 2 end`), asc(p.createdAt)],
  });
  return pages.map((p) => ({ id: p.id, title: p.title, href: hrefFor(p) }));
}

/** The ids of the pages in the header menu, in menu order. */
export function menuPageIds(navLinks: string, pages: MenuPage[]): string[] {
  const ids: string[] = [];
  for (const link of parseNavLinks(navLinks)) {
    const page = pages.find((p) => (link.pageId ? p.id === link.pageId : p.href === link.href));
    if (page && !ids.includes(page.id)) ids.push(page.id);
  }
  return ids;
}

/** Rebuilds the header menu from page ids, in the given order; unknown ids are skipped. */
export async function saveMenu(pageIds: string[], pages: MenuPage[]): Promise<string[]> {
  const links: NavLink[] = [];
  for (const id of pageIds) {
    const page = pages.find((p) => p.id === id);
    if (page && !links.some((l) => l.pageId === id)) links.push({ label: page.title, href: page.href, pageId: page.id });
  }
  await saveNavLinks(links);
  return links.map((l) => l.pageId!);
}

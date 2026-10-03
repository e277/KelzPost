import { db, pages, type Page } from "@/db";
import seedData from "@/db/seed-data.json";

/**
 * The built-in pages: Home (at /, with the post listing under it) and About (at
 * /about, with the author's photo, name and bio). Each is a row in "Page" whose id
 * is also its kind, so header-menu links (which store the page id) keep pointing at
 * them. They can be edited like any page but not deleted or moved.
 */
export const BUILT_IN_PAGES = {
  home: { id: "home", kind: "home", slug: "", ...seedData.pages.home },
  about: { id: "about", kind: "about", slug: "about", ...seedData.pages.about },
} as const;

export type BuiltInKind = keyof typeof BUILT_IN_PAGES;

export const isBuiltInPage = (page: Pick<Page, "kind">) => page.kind !== "custom";

/** A page's public address: "/" for Home, otherwise "/<slug>". */
export const pageHref = (page: Pick<Page, "slug">) => `/${page.slug}`;

/** Creates any missing built-in pages from the defaults in seed-data.json. */
export async function ensureBuiltInPages(): Promise<void> {
  await db
    .insert(pages)
    .values(Object.values(BUILT_IN_PAGES).map((p) => ({ ...p })))
    .onConflictDoNothing();
}

/** The Home or About page, created from the defaults the first time it's needed. */
export async function getBuiltInPage(kind: BuiltInKind): Promise<Page> {
  const find = () => db.query.pages.findFirst({ where: (p, { eq }) => eq(p.id, BUILT_IN_PAGES[kind].id) });
  const row = await find();
  if (row) return row;
  await ensureBuiltInPages();
  return (await find())!;
}

/** The text in a page's banner, with the blog's title and tagline as Home's fallbacks. */
export function pageBanner(page: Page, fallback: { heading?: string; subheading?: string } = {}) {
  return {
    eyebrow: page.eyebrow.trim(),
    heading: page.heading.trim() || fallback.heading || page.title,
    subheading: page.subheading.trim() || fallback.subheading || "",
  };
}

const TEXT_LIMITS = { eyebrow: 80, heading: 200, subheading: 400, seoTitle: 120, seoDescription: 300 } as const;

/** The banner and SEO fields from a page form, trimmed and capped; fields that weren't sent are left out. */
export function readPageText(body: Record<string, unknown>): Partial<Record<keyof typeof TEXT_LIMITS, string>> {
  const out: Partial<Record<keyof typeof TEXT_LIMITS, string>> = {};
  for (const [field, max] of Object.entries(TEXT_LIMITS) as [keyof typeof TEXT_LIMITS, number][]) {
    if (typeof body[field] === "string") out[field] = (body[field] as string).trim().slice(0, max);
  }
  return out;
}

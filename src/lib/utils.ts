export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Top-level addresses the blog already uses, so a custom page can't take them.
// "about" and "blog" are built-in pages, listed under Admin → Pages.
export const RESERVED_PAGE_SLUGS = new Set([
  "about", "admin", "api", "author", "blog", "category", "feed.xml", "newsletter",
  "og", "post", "robots.txt", "search", "sitemap.xml", "tag",
]);

/** A category is a filter on the home page's post list, so its address is /?category=its-slug. */
export function categoryHref(categoryName: string): string {
  return `/?category=${slugify(categoryName)}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const BADGE_COLORS = ["badge--navy", "badge--gold", "badge--green", "badge--gray"] as const;

export function categoryBadgeClass(categoryName: string | null | undefined, categories: { name: string }[]): string {
  if (!categoryName) return "badge--gray";
  const idx = categories.findIndex((c) => c.name === categoryName);
  if (idx === -1) return "badge--gray";
  return BADGE_COLORS[idx % BADGE_COLORS.length];
}

export function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function wordCount(html: string): number {
  const text = stripHtml(html);
  return text ? text.split(" ").length : 0;
}

/** Estimated reading time in minutes (~225 wpm), never less than 1. */
export function readingTime(html: string): number {
  return Math.max(1, Math.round(wordCount(html) / 225));
}

/** Excerpt to use in listings/meta: the explicit excerpt, or the start of the content. */
export function summarize(excerpt: string, html: string, max = 160): string {
  const text = excerpt.trim() || stripHtml(html);
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

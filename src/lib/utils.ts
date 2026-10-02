export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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

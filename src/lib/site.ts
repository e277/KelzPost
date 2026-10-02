import { db, settings, type Settings } from "@/db";
import { DEFAULT_SETTINGS } from "@/lib/defaults";

/**
 * Public, absolute base URL of the site (no trailing slash), used for RSS,
 * sitemap and Open Graph URLs. Set SITE_URL for a custom domain; on Vercel it
 * falls back to the project's production domain.
 */
export const SITE_URL = (
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  "http://localhost:3000"
).replace(/\/+$/, "");

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** The settings row, created from src/db/seed-data.json on first use. */
export async function getSettings(): Promise<Settings> {
  const row = await db.query.settings.findFirst({ where: (s, { eq }) => eq(s.id, 1) });
  if (row) return row;
  await db.insert(settings).values({ id: 1, ...DEFAULT_SETTINGS }).onConflictDoNothing();
  return (await db.query.settings.findFirst({ where: (s, { eq }) => eq(s.id, 1) }))!;
}

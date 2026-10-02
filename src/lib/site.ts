import { prisma } from "@/lib/prisma";
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

/** The settings row, created from prisma/seed-data.json on first use. */
export function getSettings() {
  return prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1, ...DEFAULT_SETTINGS } });
}

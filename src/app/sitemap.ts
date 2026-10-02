import type { MetadataRoute } from "next";
import { db } from "@/db";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, pages] = await Promise.all([
    db.query.posts.findMany({ where: (p, { eq }) => eq(p.status, "published"), columns: { slug: true, updatedAt: true } }),
    db.query.pages.findMany({ columns: { slug: true, updatedAt: true } }),
  ]);

  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
    ...posts.map((p) => ({ url: absoluteUrl(`/post/${p.slug}`), lastModified: p.updatedAt, priority: 0.8 })),
    ...pages.map((p) => ({ url: absoluteUrl(`/${p.slug}`), lastModified: p.updatedAt, priority: 0.5 })),
  ];
}

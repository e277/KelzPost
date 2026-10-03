import type { MetadataRoute } from "next";
import { db } from "@/db";
import { absoluteUrl } from "@/lib/site";
import { livePosts } from "@/lib/posts";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, pages, categories, tags] = await Promise.all([
    db.query.posts.findMany({ where: livePosts(), columns: { slug: true, updatedAt: true } }),
    db.query.pages.findMany({ columns: { slug: true, updatedAt: true } }),
    db.query.categories.findMany({ columns: { name: true } }),
    db.query.tags.findMany({ columns: { slug: true } }),
  ]);

  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
    ...posts.map((p) => ({ url: absoluteUrl(`/post/${p.slug}`), lastModified: p.updatedAt, priority: 0.8 })),
    ...pages.map((p) => ({ url: absoluteUrl(`/${p.slug}`), lastModified: p.updatedAt, priority: 0.5 })),
    ...categories.map((c) => ({ url: absoluteUrl(`/category/${slugify(c.name)}`), changeFrequency: "weekly" as const, priority: 0.6 })),
    ...tags.map((t) => ({ url: absoluteUrl(`/tag/${t.slug}`), changeFrequency: "weekly" as const, priority: 0.4 })),
  ];
}

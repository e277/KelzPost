import type { MetadataRoute } from "next";
import { and, isNotNull, ne } from "drizzle-orm";
import { adminUsers, db } from "@/db";
import { absoluteUrl } from "@/lib/site";
import { livePosts } from "@/lib/posts";
import { categoryHref } from "@/lib/utils";

// Cached; rebuilt at most once a minute, or straight away after an edit.
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, pages, categories, tags, authors] = await Promise.all([
    db.query.posts.findMany({ where: livePosts(), columns: { slug: true, updatedAt: true } }),
    db.query.pages.findMany({ columns: { slug: true, updatedAt: true } }),
    db.query.categories.findMany({ columns: { name: true } }),
    db.query.tags.findMany({ columns: { slug: true } }),
    db.query.adminUsers.findMany({ where: and(isNotNull(adminUsers.slug), ne(adminUsers.displayName, "")), columns: { slug: true } }),
  ]);

  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/blog"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
    ...posts.map((p) => ({ url: absoluteUrl(`/post/${p.slug}`), lastModified: p.updatedAt, priority: 0.8 })),
    ...pages.map((p) => ({ url: absoluteUrl(`/${p.slug}`), lastModified: p.updatedAt, priority: 0.5 })),
    ...categories.map((c) => ({ url: absoluteUrl(categoryHref(c.name)), changeFrequency: "weekly" as const, priority: 0.6 })),
    ...tags.map((t) => ({ url: absoluteUrl(`/tag/${t.slug}`), changeFrequency: "weekly" as const, priority: 0.4 })),
    ...authors.map((a) => ({ url: absoluteUrl(`/author/${a.slug}`), changeFrequency: "weekly" as const, priority: 0.4 })),
  ];
}

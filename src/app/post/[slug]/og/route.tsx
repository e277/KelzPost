import { NextResponse } from "next/server";
import { db } from "@/db";
import { getSettings } from "@/lib/site";
import { cardRelations, isLive, postByline } from "@/lib/posts";
import { formatDate, readingTime } from "@/lib/utils";
import { ogCard } from "@/lib/og-card";

export const dynamic = "force-dynamic";

/** Generated share image for a post that has no image of its own. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [settings, post] = await Promise.all([
    getSettings(),
    db.query.posts.findFirst({ where: (p, { eq }) => eq(p.slug, slug), with: cardRelations }),
  ]);
  if (!post || !isLive(post)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return ogCard(settings, {
    eyebrow: post.category?.name,
    title: post.title,
    footer: `${postByline(post, settings.authorName).name} · ${formatDate(post.publishedAt)} · ${readingTime(post.content)} min read`,
  });
}

// Moves images saved inline in the database (data URLs) to Vercel Blob and
// replaces them with Blob URLs. Runs on every Vercel build after migrations;
// it does nothing until a Blob store is connected, or once everything has
// moved. Never fails the build: anything it can't move stays where it is and
// is retried on the next deploy.
import { eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { blobConfigured, storeDataUrl } from "../lib/blob";

// Matches data URLs inside HTML attributes, e.g. <img src="data:image/png;base64,...">.
const INLINE_DATA_URL = /data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+/gi;

async function moveDataUrl(value: string): Promise<string> {
  if (!value.startsWith("data:")) return value;
  return (await storeDataUrl(value)) ?? value;
}

async function moveInlineImages(html: string): Promise<string> {
  const found = [...new Set(html.match(INLINE_DATA_URL) ?? [])];
  for (const dataUrl of found) {
    const url = await storeDataUrl(dataUrl);
    if (url) html = html.split(dataUrl).join(url);
  }
  return html;
}

async function main() {
  if (!blobConfigured()) {
    console.log("Image move skipped: no Vercel Blob store is connected.");
    return;
  }

  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql, { schema });
  let moved = 0;

  try {
    const { posts, pages, settings } = schema;
    const inlinePosts = await db
      .select({ id: posts.id, coverImage: posts.coverImage, ogImage: posts.ogImage, content: posts.content })
      .from(posts)
      .where(or(like(posts.coverImage, "data:%"), like(posts.ogImage, "data:%"), like(posts.content, "%data:image/%")));
    for (const post of inlinePosts) {
      const next = {
        coverImage: await moveDataUrl(post.coverImage),
        ogImage: await moveDataUrl(post.ogImage),
        content: await moveInlineImages(post.content),
      };
      // Raw update so the post's "last updated" date doesn't change.
      await sql`UPDATE "Post" SET "coverImage" = ${next.coverImage}, "ogImage" = ${next.ogImage}, "content" = ${next.content} WHERE "id" = ${post.id}`;
      moved++;
    }

    const inlinePages = await db
      .select({ id: pages.id, content: pages.content })
      .from(pages)
      .where(like(pages.content, "%data:image/%"));
    for (const page of inlinePages) {
      await sql`UPDATE "Page" SET "content" = ${await moveInlineImages(page.content)} WHERE "id" = ${page.id}`;
      moved++;
    }

    const [row] = await db.select({ authorAvatar: settings.authorAvatar }).from(settings).where(eq(settings.id, 1));
    if (row?.authorAvatar.startsWith("data:")) {
      await db.update(settings).set({ authorAvatar: await moveDataUrl(row.authorAvatar) }).where(eq(settings.id, 1));
      moved++;
    }

    console.log(moved ? `Moved inline images to Vercel Blob in ${moved} item(s).` : "No inline images left to move.");
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error("Image move did not finish; it will retry on the next deploy.", e);
});

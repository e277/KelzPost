import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Crawlers, link-preview fetchers and headless browsers don't count as readers.
const BOT_UA = /bot|crawl|spider|slurp|preview|fetch|curl|wget|python|httpclient|headless|lighthouse|facebookexternalhit|embedly|quora|whatsapp|telegram|discord|slack/i;

/**
 * Counts one read of a live post for today. The reader's browser sends this
 * once per post per day; signed-in team members and bots aren't counted.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const postId = typeof body.postId === "string" ? body.postId.slice(0, 64) : "";
  const ua = req.headers.get("user-agent") || "";
  if (!postId || !ua || BOT_UA.test(ua)) return new NextResponse(null, { status: 204 });
  if (await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) return new NextResponse(null, { status: 204 });

  // Only posts visitors can see are counted, in one statement.
  await db.execute(sql`
    INSERT INTO "PostView" ("postId", "day", "views")
    SELECT "id", current_date, 1 FROM "Post"
    WHERE "id" = ${postId} AND "status" = 'published' AND "publishedAt" <= now()
    ON CONFLICT ("postId", "day") DO UPDATE SET "views" = "PostView"."views" + 1
  `);
  return new NextResponse(null, { status: 204 });
}

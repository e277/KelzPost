import { sql } from "drizzle-orm";
import { db } from "@/db";

export type DailyViews = { day: string; views: number };
export type PostViewTotals = { total: number; recent: number };

export type ReadershipStats = {
  /** One entry per day for the last 30 days, oldest first. */
  days: DailyViews[];
  last30: number;
  previous30: number;
  allTime: number;
  byPost: Record<string, PostViewTotals>;
};

/**
 * View counts for the dashboard. Days follow the database's calendar, the
 * same one /api/views counts in. With an author id, only that author's posts count.
 */
export async function getReadershipStats(authorId?: string): Promise<ReadershipStats> {
  const ownPosts = authorId
    ? sql`AND v."postId" IN (SELECT "id" FROM "Post" WHERE "authorId" = ${authorId})`
    : sql``;

  const [days, perPost] = await Promise.all([
    db.execute<DailyViews>(sql`
      SELECT to_char(d, 'YYYY-MM-DD') AS "day", COALESCE(SUM(v."views"), 0)::int AS "views"
      FROM generate_series(current_date - 29, current_date, interval '1 day') AS d
      LEFT JOIN "PostView" v ON v."day" = d::date ${ownPosts}
      GROUP BY d ORDER BY d
    `),
    db.execute<{ postId: string; total: number; recent: number; previous: number }>(sql`
      SELECT v."postId",
        SUM(v."views")::int AS "total",
        SUM(CASE WHEN v."day" > current_date - 30 THEN v."views" ELSE 0 END)::int AS "recent",
        SUM(CASE WHEN v."day" <= current_date - 30 AND v."day" > current_date - 60 THEN v."views" ELSE 0 END)::int AS "previous"
      FROM "PostView" v
      WHERE true ${ownPosts}
      GROUP BY v."postId"
    `),
  ]);

  const byPost: Record<string, PostViewTotals> = {};
  let last30 = 0;
  let previous30 = 0;
  let allTime = 0;
  for (const row of perPost) {
    byPost[row.postId] = { total: row.total, recent: row.recent };
    last30 += row.recent;
    previous30 += row.previous;
    allTime += row.total;
  }
  return { days: [...days], last30, previous30, allTime, byPost };
}

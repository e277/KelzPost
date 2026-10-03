import { and, desc, ilike, or, sql } from "drizzle-orm";
import { db, posts, postSearchDocument } from "@/db";
import { cardRelations, livePosts, toPostSummary, type DefaultAuthor, type PostSummary } from "@/lib/posts";

export type SearchResult = PostSummary & {
  /** Matching passage as HTML-escaped text with matched words wrapped in <mark>. */
  snippet: string;
};

const MAX_RESULTS = 30;
// Markers ts_headline puts around matches; they can't appear in post text, so
// the rest can be escaped safely before they're turned into <mark> tags.
const START = "\u0001";
const STOP = "\u0002";

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function toSnippet(headline: string): string {
  const text = escapeHtml(decodeEntities(headline).replace(/\s+/g, " ").trim());
  return text.replaceAll(START, "<mark>").replaceAll(STOP, "</mark>");
}

/**
 * Searches live posts with Postgres full-text search (English stemming, so
 * "writing" finds "write"; supports "quoted phrases", OR and -exclusions).
 * Falls back to a plain substring match on titles and excerpts when the full
 * text search finds nothing, so partial words still turn something up.
 */
export async function searchPosts(rawQuery: string, defaultAuthor: DefaultAuthor): Promise<SearchResult[]> {
  const q = rawQuery.trim().slice(0, 200);
  if (!q) return [];

  const query = sql`websearch_to_tsquery('english', ${q})`;
  const document = postSearchDocument(posts);
  const bodyText = sql`regexp_replace(${posts.content}, '<[^>]+>', ' ', 'g')`;
  const headlineOptions = `StartSel=${START}, StopSel=${STOP}, MaxWords=35, MinWords=15, MaxFragments=2, FragmentDelimiter=" … "`;

  let rows = await db.query.posts.findMany({
    where: and(livePosts(), sql`${document} @@ ${query}`),
    with: cardRelations,
    extras: {
      headline: sql<string>`ts_headline('english', ${bodyText}, ${query}, ${headlineOptions})`.as("headline"),
    },
    orderBy: [desc(sql`ts_rank(${document}, ${query})`), desc(posts.publishedAt)],
    limit: MAX_RESULTS,
  });

  if (rows.length === 0) {
    const pattern = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    rows = await db.query.posts.findMany({
      where: and(livePosts(), or(ilike(posts.title, pattern), ilike(posts.excerpt, pattern))),
      with: cardRelations,
      extras: { headline: sql<string>`''`.as("headline") },
      orderBy: [desc(posts.publishedAt)],
      limit: MAX_RESULTS,
    });
  }

  return rows.map((row) => {
    const summary = toPostSummary(row, defaultAuthor);
    const snippet = row.headline?.trim() ? toSnippet(row.headline) : escapeHtml(summary.summary);
    return { ...summary, snippet };
  });
}

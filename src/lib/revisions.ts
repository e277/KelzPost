import { desc, eq, sql } from "drizzle-orm";
import { db, postRevisions, type Post } from "@/db";

/** Versions kept per post; older ones are deleted. */
const KEEP = 50;
/** Autosaves add a version at most this often; manual saves always do. */
const AUTOSAVE_GAP_MS = 10 * 60 * 1000;

type Snapshot = Pick<Post, "title" | "excerpt" | "content">;

const same = (a: Snapshot, b: Snapshot) => a.title === b.title && a.excerpt === b.excerpt && a.content === b.content;

/**
 * Adds the just-saved state of a post to its version history. The first time
 * a post is saved with history, the version it had before is kept as well.
 */
export async function recordRevision(
  postId: string,
  saved: Snapshot,
  { savedBy, autosave = false, before }: { savedBy: string; autosave?: boolean; before?: Snapshot & { updatedAt: Date } }
): Promise<void> {
  const latest = await db.query.postRevisions.findFirst({
    where: eq(postRevisions.postId, postId),
    orderBy: desc(postRevisions.createdAt),
  });

  if (!latest && before && !same(before, saved)) {
    await db.insert(postRevisions).values({
      postId,
      title: before.title,
      excerpt: before.excerpt,
      content: before.content,
      createdAt: before.updatedAt,
    });
  }
  if (latest && same(latest, saved)) return;
  if (autosave && latest && Date.now() - latest.createdAt.getTime() < AUTOSAVE_GAP_MS) return;

  await db.insert(postRevisions).values({ postId, title: saved.title, excerpt: saved.excerpt, content: saved.content, savedBy });
  await db.execute(sql`
    DELETE FROM "PostRevision" WHERE "postId" = ${postId} AND "id" NOT IN (
      SELECT "id" FROM "PostRevision" WHERE "postId" = ${postId} ORDER BY "createdAt" DESC LIMIT ${KEEP}
    )
  `);
}

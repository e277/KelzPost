import { desc, eq } from "drizzle-orm";
import { comments, db, posts } from "@/db";
import { getSettings } from "@/lib/site";
import { formatDate } from "@/lib/utils";
import { COMMENT_STATUSES, isCommentStatus } from "@/lib/comments";
import { AdminShell } from "@/components/admin/admin-shell";
import { CommentsModeration, type AdminComment } from "@/components/admin/comments-moderation";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: requested } = await searchParams;
  const status = isCommentStatus(requested) ? requested : "pending";

  const [settings, counts, rows] = await Promise.all([
    getSettings(),
    Promise.all(COMMENT_STATUSES.map((s) => db.$count(comments, eq(comments.status, s)))),
    db
      .select({ comment: comments, postTitle: posts.title, postSlug: posts.slug })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .where(eq(comments.status, status))
      .orderBy(desc(comments.createdAt))
      .limit(200),
  ]);

  const parentIds = rows.map((r) => r.comment.parentId).filter((id): id is string => !!id);
  const parents = parentIds.length
    ? await db.query.comments.findMany({
        where: (c, { inArray }) => inArray(c.id, parentIds),
        columns: { id: true, authorName: true },
      })
    : [];
  const parentName = new Map(parents.map((p) => [p.id, p.authorName]));

  const list: AdminComment[] = rows.map(({ comment: c, postTitle, postSlug }) => ({
    id: c.id,
    postId: c.postId,
    postTitle,
    postSlug,
    replyingTo: c.parentId ? parentName.get(c.parentId) ?? "a comment" : null,
    authorName: c.authorName,
    authorEmail: c.authorEmail,
    content: c.content,
    isAuthor: c.isAuthor,
    status: c.status,
    date: formatDate(c.createdAt),
  }));

  return (
    <AdminShell blogTitle={settings.blogTitle} active="comments" title="Comments">
      <CommentsModeration
        status={status}
        counts={Object.fromEntries(COMMENT_STATUSES.map((s, i) => [s, counts[i]])) as Record<(typeof COMMENT_STATUSES)[number], number>}
        comments={list}
      />
    </AdminShell>
  );
}

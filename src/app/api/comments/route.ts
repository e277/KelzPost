import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { comments, db, posts } from "@/db";
import { getCurrentUser } from "@/lib/current-user";
import { refreshPublicPages } from "@/lib/revalidate";
import { memberName } from "@/lib/team";
import { getSettings } from "@/lib/site";
import { livePosts } from "@/lib/posts";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { COMMENT_LIMITS, looksLikeSpam, parseCommentInput } from "@/lib/comments";

const MAX_COMMENTS = 5;
const WINDOW_MS = 10 * 60 * 1000;
// Real people take a few seconds to write a comment; bots post instantly.
const MIN_FILL_MS = 3000;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const session = await getCurrentUser();

  const postId = typeof body.postId === "string" ? body.postId : "";
  const post = postId
    ? await db.query.posts.findFirst({ where: and(eq(posts.id, postId), livePosts()), columns: { id: true } })
    : null;
  if (!post) return NextResponse.json({ error: "This post isn't accepting comments." }, { status: 404 });

  // Replies stay one level deep: answering a reply joins its parent's thread.
  let parentId: string | null = null;
  let parentStatus: string | null = null;
  if (typeof body.parentId === "string" && body.parentId) {
    const parent = await db.query.comments.findFirst({
      where: and(eq(comments.id, body.parentId), eq(comments.postId, post.id)),
      columns: { id: true, parentId: true, status: true },
    });
    if (!parent || (!session && parent.status !== "approved")) {
      return NextResponse.json({ error: "That comment is no longer available." }, { status: 404 });
    }
    parentId = parent.parentId ?? parent.id;
    parentStatus = parent.status;
  }

  // Signed-in team members reply under their own name, approved straight away.
  if (session) {
    const content = typeof body.content === "string" ? body.content.replace(/\r\n?/g, "\n").trim() : "";
    if (!content) return NextResponse.json({ error: "Please write a comment." }, { status: 400 });
    if (content.length > COMMENT_LIMITS.content) {
      return NextResponse.json({ error: `Comments can be up to ${COMMENT_LIMITS.content} characters.` }, { status: 400 });
    }

    const settings = await getSettings();
    // Replying to a comment that is still waiting means it is fine to show.
    if (parentId && parentStatus === "pending") {
      await db.update(comments).set({ status: "approved" }).where(inArray(comments.id, [body.parentId, parentId]));
    }
    const [created] = await db
      .insert(comments)
      .values({ postId: post.id, parentId, authorName: memberName(session, settings.authorName), content, status: "approved", isAuthor: true })
      .returning();
    refreshPublicPages();
    return NextResponse.json(created, { status: 201 });
  }

  // Bots fill in the hidden "website" field and submit straight away. Pretend it worked.
  const startedAt = Number(body.startedAt);
  if (body.website || !Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FILL_MS) {
    return NextResponse.json({ status: "pending" }, { status: 202 });
  }

  const limit = await rateLimit(`comment:${clientIp(req.headers)}`, MAX_COMMENTS, WINDOW_MS);
  if (!limit.allowed) {
    const minutes = Math.ceil(limit.retryAfterSec / 60);
    return NextResponse.json(
      { error: `You're commenting a lot. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const input = parseCommentInput(body);
  if ("error" in input) return NextResponse.json(input, { status: 400 });

  await db.insert(comments).values({
    postId: post.id,
    parentId,
    authorName: input.name,
    authorEmail: input.email,
    content: input.content,
    status: looksLikeSpam(input.content) ? "spam" : "pending",
  });

  // Every visitor comment waits for approval, so nothing about it is returned.
  return NextResponse.json({ status: "pending" }, { status: 202 });
}

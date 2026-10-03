import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { getSettings } from "@/lib/site";
import { canEditPost, requirePageUser } from "@/lib/current-user";
import { getPostTags, isLive, isScheduled, postByline, postPageRelations, renderPostBody } from "@/lib/posts";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PostArticle } from "@/components/post-article";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

/** Admin-only preview of any post (drafts included), rendered exactly like the public page. */
export default async function PreviewPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser();
  const [settings, categories, post] = await Promise.all([
    getSettings(),
    db.query.categories.findMany({ orderBy: (c, { asc }) => asc(c.order) }),
    db.query.posts.findFirst({ where: (p, { eq }) => eq(p.id, id), with: postPageRelations }),
  ]);

  if (!post || !canEditPost(user, post)) notFound();

  const tags = await getPostTags(post.id);
  const { html, toc } = renderPostBody(post.content);

  return (
    <>
      <div className="preview-banner">
        <span>
          <strong>Preview</strong> —{" "}
          {isLive(post)
            ? "this post is live."
            : isScheduled(post)
              ? `this post is scheduled for ${post.publishedAt!.toUTCString()}.`
              : "this draft is not visible to visitors."}
        </span>
        <Link href={`/admin/posts/${post.id}`}>← Back to editor</Link>
      </div>
      <SiteHeader settings={settings} />
      <main>
        <div className="post-wrapper">
          <PostArticle post={post} categories={categories} byline={postByline(post, settings.authorName)} tags={tags} bodyHtml={html} toc={toc} />
        </div>
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}

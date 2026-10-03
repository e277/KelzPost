import { db } from "@/db";
import { livePosts } from "@/lib/posts";
import { getSettings, absoluteUrl, SITE_URL } from "@/lib/site";
import { escapeXml, summarize } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const [settings, posts] = await Promise.all([
    getSettings(),
    db.query.posts.findMany({
      where: livePosts(),
      with: { category: true },
      orderBy: (p, { desc }) => [desc(p.publishedAt), desc(p.createdAt)],
      limit: 30,
    }),
  ]);

  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/post/${post.slug}`);
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${(post.publishedAt || post.createdAt).toUTCString()}</pubDate>
      <dc:creator>${escapeXml(post.author || settings.authorName)}</dc:creator>${
        post.category ? `\n      <category>${escapeXml(post.category.name)}</category>` : ""
      }
      <description>${escapeXml(summarize(post.excerpt, post.content, 300))}</description>
      <content:encoded><![CDATA[${post.content.replace(/]]>/g, "]]]]><![CDATA[>")}]]></content:encoded>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(settings.blogTitle)}</title>
    <link>${SITE_URL}/</link>
    <description>${escapeXml(settings.tagline)}</description>
    <language>en</language>
    <atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml" />${
      posts[0] ? `\n    <lastBuildDate>${(posts[0].publishedAt || posts[0].createdAt).toUTCString()}</lastBuildDate>` : ""
    }
${items}
  </channel>
</rss>
`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}

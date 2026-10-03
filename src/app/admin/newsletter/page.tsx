import { desc } from "drizzle-orm";
import { db, subscribers } from "@/db";
import { missingMailerSettings } from "@/lib/mailer";
import { livePosts } from "@/lib/posts";
import { AdminShell } from "@/components/admin/admin-shell";
import { NewsletterManager } from "@/components/admin/newsletter-manager";
import { requirePageUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  await requirePageUser("admin");
  const [subscriberRows, recentPosts] = await Promise.all([
    db
      .select({
        id: subscribers.id,
        email: subscribers.email,
        status: subscribers.status,
        createdAt: subscribers.createdAt,
        confirmedAt: subscribers.confirmedAt,
      })
      .from(subscribers).orderBy(desc(subscribers.createdAt)),
    db.query.posts.findMany({
      where: livePosts(),
      columns: { id: true, title: true, slug: true, publishedAt: true, newsletterSentAt: true },
      orderBy: (p, { desc }) => [desc(p.publishedAt)],
      limit: 15,
    }),
  ]);

  return (
    <AdminShell
     
      active="newsletter"
      title="Newsletter"
      actions={
        subscriberRows.length > 0 ? (
          <a href="/admin/newsletter/export" className="btn btn--ghost btn--sm" download>
            Export CSV
          </a>
        ) : null
      }
    >
      <NewsletterManager
        subscribers={subscriberRows}
        posts={recentPosts}
        missingSettings={missingMailerSettings()}
      />
    </AdminShell>
  );
}

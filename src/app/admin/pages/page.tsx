import Link from "next/link";
import { db } from "@/db";
import { getSettings } from "@/lib/site";
import { AdminShell } from "@/components/admin/admin-shell";
import { formatDate } from "@/lib/utils";
import { requirePageUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  await requirePageUser("admin");
  const [settings, pages] = await Promise.all([
    getSettings(),
    db.query.pages.findMany({ orderBy: (p, { asc }) => asc(p.createdAt) }),
  ]);

  return (
    <AdminShell
      blogTitle={settings.blogTitle}
      active="pages"
      title="Pages"
      actions={
        <Link href="/admin/pages/new" className="btn btn--primary btn--sm">
          + New Page
        </Link>
      }
    >
      {pages.length === 0 ? (
        <div className="dash-empty">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.5} width="48" height="48">
            <rect x="8" y="4" width="32" height="40" rx="3" />
            <path d="M16 16h16M16 22h16M16 28h10" />
          </svg>
          <p>No pages yet.</p>
          <Link href="/admin/pages/new" className="btn btn--primary btn--sm">
            Create your first page
          </Link>
        </div>
      ) : (
        <div className="dash-posts">
          {pages.map((page) => (
            <div className="dash-post-row" key={page.id}>
              <div className="dash-post-row__info">
                <Link href={`/admin/pages/${page.id}`} className="dash-post-row__title">
                  {page.title}
                </Link>
                <span className="dash-post-row__meta">
                  /{page.slug} · Updated {formatDate(page.updatedAt)}
                </span>
              </div>
              <div className="dash-post-row__actions">
                <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm">
                  View
                </a>
                <Link href={`/admin/pages/${page.id}`} className="btn btn--ghost btn--sm">
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}

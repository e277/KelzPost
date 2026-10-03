import Link from "next/link";
import { db } from "@/db";
import { getSettings } from "@/lib/site";
import { AdminShell } from "@/components/admin/admin-shell";
import { NavigationEditor } from "@/components/admin/navigation-editor";
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
      <div className="dash-posts">
        <div className="dash-post-row">
          <div className="dash-post-row__info">
            <Link href="/admin/pages/about" className="dash-post-row__title">
              {settings.aboutTitle || "About"} <span className="badge badge--gray">Built-in</span>
            </Link>
            <span className="dash-post-row__meta">/about · Shows your author photo, name and bio above the content</span>
          </div>
          <div className="dash-post-row__actions">
            <a href="/about" target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm">
              View
            </a>
            <Link href="/admin/pages/about" className="btn btn--ghost btn--sm">
              Edit
            </Link>
          </div>
        </div>
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
        {pages.length === 0 && (
          <div className="dash-post-row dash-post-row--hint">
            <span>Add more pages, such as Contact or Privacy, with New Page. Add them to your header under Site Navigation below.</span>
          </div>
        )}
      </div>

      <NavigationEditor
        navLinks={settings.navLinks}
        pages={[
          { label: settings.aboutTitle || "About", href: "/about" },
          ...pages.map((p) => ({ label: p.title, href: `/${p.slug}` })),
        ]}
      />
    </AdminShell>
  );
}

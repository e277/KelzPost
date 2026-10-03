import Link from "next/link";
import type { ReactNode } from "react";
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
     
      active="pages"
      title="Pages"
      actions={
        <Link href="/admin/pages/new" className="btn btn--primary btn--sm">
          + New Page
        </Link>
      }
    >
      <div className="dash-posts">
        <PageRow
          title={<>{settings.aboutTitle || "About"} <span className="badge badge--gray">Built-in</span></>}
          meta="/about · Shows your author photo, name and bio above the content"
          editHref="/admin/pages/about"
          viewHref="/about"
        />
        {pages.map((page) => (
          <PageRow
            key={page.id}
            title={page.title}
            meta={`/${page.slug} · Updated ${formatDate(page.updatedAt)}`}
            editHref={`/admin/pages/${page.id}`}
            viewHref={`/${page.slug}`}
          />
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

function PageRow({ title, meta, editHref, viewHref }: { title: ReactNode; meta: string; editHref: string; viewHref: string }) {
  return (
    <div className="dash-post-row">
      <div className="dash-post-row__info">
        <Link href={editHref} className="dash-post-row__title">
          {title}
        </Link>
        <span className="dash-post-row__meta">{meta}</span>
      </div>
      <div className="dash-post-row__actions">
        <a href={viewHref} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm">
          View
        </a>
        <Link href={editHref} className="btn btn--ghost btn--sm">
          Edit
        </Link>
      </div>
    </div>
  );
}

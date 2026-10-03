import Link from "next/link";
import { db } from "@/db";
import { getSettings } from "@/lib/site";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageList, type PageListRow } from "@/components/admin/page-list";
import { formatDate } from "@/lib/utils";
import { listMenuPages, menuPageIds } from "@/lib/navigation";
import { ensureBuiltInPages, isBuiltInPage, pageHref } from "@/lib/site-pages";
import { requirePageUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

const BUILT_IN_NOTES: Record<string, string> = {
  home: "The hero and intro above your posts, with your categories as filters",
  about: "Shows your author photo, name and bio above the content",
};

export default async function AdminPagesPage() {
  await requirePageUser("admin");
  await ensureBuiltInPages();
  const [settings, pages, menuPages] = await Promise.all([
    getSettings(),
    db.query.pages.findMany({ orderBy: (p, { asc }) => asc(p.createdAt) }),
    listMenuPages(),
  ]);

  const order = (kind: string) => (kind === "home" ? 0 : kind === "about" ? 1 : 2);
  const rows: PageListRow[] = [...pages]
    .sort((a, b) => order(a.kind) - order(b.kind))
    .map((page) => ({
      id: page.id,
      title: page.title,
      builtIn: isBuiltInPage(page),
      meta: isBuiltInPage(page)
        ? `${pageHref(page)} · ${BUILT_IN_NOTES[page.kind] ?? "Built-in page"}`
        : `${pageHref(page)} · Updated ${formatDate(page.updatedAt)}`,
      viewHref: pageHref(page),
      editHref: `/admin/pages/${page.id}`,
    }));

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
      <p className="settings-section-note">
        Your site&apos;s header menu is made from these pages: tick In menu to show a page there, and use the arrows to set the order. A new page goes into the menu when you create it, unless you untick Show in navigation.
      </p>
      <PageList rows={rows} menu={menuPageIds(settings.navLinks, menuPages)} />
    </AdminShell>
  );
}

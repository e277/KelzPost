import Link from "next/link";
import { db } from "@/db";
import { getSettings } from "@/lib/site";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageList, type PageListRow } from "@/components/admin/page-list";
import { formatDate } from "@/lib/utils";
import { ABOUT_PAGE_ID, BLOG_PAGE_ID, HOME_PAGE_ID } from "@/lib/nav-links";
import { listMenuPages, menuPageIds } from "@/lib/navigation";
import { requirePageUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  await requirePageUser("admin");
  const [settings, pages, menuPages] = await Promise.all([
    getSettings(),
    db.query.pages.findMany({ orderBy: (p, { asc }) => asc(p.createdAt) }),
    listMenuPages(),
  ]);

  const rows: PageListRow[] = [
    {
      id: HOME_PAGE_ID,
      title: "Home",
      builtIn: true,
      meta: "/ · Your newest posts under the homepage hero",
      viewHref: "/",
      editHref: "/admin/configurations",
      editLabel: "Configure",
    },
    {
      id: BLOG_PAGE_ID,
      title: "Blog",
      builtIn: true,
      meta: "/blog · Every post, with your categories as filters along the top",
      viewHref: "/blog",
      editHref: "/admin/categories",
      editLabel: "Categories",
    },
    {
      id: ABOUT_PAGE_ID,
      title: settings.aboutTitle || "About",
      builtIn: true,
      meta: "/about · Shows your author photo, name and bio above the content",
      viewHref: "/about",
      editHref: "/admin/pages/about",
    },
    ...pages.map((page) => ({
      id: page.id,
      title: page.title,
      meta: `/${page.slug} · Updated ${formatDate(page.updatedAt)}`,
      viewHref: `/${page.slug}`,
      editHref: `/admin/pages/${page.id}`,
    })),
  ];

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

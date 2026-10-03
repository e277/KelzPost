import { notFound } from "next/navigation";
import { db } from "@/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageEditor } from "@/components/admin/page-editor";
import { requirePageUser } from "@/lib/current-user";
import { getSettings } from "@/lib/site";
import { isPageInNav } from "@/lib/navigation";
import { BUILT_IN_PAGES, getBuiltInPage } from "@/lib/site-pages";

export const dynamic = "force-dynamic";

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageUser("admin");
  const { id } = await params;
  const [page, settings] = await Promise.all([
    // Home and About are created on first use, so their editors always open.
    id in BUILT_IN_PAGES
      ? getBuiltInPage(id as keyof typeof BUILT_IN_PAGES)
      : db.query.pages.findFirst({ where: (p, { eq }) => eq(p.id, id) }),
    getSettings(),
  ]);

  if (!page) notFound();

  return (
    <AdminShell active="pages" title={page.title}>
      <PageEditor
        page={page}
        inNav={isPageInNav(settings.navLinks, page)}
        defaults={{ heading: settings.blogTitle, subheading: settings.tagline }}
        author={
          page.kind === "about"
            ? { name: settings.authorName, bio: settings.authorBio, avatar: settings.authorAvatar }
            : undefined
        }
      />
    </AdminShell>
  );
}

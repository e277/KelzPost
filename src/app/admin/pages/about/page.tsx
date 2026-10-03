import { getSettings } from "@/lib/site";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageEditor } from "@/components/admin/page-editor";
import { requirePageUser } from "@/lib/current-user";
import { isPageInNav } from "@/lib/navigation";
import { ABOUT_PAGE_ID } from "@/lib/nav-links";

export const dynamic = "force-dynamic";

export default async function EditAboutPage() {
  await requirePageUser("admin");
  const settings = await getSettings();
  const title = settings.aboutTitle || "About";

  return (
    <AdminShell active="pages" title={title}>
      <PageEditor
        page={null}
        inNav={isPageInNav(settings.navLinks, { id: ABOUT_PAGE_ID, title, slug: "about" })}
        about={{
          title,
          content: settings.aboutContent,
          authorName: settings.authorName,
          authorBio: settings.authorBio,
          authorAvatar: settings.authorAvatar,
        }}
      />
    </AdminShell>
  );
}

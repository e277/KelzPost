import { getSettings } from "@/lib/site";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageEditor } from "@/components/admin/page-editor";
import { requirePageUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function EditAboutPage() {
  await requirePageUser("admin");
  const settings = await getSettings();
  const title = settings.aboutTitle || "About";

  return (
    <AdminShell active="pages" title={title}>
      <PageEditor
        page={null}
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

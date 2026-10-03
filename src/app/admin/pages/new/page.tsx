import { getSettings } from "@/lib/site";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageEditor } from "@/components/admin/page-editor";
import { requirePageUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function NewPagePage() {
  await requirePageUser("admin");
  const settings = await getSettings();

  return (
    <AdminShell blogTitle={settings.blogTitle} active="pages" title="New Page">
      <PageEditor page={null} />
    </AdminShell>
  );
}

import { getSettings } from "@/lib/site";
import { AdminShell } from "@/components/admin/admin-shell";
import { ConfigurationsForm } from "@/components/admin/configurations-form";
import { requirePageUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function AdminConfigurationsPage() {
  await requirePageUser("admin");
  const settings = await getSettings();

  return (
    <AdminShell active="configurations" title="Configurations">
      <ConfigurationsForm settings={settings} />
    </AdminShell>
  );
}

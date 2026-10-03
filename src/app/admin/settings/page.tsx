import { getSettings } from "@/lib/site";
import { AdminShell } from "@/components/admin/admin-shell";
import { SettingsForm } from "@/components/admin/settings-form";
import { requirePageUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requirePageUser("admin");
  const settings = await getSettings();

  return (
    <AdminShell active="settings" title="Settings">
      <SettingsForm settings={settings} />
    </AdminShell>
  );
}

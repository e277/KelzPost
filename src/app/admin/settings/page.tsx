import { db } from "@/db";
import { getSettings } from "@/lib/site";
import { AdminShell } from "@/components/admin/admin-shell";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [settings, categories] = await Promise.all([
    getSettings(),
    db.query.categories.findMany({ orderBy: (c, { asc }) => asc(c.order) }),
  ]);

  return (
    <AdminShell blogTitle={settings.blogTitle} active="settings" title="Settings">
      <SettingsForm settings={settings} categories={categories} />
    </AdminShell>
  );
}

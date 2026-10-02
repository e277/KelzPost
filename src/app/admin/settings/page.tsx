import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/site";
import { AdminShell } from "@/components/admin/admin-shell";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [settings, categories] = await Promise.all([
    getSettings(),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <AdminShell blogTitle={settings.blogTitle} active="settings" title="Settings">
      <SettingsForm settings={settings} categories={categories} />
    </AdminShell>
  );
}

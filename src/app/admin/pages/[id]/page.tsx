import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/site";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageEditor } from "@/components/admin/page-editor";

export const dynamic = "force-dynamic";

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [settings, page] = await Promise.all([
    getSettings(),
    prisma.page.findUnique({ where: { id } }),
  ]);

  if (!page) notFound();

  return (
    <AdminShell blogTitle={settings.blogTitle} active="pages" title={page.title}>
      <PageEditor page={page} />
    </AdminShell>
  );
}

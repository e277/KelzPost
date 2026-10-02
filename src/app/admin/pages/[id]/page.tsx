import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageEditor } from "@/components/admin/page-editor";

export const dynamic = "force-dynamic";

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [settings, page] = await Promise.all([
    prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } }),
    prisma.page.findUnique({ where: { id } }),
  ]);

  if (!page) notFound();

  return (
    <AdminShell blogTitle={settings.blogTitle} active="pages" title={page.title}>
      <PageEditor page={page} />
    </AdminShell>
  );
}

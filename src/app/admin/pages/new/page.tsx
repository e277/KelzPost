import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageEditor } from "@/components/admin/page-editor";

export const dynamic = "force-dynamic";

export default async function NewPagePage() {
  const settings = await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  return (
    <AdminShell blogTitle={settings.blogTitle} active="pages" title="New Page">
      <PageEditor page={null} />
    </AdminShell>
  );
}

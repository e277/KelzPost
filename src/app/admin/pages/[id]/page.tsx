import { notFound } from "next/navigation";
import { db } from "@/db";
import { getSettings } from "@/lib/site";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageEditor } from "@/components/admin/page-editor";

export const dynamic = "force-dynamic";

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [settings, page] = await Promise.all([
    getSettings(),
    db.query.pages.findFirst({ where: (p, { eq }) => eq(p.id, id) }),
  ]);

  if (!page) notFound();

  return (
    <AdminShell blogTitle={settings.blogTitle} active="pages" title={page.title}>
      <PageEditor page={page} />
    </AdminShell>
  );
}

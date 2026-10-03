import { notFound } from "next/navigation";
import { db } from "@/db";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageEditor } from "@/components/admin/page-editor";
import { requirePageUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageUser("admin");
  const { id } = await params;
  const page = await db.query.pages.findFirst({ where: (p, { eq }) => eq(p.id, id) });

  if (!page) notFound();

  return (
    <AdminShell active="pages" title={page.title}>
      <PageEditor page={page} />
    </AdminShell>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/current-user";
import { listMenuPages, saveMenu } from "@/lib/navigation";
import { refreshPublicPages } from "@/lib/revalidate";

// Sets which pages are in the header menu and in what order (Admin → Pages).
export async function PUT(req: NextRequest) {
  const { error } = await requireUser("admin");
  if (error) return error;

  const { pageIds } = await req.json().catch(() => ({}));
  if (!Array.isArray(pageIds) || !pageIds.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "pageIds must be a list of page ids." }, { status: 400 });
  }
  const saved = await saveMenu(pageIds, await listMenuPages());
  refreshPublicPages();
  return NextResponse.json({ pageIds: saved });
}

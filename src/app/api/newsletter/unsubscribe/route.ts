import { NextRequest, NextResponse } from "next/server";
import { unsubscribe } from "@/lib/newsletter";

/**
 * Unsubscribes the reader the token belongs to. Used by the unsubscribe page
 * and by mail apps' one-click "Unsubscribe" button (List-Unsubscribe-Post),
 * which posts here with the token in the query string.
 */
export async function POST(req: NextRequest) {
  const fromQuery = req.nextUrl.searchParams.get("token");
  const body = fromQuery ? {} : await req.json().catch(() => ({}));
  const token = fromQuery || (typeof body.token === "string" ? body.token : "");

  if (!(await unsubscribe(token))) return NextResponse.json({ error: "This unsubscribe link isn't valid." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

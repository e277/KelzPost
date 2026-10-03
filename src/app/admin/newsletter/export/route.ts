import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db, subscribers } from "@/db";
import { requireUser } from "@/lib/current-user";

// Quotes cells that need it and defuses values a spreadsheet would run as a formula.
function csvCell(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Downloads the subscriber list as CSV, e.g. to move it to another email service. */
export async function GET() {
  const { error } = await requireUser("admin");
  if (error) return error;

  const rows = await db.select().from(subscribers).orderBy(asc(subscribers.createdAt));
  const lines = [
    "email,status,signed_up,confirmed",
    ...rows.map((s) =>
      [s.email, s.status, s.createdAt.toISOString(), s.confirmedAt?.toISOString() ?? ""].map(csvCell).join(",")
    ),
  ];

  return new NextResponse(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

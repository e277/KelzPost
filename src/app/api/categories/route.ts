import { NextRequest, NextResponse } from "next/server";
import { asc, eq, max } from "drizzle-orm";
import { db, categories } from "@/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const rows = await db.select().from(categories).orderBy(asc(categories.order));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  const trimmed = (name || "").trim();
  if (!trimmed) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const existing = await db.query.categories.findFirst({ where: eq(categories.name, trimmed) });
  if (existing) return NextResponse.json({ error: "Category already exists." }, { status: 409 });

  const [{ last }] = await db.select({ last: max(categories.order) }).from(categories);
  const [category] = await db
    .insert(categories)
    .values({ name: trimmed, order: last === null ? 0 : last + 1 })
    .returning();

  return NextResponse.json(category, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { asc, max } from "drizzle-orm";
import { db, categories } from "@/db";
import { requireUser } from "@/lib/current-user";
import { refreshPublicPages } from "@/lib/revalidate";
import { slugify } from "@/lib/utils";

export async function GET() {
  const rows = await db.select().from(categories).orderBy(asc(categories.order));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { error } = await requireUser("admin");
  if (error) return error;

  const { name } = await req.json();
  const trimmed = (name || "").trim();
  if (!trimmed) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const all = await db.select({ name: categories.name }).from(categories);
  if (all.some((c) => slugify(c.name) === slugify(trimmed))) {
    return NextResponse.json({ error: "That category already exists." }, { status: 409 });
  }

  const [{ last }] = await db.select({ last: max(categories.order) }).from(categories);
  const [category] = await db
    .insert(categories)
    .values({ name: trimmed, order: last === null ? 0 : last + 1 })
    .returning();

  refreshPublicPages();
  return NextResponse.json(category, { status: 201 });
}

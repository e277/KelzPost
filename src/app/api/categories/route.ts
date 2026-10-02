import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  const trimmed = (name || "").trim();
  if (!trimmed) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const existing = await prisma.category.findFirst({
    where: { name: { equals: trimmed } },
  });
  if (existing) return NextResponse.json({ error: "Category already exists." }, { status: 409 });

  const count = await prisma.category.count();
  const category = await prisma.category.create({ data: { name: trimmed, order: count } });

  return NextResponse.json(category, { status: 201 });
}

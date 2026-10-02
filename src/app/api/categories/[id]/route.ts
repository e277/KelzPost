import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name, order } = await req.json();

  const data: { name?: string; order?: number } = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (typeof order === "number") data.order = order;

  const category = await prisma.category.update({ where: { id }, data });
  return NextResponse.json(category);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  // Detach posts referencing this category before deleting
  await prisma.post.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
  await prisma.category.delete({ where: { id } }).catch(() => null);

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(page);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { title, content, slug: rawSlug } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const desiredSlug = rawSlug?.trim() ? slugify(rawSlug.trim()) : slugify(title.trim());
  const existing = await prisma.page.findUnique({ where: { slug: desiredSlug } });
  if (existing && existing.id !== id) {
    return NextResponse.json({ error: "That slug is already in use." }, { status: 409 });
  }

  const page = await prisma.page.update({
    where: { id },
    data: { title: title.trim(), slug: desiredSlug, content: content || "" },
  });
  return NextResponse.json(page);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.page.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

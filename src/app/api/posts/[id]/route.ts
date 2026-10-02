import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  const post = await prisma.post.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (post.status !== "published" && !session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const title = (body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const status = body.status === "published" ? "published" : "draft";

  const post = await prisma.post.update({
    where: { id },
    data: {
      title,
      excerpt: body.excerpt || "",
      content: body.content || "",
      coverImage: body.coverImage || "",
      status,
      author: body.author || "",
      categoryId: body.categoryId || null,
      publishedAt: status === "published" ? (existing.publishedAt || new Date()) : existing.publishedAt,
    },
    include: { category: true },
  });

  return NextResponse.json(post);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.post.delete({ where: { id } }).catch(() => null);

  return NextResponse.json({ ok: true });
}

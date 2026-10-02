import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  const pages = await prisma.page.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(pages);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, content } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const baseSlug = slugify(title.trim());
  let slug = baseSlug;
  let attempt = 1;
  while (await prisma.page.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${attempt++}`;
  }

  const page = await prisma.page.create({
    data: { title: title.trim(), slug, content: content || "" },
  });
  return NextResponse.json(page, { status: 201 });
}

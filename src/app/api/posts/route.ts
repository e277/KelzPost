import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const session = await getSession();

  const where: { status?: string } = {};
  if (status === "published" || status === "draft") {
    where.status = status;
  } else if (!session) {
    // Unauthenticated requests may only see published posts
    where.status = "published";
  }

  const posts = await prisma.post.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const title = (body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const status = body.status === "published" ? "published" : "draft";
  const baseSlug = slugify(typeof body.slug === "string" && body.slug.trim() ? body.slug : title) || "post";
  let slug = baseSlug;
  let n = 1;
  while (await prisma.post.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++n}`;
  }

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      excerpt: body.excerpt || "",
      content: body.content || "",
      coverImage: body.coverImage || "",
      status,
      author: body.author || "",
      categoryId: body.categoryId || null,
      publishedAt: status === "published" ? new Date() : null,
    },
    include: { category: true },
  });

  return NextResponse.json(post, { status: 201 });
}

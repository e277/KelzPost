import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const FIELDS = [
  "blogTitle",
  "tagline",
  "logoText",
  "authorName",
  "authorBio",
  "authorAvatar",
  "accentColor",
  "navyColor",
  "aboutTitle",
  "aboutContent",
  "socialTwitter",
  "socialInstagram",
  "socialLinkedin",
  "socialGithub",
  "navLinks",
  "heroTag",
  "heroLayout",
  "footerText",
  "postsLayout",
] as const;

export async function GET() {
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data: Record<string, string> = {};
  for (const field of FIELDS) {
    if (typeof body[field] === "string") data[field] = body[field];
  }

  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });

  return NextResponse.json(settings);
}

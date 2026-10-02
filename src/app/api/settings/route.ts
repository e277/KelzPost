import { NextRequest, NextResponse } from "next/server";
import { db, settings as settingsTable } from "@/db";
import { getSettings } from "@/lib/site";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
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
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data: Partial<Record<(typeof FIELDS)[number], string>> = {};
  for (const field of FIELDS) {
    if (typeof body[field] === "string") data[field] = body[field];
  }
  if (Object.keys(data).length === 0) return NextResponse.json(await getSettings());

  const [settings] = await db
    .insert(settingsTable)
    .values({ id: 1, ...DEFAULT_SETTINGS, ...data })
    .onConflictDoUpdate({ target: settingsTable.id, set: data })
    .returning();

  return NextResponse.json(settings);
}

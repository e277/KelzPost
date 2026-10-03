import { NextRequest, NextResponse } from "next/server";
import { db, settings as settingsTable } from "@/db";
import { getSettings } from "@/lib/site";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { requireUser } from "@/lib/current-user";
import { cleanSiteText } from "@/lib/site-text";
import { refreshPublicPages } from "@/lib/revalidate";

const FIELDS = [
  "blogTitle",
  "tagline",
  "logoText",
  "authorName",
  "authorBio",
  "authorAvatar",
  "accentColor",
  "navyColor",
  "socialTwitter",
  "socialInstagram",
  "socialLinkedin",
  "socialGithub",
  "heroLayout",
  "footerText",
  "postsLayout",
] as const;

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireUser("admin");
  if (error) return error;

  const body = await req.json();
  const data: Partial<Record<(typeof FIELDS)[number], string>> = {};
  for (const field of FIELDS) {
    if (typeof body[field] === "string") data[field] = body[field];
  }
  // Site text is sent whole: the full set of overrides replaces the old one.
  const update: typeof data & { siteText?: Record<string, string> } = { ...data };
  if (body.siteText !== undefined) update.siteText = cleanSiteText(body.siteText);
  if (Object.keys(update).length === 0) return NextResponse.json(await getSettings());

  const [settings] = await db
    .insert(settingsTable)
    .values({ id: 1, ...DEFAULT_SETTINGS, ...update })
    .onConflictDoUpdate({ target: settingsTable.id, set: update })
    .returning();

  refreshPublicPages();
  return NextResponse.json(settings);
}

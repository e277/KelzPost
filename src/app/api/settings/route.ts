import { NextRequest, NextResponse } from "next/server";
import { db, settings as settingsTable } from "@/db";
import { getSettings } from "@/lib/site";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { requireUser } from "@/lib/current-user";
import { ABOUT_PAGE_ID } from "@/lib/nav-links";
import { syncPageNavLink } from "@/lib/navigation";
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
  "aboutTitle",
  "aboutContent",
  "socialTwitter",
  "socialInstagram",
  "socialLinkedin",
  "socialGithub",
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
  const { error } = await requireUser("admin");
  if (error) return error;

  const body = await req.json();
  const data: Partial<Record<(typeof FIELDS)[number], string>> = {};
  for (const field of FIELDS) {
    if (typeof body[field] === "string") data[field] = body[field];
  }
  const aboutInNav = typeof body.aboutInNav === "boolean" ? body.aboutInNav : undefined;
  if (Object.keys(data).length === 0 && aboutInNav === undefined) return NextResponse.json(await getSettings());

  let settings =
    Object.keys(data).length === 0
      ? await getSettings()
      : (
          await db
            .insert(settingsTable)
            .values({ id: 1, ...DEFAULT_SETTINGS, ...data })
            .onConflictDoUpdate({ target: settingsTable.id, set: data })
            .returning()
        )[0];

  // The About page's header link follows its title, like any other page's.
  if (data.aboutTitle !== undefined || aboutInNav !== undefined) {
    await syncPageNavLink({ id: ABOUT_PAGE_ID, title: settings.aboutTitle || "About", slug: "about" }, aboutInNav);
    settings = await getSettings();
  }

  refreshPublicPages();
  return NextResponse.json(settings);
}

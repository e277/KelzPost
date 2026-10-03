import { getSettings } from "@/lib/site";
import { getBuiltInPage, pageBanner } from "@/lib/site-pages";
import { ogCard } from "@/lib/og-card";

export const dynamic = "force-dynamic";

/** Default share image for the home page and archives. */
export async function GET() {
  const [settings, home] = await Promise.all([getSettings(), getBuiltInPage("home")]);
  return ogCard(settings, { eyebrow: pageBanner(home).eyebrow, title: settings.blogTitle, footer: settings.tagline });
}

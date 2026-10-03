import { getSettings } from "@/lib/site";
import { ogCard } from "@/lib/og-card";

export const dynamic = "force-dynamic";

/** Default share image for the home page and archives. */
export async function GET() {
  const settings = await getSettings();
  return ogCard(settings, { eyebrow: settings.heroTag, title: settings.blogTitle, footer: settings.tagline });
}

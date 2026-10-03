import { revalidatePath } from "next/cache";

/**
 * Public pages are cached and rebuilt in the background (see `revalidate` on
 * each page). Call this after a change visitors should see right away: every
 * public page and the sitemap are rebuilt on their next visit.
 */
export function refreshPublicPages(): void {
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
}

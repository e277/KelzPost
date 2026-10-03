import type { Settings } from "@/db/schema";

/**
 * The fixed wording around the site — buttons, headings and messages — with the
 * defaults used until an admin changes them under Admin → Configurations → Site
 * text. Overrides are stored in settings.siteText. "{blogTitle}" is replaced with
 * the blog's title.
 */
type TextDef = { group: string; label: string; default: string; multiline?: boolean };

export const SITE_TEXT = {
  // Post listings (home page, tags, authors)
  searchPlaceholder: { group: "Post listings", label: "Search box placeholder", default: "Search articles…" },
  filterAll: { group: "Post listings", label: "“All posts” filter button", default: "All" },
  noPosts: { group: "Post listings", label: "When there are no posts yet", default: "No posts yet — check back soon." },
  emptyListing: { group: "Post listings", label: "When a filter or archive has no posts", default: "No articles here yet." },
  readMore: { group: "Post listings", label: "Link on each post card", default: "Read More →" },
  newerPosts: { group: "Post listings", label: "Pagination: newer posts", default: "← Newer" },
  olderPosts: { group: "Post listings", label: "Pagination: older posts", default: "Older →" },

  // Post page
  backToBlog: { group: "Post page", label: "Link back to the post list", default: "Back to Blog" },
  tableOfContents: { group: "Post page", label: "Table of contents heading", default: "In this article" },
  shareLabel: { group: "Post page", label: "Share buttons label", default: "Share" },
  writtenBy: { group: "Post page", label: "Author box heading", default: "Written by" },
  previousPost: { group: "Post page", label: "Link to the previous post", default: "← Previous" },
  nextPost: { group: "Post page", label: "Link to the next post", default: "Next →" },
  keepReading: { group: "Post page", label: "Related posts heading", default: "Keep reading" },

  // Comments
  commentsHeading: { group: "Comments", label: "Comments heading", default: "Comments" },
  noComments: { group: "Comments", label: "When a post has no comments", default: "No comments yet. Be the first to share your thoughts." },
  leaveComment: { group: "Comments", label: "Comment form heading", default: "Leave a comment" },
  commentButton: { group: "Comments", label: "Comment form button", default: "Post comment" },
  commentsModerated: { group: "Comments", label: "Note under the comment form", default: "Comments are reviewed before they appear." },

  // Newsletter
  newsletterHeading: { group: "Newsletter signup", label: "Heading", default: "Get new posts by email" },
  newsletterText: {
    group: "Newsletter signup",
    label: "Text",
    default: "Subscribe to {blogTitle} and never miss a post. No spam, unsubscribe anytime.",
    multiline: true,
  },
  newsletterButton: { group: "Newsletter signup", label: "Button", default: "Subscribe" },

  // Search page
  searchHeading: { group: "Search page", label: "Heading", default: "Search the blog" },
  searchHelp: {
    group: "Search page",
    label: "Help text",
    default: "Search every article by words in its title, summary or text. Use \"quotes\" for an exact phrase.",
    multiline: true,
  },
  searchNoResults: { group: "Search page", label: "When nothing matches", default: "No articles found" },

  // Page not found
  notFoundHeading: { group: "Page not found", label: "Heading", default: "Page not found" },
  notFoundText: {
    group: "Page not found",
    label: "Text",
    default: "The page you're looking for doesn't exist or may have been moved.",
    multiline: true,
  },
} satisfies Record<string, TextDef>;

export type SiteTextKey = keyof typeof SITE_TEXT;
export type SiteText = Record<SiteTextKey, string>;

const MAX_LENGTH = 500;

/** The wording to show: each override from settings, or the default, with {blogTitle} filled in. */
export function getSiteText(settings: Pick<Settings, "siteText" | "blogTitle">): SiteText {
  const overrides = settings.siteText ?? {};
  const text = {} as SiteText;
  for (const key of Object.keys(SITE_TEXT) as SiteTextKey[]) {
    const value = typeof overrides[key] === "string" && overrides[key].trim() ? overrides[key] : SITE_TEXT[key].default;
    text[key] = value.replaceAll("{blogTitle}", settings.blogTitle);
  }
  return text;
}

/**
 * Cleans site text sent from the admin: keeps known keys, trims, and leaves out
 * anything blank or equal to the default so later changes to defaults still apply.
 */
export function cleanSiteText(input: unknown): Record<string, string> {
  if (!input || typeof input !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!(key in SITE_TEXT) || typeof value !== "string") continue;
    const trimmed = value.trim().slice(0, MAX_LENGTH);
    if (trimmed && trimmed !== SITE_TEXT[key as SiteTextKey].default) out[key] = trimmed;
  }
  return out;
}

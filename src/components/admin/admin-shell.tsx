import Link from "next/link";
import { cache, type ReactNode } from "react";
import { eq } from "drizzle-orm";
import { comments, db } from "@/db";
import { getCurrentUser, isAdmin } from "@/lib/current-user";
import { getSettings } from "@/lib/site";
import { LogoutButton } from "./logout-button";

// Shared by the sidebar and the mobile bar, so the count is queried once per request.
const pendingCommentCount = cache(() => db.$count(comments, eq(comments.status, "pending")));
const blogTitle = cache(async () => (await getSettings()).blogTitle);

async function PendingCommentsBadge() {
  const count = await pendingCommentCount().catch(() => 0);
  if (!count) return null;
  return (
    <span className="admin-nav-count" aria-label={`${count} waiting for approval`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="16" height="16" aria-hidden="true">
      {children}
    </svg>
  );
}

export type AdminSection =
  | "dashboard"
  | "editor"
  | "pages"
  | "categories"
  | "comments"
  | "newsletter"
  | "team"
  | "configurations"
  | "profile";

// Every admin page in the order the menu shows them. Each page owns one job:
// posts on the dashboard, pages and the header menu on Pages, categories and tags on
// Categories, how the public site looks on Configurations, and your own name and password on Your Profile.
const NAV: { key: AdminSection; href: string; label: string; adminOnly: boolean; icon: ReactNode }[] = [
  {
    key: "dashboard",
    href: "/admin",
    label: "Dashboard",
    adminOnly: false,
    icon: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>,
  },
  {
    key: "editor",
    href: "/admin/posts/new",
    label: "New Post",
    adminOnly: false,
    icon: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
  },
  {
    key: "pages",
    href: "/admin/pages",
    label: "Pages",
    adminOnly: true,
    icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></>,
  },
  {
    key: "categories",
    href: "/admin/categories",
    label: "Categories",
    adminOnly: true,
    icon: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></>,
  },
  {
    key: "comments",
    href: "/admin/comments",
    label: "Comments",
    adminOnly: true,
    icon: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>,
  },
  {
    key: "newsletter",
    href: "/admin/newsletter",
    label: "Newsletter",
    adminOnly: true,
    icon: <><rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="22 6 12 13 2 6" /></>,
  },
  {
    key: "team",
    href: "/admin/team",
    label: "Team",
    adminOnly: true,
    icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  },
  {
    key: "configurations",
    href: "/admin/configurations",
    label: "Configurations",
    adminOnly: true,
    icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
  },
  {
    key: "profile",
    href: "/admin/profile",
    label: "Your Profile",
    adminOnly: false,
    icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  },
];

const VIEW_BLOG_ICON = <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></>;

export async function AdminShell({
  active,
  title,
  actions,
  children,
}: {
  active: AdminSection;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  // Authors only see what they can use: their posts and their profile.
  const [user, rawTitle] = await Promise.all([getCurrentUser(), blogTitle()]);
  const admin = !!user && isAdmin(user);
  const name = rawTitle || "The Journal";
  const words = name.trim().split(/\s+/);
  const last = words.pop() || "";
  const lead = words.join(" ");

  const navItems = (
    <>
      {NAV.filter((item) => admin || !item.adminOnly).map((item) => (
        <Link key={item.key} href={item.href} className={active === item.key ? "active" : ""}>
          <Icon>{item.icon}</Icon>
          {item.label}
          {item.key === "comments" && <PendingCommentsBadge />}
        </Link>
      ))}
      <Link href="/" target="_blank">
        <Icon>{VIEW_BLOG_ICON}</Icon>
        View Blog
      </Link>
    </>
  );

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">
          <div className="blog-logo">
            <div className="blog-logo__mark">{name[0]?.toUpperCase() || "J"}</div>
            <div className="blog-logo__text">
              {lead ? `${lead} ` : ""}
              <span style={{ color: "var(--gold)" }}>{last}</span>
            </div>
          </div>
        </div>

        <div className="admin-sidebar__label">Main Menu</div>
        <nav className="admin-sidebar__nav">{navItems}</nav>

        <div className="admin-sidebar__footer">
          <LogoutButton />
        </div>
      </aside>

      <div className="admin-content">
        <div className="admin-mobilebar">
          <nav className="admin-mobilebar__nav" aria-label="Admin">
            {navItems}
            <LogoutButton />
          </nav>
        </div>

        <div className="admin-topbar">
          <h1 className="admin-topbar__title">{title}</h1>
          <div className="admin-topbar__actions">{actions}</div>
        </div>

        <div className="admin-page">{children}</div>
      </div>
    </div>
  );
}

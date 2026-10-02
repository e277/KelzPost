import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "./logout-button";

export function AdminShell({
  blogTitle,
  active,
  title,
  actions,
  children,
}: {
  blogTitle: string;
  active: "dashboard" | "editor" | "pages" | "settings";
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const name = blogTitle || "The Journal";
  const words = name.trim().split(/\s+/);
  const last = words.pop() || "";
  const lead = words.join(" ");

  const navItems = (
    <>
          <Link href="/admin" className={active === "dashboard" ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="16" height="16">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Dashboard
          </Link>
          <Link href="/admin/posts/new" className={active === "editor" ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="16" height="16">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            New Post
          </Link>
          <Link href="/admin/pages" className={active === "pages" ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="16" height="16">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Pages
          </Link>
          <Link href="/admin/settings" className={active === "settings" ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="16" height="16">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </Link>
          <Link href="/" target="_blank">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="16" height="16">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
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

"use client";

import { useState, type ReactNode } from "react";

/**
 * The admin menu on phones and small tablets: the blog logo with a hamburger
 * button that opens the menu as a dropdown, like the public site's header.
 */
export function AdminMobileMenu({ logo, children }: { logo: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="admin-mobilebar">
      <div className="admin-mobilebar__bar">
        {logo}
        <button
          type="button"
          className={`blog-nav__toggle admin-mobilebar__toggle${open ? " is-open" : ""}`}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      <nav
        id="admin-mobile-nav"
        className={`admin-mobilebar__nav${open ? " is-open" : ""}`}
        aria-label="Admin"
        // Any link picked closes the menu.
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setOpen(false);
        }}
      >
        {children}
      </nav>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { label: string; href: string };

function isActive(pathname: string, href: string) {
  const clean = (p: string) => p.replace(/\/+$/, "") || "/";
  const path = clean(pathname);
  const target = clean(href);
  return target === "/" ? path === "/" : path === target || path.startsWith(`${target}/`);
}

export function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`blog-nav__toggle${open ? " is-open" : ""}`}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span />
        <span />
        <span />
      </button>
      <div className={`blog-nav__links${open ? " is-open" : ""}`}>
        {links.map((link) => {
          const external = /^https?:\/\//.test(link.href);
          return external ? (
            <a key={link.href + link.label} href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          ) : (
            <Link
              key={link.href + link.label}
              href={link.href}
              className={isActive(pathname, link.href) ? "active" : undefined}
              aria-current={isActive(pathname, link.href) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </>
  );
}

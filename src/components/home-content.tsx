"use client";

import { useMemo, useState } from "react";
import type { Category, Settings } from "@/db/schema";
import type { PostSummary } from "@/lib/posts";
import { PostCard } from "./post-card";

const PAGE_SIZE = 9;

export function HomeContent({
  posts,
  categories,
  settings,
}: {
  posts: PostSummary[];
  categories: Category[];
  settings: Settings;
}) {
  const [activeCat, setActiveCat] = useState("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const layout = settings.postsLayout === "list" ? "list" : "grid";

  const postCats = useMemo(() => {
    return [...new Set(posts.map((p) => p.category?.name).filter((c): c is string => Boolean(c)))];
  }, [posts]);

  const filtered = posts.filter((p) => activeCat === "all" || p.category?.name === activeCat);
  const shown = filtered.slice(0, visible);

  const selectCategory = (c: string) => {
    setActiveCat(c);
    setVisible(PAGE_SIZE);
  };

  return (
    <>
      <div className="blog-controls">
        {/* Searches every post on the server (see /search). */}
        <form className="blog-search" action="/search" role="search">
          <svg className="blog-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="16" height="16">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="search" name="q" placeholder="Search articles…" aria-label="Search articles" required />
        </form>
        <div className="blog-filter">
          <button className={`filter-btn${activeCat === "all" ? " active" : ""}`} onClick={() => selectCategory("all")}>
            All
          </button>
          {postCats.map((c) => (
            <button key={c} className={`filter-btn${activeCat === c ? " active" : ""}`} onClick={() => selectCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <main className="blog-main">
        <div className={layout === "list" ? "posts-list" : "posts-grid"}>
          {filtered.length === 0 ? (
            <div className="posts-grid--empty">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.5} width="48" height="48">
                <rect x="4" y="8" width="40" height="32" rx="3" />
                <path d="M16 24h16M16 30h10" />
              </svg>
              <p>
                {posts.length === 0 ? (
                  "No posts yet — check back soon."
                ) : (
                  <>
                    No articles in this category.{" "}
                    <button type="button" className="link-btn" onClick={() => selectCategory("all")}>
                      Show all
                    </button>
                  </>
                )}
              </p>
            </div>
          ) : (
            shown.map((post, i) => (
              <PostCard
                key={post.id}
                post={post}
                categories={categories}
                featured={layout === "grid" && i === 0 && filtered.length > 1}
                layout={layout}
              />
            ))
          )}
        </div>
        {filtered.length > shown.length && (
          <div className="load-more">
            <button type="button" className="btn btn--ghost" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
              Load more articles ({filtered.length - shown.length} more)
            </button>
          </div>
        )}
      </main>
    </>
  );
}

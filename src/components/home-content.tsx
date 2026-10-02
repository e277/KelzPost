"use client";

import { useMemo, useState } from "react";
import type { Category, Post, Settings } from "@prisma/client";
import { stripHtml } from "@/lib/utils";
import { PostCard } from "./post-card";

const PAGE_SIZE = 9;

type PostWithCategory = Post & { category: Category | null };

export function HomeContent({
  posts,
  categories,
  settings,
}: {
  posts: PostWithCategory[];
  categories: Category[];
  settings: Settings;
}) {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const layout = settings.postsLayout === "list" ? "list" : "grid";

  const postCats = useMemo(() => {
    return [...new Set(posts.map((p) => p.category?.name).filter((c): c is string => Boolean(c)))];
  }, [posts]);

  const searchIndex = useMemo(
    () => new Map(posts.map((p) => [p.id, `${p.title} ${p.excerpt} ${p.category?.name || ""} ${stripHtml(p.content)}`.toLowerCase()])),
    [posts]
  );

  const q = search.trim().toLowerCase();
  const filtered = posts.filter((p) => {
    const matchCat = activeCat === "all" || p.category?.name === activeCat;
    const matchSearch = !q || q.split(/\s+/).every((term) => searchIndex.get(p.id)?.includes(term));
    return matchCat && matchSearch;
  });
  const shown = filtered.slice(0, visible);

  const selectCategory = (c: string) => {
    setActiveCat(c);
    setVisible(PAGE_SIZE);
  };

  return (
    <>
      <div className="blog-controls">
        <div className="blog-search">
          <svg className="blog-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="16" height="16">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search articles…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisible(PAGE_SIZE);
            }}
            aria-label="Search articles"
          />
        </div>
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
                    No articles match your search.{" "}
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => {
                        setSearch("");
                        selectCategory("all");
                      }}
                    >
                      Clear filters
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
                authorName={settings.authorName}
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

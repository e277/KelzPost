"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/db/schema";
import { useToast } from "@/components/toast";
import { apiSend } from "@/lib/admin-api";
import { AdminCard, ChipList } from "./ui";

export type TagSummary = { id: string; name: string; posts: number };

/** Categories and tags: how posts are grouped on the blog. */
export function TaxonomyManager({ categories, tags }: { categories: Category[]; tags: TagSummary[] }) {
  const router = useRouter();
  const { showToast, toastElement } = useToast();
  const [cats, setCats] = useState(categories);
  const [newCategory, setNewCategory] = useState("");
  const [tagList, setTagList] = useState(tags);

  const addCategory = async () => {
    const value = newCategory.trim();
    if (!value) return;
    if (cats.some((c) => c.name.toLowerCase() === value.toLowerCase())) {
      showToast("That category already exists.", "error");
      return;
    }
    const res = await apiSend<Category>("/api/categories", "POST", { name: value }, "Failed to add category.");
    if (!res.ok) return showToast(res.error, "error");
    setCats((c) => [...c, res.data]);
    setNewCategory("");
    router.refresh();
  };

  const removeCategory = async (cat: Category) => {
    const res = await apiSend(`/api/categories/${cat.id}`, "DELETE", undefined, "Failed to remove category.");
    if (!res.ok) return showToast(res.error, "error");
    setCats((c) => c.filter((x) => x.id !== cat.id));
    router.refresh();
  };

  const removeTag = async (tag: TagSummary) => {
    if (tag.posts > 0 && !confirm(`Remove “${tag.name}” from ${tag.posts} post${tag.posts === 1 ? "" : "s"}?`)) return;
    const res = await apiSend(`/api/tags/${tag.id}`, "DELETE", undefined, "Failed to remove tag.");
    if (!res.ok) return showToast(res.error, "error");
    setTagList((t) => t.filter((x) => x.id !== tag.id));
    router.refresh();
  };

  return (
    <>
      <div className="taxonomy-grid">
        <AdminCard title="Categories">
          <p className="settings-section-note">
            Each post has one category. Categories appear as filters on the blog and in the post editor&apos;s category dropdown.
          </p>
          <ChipList items={cats} empty="No categories yet. Add one below." onRemove={removeCategory} />
          <div className="tag-add-row">
            <input
              type="text"
              placeholder="Add a category…"
              aria-label="New category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory();
                }
              }}
            />
            <button type="button" className="btn btn--ghost btn--sm" onClick={addCategory}>
              Add
            </button>
          </div>
        </AdminCard>

        <AdminCard title="Tags">
          <p className="settings-section-note">
            Tags are added from the post editor and each one gets its own page on the blog. Remove tags you no longer use here.
          </p>
          <ChipList items={tagList} empty="No tags yet. Add some to a post in the editor." count={(t) => t.posts} onRemove={removeTag} />
        </AdminCard>
      </div>
      {toastElement}
    </>
  );
}

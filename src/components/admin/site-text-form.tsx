"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { apiSend } from "@/lib/admin-api";
import { SITE_TEXT, type SiteTextKey } from "@/lib/site-text";
import { AdminCard, Field } from "./ui";

const KEYS = Object.keys(SITE_TEXT) as SiteTextKey[];
const GROUPS = [...new Set(KEYS.map((k) => SITE_TEXT[k].group))];

/**
 * The fixed wording around the public site (buttons, headings, messages). Each box
 * shows the default as its placeholder; a blank box uses the default.
 */
export function SiteTextForm({ overrides }: { overrides: Record<string, string> }) {
  const router = useRouter();
  const { showToast, toastElement } = useToast();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(KEYS.map((k) => [k, overrides[k] ?? ""]))
  );
  const [saving, setSaving] = useState(false);

  const set = (key: SiteTextKey, value: string) => setValues((v) => ({ ...v, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    const res = await apiSend<{ siteText: Record<string, string> }>("/api/settings", "PUT", { siteText: values }, "Failed to save site text.");
    setSaving(false);
    if (!res.ok) return showToast(res.error, "error");
    // Show what was stored: blanks and unchanged defaults come back empty.
    setValues(Object.fromEntries(KEYS.map((k) => [k, res.data.siteText[k] ?? ""])));
    showToast("Site text saved.");
    router.refresh();
  };

  return (
    <>
      <h2 className="admin-section-title" id="site-text">
        Site text
      </h2>
      <p className="settings-section-note">
        The wording on buttons, headings and messages around your site. Leave a box blank to use the default shown in it.
        Use <code>{"{blogTitle}"}</code> to insert your blog&apos;s title.
      </p>
      <div className="settings-grid">
        {GROUPS.map((group) => (
          <AdminCard key={group} title={group}>
            {KEYS.filter((k) => SITE_TEXT[k].group === group).map((key) => {
              const def = SITE_TEXT[key];
              const id = `siteText-${key}`;
              return (
                <Field key={key} label={def.label} htmlFor={id}>
                  {"multiline" in def && def.multiline ? (
                    <textarea id={id} rows={3} maxLength={500} placeholder={def.default} value={values[key]} onChange={(e) => set(key, e.target.value)} />
                  ) : (
                    <input type="text" id={id} maxLength={500} placeholder={def.default} value={values[key]} onChange={(e) => set(key, e.target.value)} />
                  )}
                </Field>
              );
            })}
          </AdminCard>
        ))}
      </div>

      <div className="admin-save-bar">
        <button type="button" className="btn btn--primary btn--sm" disabled={saving} onClick={handleSave}>
          {saving ? "Saving…" : "Save Site Text"}
        </button>
      </div>

      {toastElement}
    </>
  );
}

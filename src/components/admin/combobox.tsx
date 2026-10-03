"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";

/**
 * A multi-select that also creates: pick any number of existing options from the
 * list as you type, or type a new name and press Enter (or comma) to add it.
 * Chosen values show as removable chips inside the field.
 */
export function ComboBox({
  id,
  values,
  options,
  onChange,
  placeholder,
  allowCreate = true,
  max = 10,
}: {
  id?: string;
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  /** When false, only options from the list can be picked. */
  allowCreate?: boolean;
  max?: number;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
  const chosen = (name: string) => values.some((v) => same(v, name));
  const q = query.trim();
  const matches = options.filter((o) => !chosen(o) && (!q || o.toLowerCase().includes(q.toLowerCase())));
  const canCreate = allowCreate && !!q && !options.some((o) => same(o, q)) && !chosen(q);
  // The rows in the dropdown: matching options, then "Create …" for a new name.
  const items = [...matches.map((name) => ({ name, create: false })), ...(canCreate ? [{ name: q, create: true }] : [])];
  const full = values.length >= max;

  const add = (name: string) => {
    const clean = name.trim().replace(/\s+/g, " ");
    if (!clean || chosen(clean) || full) return;
    // Use the existing option's spelling when the typed name matches one.
    const existing = options.find((o) => same(o, clean));
    if (!existing && !allowCreate) return;
    onChange([...values, existing ?? clean]);
    setQuery("");
    setActive(0);
  };

  const remove = (name: string) => onChange(values.filter((v) => v !== name));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || (e.key === "," && allowCreate)) {
      if (!q && e.key === "Enter" && !(open && items[active])) return;
      e.preventDefault();
      const item = open && items[active] ? items[active] : null;
      add(item ? item.name : q);
    } else if (e.key === "Backspace" && !query && values.length) {
      remove(values[values.length - 1]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && !full && items.length > 0;

  return (
    <div className="combobox" onClick={() => inputRef.current?.focus()}>
      {values.map((v) => (
        <span className="tag-chip combobox__chip" key={v}>
          {v}
          <button
            type="button"
            title={`Remove ${v}`}
            aria-label={`Remove ${v}`}
            onClick={(e) => {
              e.stopPropagation();
              remove(v);
            }}
          >
            ✕
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList ? `${listId}-${active}` : undefined}
        placeholder={full ? "" : values.length ? "Add another…" : placeholder}
        disabled={full}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul className="combobox__list" id={listId} role="listbox">
          {items.map((item, i) => (
            <li
              key={`${item.create ? "new:" : ""}${item.name}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={`combobox__option${i === active ? " is-active" : ""}`}
              // mousedown, so the pick lands before the input loses focus
              onMouseDown={(e) => {
                e.preventDefault();
                add(item.name);
              }}
              onMouseEnter={() => setActive(i)}
            >
              {item.create ? (
                <>
                  Create <strong>“{item.name}”</strong>
                </>
              ) : (
                item.name
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

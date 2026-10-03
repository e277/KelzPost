"use client";

import type { FormEvent, ReactNode } from "react";

/**
 * The building blocks every admin page repeats, so cards, fields and
 * confirmation dialogs look and behave the same everywhere.
 */

/** A white panel with an optional header. Pass onSubmit to make the whole card a form. */
export function AdminCard({
  title,
  id,
  className,
  danger,
  onSubmit,
  children,
}: {
  title?: ReactNode;
  id?: string;
  className?: string;
  danger?: boolean;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  const classes = `editor-card${className ? ` ${className}` : ""}`;
  const inner = (
    <>
      {title && <div className={`editor-card__header${danger ? " editor-card__header--danger" : ""}`}>{title}</div>}
      <div className="editor-card__body">{children}</div>
    </>
  );
  return onSubmit ? (
    <form id={id} className={classes} onSubmit={onSubmit}>
      {inner}
    </form>
  ) : (
    <section id={id} className={classes}>
      {inner}
    </section>
  );
}

/** A labelled form field with an optional hint underneath. */
export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="form-group">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <small className="field-hint">{hint}</small>}
    </div>
  );
}

/** Lighter text after a field label, like "(optional)". */
export function LabelNote({ children }: { children: ReactNode }) {
  return <span className="label-note">{children}</span>;
}

/** The inline error line under a form; it keeps its space so the form doesn't jump. */
export function FormError({ message }: { message: string }) {
  return <p className={`form-error${message ? " visible" : ""}`}>{message}</p>;
}

/** "Are you sure?" dialog for destructive actions. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = "Delete",
  tone = "danger",
  busy = false,
  busyLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: ReactNode;
  children: ReactNode;
  confirmLabel?: string;
  /** "primary" for confirmations that aren't destructive, like sending a newsletter. */
  tone?: "danger" | "primary";
  /** While true the dialog can't be dismissed and the button shows busyLabel. */
  busy?: boolean;
  busyLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className={`modal-overlay${open ? " open" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <h2 className="modal__title">{title}</h2>
        <div className="modal__body">{children}</div>
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={`btn btn--${tone}`} disabled={busy} onClick={onConfirm}>
            {busy && busyLabel ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Removable chips, used for categories and tags. */
export function ChipList<T extends { id: string; name: string }>({
  items,
  empty,
  count,
  onRemove,
}: {
  items: T[];
  empty: ReactNode;
  count?: (item: T) => ReactNode;
  onRemove: (item: T) => void;
}) {
  return (
    <div className="tag-list">
      {items.length === 0 ? (
        <p className="settings-section-note settings-section-note--flush">{empty}</p>
      ) : (
        items.map((item) => (
          <span className="tag-chip" key={item.id}>
            {item.name}
            {count && <span className="tag-chip__count">{count(item)}</span>}
            <button type="button" title={`Remove ${item.name}`} onClick={() => onRemove(item)}>
              ✕
            </button>
          </span>
        ))
      )}
    </div>
  );
}

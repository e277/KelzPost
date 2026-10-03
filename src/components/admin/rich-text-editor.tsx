"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import Youtube from "@tiptap/extension-youtube";
import { Placeholder } from "@tiptap/extensions";

/** Languages offered for code blocks; public posts are highlighted on the server (see lib/highlight). */
export const CODE_LANGUAGES: { value: string; label: string }[] = [
  { value: "", label: "Plain text" },
  { value: "bash", label: "Shell" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "css", label: "CSS" },
  { value: "go", label: "Go" },
  { value: "xml", label: "HTML / XML" },
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
  { value: "json", label: "JSON" },
  { value: "kotlin", label: "Kotlin" },
  { value: "markdown", label: "Markdown" },
  { value: "php", label: "PHP" },
  { value: "python", label: "Python" },
  { value: "ruby", label: "Ruby" },
  { value: "rust", label: "Rust" },
  { value: "sql", label: "SQL" },
  { value: "swift", label: "Swift" },
  { value: "typescript", label: "TypeScript" },
  { value: "yaml", label: "YAML" },
];

type Options = {
  content: string;
  placeholder: string;
  /** Called once the editor is ready in the browser. */
  onCreate?: (editor: Editor) => void;
  /** Called after every change. */
  onUpdate?: (editor: Editor) => void;
  /** Uploads a pasted or dropped image and resolves to its URL. */
  uploadImage?: (file: File) => Promise<string>;
  onError?: (message: string) => void;
};

const imageFiles = (list: FileList | null | undefined) => [...(list ?? [])].filter((f) => f.type.startsWith("image/"));

/**
 * Creates the rich text editor used for posts and pages. Pasted or dropped
 * images are uploaded and inserted where they land.
 */
export function useRichTextEditor({ content, placeholder, onCreate, onUpdate, uploadImage, onError }: Options) {
  // The editor is created once; keep the latest callbacks in a ref so it always calls them.
  const callbacks = useRef({ onCreate, onUpdate, uploadImage, onError });
  useEffect(() => {
    callbacks.current = { onCreate, onUpdate, uploadImage, onError };
  });

  const insertImages = async (editor: Editor, files: File[], pos?: number) => {
    const upload = callbacks.current.uploadImage;
    if (!upload) return;
    for (const file of files) {
      try {
        const src = await upload(file);
        const node = { type: "image", attrs: { src, alt: "" } };
        if (pos === undefined) editor.chain().focus().insertContent(node).run();
        else editor.chain().focus().insertContentAt(pos, node).run();
      } catch (e) {
        callbacks.current.onError?.(e instanceof Error ? e.message : "Could not upload the image.");
      }
    }
  };

  // Paste and drop handlers are set up with the first render, so they read the editor from here.
  const editorRef = useRef<Editor | null>(null);

  const editor: Editor | null = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        // Links open in the same tab unless the author says otherwise; no forced nofollow.
        link: { openOnClick: false, autolink: true, HTMLAttributes: { target: null, rel: null } },
      }),
      Image.configure({ allowBase64: true }),
      TableKit.configure({ table: { resizable: false } }),
      Youtube.configure({ nocookie: true, width: 640, height: 360, modestBranding: true }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    editorProps: {
      attributes: { class: "editor-area" },
      handleDrop: (view, event, _slice, moved) => {
        const files = imageFiles(event.dataTransfer?.files);
        if (moved || files.length === 0 || !editorRef.current) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        void insertImages(editorRef.current, files, pos);
        return true;
      },
      handlePaste: (_view, event) => {
        const files = imageFiles(event.clipboardData?.files);
        if (files.length === 0 || !editorRef.current) return false;
        event.preventDefault();
        void insertImages(editorRef.current, files);
        return true;
      },
    },
    onCreate: ({ editor }) => {
      editorRef.current = editor;
      callbacks.current.onCreate?.(editor);
    },
    onUpdate: ({ editor }) => callbacks.current.onUpdate?.(editor),
  });

  return { editor, insertImages };
}

function ToolbarButton({
  title,
  active,
  disabled,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`toolbar-btn${active ? " active" : ""}`}
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      // Keep the editor's selection while clicking toolbar buttons.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

const Icon = ({ d, fill }: { d: string; fill?: boolean }) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill={fill ? "currentColor" : "none"} stroke={fill ? "none" : "currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

export function RichTextEditor({
  editor,
  insertImages,
  onError,
}: {
  editor: Editor | null;
  insertImages: (editor: Editor, files: File[]) => Promise<void>;
  onError?: (message: string) => void;
}) {
  // The editor is created after the first render in the browser.
  if (!editor) {
    return (
      <>
        <div className="editor-toolbar" aria-hidden="true" style={{ minHeight: 53 }} />
        <div className="editor-area editor-area--loading" />
      </>
    );
  }
  return <EditorWithToolbar editor={editor} insertImages={insertImages} onError={onError} />;
}

function EditorWithToolbar({
  editor,
  insertImages,
  onError,
}: {
  editor: Editor;
  insertImages: (editor: Editor, files: File[]) => Promise<void>;
  onError?: (message: string) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      paragraph: e.isActive("paragraph"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      h4: e.isActive("heading", { level: 4 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      link: e.isActive("link"),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      blockquote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      codeLanguage: (e.getAttributes("codeBlock").language as string | null) ?? "",
      table: e.isActive("table"),
      image: e.isActive("image"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();

  const setLink = () => {
    const previous = (editor.getAttributes("link").href as string | undefined) ?? "";
    const url = window.prompt("Link address (leave empty to remove the link):", previous || "https://");
    if (url === null) return;
    if (!url.trim() || url.trim() === "https://") {
      chain().extendMarkRange("link").unsetLink().run();
      return;
    }
    const href = /^(https?:|mailto:|tel:|\/|#)/i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    chain().extendMarkRange("link").setLink({ href }).run();
  };

  const addImageFromUrl = () => {
    const url = window.prompt("Image address (https://…):");
    if (!url?.trim()) return;
    const alt = window.prompt("Describe the image for screen readers and search engines (optional):") ?? "";
    chain().setImage({ src: url.trim(), alt: alt.trim() }).run();
  };

  const editAltText = () => {
    const current = (editor.getAttributes("image").alt as string | undefined) ?? "";
    const alt = window.prompt("Image description (alt text):", current);
    if (alt !== null) chain().updateAttributes("image", { alt: alt.trim() }).run();
  };

  const addVideo = () => {
    const url = window.prompt("YouTube video link:");
    if (!url?.trim()) return;
    if (!chain().setYoutubeVideo({ src: url.trim() }).run()) onError?.("That doesn't look like a YouTube link.");
  };

  const upload = async (files: File[]) => {
    setUploading(true);
    await insertImages(editor, files);
    setUploading(false);
  };

  return (
    <>
      <div className="editor-toolbar" role="toolbar" aria-label="Formatting">
        <select
          className="toolbar-select"
          aria-label="Text style"
          value={state.h2 ? "h2" : state.h3 ? "h3" : state.h4 ? "h4" : "p"}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") chain().setParagraph().run();
            else chain().setHeading({ level: Number(v.slice(1)) as 2 | 3 | 4 }).run();
          }}
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading</option>
          <option value="h3">Subheading</option>
          <option value="h4">Small heading</option>
        </select>
        <div className="toolbar-sep" />
        <ToolbarButton title="Bold (Ctrl+B)" active={state.bold} onClick={() => chain().toggleBold().run()}>
          <b>B</b>
        </ToolbarButton>
        <ToolbarButton title="Italic (Ctrl+I)" active={state.italic} onClick={() => chain().toggleItalic().run()}>
          <i>I</i>
        </ToolbarButton>
        <ToolbarButton title="Underline (Ctrl+U)" active={state.underline} onClick={() => chain().toggleUnderline().run()}>
          <u>U</u>
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" active={state.strike} onClick={() => chain().toggleStrike().run()}>
          <s>S</s>
        </ToolbarButton>
        <ToolbarButton title="Inline code" active={state.code} onClick={() => chain().toggleCode().run()}>
          <Icon d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
        </ToolbarButton>
        <ToolbarButton title="Link" active={state.link} onClick={setLink}>
          <Icon d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </ToolbarButton>
        <div className="toolbar-sep" />
        <ToolbarButton title="Bullet list" active={state.bulletList} onClick={() => chain().toggleBulletList().run()}>
          <Icon d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" active={state.orderedList} onClick={() => chain().toggleOrderedList().run()}>
          <Icon d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
        </ToolbarButton>
        <ToolbarButton title="Quote" active={state.blockquote} onClick={() => chain().toggleBlockquote().run()}>
          <Icon fill d="M6 7a3 3 0 0 0-3 3v4h4v-4H5a1 1 0 0 1 1-1zm9 0a3 3 0 0 0-3 3v4h4v-4h-2a1 1 0 0 1 1-1z" />
        </ToolbarButton>
        <ToolbarButton title="Code block" active={state.codeBlock} onClick={() => chain().toggleCodeBlock().run()}>
          <Icon d="M4 4h16v16H4zM9 9l-2 3 2 3M15 9l2 3-2 3" />
        </ToolbarButton>
        <ToolbarButton title="Divider" onClick={() => chain().setHorizontalRule().run()}>
          <Icon d="M3 12h18" />
        </ToolbarButton>
        <div className="toolbar-sep" />
        <ToolbarButton title={uploading ? "Uploading…" : "Upload image (or drag and drop / paste)"} disabled={uploading} onClick={() => fileInput.current?.click()}>
          <Icon d="M3 5h18v14H3zM8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 19" />
        </ToolbarButton>
        <ToolbarButton title="Image from a link" onClick={addImageFromUrl}>
          <span className="toolbar-btn__text">URL</span>
        </ToolbarButton>
        <ToolbarButton title="YouTube video" onClick={addVideo}>
          <Icon d="M22 8.5a3 3 0 0 0-2-2C18 6 12 6 12 6s-6 0-8 .5a3 3 0 0 0-2 2C2 10 2 12 2 12s0 2 .5 3.5a3 3 0 0 0 2 2C6 18 12 18 12 18s6 0 8-.5a3 3 0 0 0 2-2c.5-1.5.5-3.5.5-3.5s0-2-.5-3.5zM10 15V9l5 3z" />
        </ToolbarButton>
        <ToolbarButton title="Table" active={state.table} onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          <Icon d="M3 4h18v16H3zM3 10h18M3 15h18M9 4v16M15 4v16" />
        </ToolbarButton>
        <div className="toolbar-sep" />
        <ToolbarButton title="Undo (Ctrl+Z)" disabled={!state.canUndo} onClick={() => chain().undo().run()}>
          <Icon d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-1" />
        </ToolbarButton>
        <ToolbarButton title="Redo (Ctrl+Shift+Z)" disabled={!state.canRedo} onClick={() => chain().redo().run()}>
          <Icon d="m15 14 5-5-5-5M20 9H9a5 5 0 0 0 0 10h1" />
        </ToolbarButton>
        <ToolbarButton title="Clear formatting" onClick={() => chain().unsetAllMarks().clearNodes().run()}>
          <Icon d="M4 7V4h16v3M9 20h6M12 4v16M3 3l18 18" />
        </ToolbarButton>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            const files = imageFiles(e.target.files);
            e.target.value = "";
            if (files.length) void upload(files);
          }}
        />
      </div>

      {(state.codeBlock || state.table || state.image) && (
        <div className="editor-context" role="toolbar" aria-label="Selection options">
          {state.codeBlock && (
            <label>
              Language
              <select
                className="toolbar-select"
                value={state.codeLanguage}
                onChange={(e) => chain().updateAttributes("codeBlock", { language: e.target.value || null }).run()}
              >
                {CODE_LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {state.table && (
            <>
              <button type="button" className="btn btn--ghost btn--sm" onMouseDown={(e) => e.preventDefault()} onClick={() => chain().addRowAfter().run()}>
                + Row
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onMouseDown={(e) => e.preventDefault()} onClick={() => chain().addColumnAfter().run()}>
                + Column
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onMouseDown={(e) => e.preventDefault()} onClick={() => chain().deleteRow().run()}>
                − Row
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onMouseDown={(e) => e.preventDefault()} onClick={() => chain().deleteColumn().run()}>
                − Column
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onMouseDown={(e) => e.preventDefault()} onClick={() => chain().toggleHeaderRow().run()}>
                Header row
              </button>
              <button type="button" className="btn btn--danger btn--sm" onMouseDown={(e) => e.preventDefault()} onClick={() => chain().deleteTable().run()}>
                Delete table
              </button>
            </>
          )}
          {state.image && (
            <button type="button" className="btn btn--ghost btn--sm" onMouseDown={(e) => e.preventDefault()} onClick={editAltText}>
              Edit image description
            </button>
          )}
        </div>
      )}

      <EditorContent editor={editor} />
    </>
  );
}

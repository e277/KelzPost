"use client";

import { useRef, useState } from "react";
import { prepareImage } from "@/lib/image";

export function ImageUpload({
  value,
  onChange,
  round,
  onError,
}: {
  value: string;
  onChange: (value: string) => void;
  round?: boolean;
  onError?: (message: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlField, setShowUrlField] = useState(Boolean(value) && !value.startsWith("data:"));

  const handleFile = async (file: File) => {
    try {
      onChange(await prepareImage(file, round ? 512 : 1600));
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Could not process that image.");
    }
  };

  const remove = () => {
    onChange("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <>
      {!value && (
        <div
          className={`upload-zone${dragOver ? " drag-over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width="32" height="32">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p>
            <strong>Click to upload</strong> or drag &amp; drop
            <br />
            PNG, JPG, WEBP, GIF — large photos are resized automatically
          </p>
        </div>
      )}

      {value && (
        <div className={`upload-preview-wrap${round ? " upload-preview-wrap--round" : ""}`} style={{ display: "block" }}>
          <img src={value} alt="Preview" />
          <button type="button" className="upload-preview-remove" title="Remove image" onClick={remove}>
            ✕
          </button>
        </div>
      )}

      <span className="upload-url-toggle" onClick={() => setShowUrlField((s) => !s)}>
        {showUrlField ? "Hide URL field" : "Or use an image URL instead"}
      </span>
      <div className={`upload-url-field${showUrlField ? " open" : ""}`}>
        <input
          type="url"
          placeholder="https://…"
          value={value && !value.startsWith("data:") ? value : ""}
          onChange={(e) => onChange(e.target.value.trim())}
        />
      </div>
    </>
  );
}

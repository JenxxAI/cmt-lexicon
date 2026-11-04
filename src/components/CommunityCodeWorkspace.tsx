"use client";

import { useRef, useState, type ReactNode } from "react";
import type { SampleLanguage, SampleSource } from "@/lib/sample-source";
import { SampleCodeEditor } from "./SampleCodeEditor";

const files = {
  html: "index.html",
  css: "styles.css",
  js: "script.js",
} as const;
const languages = ["html", "css", "js"] as const;

function FilePane({
  language,
  value,
  active,
  change,
}: {
  language: SampleLanguage;
  value: string;
  active: boolean;
  change: (value: string) => void;
}) {
  const [position, setPosition] = useState([1, 1]);
  return (
    <div hidden={!active}>
      <SampleCodeEditor
        language={language}
        value={value}
        onChange={change}
        onBlur={() => {}}
        onCursor={(line, column) => setPosition([line, column])}
      />
      <div className="flex flex-wrap justify-between gap-2 bg-body px-4 py-2 font-mono text-xs text-surface">
        <span>{language === "js" ? "JavaScript" : language.toUpperCase()}</span>
        <span>
          Ln {position[0]}, Col {position[1]}
        </span>
      </div>
    </div>
  );
}

export function CommunityCodeWorkspace({
  source,
  title,
  unsaved,
  saveStatus,
  onSave,
  onChange,
  preview,
}: {
  source: SampleSource;
  title: string;
  unsaved: boolean;
  saveStatus: string;
  onSave: () => void;
  onChange: (language: SampleLanguage, value: string) => void;
  preview: ReactNode;
}) {
  const workspace = useRef<HTMLDialogElement>(null);
  const expand = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState<SampleLanguage>("html");
  const [full, setFull] = useState(false);
  function toggleFull() {
    const element = workspace.current;
    if (!element) return;
    // Promote the same editor into the top layer. Its textareas retain native undo stacks.
    element.close();
    if (full) element.show();
    else element.showModal();
    setFull(!full);
    expand.current?.focus();
  }
  return (
    <dialog
      open
      ref={workspace}
      className="code-workspace"
      aria-label="Code workspace"
      onCancel={(event) => {
        event.preventDefault();
        if (full) toggleFull();
      }}
      onKeyDown={(event) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          !event.altKey &&
          !event.shiftKey &&
          event.key.toLowerCase() === "s"
        ) {
          event.preventDefault();
          if (!event.repeat) onSave();
        }
      }}
    >
      <div className="workspace-toolbar">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-muted">Code workspace</p>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold">
            <span className="truncate">{title || "Untitled project"}</span>
            {unsaved && (
              <span
                className="workspace-dot"
                role="img"
                aria-label="Unsaved changes"
                title="Unsaved changes"
              />
            )}
          </h2>
        </div>
        <button
          className="btn btn-secondary"
          onClick={onSave}
          aria-keyshortcuts="Control+S Meta+S"
        >
          Save draft
        </button>
        <button ref={expand} className="btn btn-primary" onClick={toggleFull}>
          {full ? "Exit full workspace" : "Full workspace"}
        </button>
      </div>
      <p role="status" className="px-4 pb-3 text-sm text-muted">
        {saveStatus}
      </p>
      <div className="workspace-panes">
        <div className="min-w-0 overflow-hidden rounded-2xl bg-code text-surface">
          <div
            className="flex flex-wrap border-b border-dim/30"
            role="group"
            aria-label="Project files"
          >
            {languages.map((key) => (
              <button
                key={key}
                aria-pressed={active === key}
                onClick={() => setActive(key)}
                className="min-h-11 px-3 font-mono text-sm aria-pressed:bg-body aria-pressed:text-hi"
              >
                {files[key]}
              </button>
            ))}
          </div>
          {languages.map((key) => (
            <FilePane
              key={key}
              language={key}
              active={key === active}
              value={source[key]}
              change={(value) => onChange(key, value)}
            />
          ))}
        </div>
        {preview}
      </div>
      <p id="editor-help" className="px-4 py-3 text-xs text-muted">
        Use Ctrl or ⌘ with C to copy, V to paste, Z to undo, and S to save
        locally. Tab leaves the editor. Each file can hold up to 100 KB.
      </p>
    </dialog>
  );
}

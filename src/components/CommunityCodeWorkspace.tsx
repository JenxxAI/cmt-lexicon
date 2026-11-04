"use client";

import { useId, useEffect, useRef, useState, type ReactNode } from "react";
import type { SampleLanguage, SampleSource } from "@/lib/sample-source";
import type { EditorProblem } from "@/lib/editor-diagnostics";
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
  const id = useId();
  const [result, setResult] = useState<{
    source: string;
    problem: EditorProblem | null;
    unavailable?: boolean;
  } | null>(null);
  useEffect(() => {
    if (!active || !value.trim() || value.length > 100_000) return;
    let current = true;
    const timer = window.setTimeout(async () => {
      try {
        const { checkSyntax } = await import("@/lib/editor-diagnostics");
        const problem = await checkSyntax(value, language);
        if (current) setResult({ source: value, problem });
      } catch {
        if (current)
          setResult({ source: value, problem: null, unavailable: true });
      }
    }, 450);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [active, value, language]);
  const checked = result?.source === value ? result : null;
  const problem = checked?.problem;
  return (
    <div hidden={!active}>
      <SampleCodeEditor
        errorLine={problem?.line}
        problemId={problem ? id : undefined}
        language={language}
        value={value}
        onChange={change}
        onBlur={() => {}}
        onCursor={(line, column) => setPosition([line, column])}
      />
      <div role="status" aria-live="polite">
        {problem && (
          <p
            id={id}
            className="workspace-problem break-words bg-red-soft px-4 py-3 text-sm text-red"
          >
            <strong>
              Syntax error · Line {problem.line}, column {problem.column}
            </strong>
            <br />
            {problem.message}
          </p>
        )}
        {(checked?.unavailable || value.length > 100_000) && (
          <p className="bg-body px-4 py-2 text-sm text-surface">
            {value.length > 100_000
              ? "Syntax checking is paused for files over 100,000 characters."
              : "Syntax checking is unavailable. You can still edit and save."}
          </p>
        )}
      </div>
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

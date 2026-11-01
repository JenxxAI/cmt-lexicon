"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  assembleSample,
  splitSample,
  type SampleLanguage,
  type SampleSource,
} from "@/lib/sample-source";
import { OpenFullPreview } from "./OpenFullPreview";
import { SampleCodeEditor } from "./SampleCodeEditor";

const FILES = [
  { key: "html", name: "index.html", label: "HTML", symbol: "<>" },
  { key: "css", name: "styles.css", label: "CSS", symbol: "#" },
  { key: "js", name: "script.js", label: "JavaScript", symbol: "JS" },
] as const;
type Action = "format" | "run" | "export" | "copy" | "initial";

export function WebsiteSampleStudio({
  initialCode,
  id,
  name,
}: {
  initialCode: string;
  id: string;
  name: string;
}) {
  const [initial] = useState(() => splitSample(initialCode));
  const [source, setSource] = useState(initial);
  const [applied, setApplied] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(false);
  const [active, setActive] = useState<SampleLanguage>("html");
  const [autoFormat, setAutoFormat] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Ready to edit.");
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const current = useRef(source);
  const revision = useRef(0);
  const request = useRef(0);
  const opened = useRef(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const pending = FILES.some(({ key }) => source[key] !== applied[key]);
  const control =
    "min-h-11 rounded-full px-4 text-sm font-semibold disabled:opacity-60";

  const format = useCallback(
    async (action: Action, language?: SampleLanguage) => {
      const snapshot = current.current;
      const version = revision.current;
      const operation = ++request.current;
      setBusy(true);
      setError("");
      setMessage("Formatting with Prettier…");
      try {
        const formatter = await import("@/lib/format-sample");
        const formatted = language
          ? {
              ...snapshot,
              [language]: await formatter.formatSampleCode(
                snapshot[language],
                language,
              ),
            }
          : await formatter.formatSample(snapshot);
        // A reset, newer formatting request, or newer edit always wins.
        if (operation !== request.current || version !== revision.current)
          return;
        current.current = formatted;
        setSource(formatted);
        if (action === "run" || action === "initial") setApplied(formatted);
        if (action === "export") {
          const url = URL.createObjectURL(
            new Blob([assembleSample(initialCode, formatted)], {
              type: "text/html",
            }),
          );
          const link = document.createElement("a");
          link.href = url;
          link.download = `${id}-sample.html`;
          link.click();
          window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        if (action === "copy")
          await navigator.clipboard.writeText(
            assembleSample(initialCode, formatted),
          );
        if (operation === request.current)
          setMessage(
            action === "copy"
              ? "Formatted HTML copied."
              : action === "export"
                ? "Formatted HTML exported."
                : action === "run"
                  ? "Formatted and preview updated."
                  : "Formatted with Prettier.",
          );
      } catch (cause) {
        if (operation !== request.current || version !== revision.current)
          return;
        const details =
          cause instanceof Error ? cause.message : "Please try again.";
        setError(
          `${language ? FILES.find((file) => file.key === language)?.name + ": " : ""}${details}`.slice(
            0,
            1200,
          ),
        );
        setMessage(
          "Could not complete the action. Your code and last preview are preserved.",
        );
      } finally {
        if (operation === request.current) {
          setBusy(false);
          if (version !== revision.current)
            setMessage("Newer edits kept. Format again when ready.");
        }
      }
    },
    [id, initialCode],
  );

  useEffect(() => {
    if (editing && !opened.current) {
      opened.current = true;
      void format("initial");
    }
  }, [editing, format]);
  useEffect(
    () => () => {
      request.current++;
      opened.current = false;
    },
    [],
  );

  function reset() {
    request.current++;
    revision.current++;
    current.current = initial;
    setSource(initial);
    setApplied(initial);
    setError("");
    setBusy(false);
    void format("initial");
  }
  function selectFile(key: SampleLanguage) {
    setActive(key);
    setCursor({ line: 1, column: 1 });
  }
  return (
    <section
      aria-labelledby="sample-heading"
      className="mt-10 min-w-0 rounded-[28px] bg-surface p-4 sm:p-6"
      onKeyDown={(event) => {
        if (event.altKey && event.shiftKey && event.key.toLowerCase() === "f") {
          event.preventDefault();
          void format("format");
        }
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          void format("run");
        }
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-deep">
            Interactive sample · Make it yours
          </p>
          <h2
            id="sample-heading"
            className="mt-2 font-display text-2xl font-bold"
          >
            See the blueprint come to life
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Explore the example, open a file, and make a change. Prettier keeps
            your code tidy.
          </p>
        </div>
        <button
          data-format-action
          type="button"
          disabled={busy}
          onClick={() => void format("export")}
          className={`${control} bg-ink text-surface`}
        >
          Export HTML ↓
        </button>
      </div>
      <div className="my-4 flex flex-wrap items-center gap-2">
        <OpenFullPreview title={name} getDocument={() => assembleSample(initialCode, current.current)} className={`${control} inline-flex items-center bg-line hover:bg-rule`} />
        <button
          type="button"
          className={`${control} bg-line hover:bg-rule`}
          aria-expanded={editing}
          aria-controls="sample-editor"
          onClick={() => setEditing(!editing)}
        >
          {editing ? "Hide code" : "Edit code"}
        </button>
        <button
          type="button"
          className={`${control} ${phone ? "bg-ink text-surface" : "bg-line hover:bg-rule"}`}
          aria-pressed={phone}
          onClick={() => setPhone(!phone)}
        >
          Phone preview
        </button>
        <button
          data-format-action
          type="button"
          disabled={busy}
          className={`${control} bg-line hover:bg-rule`}
          onClick={() => void format("copy")}
        >
          Copy full HTML
        </button>
        <button
          data-format-action
          type="button"
          disabled={busy}
          aria-keyshortcuts="Control+Enter Meta+Enter"
          className={`${control} bg-ink text-surface`}
          onClick={() => void format("run")}
        >
          Run changes <span aria-hidden="true">▷</span>
        </button>
        <button
          data-format-action
          type="button"
          className={`${control} hover:bg-line`}
          onClick={reset}
        >
          Reset example
        </button>
      </div>
      {editing && (
        <div
          id="sample-editor"
          className="min-w-0 overflow-hidden rounded-2xl border border-dim bg-code text-surface"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dim/30 bg-ink px-4 py-2">
            <span className="font-mono text-xs text-rule">
              {id} / playground
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-xs">
                <input
                  data-format-action
                  type="checkbox"
                  className="size-4 accent-accent"
                  checked={autoFormat}
                  onChange={(event) => setAutoFormat(event.target.checked)}
                />
                Format on blur
              </label>
              <button
                data-format-action
                type="button"
                disabled={busy}
                aria-keyshortcuts="Alt+Shift+F"
                className="min-h-11 rounded-lg border border-dim px-3 text-xs font-semibold hover:bg-body disabled:opacity-60"
                onClick={() => void format("format")}
              >
                Format code
              </button>
            </div>
          </div>
          <div className="grid min-w-0 md:grid-cols-[160px_minmax(0,1fr)]">
            <aside
              aria-label="Sample files"
              className="hidden border-r border-dim/30 bg-ink p-3 md:block"
            >
              <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-rule">
                Explorer
              </p>
              {FILES.map((file) => (
                <button
                  key={file.key}
                  type="button"
                  aria-current={active === file.key ? "true" : undefined}
                  onClick={() => selectFile(file.key)}
                  className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left font-mono text-xs ${active === file.key ? "bg-body" : "hover:bg-code"}`}
                >
                  <span aria-hidden="true" className="w-5 text-hi">
                    {file.symbol}
                  </span>
                  {file.name}
                </button>
              ))}
            </aside>
            <div className="min-w-0">
              <div
                role="tablist"
                aria-label="Code files"
                className="flex overflow-x-auto border-b border-dim/30 bg-ink"
              >
                {FILES.map((file, index) => (
                  <button
                    ref={(element) => {
                      tabs.current[index] = element;
                    }}
                    key={file.key}
                    type="button"
                    role="tab"
                    id={`file-tab-${file.key}`}
                    aria-controls={`file-panel-${file.key}`}
                    aria-selected={active === file.key}
                    tabIndex={active === file.key ? 0 : -1}
                    onClick={() => selectFile(file.key)}
                    onKeyDown={(event) => {
                      const next =
                        event.key === "ArrowRight"
                          ? (index + 1) % 3
                          : event.key === "ArrowLeft"
                            ? (index + 2) % 3
                            : event.key === "Home"
                              ? 0
                              : event.key === "End"
                                ? 2
                                : null;
                      if (next !== null) {
                        event.preventDefault();
                        selectFile(FILES[next].key);
                        tabs.current[next]?.focus();
                      }
                    }}
                    className={`flex min-h-11 shrink-0 items-center gap-2 border-t-2 px-4 font-mono text-xs ${active === file.key ? "border-accent bg-code text-surface" : "border-transparent text-rule hover:bg-body"}`}
                  >
                    <span aria-hidden="true" className="text-hi">
                      {file.symbol}
                    </span>
                    {file.name}
                    {source[file.key] !== applied[file.key] && (
                      <span aria-label="Unapplied edits">•</span>
                    )}
                  </button>
                ))}
              </div>
              {FILES.map((file) => (
                <div
                  key={file.key}
                  id={`file-panel-${file.key}`}
                  role="tabpanel"
                  aria-labelledby={`file-tab-${file.key}`}
                  hidden={active !== file.key}
                >
                  {active === file.key && (
                    <SampleCodeEditor
                      key={file.key}
                      language={file.key}
                      value={source[file.key]}
                      onCursor={(line, column) => setCursor({ line, column })}
                      onChange={(value) => {
                        revision.current++;
                        const next = { ...current.current, [file.key]: value };
                        current.current = next;
                        setSource(next);
                        setError("");
                        setMessage(
                          "Unsaved edits. Run changes to update the preview.",
                        );
                      }}
                      onBlur={(nextTarget) => {
                        if (
                          autoFormat &&
                          !(
                            nextTarget instanceof HTMLElement &&
                            nextTarget.closest("[data-format-action]")
                          )
                        )
                          void format("format", file.key);
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-t border-dim/30 bg-ink px-4 py-2 font-mono text-[11px] text-rule">
            <span>
              Ln {cursor.line}, Col {cursor.column} · Spaces: 2
            </span>
            <span>
              {FILES.find((file) => file.key === active)?.label} · UTF-8 ·{" "}
              {busy ? "Formatting…" : "Prettier"}
            </span>
          </div>
        </div>
      )}
      <p id="editor-help" className="mt-3 text-xs text-muted">
        {editing
          ? "Tab moves between controls. Alt+Shift+F formats; Ctrl/Cmd+Enter runs. Formatting also runs before Run, Copy, and Export."
          : "Open Edit code to work with HTML, CSS, and JavaScript files."}
      </p>
      {error && (
        <pre
          role="alert"
          className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-red-soft p-4 font-mono text-xs text-red"
          tabIndex={0}
        >
          {error}
        </pre>
      )}
      <div className="my-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span className="font-mono uppercase tracking-wider">
          {phone ? "Phone canvas" : "Live preview"}
          {pending ? " · Unapplied edits" : ""}
        </span>
        <p role="status">{message}</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-rule bg-stage p-2 sm:p-6">
        {phone ? (
          <div className="mx-auto w-full max-w-[414px] rounded-[44px] border border-muted bg-ink p-2.5 shadow-xl">
            <div
              aria-hidden="true"
              className="flex h-9 items-center justify-between px-6 font-mono text-xs text-surface"
            >
              <span>9:41</span>
              <span className="h-2 w-14 rounded-full bg-dim" />
              <span>100%</span>
            </div>
            <iframe
              title={`Interactive ${name.toLowerCase()} phone sample`}
              sandbox="allow-scripts allow-forms"
              srcDoc={assembleSample(initialCode, applied)}
              className="block h-[640px] w-full rounded-[28px] border-0 bg-paper"
            />
            <div
              aria-hidden="true"
              className="flex h-7 items-end justify-center pb-1"
            >
              <span className="h-1 w-24 rounded-full bg-surface" />
            </div>
          </div>
        ) : (
          <iframe
            title={`Interactive ${name.toLowerCase()} sample`}
            sandbox="allow-scripts allow-forms"
            srcDoc={assembleSample(initialCode, applied)}
            className="block h-[640px] w-full rounded-xl border-0 bg-paper"
          />
        )}
      </div>
      <p className="mt-3 text-xs text-muted">
        Edits stay in this session. Export saves the files as one standalone
        HTML document. Sample actions do not send data.
      </p>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { assembleSample, splitSample, type SampleLanguage, type SampleSource } from "@/lib/sample-source";
import { OpenFullPreview } from "./OpenFullPreview";
import { SampleCodeEditor } from "./SampleCodeEditor";

const FILES = [
  { key: "html", name: "index.html", label: "HTML", symbol: "<>" },
  { key: "css", name: "styles.css", label: "CSS", symbol: "#" },
  { key: "js", name: "script.js", label: "JavaScript", symbol: "JS" },
] as const;
type Action = "format" | "run" | "export" | "copy";

const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold disabled:opacity-60";
const menuItem = "flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-medium hover:bg-line disabled:opacity-60";

export function WebsiteEditor({ initialCode, id, name }: { initialCode: string; id: string; name: string }) {
  const storeKey = `ui-lexicon-edit:${id}`;
  const [initial] = useState(() => splitSample(initialCode));
  const [source, setSource] = useState<SampleSource>(initial);
  const [applied, setApplied] = useState<SampleSource>(initial);
  const [active, setActive] = useState<SampleLanguage>("html");
  const [pane, setPane] = useState<"code" | "preview">("code");
  const [phone, setPhone] = useState(false);
  const [live, setLive] = useState(true);
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Ready. Changes update the preview automatically.");
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const current = useRef(source);
  const revision = useRef(0);
  const request = useRef(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuBox = useRef<HTMLDivElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const pending = FILES.some(({ key }) => source[key] !== applied[key]);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storeKey) ?? "null");
      if (saved && FILES.every(({ key }) => typeof saved[key] === "string")) {
        const value = { html: saved.html, css: saved.css, js: saved.js };
        current.current = value;
        setSource(value);
        setApplied(value);
        setMessage("Your earlier edits in this tab were restored.");
      }
    } catch { /* storage is optional */ }
  }, [storeKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { sessionStorage.setItem(storeKey, JSON.stringify(source)); } catch { /* ignore */ }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [source, storeKey]);

  useEffect(() => {
    if (!live || !pending) return;
    const timer = window.setTimeout(() => {
      setApplied(current.current);
      setMessage("Preview updated.");
    }, 600);
    return () => window.clearTimeout(timer);
  }, [live, pending, source]);

  useEffect(() => {
    if (!menu) return;
    const outside = (event: PointerEvent) => {
      if (!menuBox.current?.contains(event.target as Node)) setMenu(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [menu]);

  useEffect(() => () => { request.current++; }, []);

  const format = useCallback(async (action: Action, language?: SampleLanguage) => {
    const snapshot = current.current;
    const version = revision.current;
    const operation = ++request.current;
    setBusy(true);
    setError("");
    setMessage("Formatting with Prettier…");
    try {
      const formatter = await import("@/lib/format-sample");
      const formatted = language
        ? { ...snapshot, [language]: await formatter.formatSampleCode(snapshot[language], language) }
        : await formatter.formatSample(snapshot);
      if (operation !== request.current || version !== revision.current) return;
      current.current = formatted;
      setSource(formatted);
      if (action === "run") setApplied(formatted);
      if (action === "export") {
        const url = URL.createObjectURL(new Blob([assembleSample(initialCode, formatted)], { type: "text/html" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `${id}-sample.html`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      if (action === "copy") await navigator.clipboard.writeText(assembleSample(initialCode, formatted));
      setMessage({ copy: "Formatted HTML copied.", export: "Formatted HTML exported.", run: "Formatted and preview updated.", format: "Formatted with Prettier." }[action]);
    } catch (cause) {
      if (operation !== request.current || version !== revision.current) return;
      const details = cause instanceof Error ? cause.message : "Please try again.";
      setError(`${language ? FILES.find((f) => f.key === language)?.name + ": " : ""}${details}`.slice(0, 1200));
      setMessage("Could not complete the action. Your code and last preview are kept.");
    } finally {
      if (operation === request.current) {
        setBusy(false);
        if (version !== revision.current) setMessage("Newer edits kept. Format again when ready.");
      }
    }
  }, [id, initialCode]);

  function runMenu(action: Action) {
    setMenu(false);
    void format(action);
  }
  function reset() {
    request.current++;
    revision.current++;
    current.current = initial;
    setSource(initial);
    setApplied(initial);
    setError("");
    setBusy(false);
    setMenu(false);
    setMessage("Example reset.");
    try { sessionStorage.removeItem(storeKey); } catch { /* ignore */ }
  }
  function selectFile(key: SampleLanguage) {
    setActive(key);
    setCursor({ line: 1, column: 1 });
  }

  const doc = assembleSample(initialCode, applied);
  const frameTitle = `Live ${name.toLowerCase()} preview`;

  return (
    <section
      aria-label={`${name} code editor`}
      className="mt-2"
      onKeyDown={(event) => {
        if (event.altKey && event.shiftKey && event.key.toLowerCase() === "f") { event.preventDefault(); void format("format"); }
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); void format("run"); }
        if (event.key === "Escape" && menu) { setMenu(false); menuTrigger.current?.focus(); }
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-surface p-3">
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl font-bold">
            {name} sample {pending && <span role="img" aria-label="Unapplied edits" title="Unapplied edits" className="ml-1 inline-block size-2.5 rounded-full bg-accent-deep align-middle" />}
          </h1>
          <p role="status" className="truncate text-xs text-muted">{busy ? "Formatting…" : message}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Preview size" className="flex rounded-full bg-line p-1">
            {[false, true].map((isPhone) => (
              <button key={String(isPhone)} type="button" aria-pressed={phone === isPhone} onClick={() => setPhone(isPhone)}
                className={`min-h-11 rounded-full px-4 text-sm font-medium ${phone === isPhone ? "bg-ink text-surface" : "hover:bg-rule"}`}>
                {isPhone ? "Phone" : "Desktop"}
              </button>
            ))}
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 px-1 text-sm">
            <input type="checkbox" className="size-4 accent-accent" checked={live} onChange={(e) => setLive(e.target.checked)} />
            Live
          </label>
          <button type="button" disabled={busy} aria-keyshortcuts="Control+Enter Meta+Enter" onClick={() => void format("run")} className={`${btn} bg-ink text-surface`}>
            Run <span aria-hidden="true">▷</span>
          </button>
          <div ref={menuBox} className="relative">
            <button ref={menuTrigger} type="button" aria-expanded={menu} aria-controls="editor-more" onClick={() => setMenu(!menu)} className={`${btn} bg-line hover:bg-rule`}>
              More <span aria-hidden="true">⋯</span>
            </button>
            <div id="editor-more" hidden={!menu} className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-rule bg-surface p-1.5 shadow-xl">
              <button type="button" disabled={busy} data-format-action aria-keyshortcuts="Alt+Shift+F" className={menuItem} onClick={() => runMenu("format")}>Format code</button>
              <button type="button" disabled={busy} className={menuItem} onClick={() => runMenu("copy")}>Copy full HTML</button>
              <button type="button" disabled={busy} className={menuItem} onClick={() => runMenu("export")}>Export HTML ↓</button>
              <OpenFullPreview title={name} getDocument={() => assembleSample(initialCode, current.current)} className={menuItem} />
              <div role="separator" className="my-1 h-px bg-line" />
              <button type="button" className={`${menuItem} text-red`} onClick={reset}>Reset example</button>
            </div>
          </div>
        </div>
      </div>

      <div role="group" aria-label="Editor view" className="mt-3 flex rounded-full bg-line p-1 lg:hidden">
        {(["code", "preview"] as const).map((value) => (
          <button key={value} type="button" aria-pressed={pane === value} onClick={() => setPane(value)}
            className={`min-h-11 flex-1 rounded-full text-sm font-semibold capitalize ${pane === value ? "bg-ink text-surface" : ""}`}>
            {value}
          </button>
        ))}
      </div>

      <div className="mt-3 grid min-w-0 gap-3 lg:grid-cols-2">
        <div className={`min-w-0 overflow-hidden rounded-[24px] border border-dim bg-code text-surface [--workspace-editor-height:max(360px,calc(100dvh-21rem))] ${pane === "code" ? "" : "max-lg:hidden"}`}>
          <div role="tablist" aria-label="Code files" className="flex overflow-x-auto border-b border-dim/30 bg-ink">
            {FILES.map((file, index) => (
              <button key={file.key} ref={(el) => { tabs.current[index] = el; }} type="button" role="tab"
                id={`edit-tab-${file.key}`} aria-controls={`edit-panel-${file.key}`}
                aria-selected={active === file.key} tabIndex={active === file.key ? 0 : -1}
                onClick={() => selectFile(file.key)}
                onKeyDown={(event) => {
                  const next = event.key === "ArrowRight" ? (index + 1) % 3 : event.key === "ArrowLeft" ? (index + 2) % 3 : event.key === "Home" ? 0 : event.key === "End" ? 2 : null;
                  if (next !== null) { event.preventDefault(); selectFile(FILES[next].key); tabs.current[next]?.focus(); }
                }}
                className={`flex min-h-11 shrink-0 items-center gap-2 border-t-2 px-4 font-mono text-xs ${active === file.key ? "border-accent bg-code text-surface" : "border-transparent text-rule hover:bg-body"}`}>
                <span aria-hidden="true" className="text-hi">{file.symbol}</span>
                {file.name}
                {source[file.key] !== applied[file.key] && <span aria-label="Unapplied edits">•</span>}
              </button>
            ))}
          </div>
          {FILES.map((file) => (
            <div key={file.key} id={`edit-panel-${file.key}`} role="tabpanel" aria-labelledby={`edit-tab-${file.key}`} hidden={active !== file.key}>
              {active === file.key && (
                <SampleCodeEditor key={file.key} language={file.key} value={source[file.key]}
                  onCursor={(line, column) => setCursor({ line, column })}
                  onChange={(value) => {
                    revision.current++;
                    const next = { ...current.current, [file.key]: value };
                    current.current = next;
                    setSource(next);
                    setError("");
                    if (!live) setMessage("Unapplied edits. Press Run to update the preview.");
                  }}
                  onBlur={() => {}}
                />
              )}
            </div>
          ))}
          <div className="flex flex-wrap justify-between gap-2 border-t border-dim/30 bg-ink px-4 py-2 font-mono text-[11px] text-rule">
            <span>Ln {cursor.line}, Col {cursor.column} · Spaces: 2</span>
            <span>{FILES.find((f) => f.key === active)?.label} · UTF-8</span>
          </div>
        </div>

        <div className={`min-w-0 overflow-hidden rounded-[24px] border border-rule bg-stage p-2 sm:p-4 ${pane === "preview" ? "" : "max-lg:hidden"}`}>
          {phone ? (
            <div className="mx-auto w-full max-w-[390px] rounded-[40px] border border-muted bg-ink p-2.5 shadow-xl">
              <iframe title={frameTitle} sandbox="allow-scripts allow-forms" srcDoc={doc} className="block h-[max(520px,calc(100dvh-24rem))] w-full rounded-[28px] border-0 bg-paper" />
            </div>
          ) : (
            <iframe title={frameTitle} sandbox="allow-scripts allow-forms" srcDoc={doc} className="block h-[max(420px,calc(100dvh-19rem))] w-full rounded-xl border-0 bg-paper" />
          )}
        </div>
      </div>

      <p id="editor-help" className="mt-3 text-xs text-muted">
        Tab moves between controls. Alt+Shift+F formats; Ctrl/Cmd+Enter runs. Edits stay in this tab until you export. Sample actions do not send data.
      </p>
      {error && (
        <pre role="alert" tabIndex={0} className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-red-soft p-4 font-mono text-xs text-red">{error}</pre>
      )}
      <Link href={`/websites/${id}/`} className="mt-4 inline-flex min-h-11 items-center text-sm text-accent-deep underline underline-offset-4">← Back to {name}</Link>
    </section>
  );
}

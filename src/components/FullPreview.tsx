"use client";
import { useEffect, useState } from "react";
import {
  PREVIEW_PREFIX,
  parsePreview,
  type PreviewSnapshot,
} from "@/lib/full-preview";

export function FullPreview() {
  const [snapshot, setSnapshot] = useState<PreviewSnapshot | null>(null);
  const [ready, setReady] = useState(false);
  const [phone, setPhone] = useState(false);
  const [running, setRunning] = useState(true);
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("id") ?? "";
    if (/^[a-f0-9-]{36}$/i.test(id)) {
      const key = PREVIEW_PREFIX + id;
      try {
        const saved =
          parsePreview(sessionStorage.getItem(key)) ??
          parsePreview(localStorage.getItem(key));
        if (saved) {
          sessionStorage.setItem(key, JSON.stringify(saved));
          setSnapshot(saved);
        }
        localStorage.removeItem(key);
      } catch {
        /* Storage is optional; the empty state explains recovery. */
      }
    }
    setReady(true);
  }, []);
  const control =
    "inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold";
  if (!ready)
    return (
      <main id="main" className="p-6" role="status">
        Loading preview…
      </main>
    );
  if (!snapshot)
    return (
      <main id="main" className="mx-auto max-w-xl p-6">
        <h1 className="font-display text-3xl font-bold">
          Open a fresh preview
        </h1>
        <p className="my-4 text-body">
          This preview is unavailable or expired. Return to the editor and
          choose Open full preview. Preview links work only in this browser and
          expire after 15 minutes.
        </p>
        <a href="/websites/" className={`${control} bg-ink text-surface`}>
          Browse website samples
        </a>
      </main>
    );
  return (
    <main id="main" className="flex h-dvh min-h-0 flex-col bg-paper">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-rule bg-surface px-4 py-2">
        <h1 className="min-w-0 max-w-full break-words font-display text-lg font-bold">
          {snapshot.title}
        </h1>
        <nav
          aria-label="Preview controls"
          className="flex max-w-full flex-wrap gap-2"
        >
          <button
            className={`${control} ${!phone ? "bg-ink text-surface" : "bg-line"}`}
            aria-pressed={!phone}
            onClick={() => setPhone(false)}
          >
            Desktop
          </button>
          <button
            className={`${control} ${phone ? "bg-ink text-surface" : "bg-line"}`}
            aria-pressed={phone}
            onClick={() => setPhone(true)}
          >
            Mobile
          </button>
          <button
            className={`${control} bg-line`}
            onClick={() => setRunning(!running)}
          >
            {running ? "Stop preview" : "Run preview"}
          </button>
          <a
            className={`${control} bg-line`}
            href={snapshot.returnTo}
            onClick={(event) => {
              if (window.history.length === 1) {
                event.preventDefault();
                window.close();
                window.setTimeout(() => window.location.assign(snapshot.returnTo), 150);
              }
            }}
          >
            Back to editor
          </a>
        </nav>
      </header>
      <div className={`min-h-0 flex-1 ${phone ? "overflow-auto p-3" : ""}`}>
        <div
          className={
            phone
              ? "mx-auto h-full min-h-80 w-full max-w-[390px] rounded-[36px] border-[8px] border-ink bg-ink pb-2 pt-5"
              : "h-full w-full"
          }
        >
          {running ? (
            <iframe
              title={`Full preview: ${snapshot.title}`}
              srcDoc={snapshot.document}
              sandbox="allow-scripts"
              referrerPolicy="no-referrer"
              className={`block h-full w-full border-0 bg-surface ${phone ? "rounded-[24px]" : ""}`}
            />
          ) : (
            <div
              role="status"
              className="grid h-full place-items-center rounded-2xl bg-surface p-6 text-muted"
            >
              Preview stopped.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

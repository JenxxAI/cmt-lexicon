"use client";

import { useState } from "react";
import { CopyButton } from "./CopyButton";

export function WebsiteSample({ initialCode, id, name }: { initialCode: string; id: string; name: string }) {
  const [code, setCode] = useState(initialCode);
  const [preview, setPreview] = useState(initialCode);
  const [editing, setEditing] = useState(false);
  const [mobile, setMobile] = useState(false);
  const control = "min-h-11 rounded-full bg-line px-4 text-sm font-semibold hover:bg-rule";
  function download() {
    const url = URL.createObjectURL(new Blob([code], { type: "text/html" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${id}-sample.html`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section aria-labelledby="sample-heading" className="mt-10 min-w-0 rounded-[28px] bg-surface p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-accent-deep">Try a complete example</p><h2 id="sample-heading" className="mt-2 font-display text-2xl font-bold">See the blueprint come to life</h2><p className="mt-2 max-w-xl text-sm text-muted">Explore this {name.toLowerCase()} example. Edit the HTML, CSS, or JavaScript, then run your changes.</p></div>
      <button type="button" onClick={download} className="min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-surface">Export HTML ↓</button>
    </div>
    <div className="my-4 flex flex-wrap gap-2">
      <button type="button" className={control} aria-pressed={editing} onClick={() => setEditing(!editing)}>{editing ? "Hide code" : "Edit code"}</button>
      <button type="button" className={control} aria-pressed={mobile} onClick={() => setMobile(!mobile)}>Phone preview</button>
      <CopyButton text={code} label="Copy HTML" />
      {editing && <><button type="button" className={control} onClick={() => setPreview(code)}>Run changes</button><button type="button" className={control} onClick={() => { setCode(initialCode); setPreview(initialCode); }}>Reset example</button></>}
    </div>
    {editing && <div className="mb-4"><label htmlFor="sample-code" className="mb-2 block text-sm font-semibold">Standalone HTML, CSS &amp; JavaScript</label><textarea id="sample-code" spellCheck={false} value={code} onChange={event => setCode(event.target.value)} className="h-80 w-full rounded-2xl bg-code p-4 font-mono text-sm text-surface" /><p role="status" className="text-sm text-muted">{code !== preview ? "Unapplied edits — select Run changes to update the preview." : "Preview is up to date."}</p></div>}
    <div className="overflow-hidden rounded-2xl border border-rule bg-stage p-2 sm:p-4"><iframe title={`Interactive ${name.toLowerCase()} sample`} sandbox="allow-scripts allow-forms" srcDoc={preview} className={`mx-auto h-[640px] w-full rounded-xl border-0 bg-paper ${mobile ? "max-w-[390px]" : ""}`} /></div>
    <p className="mt-3 text-xs text-muted">Runs in an isolated preview. Export downloads one HTML file with no dependencies; open it in your browser to keep experimenting.</p>
  </section>;
}

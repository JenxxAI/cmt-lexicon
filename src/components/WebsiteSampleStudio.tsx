"use client";

import { useState } from "react";
import { CopyButton } from "./CopyButton";

type Source = { html: string; css: string; js: string };

function splitDocument(document: string): Source {
  return {
    html: (document.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? "").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").trim().replace(/></g, ">\n<"),
    css: (document.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] ?? "").trim().replace(/\s*{\s*/g, " {\n  ").replace(/;\s*/g, ";\n  ").replace(/\s*}\s*/g, "\n}\n\n"),
    js: (document.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)?.[1] ?? "").trim(),
  };
}

export function WebsiteSampleStudio({ initialCode, id, name }: { initialCode: string; id: string; name: string }) {
  const [initial] = useState(() => splitDocument(initialCode));
  const [source, setSource] = useState(initial);
  const [applied, setApplied] = useState(initial);
  const [editing, setEditing] = useState(true);
  const [phone, setPhone] = useState(false);
  const head = initialCode.match(/<head>([\s\S]*?)<\/head>/i)?.[1].replace(/<style[^>]*>[\s\S]*?<\/style>/i, "") ?? "";
  const documentFor = (value: Source) => `<!doctype html>\n<html lang="en">\n<head>${head}\n<style>\n${value.css}\n</style>\n</head>\n<body>\n${value.html}\n<script>\n${value.js}\n</script>\n</body>\n</html>`;
  const code = documentFor(source);
  const pending = (Object.keys(source) as (keyof Source)[]).some(key => source[key] !== applied[key]);
  const control = "min-h-11 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-accent-deep";
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
      <div><p className="text-xs font-semibold uppercase tracking-widest text-accent-deep">Interactive sample · Try it your way</p><h2 id="sample-heading" className="mt-2 font-display text-2xl font-bold">See the blueprint come to life</h2><p className="mt-2 max-w-xl text-sm text-muted">Three languages, one live example. Edit a panel and run your changes to see what happens.</p></div>
      <button type="button" onClick={download} className={`${control} bg-ink text-surface`}>Export HTML ↓</button>
    </div>
    <div className="my-4 flex flex-wrap items-center gap-2">
      <button type="button" className={`${control} bg-line hover:bg-rule`} aria-pressed={editing} onClick={() => setEditing(!editing)}>{editing ? "Hide code" : "Edit code"}</button>
      <button type="button" className={`${control} ${phone ? "bg-ink text-surface" : "bg-line hover:bg-rule"}`} aria-pressed={phone} onClick={() => setPhone(!phone)}>Phone preview</button>
      <CopyButton text={code} label="Copy full HTML" />
      <button type="button" className={`${control} bg-ink text-surface`} onClick={() => setApplied({ ...source })}>Run changes <span aria-hidden="true">↗</span></button>
      <button type="button" className={`${control} hover:bg-line`} onClick={() => { setSource(initial); setApplied(initial); }}>Reset example</button>
    </div>
    {editing && <div className="grid min-w-0 gap-3 lg:grid-cols-3">
      {([['html', 'HTML', 'Structure'], ['css', 'CSS', 'Appearance'], ['js', 'JavaScript', 'Behavior']] as const).map(([key, label, description]) => <div key={key} className="min-w-0 overflow-hidden rounded-2xl bg-code text-surface">
        <div className="flex items-center justify-between gap-2 border-b border-dim/30 px-4 py-3"><label htmlFor={`studio-${key}`} className="font-mono text-sm font-semibold">{label}</label><span className="text-xs text-rule">{description}</span></div>
        <textarea id={`studio-${key}`} aria-label={`${label} code`} spellCheck={false} autoCapitalize="off" autoCorrect="off" wrap="off" value={source[key]} onChange={event => setSource({ ...source, [key]: event.target.value })} className="block h-72 min-h-44 w-full resize-y bg-code p-4 font-mono text-[13px] leading-6 text-surface outline-offset-[-3px] selection:bg-accent-soft selection:text-ink" style={{ tabSize: 2 }} />
      </div>)}
    </div>}
    <div className="my-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted"><span className="font-mono uppercase tracking-wider">{phone ? "Phone canvas" : "Live preview"}</span><p role="status">{pending ? "Edits ready — select Run changes." : "Preview is up to date."}</p></div>
    <div className="overflow-hidden rounded-2xl border border-rule bg-stage p-2 sm:p-6">
      {phone ? <div className="mx-auto w-full max-w-[414px] rounded-[44px] border border-muted bg-ink p-2.5 shadow-xl">
        <div aria-hidden="true" className="flex h-9 items-center justify-between px-6 font-mono text-xs text-surface"><span>9:41</span><span className="h-2 w-14 rounded-full bg-dim" /><span>100%</span></div>
        <iframe title={`Interactive ${name.toLowerCase()} phone sample`} sandbox="allow-scripts allow-forms" srcDoc={documentFor(applied)} className="block h-[640px] w-full rounded-[28px] border-0 bg-paper" />
        <div aria-hidden="true" className="flex h-7 items-end justify-center pb-1"><span className="h-1 w-24 rounded-full bg-surface" /></div>
      </div> : <iframe title={`Interactive ${name.toLowerCase()} sample`} sandbox="allow-scripts allow-forms" srcDoc={documentFor(applied)} className="block h-[640px] w-full rounded-xl border-0 bg-paper" />}
    </div>
    <p className="mt-3 text-xs text-muted">Edits stay in this session. Export saves all three panels as one standalone HTML file. Sample actions do not send data.</p>
  </section>;
}

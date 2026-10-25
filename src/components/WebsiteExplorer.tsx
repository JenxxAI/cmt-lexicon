"use client";

import { useMemo, useState } from "react";
import type { WebsiteTypeSummary } from "@/lib/schema";
import { search } from "@/lib/search";
import { WebsiteCard } from "./WebsiteCard";

export function WebsiteExplorer({ entries }: { entries: WebsiteTypeSummary[] }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("all");
  const groups = useMemo(() => [...new Set(entries.map(entry => entry.tags[0]))].sort(), [entries]);
  const results = useMemo(() => search(entries, query).filter(entry => tag === "all" || entry.tags[0] === tag), [entries, query, tag]);
  function clear() { setQuery(""); setTag("all"); }
  return <>
    <div className="mt-8 grid gap-4 rounded-[28px] bg-surface p-5 sm:grid-cols-[1fr_auto]">
      <label className="block min-w-0">
        <span className="mb-2 block text-sm font-medium">Describe the website</span>
        <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Page with products and cart" className="min-h-11 w-full rounded-2xl border border-rule bg-paper px-4 text-base" />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium">Filter by purpose</span>
        <select value={tag} onChange={event => setTag(event.target.value)} className="min-h-11 w-full rounded-2xl border border-rule bg-paper px-4 capitalize">
          <option value="all">All purposes</option>
          {groups.map(group => <option key={group} value={group}>{group[0].toUpperCase() + group.slice(1)}</option>)}
        </select>
      </label>
    </div>
    <div className="mt-4 flex min-h-11 items-center justify-between gap-3">
      <p role="status" className="text-sm text-muted">{results.length} of {entries.length} website types</p>
      {(query || tag !== "all") && <button type="button" onClick={clear} className="min-h-11 rounded-full bg-surface px-4 text-sm hover:bg-line">Clear</button>}
    </div>
    <h2 className="sr-only">Website type results</h2>
    {results.length ? <ul aria-label="Website types" className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {results.map(entry => <li key={entry.id}><WebsiteCard entry={entry} /></li>)}
    </ul> : <div className="mt-4 rounded-[28px] bg-surface p-8 text-center">
      <h2 className="font-display text-xl font-bold">No matching website types</h2>
      <p className="mt-2 text-muted">Try describing what visitors can do, or choose a different purpose.</p>
      <button type="button" onClick={clear} className="mt-4 min-h-11 rounded-full bg-ink px-5 text-white">Clear search and filter</button>
    </div>}
  </>;
}

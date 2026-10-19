"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import type { EntrySummary } from "@/lib/schema";
import { search } from "@/lib/search";
import { SPOTLIGHT_IDS } from "@/lib/site";
import { ComponentCard } from "./ComponentCard";
import { SearchIcon } from "./icons";
import { Preview } from "./previews";

const EXAMPLES = ["popup with dark background", "three lines icon", "gray loading boxes"];

const chip = "max-sm:shrink-0 max-sm:whitespace-nowrap min-h-11 rounded-full border px-[18px] text-[15px] font-medium";

export function Explorer({ entries, assetGuide }: { entries: EntrySummary[]; assetGuide: ReactNode }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");

  const input = useRef<HTMLInputElement>(null);
  const [urlReady, setUrlReady] = useState(false);

  useEffect(() => {
    function readUrl() {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("cat");
      setQuery(params.get("q") ?? "");
      setCategory(cat && Object.hasOwn(CATEGORIES, cat) ? cat as CategoryId : "all");
      setUrlReady(true);
    }
    readUrl();
    window.addEventListener("popstate", readUrl);
    return () => window.removeEventListener("popstate", readUrl);
  }, []);

  useEffect(() => {
    if (!urlReady) return;
    const timer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      if (query) url.searchParams.set("q", query);
      else url.searchParams.delete("q");
      if (category !== "all") url.searchParams.set("cat", category);
      else url.searchParams.delete("cat");
      if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, category, urlReady]);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      const target = event.target;
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
      if (target instanceof HTMLElement && (target.closest("input, textarea") || target.isContentEditable)) return;
      event.preventDefault();
      input.current?.focus();
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const trimmed = query.trim();
  const matches = useMemo(() => search(entries, query), [entries, query]);
  const visible = useMemo(
    () => (category === "all" ? matches : matches.filter((entry) => entry.category === category)),
    [matches, category],
  );

  // Only offer categories that actually have entries.
  const categories = useMemo(() => {
    const present = new Set(entries.map((entry) => entry.category));
    return (Object.keys(CATEGORIES) as CategoryId[]).filter((id) => present.has(id));
  }, [entries]);

  const spotlight = trimmed
    ? matches.slice(0, 3)
    : SPOTLIGHT_IDS.flatMap((id) => entries.find((entry) => entry.id === id) ?? []);

  function jumpToResults() {
    const target = document.getElementById("browse");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }

  function clearAll() {
    setQuery("");
    setCategory("all");
  }

  return (
    <>
      {/* Hero */}
      <section className="flex flex-wrap items-start gap-12 pb-12 pt-10 sm:pt-14">
        <div className="min-w-0 flex-[1_1_520px]">
          <div className="inline-flex items-center rounded-full bg-hi px-3.5 py-1.5 font-mono text-[13px] font-medium">
            Free · open source · MIT
          </div>
          <h1 className="mt-5 font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-[64px]">
            <span className="block">Can’t name it?</span>
            <span className="block text-accent">Describe it.</span>
          </h1>
          <p className="mt-5 max-w-[520px] text-lg text-muted">
            Search UI components by what they look like. Get the real name, the library equivalents, and a short
            prompt that keeps your token bill small.
          </p>

          <form
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              jumpToResults();
            }}
            className="mt-7 flex max-w-[560px] flex-wrap items-center gap-2 rounded-2xl border border-rule bg-surface py-2 pl-4 pr-2 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent"
          >
            <SearchIcon className="size-5 text-muted" />
            <label htmlFor="q" className="sr-only">
              Describe the UI element
            </label>
            <input
              id="q"
              ref={input}
              aria-keyshortcuts="/"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Describe it: a panel that slides in from the side"
              autoComplete="off"
              className="min-h-11 min-w-0 flex-[1_1_12rem] bg-transparent text-[17px] outline-none placeholder:text-muted"
            />
            <kbd aria-hidden="true" className="hidden rounded border border-rule px-2 font-mono text-sm text-muted sm:block">/</kbd>
            <button
              type="submit"
              className="min-h-11 rounded-[11px] bg-accent px-[22px] text-[15px] font-semibold text-white hover:bg-accent-deep"
            >
              Find it
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">Try:</span>
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setQuery(example)}
                className="min-h-11 rounded-full border border-rule px-3.5 text-sm hover:border-ink"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Live results card */}
        <div className="min-w-0 flex-[1_1_440px] rounded-[20px] border border-rule bg-surface p-3">
          <p className="px-3 pb-3 pt-2.5 text-sm text-muted" aria-live="polite">
            {trimmed
              ? matches.length > 0
                ? `${matches.length} ${matches.length === 1 ? "match" : "matches"} for “${trimmed}”`
                : `No matches for “${trimmed}” yet. Try describing what it looks like.`
              : "Popular terms"}
          </p>

          <ul>
            {spotlight.map((entry, index) => (
              <li key={entry.id}>
                <Link
                  href={`/components/${entry.id}/`}
                  className={`flex items-center gap-3.5 rounded-[14px] px-3 py-3.5 hover:bg-paper ${
                    trimmed && index === 0 ? "bg-accent-soft hover:bg-accent-soft" : ""
                  }`}
                >
                  <span className="block size-[52px] shrink-0 overflow-hidden rounded-xl" aria-hidden="true">
                    <Preview id={entry.id} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-xl font-semibold">{entry.name}</span>
                    <span className="block truncate text-sm text-muted">
                      Also called {entry.aliases.slice(0, 3).join(", ")}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 font-mono text-xs ${
                      trimmed && index === 0 ? "rounded-full bg-ink px-2.5 py-1 text-white" : "text-muted"
                    }`}
                  >
                    {trimmed && index === 0 ? "Best match" : CATEGORIES[entry.category]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mx-3 mb-1 mt-1.5 border-t border-line pt-3.5 text-sm text-muted">
            {trimmed
              ? "Not what you meant? Describe it differently, or browse by category below."
              : "Describe what you see, or browse by category below."}
          </p>
        </div>
      </section>

      {assetGuide}

      {/* Browse */}
      <section id="browse" aria-labelledby="browse-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="browse-heading" className="font-display text-[32px] font-bold tracking-tight">
            Browse the basics
          </h2>
          <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2 max-sm:w-full max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:p-1">
            {(["all", ...categories] as const).map((id) => {
              const active = category === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(id)}
                  className={`${chip} ${
                    active ? "border-ink bg-ink text-white" : "border-rule bg-surface text-ink hover:border-ink"
                  }`}
                >
                  {id === "all" ? "All" : CATEGORIES[id]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">
            Showing {visible.length} of {entries.length}
            {trimmed ? ` for “${trimmed}”` : ""}
          </p>

          {(query || category !== "all") && (
            <button type="button" onClick={clearAll} className="min-h-11 rounded-lg border border-rule bg-surface px-4 text-sm hover:border-ink">Clear</button>
          )}
        </div>

        {visible.length > 0 ? (
          <ul className="mt-5 grid grid-cols-1 gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((entry) => (
              <li key={entry.id}>
                <ComponentCard entry={entry} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-5 rounded-[18px] border border-dashed border-rule bg-surface p-10 text-center">
            <p className="font-display text-xl font-semibold">Nothing here yet</p>
            <p className="mx-auto mt-1 max-w-md text-muted">
              Try describing what it looks like or what it does, not what it’s called.
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="mt-4 min-h-11 rounded-xl border border-ink px-5 text-sm font-medium hover:bg-paper"
            >
              Clear search and filters
            </button>
          </div>
        )}
      </section>
    </>
  );
}

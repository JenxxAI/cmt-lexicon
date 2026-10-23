import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { assets } from "@/lib/assets";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { buildCheatSheet } from "@/lib/cheatsheet";
import { getAllEntries } from "@/lib/content";
import { estimateTokens } from "@/lib/tokens";

export const metadata: Metadata = {
  title: "Prompt cheat sheet",
  description: "Copy concise UI prompts by category, from navigation and forms to icons and assets. Download the full vocabulary for your AI coding tools.",
};

const link = "inline-flex min-h-11 items-center rounded-sm text-sm text-accent-deep underline underline-offset-4 hover:text-ink";

export default function CheatSheetPage() {
  const entries = getAllEntries();
  const groups = (Object.keys(CATEGORIES) as CategoryId[])
    .map((id) => ({ id, name: CATEGORIES[id], entries: entries.filter((entry) => entry.category === id) }))
    .filter((group) => group.entries.length > 0);

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-8">
      <Header />
      <main id="main" className="pb-8 pt-8">
        <p className="font-mono text-xs uppercase tracking-wide text-muted">Less typing. Clearer requests.</p>
        <h1 className="mt-3 font-display text-4xl font-bold sm:text-6xl">Prompt cheat sheet</h1>
        <p className="mt-4 max-w-2xl text-lg text-body">Find the component you need, copy a short prompt, and make it your own. {entries.length} components and {assets.topics.length} asset topics, all in one place.</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
          <CopyButton text={buildCheatSheet(entries, assets.topics)} label="Copy all prompts" variant="solid" />
          <a href="/llms.txt" download className={link}>Download text version</a>
          <a href="/llms.txt" className={link}>View plain text</a>
        </div>

        <section aria-labelledby="use-heading" className="mt-8 rounded-[28px] bg-surface p-5 sm:p-6">
          <h2 id="use-heading" className="font-display text-xl font-bold">Make the prompt yours</h2>
          <ol className="mt-3 grid list-decimal gap-3 pl-5 text-sm text-body sm:grid-cols-3 sm:gap-8">
            <li>Choose a component and copy its prompt.</li>
            <li>Add your framework, page, and real content.</li>
            <li>Keep your design tokens and ask for keyboard support and a mobile layout.</li>
          </ol>
          <p className="mt-4 text-sm text-muted">Use one prompt for a focused request. Save the full text in AGENTS.md or CLAUDE.md when you want a vocabulary reference.</p>
        </section>

        <nav aria-label="Prompt categories" className="mt-6 flex flex-wrap gap-2">
          {groups.map((group) => <a key={group.id} href={`#${group.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-surface px-4 text-sm hover:bg-line">{group.name}<span className="font-mono text-xs text-muted">{group.entries.length}</span></a>)}
          <a href="#asset-prompts" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-surface px-4 text-sm hover:bg-line">Asset prompts<span className="font-mono text-xs text-muted">{assets.topics.length}</span></a>
        </nav>

        {groups.map((group) => (
          <section key={group.id} id={group.id} aria-labelledby={`${group.id}-heading`} className="mt-10 scroll-mt-6">
            <h2 id={`${group.id}-heading`} className="font-display text-3xl font-bold">{group.name}</h2>
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {group.entries.map((entry) => (
                <li key={entry.id} className="flex min-w-0 flex-col rounded-[28px] bg-surface p-5">
                  <h3 className="font-display text-xl font-bold"><Link href={`/components/${entry.id}/`} className="inline-flex min-h-11 items-center rounded-sm hover:text-accent-deep">{entry.name}</Link></h3>
                  <p className="text-sm text-muted">{entry.looksLike[0]}</p>
                  <p className="mt-4 flex-1 rounded-2xl bg-paper p-4 font-mono text-sm leading-relaxed">{entry.prompts.short}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted">~{estimateTokens(entry.prompts.short)} tokens</span>
                    <CopyButton text={entry.prompts.short} label={`Copy ${entry.name} prompt`} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section id="asset-prompts" aria-labelledby="asset-prompts-heading" className="mt-10 scroll-mt-6">
          <h2 id="asset-prompts-heading" className="font-display text-3xl font-bold">Asset prompts</h2>
          <p className="mt-2 text-body">Ask for the right graphic, format, or animation.</p>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {assets.topics.map((topic) => (
              <li key={topic.id} className="flex min-w-0 flex-col rounded-[28px] bg-surface p-5">
                <h3 className="font-display text-xl font-bold"><Link href={`/assets/#${topic.id}`} className="inline-flex min-h-11 items-center rounded-sm hover:text-accent-deep">{topic.name}</Link></h3>
                <p className="text-sm text-muted">{topic.looksLike}</p>
                <p className="mt-4 flex-1 rounded-2xl bg-paper p-4 font-mono text-sm leading-relaxed">{topic.prompt}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted">~{estimateTokens(topic.prompt)} tokens</span>
                  <CopyButton text={topic.prompt} label={`Copy ${topic.name} prompt`} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}

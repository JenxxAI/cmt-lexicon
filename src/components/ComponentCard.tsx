import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import type { EntrySummary } from "@/lib/schema";
import { estimateTokens } from "@/lib/tokens";
import { CopyButton } from "./CopyButton";
import { Preview } from "./previews";

export function ComponentCard({ entry }: { entry: EntrySummary }) {
  return (
    <article className="relative flex h-full flex-col max-sm:flex-row max-sm:items-center max-sm:gap-3 max-sm:p-3 overflow-hidden rounded-[18px] border border-rule bg-surface transition-shadow focus-within:shadow-md hover:shadow-md">
      <div className="h-[152px] max-sm:size-16 max-sm:shrink-0 max-sm:overflow-hidden max-sm:rounded-xl" aria-hidden="true">
        <Preview id={entry.id} />
      </div>
      <div className="flex flex-1 flex-col p-5 max-sm:min-w-0 max-sm:flex-row max-sm:items-center max-sm:gap-2 max-sm:p-0">
        <div className="max-sm:min-w-0 max-sm:flex-1 sm:contents">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-2xl font-semibold max-sm:min-w-0 max-sm:text-lg">
              {/* Stretched link: the whole card is clickable, the copy button sits above it. */}
              <Link href={`/components/${entry.id}/`} className="after:absolute after:inset-0">
                <span className="max-sm:block max-sm:truncate">{entry.name}</span>
              </Link>
            </h3>
            <span className="max-sm:hidden shrink-0 font-mono text-xs text-muted">{CATEGORIES[entry.category]}</span>
          </div>
          <p className="mt-1 text-sm text-muted max-sm:truncate">Also called {entry.aliases.slice(0, 3).join(" · ")}</p>
        </div>
        <p className="max-sm:hidden mt-3.5 rounded-[10px] bg-paper px-3.5 py-3 font-mono text-[13px] leading-normal">
          {entry.shortPrompt}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3.5 max-sm:mt-0 max-sm:shrink-0 max-sm:pt-0">
          <span className="max-sm:hidden rounded-lg bg-hi px-2.5 py-1 font-mono text-xs font-medium">
            ~{estimateTokens(entry.shortPrompt)} tokens
          </span>
          <CopyButton compactOnMobile text={entry.shortPrompt} className="relative z-10" />
        </div>
      </div>
    </article>
  );
}

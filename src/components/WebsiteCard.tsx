import Link from "next/link";
import type { WebsiteTypeSummary } from "@/lib/schema";
import { estimateTokens } from "@/lib/tokens";
import { CopyButton } from "./CopyButton";

export function WebsiteCard({ entry }: { entry: WebsiteTypeSummary }) {
  return (
    <article className="relative flex h-full flex-col rounded-[28px] bg-surface p-5 transition-shadow focus-within:shadow-md hover:shadow-md has-[h3_a:focus-visible]:outline-2 has-[h3_a:focus-visible]:outline-offset-2 has-[h3_a:focus-visible]:outline-accent-deep">
      <span className="mb-3 self-start rounded-full bg-accent-soft px-3 py-1 font-mono text-xs text-accent-deep">Website type</span>
      <h3 className="font-display text-2xl font-semibold">
        {/* Stretched link: the whole card is clickable, the copy button sits above it.
            The card draws the focus ring, because the link itself is only as big as its text. */}
        <Link href={`/websites/${entry.id}/`} className="after:absolute after:inset-0 after:rounded-[28px] focus-visible:outline-none">
          {entry.name}
        </Link>
      </h3>
      <p className="mt-1 text-sm text-muted">{entry.aliases.slice(0, 3).join(" · ")}</p>
      <p className="mb-5 mt-3 text-body">{entry.definition}</p>
      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="rounded-lg bg-hi px-2.5 py-1 font-mono text-xs font-medium">
          ~{estimateTokens(entry.shortPrompt)} tokens
        </span>
        <CopyButton text={entry.shortPrompt} className="relative z-10" />
      </div>
    </article>
  );
}

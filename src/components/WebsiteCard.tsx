import Link from "next/link";
import type { WebsiteTypeSummary } from "@/lib/schema";
import { CopyButton } from "./CopyButton";

export function WebsiteCard({ entry }: { entry: WebsiteTypeSummary }) {
  return (
    <article className="flex h-full flex-col rounded-[28px] bg-surface p-5">
      <span className="mb-3 self-start rounded-full bg-accent-soft px-3 py-1 font-mono text-xs text-accent-deep">Website type</span>
      <h3 className="font-display text-2xl font-bold">
        <Link href={`/websites/${entry.id}/`} className="inline-flex min-h-11 items-center rounded-sm hover:text-accent-deep">{entry.name}</Link>
      </h3>
      <p className="mt-1 text-sm text-muted">{entry.aliases.slice(0, 3).join(" · ")}</p>
      <p className="mb-5 mt-3 text-body">{entry.definition}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        <Link href={`/websites/${entry.id}/`} className="inline-flex min-h-11 items-center rounded-full bg-line px-4 text-sm font-medium hover:bg-rule">View blueprint</Link>
        <CopyButton text={entry.shortPrompt} />
      </div>
    </article>
  );
}

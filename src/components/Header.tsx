import Link from "next/link";
import { SITE } from "@/lib/site";
import { StarIcon } from "./icons";

const navLink = "inline-flex min-h-11 items-center hover:text-accent";

export function Header() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4">
      <Link href="/" className="flex items-center gap-2.5" aria-label={`${SITE.name} home`}>
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-[9px] bg-accent font-mono text-sm font-medium text-white"
        >
          Aa
        </span>
        <span className="font-display text-[22px] font-bold tracking-tight">{SITE.name}</span>
      </Link>

      <nav aria-label="Main" className="flex flex-wrap items-center gap-x-7 text-[15px] font-medium">
        <Link href="/#browse" className={navLink}>
          Components
        </Link>
        <Link href="/assets/" className={navLink}>
          Icons &amp; assets
        </Link>
        <a href="/llms.txt" className={navLink}>
          Cheat sheet
        </a>
        <a href={`${SITE.repoUrl}/blob/main/CONTRIBUTING.md`} className={navLink}>
          Contribute
        </a>
      </nav>

      <a
        href={SITE.repoUrl}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rule bg-surface px-4 text-[15px] font-medium hover:border-ink"
      >
        <StarIcon className="size-[18px]" />
        Star on GitHub
      </a>
    </header>
  );
}

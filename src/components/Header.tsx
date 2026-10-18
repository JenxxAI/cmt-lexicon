import Link from "next/link";
import { SITE } from "@/lib/site";
import { StarIcon } from "./icons";

const navLink = "inline-flex min-h-11 items-center hover:text-accent";

export function Header() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 max-sm:grid max-sm:grid-cols-[1fr_auto] max-sm:gap-y-0 max-sm:py-2">
      <Link href="/" className="flex items-center gap-2.5 max-sm:min-h-11" aria-label={`${SITE.name} home`}>
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-[9px] bg-accent font-mono text-sm font-medium text-white"
        >
          Aa
        </span>
        <span className="font-display text-[22px] font-bold tracking-tight">{SITE.name}</span>
      </Link>

      <nav aria-label="Main" className="flex flex-wrap items-center gap-x-7 text-[15px] font-medium max-sm:col-span-2 max-sm:row-start-2 max-sm:flex-nowrap max-sm:justify-between max-sm:gap-x-2 max-sm:text-[13px]">
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
        aria-label="Star on GitHub"
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rule bg-surface px-4 text-[15px] font-medium hover:border-ink max-sm:col-start-2 max-sm:row-start-1 max-sm:w-11 max-sm:justify-center max-sm:px-0"
      >
        <StarIcon className="size-[18px]" />
        <span className="max-sm:hidden">Star on GitHub</span>
      </a>
    </header>
  );
}

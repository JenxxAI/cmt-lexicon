import Link from "next/link";
import { FeedbackForm } from "./FeedbackForm";
import { SITE } from "@/lib/site";

const footerLink = "inline-flex min-h-11 items-center rounded-sm text-sm text-muted underline-offset-4 hover:text-accent-deep hover:underline";

export function Footer() {
  return (
    <footer className="mt-14 border-t border-rule pb-8 pt-8 sm:mt-20 sm:pt-10">
      <FeedbackForm />
      <div className="grid gap-8 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] sm:gap-12">
        <div>
          <Link href="/" className="inline-flex min-h-11 items-center gap-2.5 rounded-sm">
            <span aria-hidden="true" className="grid size-8 place-items-center rounded-[10px] bg-accent font-mono text-sm font-semibold text-ink">Aa</span>
            <span className="font-display text-[22px] font-bold tracking-tight">{SITE.name}</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Find the words for what you see. Learn UI names and turn your ideas into clear, concise prompts.
          </p>
          <p className="mt-4 font-mono text-xs text-muted">Free to explore. Open to everyone.</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <nav aria-label="Footer explore">
            <h2 className="mb-2 font-display text-base font-semibold">Explore</h2>
            <ul>
              <li><Link href="/about/" className={footerLink}>About UI Lexicon</Link></li>
              <li><Link href="/#browse" className={footerLink}>Components</Link></li>
              <li><Link href="/websites/" className={footerLink}>Website types</Link></li>
              <li><Link href="/community/" className={footerLink}>Community projects</Link></li>
              <li><Link href="/assets/" className={footerLink}>Icons &amp; assets</Link></li>
              <li><Link href="/cheat-sheet/" className={footerLink}>Prompt cheat sheet</Link></li>
            </ul>
          </nav>
          <nav aria-label="Footer resources">
            <h2 className="mb-2 font-display text-base font-semibold">Resources</h2>
            <ul>
              <li><a href="/glossary.min.json" download className={footerLink}>Download glossary</a></li>
              <li><a href={`${SITE.repoUrl}/blob/main/CONTRIBUTING.md`} className={footerLink}>Contribute</a></li>
              <li><a href="#feedback" className={footerLink}>Feedback</a></li>
              <li><a href={SITE.repoUrl} className={footerLink}>View on GitHub</a></li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-rule pt-4 text-sm text-muted">
        <p className="flex flex-wrap items-center gap-x-1">
          Open source under the <a href={`${SITE.repoUrl}/blob/main/LICENSE`} className={`${footerLink} underline`}>MIT license</a>
        </p>
        <p className="flex items-center gap-1">
          Made by <a href={SITE.authorUrl} className={`${footerLink} underline`}>Miguel</a>
        </p>
      </div>
    </footer>
  );
}

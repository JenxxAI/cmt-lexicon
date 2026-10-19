import { SITE } from "@/lib/site";
import { DownloadIcon } from "./icons";

const base =
  "inline-flex min-h-12 items-center gap-2.5 rounded-full px-5 text-sm font-medium focus-visible:outline-hi";

export function OpenSourceBand() {
  return (
    <section
      aria-labelledby="oss-heading"
      className="mt-14 flex flex-wrap items-center justify-between gap-8 rounded-[28px] bg-ink p-8 text-white sm:p-10"
    >
      <div className="min-w-0 flex-[1_1_380px]">
        <h2 id="oss-heading" className="font-display text-[34px] font-bold tracking-tight">
          Built in the open.
        </h2>
        <p className="mt-3 max-w-[460px] text-rule">
          Every component is one JSON file. Add one, open a PR, and CI checks the schema. Export the whole glossary
          and drop it into CLAUDE.md or AGENTS.md so your AI uses the right terms from the first prompt.
        </p>
      </div>
      <div className="flex min-w-0 flex-[1_1_340px] flex-wrap gap-3">
        <a href="/glossary.min.json" download className={`${base} bg-hi font-mono text-ink`}>
          <DownloadIcon className="size-[18px]" />
          glossary.min.json
        </a>
        <a href="/llms.txt" download className={`${base} border border-dim font-mono`}>
          <DownloadIcon className="size-[18px]" />
          llms.txt
        </a>
        <a href={`${SITE.repoUrl}/blob/main/CONTRIBUTING.md`} className={`${base} border border-dim`}>
          Contribute a component
        </a>
      </div>
    </section>
  );
}

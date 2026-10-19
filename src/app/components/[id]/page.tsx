import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeTabs, type CodeTab } from "@/components/CodeTabs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LivePreview } from "@/components/LivePreview";
import { Preview } from "@/components/previews";
import { PromptPanel } from "@/components/PromptPanel";
import { Playground } from "@/components/playground/Playground";
import { hasSample } from "@/components/playground/sample-ids";
import { CATEGORIES } from "@/lib/categories";
import { getAllEntries, getEntry } from "@/lib/content";

type Params = { id: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getAllEntries().map((entry) => ({ id: entry.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const entry = getEntry(id);
  return entry ? { title: entry.name, description: entry.definition } : {};
}

const pill = "inline-flex min-h-11 items-center rounded-full border border-rule bg-surface px-[18px] text-[15px] font-medium hover:border-ink";

export default async function ComponentPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const entry = getEntry(id);
  if (!entry) notFound();

  const all = getAllEntries();
  const byId = new Map(all.map((item) => [item.id, item]));

  const tabs: CodeTab[] = [
    entry.snippets.html ? { id: "html", label: "HTML", code: entry.snippets.html } : null,
    entry.snippets.reactTailwind
      ? {
          id: "react",
          label: entry.snippets.reactTailwind.includes("@/components/ui") ? "React (shadcn/ui)" : "React + Tailwind",
          code: entry.snippets.reactTailwind,
        }
      : null,
    entry.snippets.vue ? { id: "vue", label: "Vue", code: entry.snippets.vue } : null,
  ].filter((tab): tab is CodeTab => tab !== null);

  const libraries = Object.entries(entry.libraries);
  const related = entry.related.flatMap((relatedId) => byId.get(relatedId) ?? []);

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-8">
      <Header />
      <main id="main">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 pb-2 pt-5 text-sm text-muted">
          <Link href="/#browse" className="hover:text-accent-deep">
            Components
          </Link>
          <span aria-hidden="true">/</span>
          <span>{CATEGORIES[entry.category]}</span>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="font-medium text-ink">
            {entry.name}
          </span>
        </nav>

        <div className="flex flex-wrap items-start gap-10 pt-3 max-lg:flex-col max-lg:flex-nowrap max-lg:items-stretch max-lg:gap-5">
          {/* Left: the vocabulary */}
          <div className="min-w-0 flex-[1_1_520px] max-lg:contents">
            <div className="max-lg:order-1 max-lg:min-w-0 max-lg:w-full">
              <p className="font-mono text-[13px] uppercase text-muted">{CATEGORIES[entry.category]}</p>
              <h1 className="mt-1.5 font-display text-6xl font-bold leading-none tracking-tight sm:text-7xl">
                {entry.name}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted">Also called</span>
                {entry.aliases.map((alias) => (
                  <span
                    key={alias}
                    className="rounded-full bg-accent-soft px-3 py-1 font-mono text-[13px] text-accent-deep"
                  >
                    {alias}
                  </span>
                ))}
              </div>

              <p className="mt-6 max-w-[560px] text-[19px] text-body">{entry.definition}</p>
            </div>
            <div className="max-lg:order-5 max-lg:min-w-0 max-lg:w-full">
              <h2 className="mt-9 font-display text-[22px] font-semibold">How people describe it</h2>
              <ul className="mt-3 flex flex-wrap gap-2.5">
                {entry.looksLike.map((phrase) => (
                  <li key={phrase} className="rounded-2xl bg-surface px-3.5 py-2 text-[15px]">
                    “{phrase}”
                  </li>
                ))}
              </ul>

              <h2 className="mt-9 font-display text-[22px] font-semibold">Good for</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-body marker:text-muted">
                {entry.whenToUse.map((use) => (
                  <li key={use}>{use}</li>
                ))}
              </ul>

              {entry.notConfusedWith.length > 0 && (
                <>
                  <h2 className="mt-9 font-display text-[22px] font-semibold">Don’t mix it up with</h2>
                  <ul className="mt-3 flex flex-wrap gap-3">
                    {entry.notConfusedWith.map((item) => {
                      const other = byId.get(item.id);
                      return (
                        <li key={item.id} className="min-w-0 flex-[1_1_170px] rounded-[20px] bg-surface p-4">
                          <div className="font-display text-lg font-semibold">
                            {other ? (
                              <Link href={`/components/${other.id}/`} className="hover:text-accent-deep">
                                {other.name}
                              </Link>
                            ) : (
                              item.id
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted">{item.difference}</p>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              {libraries.length > 0 && (
                <>
                  <h2 className="mt-9 font-display text-[22px] font-semibold">What your library calls it</h2>
                  <div className="mt-3 overflow-x-auto rounded-[20px] bg-surface">
                    <table className="w-full border-collapse text-[15px]">
                      <thead>
                        <tr className="bg-paper text-left font-mono text-[13px] text-muted">
                          <th scope="col" className="px-4 py-3 font-semibold">
                            LIBRARY
                          </th>
                          <th scope="col" className="px-4 py-3 font-semibold">
                            CALLS IT
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {libraries.map(([library, name]) => (
                          <tr key={library} className="border-t border-line">
                            <th scope="row" className="px-4 py-3 text-left font-normal">
                              {library}
                            </th>
                            <td className="px-4 py-3 font-mono">{name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {entry.a11yNotes.length > 0 && (
                <>
                  <h2 className="mt-9 font-display text-[22px] font-semibold">Accessibility checklist</h2>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-body marker:text-muted">
                    {entry.a11yNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* Right: see it, prompt it, code it */}
          <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-5 max-lg:contents">
            <div className="max-lg:order-3 max-lg:min-w-0 max-lg:w-full">
              {entry.id === "drawer" || entry.id === "modal" || entry.id === "popover" || entry.id === "toast" ? (
                <LivePreview id={entry.id} />
              ) : hasSample(entry.id) ? (
                <Playground id={entry.id} name={entry.name} />
              ) : (
                <section aria-label={`${entry.name} illustration`} className="overflow-hidden rounded-[28px] bg-surface">
                  <div role="img" aria-label={`Illustration of a ${entry.name.toLowerCase()}`} className="h-80">
                    <Preview id={entry.id} />
                  </div>
                </section>
              )}
            </div>
            <div className="max-lg:order-2 max-lg:min-w-0 max-lg:w-full">
              <PromptPanel short={entry.prompts.short} detailed={entry.prompts.detailed} />
            </div>
            <div className="min-w-0 max-lg:order-4 max-lg:w-full">
              <CodeTabs tabs={tabs} />
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-12">
            <h2 id="related-heading" className="font-display text-[22px] font-semibold">
              Related
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2.5">
              {related.map((item) => (
                <li key={item.id}>
                  <Link href={`/components/${item.id}/`} className={pill}>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

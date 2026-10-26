import { getWebsiteSample } from "@/lib/website-samples";
import { WebsiteSampleStudio } from "@/components/WebsiteSampleStudio";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PromptPanel } from "@/components/PromptPanel";
import { getAllEntries, getAllWebsiteTypes, getWebsiteType } from "@/lib/content";

type Params = { id: string };
export const dynamicParams = false;
export function generateStaticParams(): Params[] { return getAllWebsiteTypes().map(({ id }) => ({ id })); }
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const entry = getWebsiteType((await params).id);
  return entry ? { title: `${entry.name} website`, description: entry.definition } : {};
}
const pill = "inline-flex min-h-11 items-center rounded-full border border-rule bg-surface px-4 text-sm font-medium hover:border-ink hover:text-accent-deep";
const heading = "font-display text-2xl font-bold";

export default async function WebsitePage({ params }: { params: Promise<Params> }) {
  const entry = getWebsiteType((await params).id);
  if (!entry) notFound();
  const components = new Map(getAllEntries().map(component => [component.id, component.name]));
  const sample = getWebsiteSample(entry.id);
  const related = entry.related.flatMap(id => getWebsiteType(id) ?? []);
  return <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-8">
    <Header />
    <main id="main" className="pt-5">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/websites/" className="inline-flex min-h-11 items-center hover:text-accent-deep">Website types</Link>
        <span aria-hidden="true">/</span><span aria-current="page" className="text-ink">{entry.name}</span>
      </nav>
      <div className="mt-4 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div>
          <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl">{entry.name}</h1>
          <p className="mt-4 text-sm text-muted">Also called {entry.aliases.join(" · ")}</p>
          <p className="mt-5 text-lg text-body">{entry.definition}</p>
          <dl className="mt-5 space-y-3">
            <div><dt className="font-semibold">Main goal</dt><dd className="mt-1 text-body">{entry.goal}</dd></div>
            <div><dt className="font-semibold">Who it is for</dt><dd className="mt-1 text-body">{entry.audience}</dd></div>
          </dl>
        </div>
        <div className="min-w-0"><PromptPanel {...entry.prompts} /></div>
      </div>
      {sample && <WebsiteSampleStudio initialCode={sample} id={entry.id} name={entry.name} />}
      <section aria-labelledby="blueprint-heading" className="mt-10">
        <h2 id="blueprint-heading" className={heading}>Section blueprint</h2>
        <p className="mt-2 text-muted">A suggested order to start from. Adapt it to the people and tasks your site serves.</p>
        <ol className="mt-5 grid gap-4">
          {entry.sections.map((section, index) => <li key={section.name} className="rounded-[28px] bg-surface p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft font-mono text-accent-deep">{index + 1}</span>
              <div className="min-w-0">
                <h3 className="font-display text-xl font-semibold">{section.name}</h3>
                <p className="mt-1 text-body">{section.purpose}</p>
                <ul aria-label={`${section.name} components`} className="mt-3 flex flex-wrap gap-2">
                  {section.componentIds.map(id => <li key={id}><Link href={`/components/${id}/`} className={pill}>{components.get(id)}</Link></li>)}
                </ul>
              </div>
            </div>
          </li>)}
        </ol>
      </section>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {[{ title: "Must have", items: entry.mustHave }, { title: "Avoid", items: entry.avoid }].map(group => <section key={group.title} className="rounded-[28px] bg-surface p-6">
          <h2 className={heading}>{group.title}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-body">{group.items.map(item => <li key={item}>{item}</li>)}</ul>
        </section>)}
      </div>
      <section className="mt-8"><h2 className={heading}>Example ideas</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-body">{entry.examples.map(example => <li key={example}>{example}</li>)}</ul></section>
      <section className="mt-8"><h2 className={heading}>How people describe it</h2><ul className="mt-3 flex flex-wrap gap-2">{entry.looksLike.map(phrase => <li key={phrase} className="rounded-2xl bg-surface px-4 py-3">“{phrase}”</li>)}</ul></section>
      {related.length > 0 && <section className="mt-10"><h2 className={heading}>Related website types</h2><ul className="mt-3 flex flex-wrap gap-2">{related.map(item => <li key={item.id}><Link href={`/websites/${item.id}/`} className={pill}>{item.name}</Link></li>)}</ul></section>}
    </main>
    <Footer />
  </div>;
}

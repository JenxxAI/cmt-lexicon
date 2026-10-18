import type { Metadata } from "next";
import { AssetGlyph } from "@/components/AssetGlyph";
import { CopyButton } from "@/components/CopyButton";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { assets } from "@/lib/assets";

export const metadata: Metadata = {
  title: "Icons & assets",
  description: "Name the small graphics on a website: icons, SVGs, favicons, sprites, Lottie animations, and Open Graph images. Compare common icon names across libraries.",
};

const link = "inline-flex min-h-11 items-center text-accent underline underline-offset-4 hover:text-accent-deep";

export default function AssetsPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-8">
      <Header />
      <main id="main" className="pb-8 pt-8">
        <p className="font-mono text-[13px] uppercase text-muted">The visual vocabulary</p>
        <h1 className="mt-2 font-display text-5xl font-bold tracking-tight sm:text-7xl">Icons &amp; assets</h1>
        <p className="mt-5 max-w-2xl text-lg text-body">Name the little graphics that make a website recognizable. Learn what to ask for, then find the right name in your icon library.</p>
        <div className="mt-6 rounded-[18px] border border-rule bg-surface p-5 text-body">
          <p><strong className="text-ink">Icon = meaning. SVG = format. Favicon = location.</strong> The same small symbol could be an icon, drawn as an SVG, and used as a favicon in a browser tab.</p>
        </div>
        <nav aria-label="On this page" className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {assets.topics.map((topic) => <a key={topic.id} href={`#${topic.id}`} className={link}>{topic.name}</a>)}
          <a href="#icon-names" className={link}>Icon name table</a>
        </nav>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {assets.topics.map((topic) => (
            <section key={topic.id} id={topic.id} aria-labelledby={`${topic.id}-heading`} className="flex min-w-0 flex-col rounded-[18px] border border-rule bg-surface p-5 sm:p-6">
              <h2 id={`${topic.id}-heading`} className="font-display text-2xl font-semibold">{topic.name}</h2>
              <p className="mt-2 text-sm text-accent-deep">“{topic.looksLike}”</p>
              <p className="mt-4 text-body">{topic.definition}</p>
              <p className="mt-3 text-sm text-body"><strong>Use it for: </strong>{topic.whenToUse}</p>
              <p className="mt-3 text-sm text-muted">{topic.note}</p>
              <div className="mt-5 rounded-xl bg-paper p-4">
                <p className="font-mono text-xs uppercase text-muted">Try this prompt</p>
                <p className="mt-2 font-mono text-sm text-ink">{topic.prompt}</p>
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                <CopyButton text={topic.prompt} label={`Copy ${topic.name} prompt`} />
                <a href={topic.source} className={`${link} text-sm`}>Read the source<span className="sr-only"> for {topic.name}</span></a>
              </div>
            </section>
          ))}
        </div>

        <section id="icon-names" aria-labelledby="icon-names-heading" className="mt-12">
          <h2 id="icon-names-heading" className="font-display text-3xl font-semibold">One idea, different icon names</h2>
          <p className="mt-3 max-w-2xl text-body">These are React component names, including the Icon suffix where required. The small drawings represent each idea; each library has its own artwork.</p>
          <div tabIndex={0} role="region" aria-label="Icon names by library, horizontally scrollable" className="mt-5 overflow-x-auto rounded-[18px] border border-rule bg-surface">
            <table className="w-full min-w-[720px] sm:min-w-0 table-fixed border-collapse text-left text-xs sm:text-sm">
              <caption className="border-b border-rule p-4 text-left text-sm text-muted">Common icon names. Verified against official documentation and source on {assets.verifiedOn}.</caption>
              <thead className="bg-paper">
                <tr>
                  <th scope="col" className="w-[28%] p-2 sm:p-4">What you see</th>
                  {assets.libraries.map((library) => <th key={library.id} scope="col" className="break-words p-2 sm:p-4">{library.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {assets.icons.map((icon) => (
                  <tr key={icon.id} className="border-t border-line align-top">
                    <th scope="row" className="p-2 font-normal sm:p-4">
                      <AssetGlyph id={icon.id} />
                      <span className="mt-2 block font-semibold">{icon.name}</span>
                      <span className="mt-1 block text-muted">{icon.looksLike}</span>
                    </th>
                    {assets.libraries.map((library) => <td key={library.id} className="whitespace-nowrap p-2 font-mono sm:p-4">{icon.names[library.id]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {assets.libraries.map((library) => (
              <div key={library.id} className="min-w-0 rounded-xl border border-rule bg-surface p-4">
                <h3 className="font-display text-lg font-semibold">{library.name}</h3>
                <p className="mt-2 text-sm text-muted">React import path</p>
                <code className="mt-1 block break-all text-sm">{library.importFrom}</code>
                <a href={library.docs} className={`${link} mt-2 text-sm`}>{library.name} usage and source</a>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">For Phosphor in React Server Components, use its documented <code className="break-all">@phosphor-icons/react/ssr</code> import path. Match examples to the version installed in your project.</p>
        </section>

        <section aria-labelledby="icon-a11y" className="mt-10 rounded-[18px] border border-rule bg-surface p-5 sm:p-6">
          <h2 id="icon-a11y" className="font-display text-2xl font-semibold">Make the meaning available to everyone</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-body">
            <li>Use a real button for actions and a link for navigation. A clickable SVG alone is not enough.</li>
            <li>Give an icon-only button a name such as “Close dialog”, not “X icon”. Keep its target at least 44 × 44 pixels.</li>
            <li>Hide an icon from screen readers when nearby text already says the same thing. Give meaningful standalone graphics a text alternative.</li>
            <li>Keep focus visible, and pair status colors or animation with text.</li>
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Preview } from "@/components/previews";
import { assets } from "@/lib/assets";
import { getAllEntries } from "@/lib/content";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "UI Lexicon helps beginners and developers name interface components and turn ideas into clear prompts. Learn how it works and contribute to the open-source glossary.",
};

const textLink = "inline-flex min-h-11 items-center rounded-sm text-sm text-accent-deep underline underline-offset-4 hover:text-ink";

export default function AboutPage() {
  const entries = getAllEntries();
  const example = entries.find((entry) => entry.id === "drawer");

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-8">
      <Header />
      <main id="main" className="pb-8 pt-8 sm:pt-12">
        <section aria-labelledby="about-heading" className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-muted">About UI Lexicon</p>
            <h1 id="about-heading" className="mt-3 font-display text-4xl font-bold leading-tight sm:text-6xl">You can picture it.<br />Now you can name it.</h1>
            <p className="mt-5 max-w-xl text-lg text-body">UI Lexicon is a free, open-source guide to the pieces that make up an interface. Describe what you see, learn its name, and get a concise prompt to help you build it.</p>
            <Link href="/#browse" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-code">Explore the glossary</Link>
          </div>
          {example && (
            <aside aria-label="From a description to a component name" className="min-w-0 rounded-[28px] bg-surface p-6 sm:p-8">
              <p className="font-mono text-xs uppercase text-muted">What you see</p>
              <p className="mt-2 font-display text-xl font-semibold">“{example.looksLike[0]}”</p>
              <div className="mt-5 h-40 overflow-hidden rounded-2xl" aria-hidden="true"><Preview id={example.id} /></div>
              <p className="mt-5 font-mono text-xs uppercase text-muted">What it’s called</p>
              <Link href={`/components/${example.id}/`} className="inline-flex min-h-11 items-center rounded-sm font-display text-3xl font-bold hover:text-accent-deep">{example.name}</Link>
              <p className="mt-2 text-sm text-muted">{example.definition}</p>
            </aside>
          )}
        </section>

        <section aria-labelledby="why-heading" className="mt-12 max-w-3xl sm:mt-16">
          <h2 id="why-heading" className="font-display text-3xl font-bold">A small vocabulary gap can slow a good idea.</h2>
          <p className="mt-4 text-body">You know the panel that slides in from the side, or the gray boxes that appear while a page loads. Knowing the name makes it easier to find an example, explain a change to a teammate, or ask an AI coding tool for what you actually mean.</p>
          <p className="mt-3 text-body">This glossary connects everyday descriptions to shared UI terms. It’s for people building their first interface and developers who want a quick reference.</p>
        </section>

        <section aria-labelledby="how-heading" className="mt-12">
          <h2 id="how-heading" className="font-display text-3xl font-bold">From “that thing” to a clear request</h2>
          <ol className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              { title: "Describe it", text: "Search in your own words, or browse by category. You don’t need to know the technical name to start." },
              { title: "Understand it", text: "Compare the illustration, common aliases, and similar components. Check when to use it and what accessibility needs attention." },
              { title: "Make it yours", text: "Copy a short prompt or code example. Add your own content and behavior, then test it in your project." },
            ].map((step, index) => (
              <li key={step.title} className="rounded-[28px] bg-surface p-6">
                <span aria-hidden="true" className="inline-flex size-10 items-center justify-center rounded-full bg-accent-soft font-mono text-sm text-accent-deep">0{index + 1}</span>
                <h3 className="mt-4 font-display text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-body">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="inside-heading" className="mt-12 rounded-[28px] bg-surface p-6 sm:p-8">
          <h2 id="inside-heading" className="font-display text-3xl font-bold">A reference you can keep close</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-3">
            <div><p className="font-display text-4xl font-bold">{entries.length}</p><p className="mt-1 text-sm text-muted">UI components, from navigation to feedback</p></div>
            <div><p className="font-display text-4xl font-bold">{assets.topics.length}</p><p className="mt-1 text-sm text-muted">Asset topics, including icons, SVGs, and animation</p></div>
            <div><p className="font-display text-4xl font-bold">MIT</p><p className="mt-1 text-sm text-muted">Open-source license for learning and building</p></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1">
            <Link href="/assets/" className={textLink}>Explore icons &amp; assets</Link>
            <a href="/llms.txt" download className={textLink}>Download the prompt reference</a>
            <a href="/glossary.min.json" download className={textLink}>Download the glossary</a>
          </div>
        </section>

        <section aria-labelledby="contribute-heading" className="mt-12 grid gap-5 sm:grid-cols-[1.3fr_1fr] sm:gap-12">
          <div>
            <h2 id="contribute-heading" className="font-display text-3xl font-bold">Built in the open, better together.</h2>
            <p className="mt-3 text-body">Made by Miguel and open to contributions. Help improve a description, correct an example, or add a component someone else is struggling to name.</p>
          </div>
          <div className="flex flex-col items-start">
            <a href={`${SITE.repoUrl}/blob/main/CONTRIBUTING.md`} className={textLink}>Read the contribution guide</a>
            <a href={SITE.repoUrl} className={textLink}>View the project on GitHub</a>
            <a href={SITE.authorUrl} className={textLink}>Meet Miguel on GitHub</a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

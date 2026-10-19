import Link from "next/link";
import { assets } from "@/lib/assets";
import { Explorer } from "@/components/Explorer";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { OpenSourceBand } from "@/components/OpenSourceBand";
import { getAllEntries, toSummary } from "@/lib/content";

export default function HomePage() {
  const entries = getAllEntries().map(toSummary);

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-8">
      <Header />
      <main id="main">
        <Explorer entries={entries} assetGuide={
          <aside aria-label="Icons and assets guide" className="mb-8 rounded-[28px] bg-surface p-5">
            <Link href="/assets/" className="inline-flex min-h-11 items-center font-display text-xl font-semibold text-accent-deep underline underline-offset-4">
              Looking for an icon or image? Explore icons &amp; assets
            </Link>
            <p className="mt-2 text-sm text-muted">{assets.topics.map((topic) => topic.name).join(" · ")}</p>
          </aside>
        } />
        <OpenSourceBand />
      </main>
      <Footer />
    </div>
  );
}

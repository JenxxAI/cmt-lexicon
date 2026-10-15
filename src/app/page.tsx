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
        <Explorer entries={entries} />
        <OpenSourceBand />
      </main>
      <Footer />
    </div>
  );
}

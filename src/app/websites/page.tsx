import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WebsiteExplorer } from "@/components/WebsiteExplorer";
import { getAllWebsiteTypes, toWebsiteSummary } from "@/lib/content";

export const metadata: Metadata = {
  title: "Website types",
  description: "Find the name for the website you want to build, explore its section blueprint, and copy a concise prompt.",
};

export default function WebsitesPage() {
  return <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-8">
    <Header />
    <main id="main" className="pt-8 sm:pt-12">
      <p className="font-mono text-sm uppercase text-accent-deep">From idea to blueprint</p>
      <h1 className="mt-3 font-display text-5xl font-bold tracking-tight sm:text-6xl">Website types</h1>
      <p className="mt-5 max-w-2xl text-lg text-muted">Know what you want people to do, but not what to call the site? Explore 20 website types, their essential sections, and the components that bring them together.</p>
      <WebsiteExplorer entries={getAllWebsiteTypes().map(toWebsiteSummary)} />
    </main>
    <Footer />
  </div>;
}

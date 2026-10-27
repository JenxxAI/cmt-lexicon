import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CommunityApp } from "@/components/CommunityApp";
export const metadata: Metadata = {
  title: "Community — project",
  description: "View the source, run the example, or make it your own.",
  robots: { index: false, follow: true },
};
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-8">
      <Header />
      <main id="main" className="pt-8 sm:pt-12">
        <p className="font-mono text-xs uppercase tracking-widest text-accent-deep">
          Community · HTML / CSS / JavaScript
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-6xl">
          Explore a community project.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-body">
          View the source, run the example, or make it your own.
        </p>
        <CommunityApp view="project" />
      </main>
      <Footer />
    </div>
  );
}

import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CommunityApp } from "@/components/CommunityApp";
export const metadata: Metadata = {
  title: "Community — browse",
  description:
    "Discover components and website templates shared by other makers. Every published project has been reviewed. Go from an idea to working HTML, CSS, and JavaScript.",
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
          Made by the community.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-body">
          Discover components and website templates shared by other makers.
          Every published project has been reviewed. Go from an idea to working
          HTML, CSS, and JavaScript.
        </p>
        <CommunityApp view="browse" />
      </main>
      <Footer />
    </div>
  );
}

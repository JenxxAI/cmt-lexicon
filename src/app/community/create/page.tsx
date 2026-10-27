import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CommunityApp } from "@/components/CommunityApp";
export const metadata: Metadata = {
  title: "Community — create",
  description:
    "Build a component or a website template, try it in the preview, and submit it for review.",
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
          Make something worth sharing.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-body">
          Build a component or a website template, try it in the preview, and
          submit it for review.
        </p>
        <CommunityApp view="create" />
      </main>
      <Footer />
    </div>
  );
}

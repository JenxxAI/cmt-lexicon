import type { Metadata } from "next";
import { CommunityApp } from "@/components/CommunityApp";
export const metadata: Metadata = {
  title: "Community — mine",
  description:
    "Track what you have submitted and see feedback from the maintainer.",
  robots: { index: false, follow: true },
};
export default function Page() {
  return (
    <CommunityApp view="mine">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-deep">
        Community · HTML / CSS / JavaScript
      </p>
      <h1 className="mt-4 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Your contributions.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-body">
        Track what you have submitted and see feedback from the maintainer.
      </p>
    </CommunityApp>
  );
}

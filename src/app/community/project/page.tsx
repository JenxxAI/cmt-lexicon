import type { Metadata } from "next";
import { CommunityApp } from "@/components/CommunityApp";
export const metadata: Metadata = {
  title: "Community — project",
  description: "View the source, run the example, or make it your own.",
  robots: { index: false, follow: true },
};
export default function Page() {
  return (
    <CommunityApp view="project">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-deep">
        Community · HTML / CSS / JavaScript
      </p>
      <h1 className="mt-4 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Explore a community project.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-body">
        View the source, run the example, or make it your own.
      </p>
    </CommunityApp>
  );
}

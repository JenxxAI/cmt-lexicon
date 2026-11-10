import type { Metadata } from "next";
import { CommunityApp } from "@/components/CommunityApp";
export const metadata: Metadata = {
  title: "Community — create",
  description:
    "Build a component or a website template, try it in the preview, and submit it for review.",
  robots: { index: false, follow: true },
};
export default function Page() {
  return (
    <CommunityApp view="create">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-deep">
        Community · HTML / CSS / JavaScript
      </p>
      <h1 className="mt-4 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Make something worth sharing.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-body">
        Build a component or a website template, try it in the preview, and
        submit it for review.
      </p>
    </CommunityApp>
  );
}

import type { Metadata } from "next";
import { CommunityApp } from "@/components/CommunityApp";
export const metadata: Metadata = {
  title: "Community — create",
  description:
    "Share an interactive code sample or showcase your GitHub project with screenshots.",
  robots: { index: false, follow: true },
};
export default function Page() {
  return (
    <CommunityApp view="create">
      <h1 className="max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Make something worth sharing.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-body">
        Share an interactive code sample, or showcase your GitHub project with
        screenshots. Every submission is reviewed before it appears publicly.
      </p>
    </CommunityApp>
  );
}

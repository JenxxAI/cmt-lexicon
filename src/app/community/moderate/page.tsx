import type { Metadata } from "next";
import { CommunityApp } from "@/components/CommunityApp";
export const metadata: Metadata = {
  title: "Community — moderate",
  description:
    "Only appointed moderators can approve projects for the community library.",
  robots: { index: false, follow: true },
};
export default function Page() {
  return (
    <CommunityApp view="moderate">
      <h1 className="max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Review before publication.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-body">
        Only appointed moderators can approve projects for the community
        library.
      </p>
    </CommunityApp>
  );
}

import { publicPageMetadata } from "@/lib/page-metadata";
import { CommunityApp } from "@/components/CommunityApp";
export const metadata = publicPageMetadata("/community/", {
  title: "Community — browse",
  description:
    "Discover interactive components, website templates, and GitHub showcases shared by other makers. Every published submission has been reviewed.",
});
export default function Page() {
  return (
    <CommunityApp view="browse">
      <h1 className="max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Made by the community.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-body">
        Discover interactive components, website templates, and GitHub showcases
        shared by other makers. Every published submission has been reviewed.
      </p>
    </CommunityApp>
  );
}

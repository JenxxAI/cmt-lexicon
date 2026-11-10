import { publicPageMetadata } from "@/lib/page-metadata";
import { CommunityApp } from "@/components/CommunityApp";
export const metadata = publicPageMetadata("/community/", {
  title: "Community — browse",
  description:
    "Discover components and website templates shared by other makers. Every published project has been reviewed. Go from an idea to working HTML, CSS, and JavaScript.",
});
export default function Page() {
  return (
    <CommunityApp view="browse">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-deep">
        Community · HTML / CSS / JavaScript
      </p>
      <h1 className="mt-4 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Made by the community.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-body">
        Discover components and website templates shared by other makers. Every
        published project has been reviewed. Go from an idea to working HTML,
        CSS, and JavaScript.
      </p>
    </CommunityApp>
  );
}

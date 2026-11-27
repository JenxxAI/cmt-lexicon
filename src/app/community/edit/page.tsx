import { CommunityApp } from "@/components/CommunityApp";
export const metadata = {
  title: "Community — edit",
  robots: { index: false, follow: true },
};
export default function Page() {
  return (
    <CommunityApp view="edit">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">
        Edit your project.
      </h1>
      <p className="mt-5 text-lg text-body">
        Make your changes, then submit for another review.
      </p>
    </CommunityApp>
  );
}

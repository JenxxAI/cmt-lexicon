import { CommunityApp } from "@/components/CommunityApp";
export const metadata = {
  title: "Community — saved",
  robots: { index: false, follow: true },
};
export default function Page() {
  return (
    <CommunityApp view="saved">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">
        Your saved projects.
      </h1>
      <p className="mt-5 text-lg text-body">
        A private collection of projects to come back to.
      </p>
    </CommunityApp>
  );
}

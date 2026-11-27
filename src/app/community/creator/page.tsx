import { CommunityApp } from "@/components/CommunityApp";
export const metadata = {
  title: "Community — creator",
  robots: { index: false, follow: true },
};
export default function Page() {
  return (
    <CommunityApp view="creator">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">
        Meet the creator.
      </h1>
      <p className="mt-5 text-lg text-body">
        Explore their approved community projects.
      </p>
    </CommunityApp>
  );
}

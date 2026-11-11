import type { Metadata } from "next";
import { CommunityApp } from "@/components/CommunityApp";
export const metadata: Metadata = {
  title: "Community — auth",
  description: "Finish signing in with GitHub and return to your project.",
  robots: { index: false, follow: true },
};
export default function Page() {
  return (
    <CommunityApp view="auth">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-deep">
        Community · HTML / CSS / JavaScript
      </p>
      <h1 className="mt-4 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Welcome back.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-body">
        Finish signing in with GitHub and return to your project.
      </p>
    </CommunityApp>
  );
}

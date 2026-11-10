import { publicPageMetadata } from "@/lib/page-metadata";
import { SITE } from "@/lib/site";
import Link from "next/link";
import { assets } from "@/lib/assets";
import { Explorer } from "@/components/Explorer";
import { Footer } from "@/components/Footer";
import { SiteShell } from "@/components/SiteShell";
import { OpenSourceBand } from "@/components/OpenSourceBand";
import {
  getAllEntries,
  toSummary,
  getAllWebsiteTypes,
  toWebsiteSummary,
} from "@/lib/content";

export const metadata = publicPageMetadata("/", {
  title: `${SITE.name}: name any UI component`,
  description: SITE.description,
});

export default function HomePage() {
  const entries = getAllEntries().map(toSummary);

  return (
    <SiteShell>
      <main id="main">
        <Explorer
          entries={entries}
          websites={getAllWebsiteTypes().map(toWebsiteSummary)}
          assetGuide={
            <aside
              aria-label="Icons and assets guide"
              className="mb-8 rounded-[28px] bg-surface p-5"
            >
              <Link
                href="/assets/"
                className="inline-flex min-h-11 items-center font-display text-xl font-semibold text-accent-deep underline underline-offset-4"
              >
                Looking for an icon or image? Explore icons &amp; assets
              </Link>
              <p className="mt-2 text-sm text-muted">
                {assets.topics.map((topic) => topic.name).join(" · ")}
              </p>
            </aside>
          }
        />
        <OpenSourceBand />
      </main>
      <Footer />
    </SiteShell>
  );
}

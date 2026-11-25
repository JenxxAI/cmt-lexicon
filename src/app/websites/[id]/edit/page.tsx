import { publicPageMetadata } from "@/lib/page-metadata";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { WebsiteEditor } from "@/components/WebsiteEditor";
import { getAllWebsiteTypes, getWebsiteType } from "@/lib/content";
import { getWebsiteSample } from "@/lib/website-samples";

type Params = { id: string };
export const dynamicParams = false;
export function generateStaticParams(): Params[] {
  return getAllWebsiteTypes().map(({ id }) => ({ id }));
}
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const entry = getWebsiteType((await params).id);
  return entry
    ? { ...publicPageMetadata(`/websites/${entry.id}/edit/`, {
        title: `Edit ${entry.name} sample`,
        description: `Edit the HTML, CSS, and JavaScript of the ${entry.name} sample and see the result live.`,
      }), robots: { index: false, follow: true } }
    : {};
}

export default async function EditPage({ params }: { params: Promise<Params> }) {
  const entry = getWebsiteType((await params).id);
  if (!entry) notFound();
  return (
    <SiteShell>
      <main id="main" className="pb-6 pt-4">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Link href="/websites/" className="inline-flex min-h-11 items-center hover:text-accent-deep">Website types</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/websites/${entry.id}/`} className="inline-flex min-h-11 items-center hover:text-accent-deep">{entry.name}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-ink">Edit code</span>
        </nav>
        <WebsiteEditor initialCode={getWebsiteSample(entry.id)} id={entry.id} name={entry.name} />
      </main>
    </SiteShell>
  );
}

import type { Metadata } from "next";
import { SITE } from "./site";

export function publicPageMetadata(
  path: string,
  { title, description }: { title: string; description: string },
): Metadata {
  const pageTitle = path === "/" ? title : `${title} · ${SITE.name}`;
  const image = { url: "/social-card.png", width: 1200, height: 630, alt: "UI Lexicon: Name any UI component." };
  return {
    title: { absolute: pageTitle },
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: SITE.name, url: path, title: pageTitle, description, images: [image] },
    twitter: { card: "summary_large_image", title: pageTitle, description, images: [image] },
  };
}

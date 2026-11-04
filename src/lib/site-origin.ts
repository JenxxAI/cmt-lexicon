import { SITE } from "./site";

/** All build-time URLs should point to the same public origin, including on previews. */
export function siteOrigin(): URL {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || (host ? `https://${host}` : SITE.url));
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTP(S) URL");
  }
  return new URL(url.origin);
}

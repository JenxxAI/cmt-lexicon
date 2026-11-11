import { BASE_PATH } from "./base-path";
import { SITE } from "./site";

/**
 * Public URL of the site root including any base path, with a trailing slash
 * (https://user.github.io/cmt-lexicon/). Relative metadata URLs resolve against this.
 */
export function siteBaseUrl(): URL {
  return new URL(`${BASE_PATH}/`, siteOrigin());
}

/**
 * All build-time URLs should point to the same public origin, including on previews.
 * Origin only: a project-site path comes from NEXT_PUBLIC_BASE_PATH, not from here.
 */
export function siteOrigin(): URL {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || (host ? `https://${host}` : SITE.url));
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTP(S) URL");
  }
  return new URL(url.origin);
}

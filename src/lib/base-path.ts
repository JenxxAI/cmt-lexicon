/**
 * Optional URL prefix for hosting under a subpath, such as a GitHub Pages project site
 * (https://user.github.io/cmt-lexicon/). Set NEXT_PUBLIC_BASE_PATH when building.
 *
 * Unset (Vercel, Netlify, a user site or a custom domain) it is "" and every URL is
 * unchanged. Pure and dependency-free, so next.config.ts, client components and the
 * export scripts all share it.
 */

/** One path segment: letters, numbers and . _ ~ - (what a GitHub repository name allows), never "." or "..". */
const SEGMENT = /^(?!\.{1,2}$)[A-Za-z0-9._~-]+$/;

/** "", "/" and undefined mean no prefix. Anything else becomes "/segment[/segment]" with no trailing slash. */
export function normalizeBasePath(raw: string | undefined): string {
  const trimmed = (raw ?? "").trim();
  if (trimmed === "" || trimmed === "/") return "";
  const segments = trimmed.replace(/^\/+|\/+$/g, "").split("/");
  if (!segments.every((segment) => SEGMENT.test(segment))) {
    throw new Error(
      `NEXT_PUBLIC_BASE_PATH must be a path such as /cmt-lexicon (letters, numbers, . _ ~ -), got "${raw}"`,
    );
  }
  return `/${segments.join("/")}`;
}

// Read the variable directly so Next.js inlines it into client bundles at build time.
export const BASE_PATH = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

/**
 * Prefix a root-relative path ("/about/") with the base path. Use it for plain `<a>`
 * links, downloads and generated files. `next/link` already adds the prefix itself, so
 * do not use this for `<Link href>`.
 */
export function withBasePath(path: string, basePath: string = BASE_PATH): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error(`withBasePath expects a root-relative path such as "/about/", got "${path}"`);
  }
  return `${basePath}${path}`;
}

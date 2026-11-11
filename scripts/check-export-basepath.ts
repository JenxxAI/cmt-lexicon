import fs from "node:fs";
import path from "node:path";
import { normalizeBasePath } from "../src/lib/base-path";

/**
 * Verifies a static export that was built for a subpath host such as a GitHub Pages
 * project site (issue #34). Build first, then check the output:
 *
 *   NEXT_PUBLIC_BASE_PATH=/cmt-lexicon npm run build
 *   tsx scripts/check-export-basepath.ts /cmt-lexicon [outDir]
 *
 * It fails if any page links to a root path outside the base path, if a prefixed URL
 * does not resolve to a real file in the export, or if canonical/social metadata,
 * robots.txt, the sitemap or the generated glossary and llms.txt miss the prefix.
 */
const basePath = normalizeBasePath(process.argv[2]);
if (!basePath) {
  console.error("Usage: tsx scripts/check-export-basepath.ts /<base-path> [outDir]");
  process.exit(2);
}
const outDir = path.resolve(process.argv[3] ?? "out");
const prefix = `${basePath}/`;
const problems: string[] = [];
const fail = (message: string) => problems.push(message);
const rel = (file: string) => path.relative(outDir, file) || ".";

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
  );
}

/** Where a host serving `outDir` at `basePath` finds a URL path: the file itself or a folder's index.html. */
function resolves(urlPath: string): boolean {
  const withoutQuery = urlPath.split(/[?#]/)[0];
  if (withoutQuery !== basePath && !withoutQuery.startsWith(prefix)) return false;
  const local = decodeURIComponent(withoutQuery.slice(basePath.length)) || "/";
  const target = path.join(outDir, local);
  if (!target.startsWith(outDir)) return false;
  if (local.endsWith("/")) return fs.existsSync(path.join(target, "index.html"));
  return fs.existsSync(target) && fs.statSync(target).isFile();
}

if (!fs.existsSync(outDir)) {
  console.error(`No export found at ${outDir}. Run the build first.`);
  process.exit(2);
}

const files = walk(outDir);
const pages = files.filter((file) => file.endsWith(".html"));

// 1. Every root-relative reference in every page stays inside the base path and resolves.
const referenced = new Set<string>();
for (const page of pages) {
  // preconnect and dns-prefetch hints name an origin (href="/" means "this origin"), not a page.
  const html = fs
    .readFileSync(page, "utf8")
    .replace(/<link rel="(?:preconnect|dns-prefetch)"[^>]*>/g, "");
  for (const [, , value] of html.matchAll(/\b(href|src|poster|action)="(\/(?!\/)[^"]*)"/g)) {
    if (!value.startsWith(prefix) && value !== basePath) fail(`${rel(page)}: "${value}" is outside ${basePath}/`);
    else referenced.add(value);
  }
}
for (const url of referenced) {
  if (!resolves(url)) fail(`${url} is referenced but does not resolve to a file in the export`);
}

// 2. Canonical and social metadata are absolute URLs under the base path, and canonical pages exist.
let canonicalCount = 0;
for (const page of pages) {
  const html = fs.readFileSync(page, "utf8");
  if (rel(page) === "404.html" || rel(page).startsWith("_not-found")) continue;
  const tags = [
    ...html.matchAll(/<link rel="canonical" href="([^"]+)"/g),
    ...html.matchAll(/<meta property="og:(?:url|image)" content="([^"]+)"/g),
    ...html.matchAll(/<meta name="twitter:image" content="([^"]+)"/g),
  ];
  for (const [, value] of tags) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      fail(`${rel(page)}: metadata URL "${value}" is not absolute`);
      continue;
    }
    if (!url.pathname.startsWith(prefix)) fail(`${rel(page)}: metadata URL "${value}" is outside ${basePath}/`);
    else if (!resolves(url.pathname)) fail(`${rel(page)}: metadata URL "${value}" does not resolve in the export`);
  }
  if (/<link rel="canonical"/.test(html)) canonicalCount++;
}

// 3. robots.txt points at the prefixed sitemap and allows the prefixed site.
const robotsFile = path.join(outDir, "robots.txt");
if (!fs.existsSync(robotsFile)) fail("robots.txt is missing");
else {
  const robots = fs.readFileSync(robotsFile, "utf8");
  const sitemapUrl = robots.match(/^Sitemap:\s*(\S+)/im)?.[1];
  if (!sitemapUrl) fail("robots.txt has no Sitemap line");
  else if (new URL(sitemapUrl).pathname !== `${basePath}/sitemap.xml`) fail(`robots.txt Sitemap "${sitemapUrl}" is not under ${basePath}/`);
  if (!new RegExp(`^Allow:\\s*${basePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/\\s*$`, "im").test(robots)) fail(`robots.txt does not allow ${prefix}`);
}

// 4. Every sitemap URL is under the base path and is a real page.
const sitemapFile = path.join(outDir, "sitemap.xml");
let sitemapCount = 0;
if (!fs.existsSync(sitemapFile)) fail("sitemap.xml is missing");
else {
  for (const [, loc] of fs.readFileSync(sitemapFile, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)) {
    sitemapCount++;
    const pathname = new URL(loc.replaceAll("&amp;", "&")).pathname;
    if (!resolves(pathname)) fail(`sitemap.xml: ${loc} does not resolve under ${basePath}/`);
  }
  if (sitemapCount === 0) fail("sitemap.xml has no URLs");
}

// 5. Generated downloads use prefixed paths.
const glossaryFile = path.join(outDir, "glossary.min.json");
if (!fs.existsSync(glossaryFile)) fail("glossary.min.json is missing");
else {
  const walkJson = (value: unknown, where: string) => {
    if (Array.isArray(value)) value.forEach((item, index) => walkJson(item, `${where}[${index}]`));
    else if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        if (key === "url" && typeof child === "string" && child.startsWith("/") && !child.startsWith(prefix)) {
          fail(`glossary.min.json: ${where}.url "${child}" is outside ${basePath}/`);
        } else walkJson(child, `${where}.${key}`);
      }
    }
  };
  walkJson(JSON.parse(fs.readFileSync(glossaryFile, "utf8")), "$");
}
const llmsFile = path.join(outDir, "llms.txt");
if (!fs.existsSync(llmsFile)) fail("llms.txt is missing");
else {
  // "@/components/ui/x" and "../components/x" are import paths, not site links.
  const unprefixed = fs.readFileSync(llmsFile, "utf8").match(/(?<![A-Za-z0-9._~@-])\/(?:components|websites|assets)\/[^\s\],]*/g) ?? [];
  for (const link of new Set(unprefixed)) fail(`llms.txt: site path "${link}" is not under ${basePath}/`);
}

// 6. GitHub Pages extras: Jekyll must not drop /_next, and unknown URLs need a 404 page.
if (!fs.existsSync(path.join(outDir, ".nojekyll"))) fail(".nojekyll is missing, so branch-based GitHub Pages would drop /_next");
if (!fs.existsSync(path.join(outDir, "404.html"))) fail("404.html is missing");

if (problems.length > 0) {
  console.error(`\n✗ Export for ${basePath}/ has ${problems.length} problem(s):\n`);
  for (const problem of problems.slice(0, 40)) console.error(`  - ${problem}`);
  if (problems.length > 40) console.error(`  … and ${problems.length - 40} more`);
  console.error("");
  process.exit(1);
}
console.log(
  `✓ Export is valid under ${basePath}/: ${pages.length} pages, ${referenced.size} distinct internal URLs resolve, ` +
    `${canonicalCount} canonical tags, ${sitemapCount} sitemap URLs`,
);

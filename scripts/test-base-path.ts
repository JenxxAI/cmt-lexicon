import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { normalizeBasePath, withBasePath } from "../src/lib/base-path";
import { parsePreview, PREVIEW_PREFIX } from "../src/lib/full-preview";

/**
 * Base-path support for GitHub Pages project sites (issue #34). The built export is checked
 * by scripts/check-export-basepath.ts; these cover the helpers and the one class of mistake
 * a static export check cannot see: links that only appear at runtime.
 */

// normalizeBasePath: unset means root hosting, anything valid becomes "/segment" with no trailing slash.
for (const unset of [undefined, "", "   ", "/"]) {
  assert.equal(normalizeBasePath(unset), "", `${JSON.stringify(unset)} means no base path`);
}
for (const same of ["/cmt-lexicon", "cmt-lexicon", "/cmt-lexicon/", " /cmt-lexicon/ ", "//cmt-lexicon//"]) {
  assert.equal(normalizeBasePath(same), "/cmt-lexicon", `${JSON.stringify(same)} normalizes`);
}
assert.equal(normalizeBasePath("/team/ui.lexicon_v2"), "/team/ui.lexicon_v2", "nested paths and . _ are allowed");
for (const bad of [".", "..", "/a/../b", "/a/./b", "/a b", "/a?x=1", "/a#x", "https://x.github.io/repo", "/a\\b", "/%2e%2e"]) {
  assert.throws(() => normalizeBasePath(bad), /NEXT_PUBLIC_BASE_PATH/, `${JSON.stringify(bad)} is rejected with a helpful message`);
}

// withBasePath: prefixes root-relative paths only, and keeps query strings and fragments intact.
assert.equal(withBasePath("/about/", ""), "/about/", "no prefix at the host root");
assert.equal(withBasePath("/about/", "/cmt-lexicon"), "/cmt-lexicon/about/");
assert.equal(withBasePath("/", "/cmt-lexicon"), "/cmt-lexicon/", "the home page keeps its trailing slash");
assert.equal(withBasePath("/assets/#icon", "/cmt-lexicon"), "/cmt-lexicon/assets/#icon");
assert.equal(withBasePath("/community/project/?id=7", "/cmt-lexicon"), "/cmt-lexicon/community/project/?id=7");
for (const notRootRelative of ["about/", "https://example.com/", "//example.com/x", ""]) {
  assert.throws(() => withBasePath(notRootRelative, "/cmt-lexicon"), /root-relative/, `${JSON.stringify(notRootRelative)} is refused`);
}

// "Return to editor" must accept in-site editor pages under the base path, and nothing else.
{
  const snapshot = (returnTo: string) =>
    JSON.stringify({ title: "Sample", document: "<p>hi</p>", returnTo, createdAt: 1_000 });
  const now = 2_000;
  assert.ok(parsePreview(snapshot("/cmt-lexicon/websites/blog/"), now, "/cmt-lexicon"), "websites page under the base path");
  assert.ok(parsePreview(snapshot("/cmt-lexicon/community/create/?remix=1"), now, "/cmt-lexicon"), "community page under the base path");
  assert.equal(parsePreview(snapshot("/websites/blog/"), now, "/cmt-lexicon"), null, "an unprefixed path is outside the site");
  assert.equal(parsePreview(snapshot("/cmt-lexicon/about/"), now, "/cmt-lexicon"), null, "other in-site pages are still refused");
  assert.equal(parsePreview(snapshot("/cmt-lexiconX/websites/blog/"), now, "/cmt-lexicon"), null, "the prefix matches whole segments");
  assert.equal(parsePreview(snapshot("/aXb/websites/blog/"), now, "/a.b"), null, "regex characters in the base path are literal");
  assert.ok(parsePreview(snapshot("/websites/blog/"), now, ""), "root hosting is unchanged");
  assert.equal(parsePreview(snapshot("//evil.example/websites/x/"), now, ""), null, "protocol-relative URLs are refused");
}
assert.ok(PREVIEW_PREFIX.length > 0);

// Source guard: a plain <a> (or a redirect built from the origin) with a root path must use withBasePath.
// next/link adds the base path itself, so <Link> is exempt; static HTML cannot reveal links that render later.
function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(tsx|ts)$/.test(entry.name) ? [full] : [];
  });
}
const offenders: string[] = [];
for (const file of sourceFiles("src")) {
  const source = fs.readFileSync(file, "utf8");
  const lineOf = (index: number) => source.slice(0, index).split("\n").length;
  for (const match of source.matchAll(/<a\b[^>]*?\bhref=(?:\{\s*)?(?:"\/(?!\/)|`\/|'\/(?!\/))[^>]*/g)) {
    offenders.push(`${file}:${lineOf(match.index!)}: plain <a> with an unprefixed root path; use withBasePath(...)`);
  }
  for (const match of source.matchAll(/location\.origin\}\/(?!\/)/g)) {
    offenders.push(`${file}:${lineOf(match.index!)}: URL built from location.origin with an unprefixed path; use withBasePath(...)`);
  }
  for (const match of source.matchAll(/\b(?:fetch|new URL|window\.open|location\.assign)\(\s*["'`]\/(?!\/)/g)) {
    offenders.push(`${file}:${lineOf(match.index!)}: root path passed to a runtime URL API; use withBasePath(...)`);
  }
}
assert.deepEqual(offenders, [], `unprefixed root paths found:\n  ${offenders.join("\n  ")}`);

console.log("Base-path checks passed: normalization, withBasePath, preview return paths, runtime link guard.");

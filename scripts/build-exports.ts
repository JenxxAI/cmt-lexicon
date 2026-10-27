import fs from "node:fs";
import path from "node:path";
import { assets } from "../src/lib/assets";
import { buildCheatSheet } from "../src/lib/cheatsheet";
import { getAllEntries, getAllWebsiteTypes } from "../src/lib/content";
import { SITE } from "../src/lib/site";

const entries = getAllEntries();
const websites = getAllWebsiteTypes();
const publicDir = path.join(process.cwd(), "public");
fs.mkdirSync(publicDir, { recursive: true });

// 1. Full glossary as minified JSON, for apps, extensions, and other tools.
fs.writeFileSync(
  path.join(publicDir, "glossary.min.json"),
  JSON.stringify({ name: SITE.name, repo: SITE.repoUrl, count: entries.length, entries, websiteTypeCount: websites.length, websiteTypes: websites, assetCount: assets.topics.length, assets: assets.topics.map((topic) => ({ ...topic, url: `/assets/#${topic.id}` })) }),
);

// 2. Shared with the human-readable cheat sheet and its Copy all action.
fs.writeFileSync(path.join(publicDir, "llms.txt"), buildCheatSheet(entries, assets.topics) + "\n\n# Website types\n\n" + websites.map(entry => [
  `## ${entry.name}`, `/websites/${entry.id}/`, entry.definition,
  `Goal: ${entry.goal}`, `Audience: ${entry.audience}`,
  `Blueprint: ${entry.sections.map(section => `${section.name}: ${section.purpose} [${section.componentIds.map(id => `/components/${id}/`).join(", ")}]`).join("; ")}`,
  `Must have: ${entry.mustHave.join("; ")}`, `Avoid: ${entry.avoid.join("; ")}`,
  `Prompt: ${entry.prompts.short}`,
].join("\n")).join("\n\n") + "\n");

// Absolute sitemap URLs use the configured public origin (the repository’s published site otherwise).
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : SITE.url);
const origin = new URL(siteUrl);
if (!["http:", "https:"].includes(origin.protocol)) throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTP(S) URL");
const routes = ["/", "/about/", "/assets/", "/cheat-sheet/", "/websites/", "/community/",
  ...entries.map(entry => `/components/${entry.id}/`), ...websites.map(entry => `/websites/${entry.id}/`)];
const xmlEscape = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
fs.writeFileSync(path.join(publicDir, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(route => `  <url><loc>${xmlEscape(new URL(route, origin).href)}</loc></url>`).join("\n")}\n</urlset>\n`);

console.log(`✓ exported ${entries.length} components, ${websites.length} website types, and ${assets.topics.length} asset topics; sitemap has ${routes.length} URLs`);

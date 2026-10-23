import fs from "node:fs";
import path from "node:path";
import { assets } from "../src/lib/assets";
import { buildCheatSheet } from "../src/lib/cheatsheet";
import { getAllEntries } from "../src/lib/content";
import { SITE } from "../src/lib/site";

const entries = getAllEntries();
const publicDir = path.join(process.cwd(), "public");
fs.mkdirSync(publicDir, { recursive: true });

// 1. Full glossary as minified JSON, for apps, extensions, and other tools.
fs.writeFileSync(
  path.join(publicDir, "glossary.min.json"),
  JSON.stringify({ name: SITE.name, repo: SITE.repoUrl, count: entries.length, entries, assetCount: assets.topics.length, assets: assets.topics.map((topic) => ({ ...topic, url: `/assets/#${topic.id}` })) }),
);

// 2. Shared with the human-readable cheat sheet and its Copy all action.
fs.writeFileSync(path.join(publicDir, "llms.txt"), buildCheatSheet(entries, assets.topics));

console.log(`✓ exported ${entries.length} components and ${assets.topics.length} asset topics to public/glossary.min.json and public/llms.txt`);

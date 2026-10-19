import fs from "node:fs";
import path from "node:path";
import { assets } from "../src/lib/assets";
import { CATEGORIES, type CategoryId } from "../src/lib/categories";
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

// 2. Compact cheat sheet. Paste it into CLAUDE.md / AGENTS.md so your AI uses the right terms.
const lines = [
  `# ${SITE.name}`,
  "> Plain names for UI components. Use these exact terms when describing UI changes.",
  "",
];

for (const categoryId of Object.keys(CATEGORIES) as CategoryId[]) {
  const group = entries.filter((entry) => entry.category === categoryId);
  if (group.length === 0) continue;
  lines.push(`## ${CATEGORIES[categoryId]}`);
  for (const entry of group) {
    const aka = entry.aliases.length > 0 ? ` (aka ${entry.aliases.join(", ")})` : "";
    lines.push(`- ${entry.name}${aka}: ${entry.prompts.short}`);
  }
  lines.push("");
}

lines.push("## Asset vocabulary");
for (const topic of assets.topics) {
  lines.push(`- ${topic.name} (/assets/#${topic.id}): ${topic.definition} Prompt: ${topic.prompt}`);
}

fs.writeFileSync(path.join(publicDir, "llms.txt"), `${lines.join("\n").trimEnd()}\n`);

console.log(`✓ exported ${entries.length} components and ${assets.topics.length} asset topics to public/glossary.min.json and public/llms.txt`);

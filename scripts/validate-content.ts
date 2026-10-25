import { assets } from "../src/lib/assets";
import { loadEntries, loadWebsiteTypes } from "../src/lib/content";
import { estimateTokens } from "../src/lib/tokens";

const MAX_SHORT_PROMPT_TOKENS = 40;

const { entries, errors } = loadEntries();
const ids = new Set(entries.map((entry) => entry.id));
const seenTerms = new Map<string, string>();

for (const entry of entries) {
  for (const id of entry.related) {
    if (id === entry.id) errors.push(`${entry.id}.json: related lists itself`);
    else if (!ids.has(id)) errors.push(`${entry.id}.json: related "${id}" is not an existing entry`);
  }

  for (const { id } of entry.notConfusedWith) {
    if (id === entry.id) errors.push(`${entry.id}.json: notConfusedWith lists itself`);
    else if (!ids.has(id)) errors.push(`${entry.id}.json: notConfusedWith "${id}" is not an existing entry`);
  }

  const tokens = estimateTokens(entry.prompts.short);
  if (tokens > MAX_SHORT_PROMPT_TOKENS) {
    errors.push(`${entry.id}.json: short prompt is ~${tokens} tokens, keep it under ${MAX_SHORT_PROMPT_TOKENS}`);
  }

  // The same name or alias on two entries makes search ambiguous.
  for (const term of [entry.name, ...entry.aliases]) {
    const key = term.toLowerCase();
    const owner = seenTerms.get(key);
    if (owner && owner !== entry.id) {
      errors.push(`${entry.id}.json: "${term}" is already used by "${owner}"`);
    } else {
      seenTerms.set(key, entry.id);
    }
  }
}

for (const topic of assets.topics) {
  if (estimateTokens(topic.prompt) >= MAX_SHORT_PROMPT_TOKENS) {
    errors.push(`assets.json: ${topic.id} prompt must stay under ${MAX_SHORT_PROMPT_TOKENS} estimated tokens`);
  }
}

const websites = loadWebsiteTypes();
errors.push(...websites.errors);
const websiteIds = new Set<string>();
for (const website of websites.entries) {
  if (websiteIds.has(website.id)) errors.push(`website-types/${website.id}: duplicate id`);
  if (ids.has(website.id)) errors.push(`website-types/${website.id}: id is already used by a component`);
  websiteIds.add(website.id);
}
const websiteTerms = new Map<string, string>();
for (const website of websites.entries) {
  for (const term of [website.name, ...website.aliases]) {
    const key = term.trim().toLowerCase();
    const owner = websiteTerms.get(key);
    if (owner && owner !== website.id) errors.push(`website-types/${website.id}: ambiguous name or alias "${term}"`);
    websiteTerms.set(key, website.id);
  }
  if (estimateTokens(website.prompts.short) >= MAX_SHORT_PROMPT_TOKENS) errors.push(`website-types/${website.id}: short prompt must be under 40 tokens`);
  for (const section of website.sections) {
    for (const id of section.componentIds) {
      if (!ids.has(id)) errors.push(`website-types/${website.id}: unknown component "${id}" in ${section.name}`);
    }
  }
  for (const id of website.related) {
    if (id === website.id || !websiteIds.has(id)) errors.push(`website-types/${website.id}: invalid related website "${id}"`);
  }
}

if (errors.length > 0) {
  console.error(`\n✗ Content has ${errors.length} problem(s):\n`);
  for (const error of errors) console.error(`  - ${error}`);
  console.error("");
  process.exit(1);
}

console.log(`✓ ${entries.length} entries valid`);

console.log(`✓ ${assets.topics.length} asset terms and ${assets.icons.length} icon mappings valid`);

console.log(`✓ ${websites.entries.length} website types and their component links valid`);

import { assets } from "../src/lib/assets";
import { loadEntries } from "../src/lib/content";
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

if (errors.length > 0) {
  console.error(`\n✗ Content has ${errors.length} problem(s):\n`);
  for (const error of errors) console.error(`  - ${error}`);
  console.error("");
  process.exit(1);
}

console.log(`✓ ${entries.length} entries valid`);

console.log(`✓ ${assets.topics.length} asset terms and ${assets.icons.length} icon mappings valid`);

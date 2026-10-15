import fs from "node:fs";
import path from "node:path";
import { entrySchema, type Entry, type EntrySummary } from "./schema";

export const CONTENT_DIR = path.join(process.cwd(), "content", "components");

/** Reads and validates every content/components/*.json. Collects all errors instead of stopping at the first. */
export function loadEntries(dir: string = CONTENT_DIR): { entries: Entry[]; errors: string[] } {
  const entries: Entry[] = [];
  const errors: string[] = [];

  if (!fs.existsSync(dir)) {
    return { entries, errors: [`Content folder not found: ${dir}`] };
  }

  const files = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort();

  for (const file of files) {
    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    } catch (error) {
      errors.push(`${file}: invalid JSON (${(error as Error).message})`);
      continue;
    }

    const parsed = entrySchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`${file}: ${issue.path.join(".") || "(root)"}: ${issue.message}`);
      }
      continue;
    }

    if (`${parsed.data.id}.json` !== file) {
      errors.push(`${file}: id "${parsed.data.id}" must match the file name`);
    }
    entries.push(parsed.data);
  }

  return { entries, errors };
}

let cache: Entry[] | null = null;

/** All entries, sorted by name. Throws a readable error if any content file is invalid. */
export function getAllEntries(): Entry[] {
  if (cache) return cache;
  const { entries, errors } = loadEntries();
  if (errors.length > 0) {
    throw new Error(`Invalid content:\n${errors.map((line) => `  - ${line}`).join("\n")}`);
  }
  cache = [...entries].sort((a, b) => a.name.localeCompare(b.name));
  return cache;
}

export function getEntry(id: string): Entry | undefined {
  return getAllEntries().find((entry) => entry.id === id);
}

export function toSummary(entry: Entry): EntrySummary {
  const { id, name, category, aliases, looksLike, definition, whenToUse, tags } = entry;
  return { id, name, category, aliases, looksLike, definition, whenToUse, tags, shortPrompt: entry.prompts.short };
}

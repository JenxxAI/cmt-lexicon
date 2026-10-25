import fs from "node:fs";
import path from "node:path";
import { entrySchema, websiteTypeSchema, type Entry, type EntrySummary, type WebsiteType, type WebsiteTypeSummary } from "./schema";

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

export const WEBSITE_TYPES_DIR = path.join(process.cwd(), "content", "website-types");

export function loadWebsiteTypes(dir = WEBSITE_TYPES_DIR): { entries: WebsiteType[]; errors: string[] } {
  const entries: WebsiteType[] = [];
  const errors: string[] = [];
  if (!fs.existsSync(dir)) return { entries, errors: [`Website types folder not found: ${dir}`] };
  for (const file of fs.readdirSync(dir).filter(file => file.endsWith(".json")).sort()) {
    try {
      const result = websiteTypeSchema.safeParse(JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")));
      if (!result.success) {
        errors.push(...result.error.issues.map(issue => `website-types/${file}: ${issue.path.join(".")}: ${issue.message}`));
        continue;
      }
      if (`${result.data.id}.json` !== file) errors.push(`website-types/${file}: id must match the file name`);
      entries.push(result.data);
    } catch (error) {
      errors.push(`website-types/${file}: invalid JSON (${(error as Error).message})`);
    }
  }
  return { entries, errors };
}

let websiteCache: WebsiteType[] | null = null;
export function getAllWebsiteTypes(): WebsiteType[] {
  if (websiteCache) return websiteCache;
  const { entries, errors } = loadWebsiteTypes();
  if (errors.length) throw new Error(`Invalid website types:\n${errors.join("\n")}`);
  websiteCache = entries.sort((a, b) => a.name.localeCompare(b.name));
  return websiteCache;
}

export function getWebsiteType(id: string): WebsiteType | undefined {
  return getAllWebsiteTypes().find(entry => entry.id === id);
}

export function toWebsiteSummary(entry: WebsiteType): WebsiteTypeSummary {
  const { id, name, aliases, looksLike, definition, goal, tags } = entry;
  return { kind: "website", id, name, aliases, looksLike, definition, goal, tags, shortPrompt: entry.prompts.short };
}

export function getWebsiteTypesUsing(componentId: string): WebsiteType[] {
  return getAllWebsiteTypes().filter(entry => entry.sections.some(section => section.componentIds.includes(componentId)));
}

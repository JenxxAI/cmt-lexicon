import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadEntries, loadWebsiteTypes } from "../src/lib/content";
import { entrySchema, websiteTypeSchema } from "../src/lib/schema";

/**
 * Content schemas must reject unknown keys, so a misspelled field fails validation
 * instead of being silently stripped (issue #33).
 */
type Json = Record<string, any>;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const entry: Json = JSON.parse(readFileSync("content/components/select.json", "utf8"));
const website: Json = JSON.parse(readFileSync("content/website-types/blog.json", "utf8"));

/** The schema must fail, and the error must name the misspelled key so authors can find it. */
function rejects(schema: typeof entrySchema | typeof websiteTypeSchema, payload: unknown, key: string, where: string) {
  const result = schema.safeParse(payload);
  assert.equal(result.success, false, `${where}: misspelled key "${key}" must fail validation`);
  const unrecognized = result.error!.issues.filter((issue) => issue.code === "unrecognized_keys");
  assert.ok(
    unrecognized.some((issue) => (issue as { keys: string[] }).keys.includes(key)),
    `${where}: the error names "${key}" as unrecognized, got ${JSON.stringify(result.error!.issues.map((i) => i.message))}`,
  );
}

// Real content still passes, so strictness only rejects what is actually wrong.
assert.equal(entrySchema.safeParse(entry).success, true, "a real component entry is valid");
assert.equal(websiteTypeSchema.safeParse(website).success, true, "a real website type is valid");

// Components: root and every nested object.
for (const [typo, original] of [["defintion", "definition"], ["alises", "aliases"], ["tgs", "tags"]] as const) {
  const payload = clone(entry);
  payload[typo] = payload[original];
  delete payload[original];
  rejects(entrySchema, payload, typo, `component root (${original})`);
}
{
  const payload = clone(entry);
  payload.extraField = "x";
  rejects(entrySchema, payload, "extraField", "component root (unrelated extra key)");
}
{
  const payload = clone(entry);
  payload.prompts.shrot = "typo";
  rejects(entrySchema, payload, "shrot", "component prompts");
}
{
  const payload = clone(entry);
  payload.snippets.reactTailwnd = ["<div />"];
  rejects(entrySchema, payload, "reactTailwnd", "component snippets");
}
{
  const payload = clone(entry);
  payload.notConfusedWith = [{ id: "dropdown-menu", difference: "Runs commands such as Rename.", diference: "typo" }];
  rejects(entrySchema, payload, "diference", "component notConfusedWith item");
}

// Website types: root and nested objects.
for (const [typo, original] of [["goall", "goal"], ["audiance", "audience"], ["mustHav", "mustHave"]] as const) {
  const payload = clone(website);
  payload[typo] = payload[original];
  delete payload[original];
  rejects(websiteTypeSchema, payload, typo, `website root (${original})`);
}
{
  const payload = clone(website);
  payload.sections[0].componentId = ["navbar"];
  rejects(websiteTypeSchema, payload, "componentId", "website section");
}
{
  const payload = clone(website);
  payload.prompts.detailled = "typo";
  rejects(websiteTypeSchema, payload, "detailled", "website prompts");
}

// A typo that replaces a required key still fails, now with both the missing and the unrecognized error.
{
  const payload = clone(entry);
  payload.defintion = payload.definition;
  delete payload.definition;
  assert.equal(entrySchema.safeParse(payload).success, false);
}

// Free-form library names remain allowed: `libraries` is a record, not a fixed object.
{
  const payload = clone(entry);
  payload.libraries = { ...payload.libraries, "Some New UI Kit": "Picker" };
  assert.equal(entrySchema.safeParse(payload).success, true, "libraries accepts any library name");
}

// The real validation path (what `npm run validate` and the build use) surfaces the typo, per file.
const dir = mkdtempSync(join(tmpdir(), "lexicon-strict-"));
try {
  const componentDir = join(dir, "components");
  const websiteDir = join(dir, "website-types");
  mkdirSync(componentDir);
  mkdirSync(websiteDir);

  const typoEntry = clone(entry);
  typoEntry.defintion = typoEntry.definition;
  delete typoEntry.definition;
  writeFileSync(join(componentDir, "select.json"), JSON.stringify(typoEntry));
  const components = loadEntries(componentDir);
  assert.equal(components.entries.length, 0, "an entry with a misspelled key is not loaded");
  assert.ok(
    components.errors.some((message) => message.startsWith("select.json:") && message.includes("defintion")),
    `validate reports the misspelled component key with its file, got ${JSON.stringify(components.errors)}`,
  );

  const typoWebsite = clone(website);
  typoWebsite.audiance = typoWebsite.audience;
  writeFileSync(join(websiteDir, "blog.json"), JSON.stringify(typoWebsite));
  const websites = loadWebsiteTypes(websiteDir);
  assert.equal(websites.entries.length, 0, "a website type with an unknown key is not loaded");
  assert.ok(
    websites.errors.some((message) => message.includes("blog.json") && message.includes("audiance")),
    `validate reports the unknown website key with its file, got ${JSON.stringify(websites.errors)}`,
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log("Schema strictness checks passed: component and website roots and nested objects reject unknown keys.");

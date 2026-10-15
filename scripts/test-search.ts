import assert from "node:assert/strict";
import { getAllEntries, toSummary } from "../src/lib/content";
import { search } from "../src/lib/search";

const entries = getAllEntries().map(toSummary);

// [what a beginner might type, the entry that should come first]
const cases: [string, string][] = [
  ["a panel that slides in from the side", "drawer"],
  ["off-canvas", "drawer"],
  ["popup with dark background", "modal"],
  ["three lines icon", "hamburger-icon"],
  ["gray loading boxes", "skeleton-loader"],
  ["message that disappears by itself", "toast"],
  ["snackbar", "toast"],
  ["on off switch", "toggle-switch"],
  ["bar at the top of the page with links", "navbar"],
  ["slides up from the bottom", "bottom-sheet"],
];

let failed = 0;
for (const [query, expected] of cases) {
  const top = search(entries, query)[0]?.id;
  if (top === expected) {
    console.log(`✓ "${query}" -> ${top}`);
  } else {
    failed++;
    console.error(`✗ "${query}" -> ${top ?? "(no results)"}, expected ${expected}`);
  }
}

assert.equal(search(entries, "").length, entries.length, "empty query returns everything");
assert.equal(search(entries, "the").length, 0, "stopwords alone return nothing");
assert.equal(search(entries, "zzzxqj").length, 0, "nonsense returns nothing");

if (failed > 0) {
  console.error(`\n${failed} search case(s) failed`);
  process.exit(1);
}
console.log(`\n✓ ${cases.length} search cases passed`);

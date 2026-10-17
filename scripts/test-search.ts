import assert from "node:assert/strict";
import { getAllEntries, toSummary } from "../src/lib/content";
import { search } from "../src/lib/search";
import type { EntrySummary } from "../src/lib/schema";

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
  ["row of labels that switch the content below", "tabs"],
  ["click a heading to swap between views", "tabs"],
  ["trail of links showing where I am", "breadcrumb"],
  ["home then category then current page", "breadcrumb"],
  ["small text label that appears when I hover", "tooltip"],
  ["tiny explanation beside an icon", "tooltip"],
  ["sections that expand when you click", "accordion"],
  ["stack of questions that reveal answers", "accordion"],
  ["list of actions that opens below a button", "dropdown-menu"],
  ["click more to reveal a vertical list of commands", "dropdown-menu"],
  ["box with a picture title and description", "card"],
  ["separate rectangle containing one item", "card"],
  ["filled rectangle you press to do something", "button"],
  ["clickable box labeled save or submit", "button"],
  ["empty box where I type my name", "text-input"],
  ["rectangle with a blinking cursor for typing", "text-input"],
  ["little square you tick next to a choice", "checkbox"],
  ["boxes that let me pick several options", "checkbox"],
  ["bar that fills up as a file uploads", "progress-bar"],
  ["horizontal strip showing how much is finished", "progress-bar"],
  ["numbered links below a list of results", "pagination"],
  ["previous and next buttons beside page numbers", "pagination"],
  ["column of links down the left side", "sidebar"],
  ["menu that stays beside the main content", "sidebar"],
  ["pictures you move through with left and right arrows", "carousel"],
  ["row of dots underneath changing pictures", "carousel"],
  ["small pill with a status word inside", "badge"],
  ["tiny number next to a label", "badge"],
  ["small round photo beside a persons name", "avatar"],
  ["circle with initials when there is no photo", "avatar"],
  ["round choices where only one can be selected", "radio"],
  ["little circles with a dot in the chosen one", "radio"],
  ["line with a knob I drag to change a value", "slider"],
  ["volume control with a handle on a track", "slider"],
  ["field with a down arrow that opens choices", "select"],
  ["type in a field to narrow the available choices", "select"],
  ["spinning circle while I wait", "spinner"],
  ["rotating ring while something loads", "spinner"],
  ["wide message strip with a warning", "alert"],
  ["notice that stays above the form", "alert"],
  ["small calendar where I choose a day", "date-picker"],
  ["field that opens a grid of dates", "date-picker"],
  ["message saying there is nothing here yet", "empty-state"],
  ["empty list with a suggestion to add something", "empty-state"],
  ["big headline and main button at the start of a page", "hero-section"],
  ["large introduction area above everything else", "hero-section"],
  ["links and copyright at the bottom of the page", "footer"],
  ["bottom section with contact and privacy links", "footer"],
  ["top strip that stays visible while I scroll", "sticky-header"],
  ["page heading stuck to the top as content moves", "sticky-header"],
  ["tiles of different sizes arranged like a collage", "bento-grid"],
  ["one large box next to several smaller boxes", "bento-grid"],
  ["search box floating over the page for actions", "command-palette"],
  ["type a command to find something to do", "command-palette"],
  ["numbered circles connected by a line", "stepper"],
  ["steps showing where I am in a signup process", "stepper"],
  ["information lined up in rows and columns", "data-table"],
  ["spreadsheet-like list with headings above each column", "data-table"],
  ["three vertical dots that open extra actions", "kebab-menu"],
  ["stack of three dots at the end of a row", "kebab-menu"],
  ["choose file button beside a filename", "file-upload"],
  ["box where I attach a document", "file-upload"],
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

// Check the returned set as well as the winner: weak matches should disappear,
// but genuinely ambiguous searches must retain useful alternatives.
const idsFor = (query: string) => search(entries, query).map((entry) => entry.id);
assert.deepEqual(idsFor("a panel that slides in from the side"), ["drawer", "bottom-sheet"]);
assert.deepEqual(idsFor("side panel"), ["drawer"]);
assert.deepEqual(idsFor("three lines icon"), ["hamburger-icon"]);
assert.deepEqual(idsFor("gray loading boxes"), ["skeleton-loader"]);
assert.deepEqual(idsFor("loading"), ["skeleton-loader", "spinner", "progress-bar"]);
for (const id of ["dropdown-menu", "kebab-menu", "drawer", "navbar"]) {
  assert.ok(idsFor("menu").includes(id), `broad menu query keeps ${id}`);
}
assert.ok(!idsFor("form").includes("data-table"), "form must not match the middle of information");
assert.equal(idsFor("accord")[0], "accordion", "typing a prefix still finds the component");
assert.deepEqual(idsFor("  SIDE   PANEL  "), idsFor("side panel"), "case and whitespace are normalized");
assert.strictEqual(search(entries, " \t\n "), entries, "whitespace preserves the browse list and order");
assert.deepEqual(search([], "drawer"), [], "an empty corpus has no matches");
assert.deepEqual(search(entries, "?!..."), [], "punctuation alone has no matches");

function fixture(id: string, name: string, fields: Partial<EntrySummary> = {}): EntrySummary {
  return {
    id, name, category: "layout", aliases: [], looksLike: [], definition: "",
    whenToUse: [], tags: [], shortPrompt: "", ...fields,
  };
}

// For "alpha beta", separate fields give the strongest match a score of 10.
// Name-only matches score 6 (the inclusive cutoff); an alias-only match scores 5.
const boundaryEntries = [
  fixture("below", "Below", { aliases: ["alpha"] }),
  fixture("boundary-z", "Beta Z"),
  fixture("strongest", "Alpha", { looksLike: ["beta"] }),
  fixture("boundary-a", "Beta A"),
  fixture("unrelated", "Unrelated"),
];
const originalOrder = boundaryEntries.map((entry) => entry.id);
const expectedOrder = ["strongest", "boundary-a", "boundary-z"];
assert.deepEqual(search(boundaryEntries, "alpha beta").map((entry) => entry.id), expectedOrder);
assert.deepEqual(search([...boundaryEntries].reverse(), "alpha beta").map((entry) => entry.id), expectedOrder,
  "ties sort alphabetically regardless of input order");
assert.deepEqual(boundaryEntries.map((entry) => entry.id), originalOrder, "search does not mutate the input");
assert.deepEqual(search([fixture("none", "Unrelated")], "alpha"), [], "zero scores never survive the cutoff");
assert.deepEqual(search([fixture("only", "Alpha")], "alpha").map((entry) => entry.id), ["only"],
  "a lone positive match is retained");
assert.deepEqual(search([fixture("literal", "C++"), fixture("plain", "C")], "c++").map((entry) => entry.id),
  ["literal"], "phrase matching treats regex punctuation literally");
console.log("✓ Relevance, cutoff boundary, and search edge-case checks passed");

if (failed > 0) {
  console.error(`\n${failed} search case(s) failed`);
  process.exit(1);
}
console.log(`\n✓ ${cases.length} search cases passed`);

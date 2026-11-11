import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Regression checks for library names that are easy to get subtly wrong (issue #32).
 * Library mappings are free text, so these pin the two that must stay disambiguated.
 */
function libraries(id: string): Record<string, string> {
  return JSON.parse(readFileSync(`content/components/${id}.json`, "utf8")).libraries;
}

// shadcn/ui: a fixed-choice Select and a searchable Combobox are different things, not one "Select / Combobox".
const shadcnSelect = libraries("select")["shadcn/ui"];
assert.ok(shadcnSelect, "select maps shadcn/ui");
assert.match(shadcnSelect, /Select \(fixed/i, "names the fixed-choice Select");
assert.match(shadcnSelect, /Combobox \(separate/i, "names the searchable Combobox as a separate pattern");
assert.ok(!/^Select \/ Combobox$/.test(shadcnSelect), "does not present Select and Combobox as one component");

// Chakra UI: v3 uses the toaster API and v2 uses the useToast hook; a bare "Toast" names neither.
const chakraToast = libraries("toast")["Chakra UI"];
assert.ok(chakraToast, "toast maps Chakra UI");
assert.match(chakraToast, /toaster \(v3\)/, "names the v3 toaster API");
assert.match(chakraToast, /useToast \(v2\)/, "names the v2 useToast hook");

// Other versioned Chakra names keep the same "(v3) / (v2)" convention.
assert.match(libraries("modal")["Chakra UI"], /\(v3\).*\(v2\)/, "modal keeps its v3/v2 note");

console.log("Library mapping checks passed: shadcn/ui Select vs Combobox, Chakra toaster v3 vs useToast v2.");

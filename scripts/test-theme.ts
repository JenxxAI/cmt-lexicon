import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { readFileSync } from "node:fs";
import { THEME_SCRIPT, themePreference } from "../src/lib/theme";

for (const [saved, systemDark, expected] of [
  ["dark", false, "dark"],
  ["light", true, "light"],
  ["system", true, "dark"],
  [null, false, "light"],
  ["invalid", true, "dark"],
] as const) {
  const document = {
    documentElement: { dataset: {} as Record<string, string> },
  };
  runInNewContext(THEME_SCRIPT, {
    document,
    localStorage: { getItem: () => saved },
    window: { matchMedia: () => ({ matches: systemDark }) },
  });
  assert.equal(document.documentElement.dataset.theme, expected);
}
const document = { documentElement: { dataset: {} as Record<string, string> } };
runInNewContext(THEME_SCRIPT, {
  document,
  localStorage: {
    getItem() {
      throw Error("blocked");
    },
  },
  window: { matchMedia: () => ({ matches: true }) },
});
assert.equal(document.documentElement.dataset.theme, "dark");
assert.equal(themePreference("invalid"), "system");
const css = readFileSync("src/app/dark-theme.css", "utf8");
function color(name: string) {
  const hex = css.match(new RegExp(`--color-${name}:\\s*#([a-f0-9]{6})`))![1];
  const c = hex
    .match(/../g)!
    .map((x) => parseInt(x, 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
}
for (const foreground of ["ink", "body", "muted", "accent-deep"])
  for (const background of ["paper", "surface"])
    assert.ok(
      (color(foreground) + 0.05) / (color(background) + 0.05) >= 4.5,
      `${foreground} on ${background}`,
    );
console.log(
  "Theme checks passed: startup preferences, blocked storage, and dark text contrast.",
);

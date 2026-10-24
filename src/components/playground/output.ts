import { generateCode, supportsOutput } from "./generators";
import type { CodeTab } from "../CodeTabs";
import { estimateTokens } from "../../lib/tokens";
import { cssFill, pickOn, type Palette } from "./color";
import type { Control, Values } from "./types";

export function describeSettings(controls: Control[], values: Values, palette: Palette) {
  // Behavior before appearance: short prompts omit whole lower-priority clauses.
  const changed = controls.filter(c => values[c.key] !== c.default);
  const priority = (c: Control) => ["loading", "disabled", "mode", "type", "value"].includes(c.key) ? 0 : ["size", "radius", "shape"].includes(c.key) ? 3 : c.type === "text" ? 2 : 1;
  const ordered = [...changed].sort((a, b) => priority(a) - priority(b));
  return { count: changed.length, phrases: ordered.map(c => {
    const value = values[c.key];
    if (c.key === "color" && value === "custom") return `Color: ${cssFill(palette)}, text ${pickOn(palette).on}`;
    const label = c.type === "choice" ? c.options.find(o => o.value === value)?.label ?? value : c.type === "toggle" ? value ? "on" : "off" : c.type === "text" ? JSON.stringify(value) : `${value}${c.type === "range" ? c.unit ?? "" : ""}`;
    return `${c.label}: ${label}`;
  }) };
}

export function customizePrompts(original: { short: string; detailed: string }, phrases: string[]) {
  let short = original.short;
  for (const phrase of phrases) {
    const candidate = `${short} ${phrase}.`;
    if (estimateTokens(candidate) < 40) short = candidate;
  }
  return { short, detailed: phrases.length ? `${original.detailed}\nSettings: ${phrases.join("; ")}.` : original.detailed };
}

/** Preserve the exact authored examples at defaults and for unsupported samples. */
export function resolveOutput(id: string, controls: Control[], values: Values, palette: Palette, prompts: { short: string; detailed: string }, tabs: CodeTab[]) {
  const description = describeSettings(controls, values, palette);
  const count = supportsOutput(id) ? description.count : 0;
  if (!count) return { prompts, tabs, count };
  const code = generateCode(id, values, palette);
  return {
    count, prompts: customizePrompts(prompts, description.phrases),
    tabs: [
      { id: "html", label: "HTML", code: code.html },
      { id: "react", label: "React + Tailwind", code: code.react },
      ...tabs.filter(tab => tab.id !== "html" && tab.id !== "react").map(tab => tab.id === "vue" ? { ...tab, label: "Vue · Default" } : tab),
    ],
  };
}

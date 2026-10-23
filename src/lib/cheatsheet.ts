import { CATEGORIES, type CategoryId } from "./categories";
import type { Entry } from "./schema";
import { SITE } from "./site";

type PromptEntry = Pick<Entry, "id" | "name" | "category" | "aliases" | "prompts">;
type AssetPrompt = { id: string; name: string; definition: string; prompt: string };

/** Shared by the downloadable export and the page's Copy all action. */
export function buildCheatSheet(entries: readonly PromptEntry[], topics: readonly AssetPrompt[]): string {
  const lines = [
    `# ${SITE.name} — Prompt cheat sheet`,
    "> Name the component, then describe the behavior you need.",
    "",
    `${entries.length} component prompts · ${topics.length} asset prompts`,
    "",
    "## How to use",
    "Copy one prompt for the UI you need. Add your framework, where it belongs, and the action or content it should show.",
    "Keep the existing design tokens. Ask for keyboard support, visible focus, and a layout that works on a phone.",
    "Use the full sheet as a vocabulary reference in AGENTS.md or CLAUDE.md; you do not need to paste every prompt into each request.",
    "Paths below are relative to the UI Lexicon website.",
    "",
  ];
  for (const categoryId of Object.keys(CATEGORIES) as CategoryId[]) {
    const group = entries.filter((entry) => entry.category === categoryId);
    if (!group.length) continue;
    lines.push(`## ${CATEGORIES[categoryId]}`);
    for (const entry of group) {
      const aka = entry.aliases.length ? ` (aka ${entry.aliases.join(", ")})` : "";
      lines.push(`- ${entry.name}${aka} [/components/${entry.id}/]: ${entry.prompts.short}`);
    }
    lines.push("");
  }
  lines.push("## Asset vocabulary");
  for (const topic of topics) {
    lines.push(`- ${topic.name} [/assets/#${topic.id}]: ${topic.definition} Prompt: ${topic.prompt}`);
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

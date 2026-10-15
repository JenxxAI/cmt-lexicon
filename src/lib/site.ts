export const SITE = {
  name: "UI Lexicon",
  description:
    "Name any UI component by describing it. Free, open-source glossary with token-lean prompts for AI coding tools.",
  repoUrl: "https://github.com/JenxxAI/cmt-lexicon",
  authorUrl: "https://github.com/JenxxAI",
} as const;

/** Entries shown in the hero card before anyone types. Missing ids are skipped. */
export const SPOTLIGHT_IDS = ["drawer", "modal", "toast"];

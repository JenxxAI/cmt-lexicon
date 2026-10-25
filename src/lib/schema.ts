import { z } from "zod";
import { categoryIds } from "./categories";

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "use lowercase-kebab-case (letters, numbers, dashes)");

/** Code is authored as an array of lines in JSON (readable diffs), joined with \n at load time. */
const codeLines = z.array(z.string()).min(1).transform((lines) => lines.join("\n"));

export const entrySchema = z.object({
  /** Must match the file name: content/components/<id>.json */
  id: slug,
  name: z.string().min(2).max(40),
  category: z.enum(categoryIds),
  /** Other names people use for it. Searchable. */
  aliases: z.array(z.string().min(2)).min(1),
  /** How a beginner would DESCRIBE it, in their own words. This powers the search. */
  looksLike: z.array(z.string().min(5)).min(2),
  definition: z.string().min(20).max(240),
  whenToUse: z.array(z.string().min(3)).min(1),
  /** Look-alikes people mix this up with. `id` must be another entry. */
  notConfusedWith: z
    .array(z.object({ id: slug, difference: z.string().min(8).max(140) }))
    .default([]),
  related: z.array(slug).default([]),
  prompts: z.object({
    /** Token-lean. Keep it to one or two short sentences. */
    short: z.string().min(10).max(160),
    detailed: z.string().min(20).max(500),
  }),
  snippets: z
    .object({
      html: codeLines.optional(),
      reactTailwind: codeLines.optional(),
      vue: codeLines.optional(),
    })
    .default({}),
  /** Library name -> what that library calls this component. */
  libraries: z.record(z.string(), z.string()).default({}),
  a11yNotes: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export type Entry = z.infer<typeof entrySchema>;

/** The slim shape sent to the browser for search and cards (no code snippets). */
export type EntrySummary = Pick<
  Entry,
  "id" | "name" | "category" | "aliases" | "looksLike" | "definition" | "whenToUse" | "tags"
> & { shortPrompt: string };

/** Website blueprints reference existing components rather than duplicating their content. */
export const websiteTypeSchema = z.object({
  id: slug,
  name: z.string().min(2).max(60),
  aliases: z.array(z.string().min(2)).min(3),
  looksLike: z.array(z.string().min(5)).min(3),
  definition: z.string().min(20).max(240),
  goal: z.string().min(10).max(240),
  audience: z.string().min(5).max(240),
  sections: z.array(z.object({
    name: z.string().min(2).max(80),
    purpose: z.string().min(10).max(240),
    componentIds: z.array(slug).min(1),
  })).min(1),
  mustHave: z.array(z.string().min(5)).min(1),
  avoid: z.array(z.string().min(5)).min(1),
  examples: z.array(z.string().min(5)).min(1),
  related: z.array(slug).default([]),
  prompts: z.object({ short: z.string().min(10).max(156), detailed: z.string().min(20).max(500) }),
  tags: z.array(slug).min(1),
});

export type WebsiteType = z.infer<typeof websiteTypeSchema>;
export type WebsiteTypeSummary = Pick<WebsiteType, "id" | "name" | "aliases" | "looksLike" | "definition" | "goal" | "tags"> & {
  kind: "website";
  shortPrompt: string;
};

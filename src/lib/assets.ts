import { z } from "zod";
import data from "../../content/assets.json";

const text = z.string().min(1);
const source = z.url().startsWith("https://");
const schema = z.object({
  verifiedOn: z.iso.date(),
  topics: z.array(z.object({
    id: text.regex(/^[a-z]+(?:-[a-z]+)*$/), name: text, definition: text,
    looksLike: text, whenToUse: text, note: text, prompt: text, source,
  })).min(6),
  libraries: z.array(z.object({
    id: z.enum(["lucide", "heroicons", "phosphor"]), name: text, importFrom: text, docs: source,
  })).length(3),
  icons: z.array(z.object({
    id: z.enum(["menu", "search", "close", "settings", "check", "delete"]),
    name: text, looksLike: text,
    names: z.object({ lucide: text, heroicons: text, phosphor: text }),
  })).min(1),
}).superRefine((value, ctx) => {
  for (const key of ["topics", "libraries", "icons"] as const) {
    const ids = value[key].map((item) => item.id);
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", path: [key], message: "IDs must be unique" });
  }
});

// Server-side content only: do not import this Zod-backed module in client components.
export const assets = schema.parse(data);
export type AssetIconId = typeof assets.icons[number]["id"];

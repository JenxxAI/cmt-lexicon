// Server-only: read authored samples here, never from a client component.
import fs from "node:fs";
import path from "node:path";

/** Embed the site's color tokens so downloaded HTML also works on its own. */
export function getWebsiteSample(id: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error("Invalid website sample ID");
  const sample = fs.readFileSync(path.join(process.cwd(), "content/website-samples", `${id}.html`), "utf8");
  const theme = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
  const colors = theme.match(/--color-[\w-]+\s*:[^;]+;/g);
  if (!colors?.length) throw new Error("Website samples require theme colors");
  return sample.replace("/* THEME_TOKENS */", `:root {\n${colors.join("\n")}\n}`);
}

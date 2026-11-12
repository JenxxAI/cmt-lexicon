import type { SampleSource } from "./sample-source";
import { COMMUNITY_LIMITS } from "./community";

export type ImportKind = "html" | "css" | "js" | "image";
export function importKind(file: { name: string; type: string }): ImportKind | null {
  const name = file.name.toLowerCase();
  if (/\.html?$/.test(name)) return "html";
  if (name.endsWith(".css")) return "css";
  if (/\.(js|mjs)$/.test(name)) return "js";
  if (/^image\/(png|jpeg|webp)$/.test(file.type)) return "image";
  return null;
}
const JS_TYPE = /^\s*$|javascript|ecmascript|module/i;
/**
 * Split a single HTML page into the editor's three panes. Inline <style> and classic/module
 * <script> blocks move to CSS and JS; the <body> content becomes HTML. Anything the sandboxed
 * preview would block (external scripts, stylesheets, remote images) is reported, not fetched.
 */
export function splitHtmlDocument(text: string): {
  source: SampleSource;
  warnings: string[];
} {
  const warnings: string[] = [];
  const css: string[] = [];
  const js: string[] = [];
  let html = text.replace(/<!--[\s\S]*?-->/g, "");
  html = html.replace(
    /<style\b([^>]*)>([\s\S]*?)<\/style\s*>/gi,
    (_all, _attributes, body: string) => {
      if (body.trim()) css.push(body.trim());
      return "";
    },
  );
  html = html.replace(
    /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi,
    (all, attributes: string, body: string) => {
      if (/\bsrc\s*=/i.test(attributes)) {
        warnings.push("External scripts are blocked in community previews; inline them to keep them.");
        return "";
      }
      const type = /\btype\s*=\s*["']?([^"'\s>]*)/i.exec(attributes)?.[1] ?? "";
      if (!JS_TYPE.test(type)) return all;
      if (body.trim()) js.push(body.trim());
      return "";
    },
  );
  html = html.replace(/<link\b[^>]*>/gi, (all) => {
    if (/\brel\s*=\s*["']?stylesheet/i.test(all))
      warnings.push("Linked stylesheets are blocked in community previews; paste them into the CSS tab.");
    return "";
  });
  const body = /<body\b[^>]*>([\s\S]*?)(?:<\/body\s*>|$)/i.exec(html);
  html = body
    ? body[1]
    : html
        .replace(/<!doctype[^>]*>/gi, "")
        .replace(/<head\b[\s\S]*?<\/head\s*>/gi, "")
        .replace(/<title\b[\s\S]*?<\/title\s*>/gi, "")
        .replace(/<(?:meta|base)\b[^>]*>/gi, "")
        .replace(/<\/?(?:html|head|body)\b[^>]*>/gi, "");
  if (/<img\b[^>]*\bsrc\s*=\s*["']?(?:https?:)?\/\//i.test(html))
    warnings.push("Remote images are blocked in community previews; use data: URLs or remove them.");
  return {
    source: {
      html: html.trim(),
      css: css.join("\n\n"),
      js: js.join("\n\n"),
    },
    warnings: [...new Set(warnings)],
  };
}
/** Largest text file the importer reads; matches the per-file source limit. */
export const IMPORT_TEXT_LIMIT = COMMUNITY_LIMITS.fileBytes;

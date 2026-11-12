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
const WRAPPERS = new Set(["html", "head", "body"]);
const DROPPED = new Set(["meta", "base"]);
const isSpace = (c: string) => c === " " || c === "\t" || c === "\n" || c === "\r" || c === "\f";
/** Lowercases ASCII only, so indexes stay aligned with the original text (unlike toLowerCase). */
const asciiLower = (value: string) =>
  value.replace(/[A-Z]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 32));

type Tag = { name: string; closing: boolean; attributes: string; end: number };
/** Reads one tag starting at `<`, honoring quoted attribute values. Null when it is plain text. */
function readTag(text: string, start: number): Tag | null {
  let i = start + 1;
  const closing = text[i] === "/";
  if (closing) i++;
  const nameStart = i;
  while (i < text.length && /[A-Za-z0-9-]/.test(text[i])) i++;
  if (i === nameStart || !/[A-Za-z]/.test(text[nameStart])) return null;
  const name = asciiLower(text.slice(nameStart, i));
  const attributesStart = i;
  while (i < text.length && text[i] !== ">") {
    if (text[i] === '"' || text[i] === "'") {
      const close = text.indexOf(text[i], i + 1);
      i = close < 0 ? text.length : close + 1;
    } else i++;
  }
  return { name, closing, attributes: text.slice(attributesStart, i), end: Math.min(text.length, i + 1) };
}
/** Finds `</name` followed by whitespace, `/` or `>`, the way browsers end raw-text elements. */
function findClose(lower: string, name: string, from: number) {
  let at = lower.indexOf(`</${name}`, from);
  while (at >= 0) {
    const next = lower[at + name.length + 2];
    if (next === undefined || next === ">" || next === "/" || isSpace(next)) break;
    at = lower.indexOf(`</${name}`, at + 1);
  }
  if (at < 0) return { start: lower.length, end: lower.length };
  const close = lower.indexOf(">", at);
  return { start: at, end: close < 0 ? lower.length : close + 1 };
}
/**
 * Split a single HTML page into the editor's three panes. Inline <style> and classic/module
 * <script> blocks move to CSS and JS; the markup becomes HTML. Anything the sandboxed preview
 * would block (external scripts, stylesheets, remote images) is reported, not fetched.
 *
 * This is a linear scanner, not a regex rewrite: it never re-scans its own output, so nested
 * tricks like `<scr<script>ipt>` cannot reassemble into a tag. Its result only fills the editor,
 * which the author reviews, and the preview still runs in the sandboxed, CSP-locked iframe.
 */
export function splitHtmlDocument(text: string): {
  source: SampleSource;
  warnings: string[];
} {
  const warnings: string[] = [];
  const css: string[] = [];
  const js: string[] = [];
  const lower = asciiLower(text);
  let html = "";
  let i = 0;
  while (i < text.length) {
    const lt = text.indexOf("<", i);
    if (lt < 0) {
      html += text.slice(i);
      break;
    }
    html += text.slice(i, lt);
    if (text.startsWith("<!--", lt)) {
      const close = text.indexOf("-->", lt + 4);
      i = close < 0 ? text.length : close + 3;
      continue;
    }
    if (text[lt + 1] === "!" || text[lt + 1] === "?") {
      const close = text.indexOf(">", lt);
      i = close < 0 ? text.length : close + 1;
      continue;
    }
    const tag = readTag(text, lt);
    if (!tag) {
      html += "<";
      i = lt + 1;
      continue;
    }
    i = tag.end;
    if (WRAPPERS.has(tag.name) || DROPPED.has(tag.name)) continue;
    if (tag.closing) {
      html += text.slice(lt, tag.end);
      continue;
    }
    if (tag.name === "title") {
      i = findClose(lower, "title", tag.end).end;
    } else if (tag.name === "link") {
      if (/\brel\s*=\s*["']?stylesheet/i.test(tag.attributes))
        warnings.push("Linked stylesheets are blocked in community previews; paste them into the CSS tab.");
    } else if (tag.name === "style") {
      const close = findClose(lower, "style", tag.end);
      const body = text.slice(tag.end, close.start).trim();
      if (body) css.push(body);
      i = close.end;
    } else if (tag.name === "script") {
      const close = findClose(lower, "script", tag.end);
      const body = text.slice(tag.end, close.start);
      const type = /\btype\s*=\s*["']?([^"'\s>]*)/i.exec(tag.attributes)?.[1] ?? "";
      if (/\bsrc\s*=/i.test(tag.attributes)) {
        warnings.push("External scripts are blocked in community previews; inline them to keep them.");
      } else if (JS_TYPE.test(type)) {
        if (body.trim()) js.push(body.trim());
      } else html += text.slice(lt, close.end); // JSON or template data stays in the markup
      i = close.end;
    } else {
      html += text.slice(lt, tag.end);
      if (
        tag.name === "img" &&
        /\bsrc\s*=\s*["']?(?:https?:)?\/\//i.test(tag.attributes)
      )
        warnings.push("Remote images are blocked in community previews; use data: URLs or remove them.");
    }
  }
  return {
    source: { html: html.trim(), css: css.join("\n\n"), js: js.join("\n\n") },
    warnings: [...new Set(warnings)],
  };
}
/** Largest text file the importer reads; matches the per-file source limit. */
export const IMPORT_TEXT_LIMIT = COMMUNITY_LIMITS.fileBytes;

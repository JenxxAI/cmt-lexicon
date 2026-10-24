import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { transformSync } from "esbuild";
import { DEFAULT_PALETTE } from "../src/components/playground/color";
import { generateCode, OUTPUT_IDS } from "../src/components/playground/generators";
import { customizePrompts, describeSettings, resolveOutput } from "../src/components/playground/output";
import { defaultsFor, type Control } from "../src/components/playground/types";
import { estimateTokens } from "../src/lib/tokens";

// Sample modules contain render functions; no rendering or DOM is needed here.
const load = createRequire(`${process.cwd()}/package.json`);
load.extensions[".css"] = module => { module.exports = {}; };
const { SAMPLES } = load("./src/components/playground/samples") as typeof import("../src/components/playground/samples");
const alternative = (c: Control) => c.type === "toggle" ? !c.default : c.type === "choice" ? c.options.find(o => o.value !== c.default)!.value : c.type === "range" ? c.default === c.max ? c.min : c.max : '<Save "now"> & {later}';
let checks = 0;
function parse(code: { html: string; react: string }) {
  transformSync(code.react, { loader: "jsx", target: "es2022" });
  const stack: string[] = [];
  const html = code.html.replace(/<(script|style)>[\s\S]*?<\/\1>/g, "");
  for (const match of html.matchAll(/<(\/?)([a-z][\w-]*)\b[^>]*>/gi)) {
    if (match[1]) assert.equal(stack.pop(), match[2], `Unbalanced HTML: ${match[0]}`);
    else if (!["input", "br", "img", "hr", "meta", "link"].includes(match[2])) stack.push(match[2]);
  }
  assert.equal(stack.length, 0);
  const script = code.html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if (script) new Function(script);
  assert(!/bg-(ink|accent|surface)|var\(--cx/.test(code.html + code.react));
  checks++;
}
for (const id of OUTPUT_IDS) {
  const controls = SAMPLES[id].controls;
  const defaults = defaultsFor(controls);
  const entry = JSON.parse(readFileSync(`content/components/${id}.json`, "utf8"));
  const baseline = describeSettings(controls, defaults, DEFAULT_PALETTE);
  assert.equal(baseline.count, 0);
  assert.deepEqual(customizePrompts(entry.prompts, baseline.phrases), entry.prompts);
  const tabs = Object.entries(entry.snippets).map(([id, lines]) => ({ id: id === "reactTailwind" ? "react" : id, label: id, code: (lines as string[]).join("\n") }));
  const resolved = resolveOutput(id, controls, defaults, DEFAULT_PALETTE, entry.prompts, tabs);
  assert.strictEqual(resolved.prompts, entry.prompts);
  assert.strictEqual(resolved.tabs, tabs);
  const defaultCode = generateCode(id, defaults, DEFAULT_PALETTE);
  parse(defaultCode);
  for (const control of controls) {
    const values = { ...defaults, [control.key]: alternative(control) };
    const description = describeSettings(controls, values, DEFAULT_PALETTE);
    assert.equal(description.count, 1, `${id}/${control.key}`);
    assert(description.phrases[0].includes(control.label));
    const prompts = customizePrompts(entry.prompts, description.phrases);
    assert.notEqual(prompts.detailed, entry.prompts.detailed);
    assert(estimateTokens(prompts.short) < 40);
    const current = resolveOutput(id, controls, values, DEFAULT_PALETTE, entry.prompts, tabs);
    assert(current.tabs.some(tab => tab.id === "html"));
    assert(current.tabs.some(tab => tab.id === "react"));
    assert.equal(current.tabs.find(tab => tab.id === "vue")?.code, tabs.find(tab => tab.id === "vue")?.code);
    const code = generateCode(id, values, DEFAULT_PALETTE);
    assert.notEqual(code.html, defaultCode.html, `${id}/${control.key} HTML unchanged`);
    assert.notEqual(code.react, defaultCode.react, `${id}/${control.key} React unchanged`);
    parse(code);
  }
  const worst = Object.fromEntries(controls.map(c => [c.key, c.key === "color" ? "custom" : alternative(c)]));
  const description = describeSettings(controls, worst, DEFAULT_PALETTE);
  assert(estimateTokens(customizePrompts(entry.prompts, description.phrases).short) < 40);
  parse(generateCode(id, worst, DEFAULT_PALETTE));
  if ("color" in defaults) {
    const values = { ...defaults, color: "custom" };
    const description = describeSettings(controls, values, DEFAULT_PALETTE);
    assert(description.phrases.join().includes("linear-gradient(135deg, #ff9a3c, #ff6b8a)"));
    assert(description.phrases.join().includes("text #"));
    assert.notDeepEqual(generateCode(id, values, DEFAULT_PALETTE), generateCode(id, values, { ...DEFAULT_PALETTE, c1: "#123456", angle: 90 }));
  }
}
console.log(`Generator checks passed: ${OUTPUT_IDS.length} components, ${checks} parsed examples.`);

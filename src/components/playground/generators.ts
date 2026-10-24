/** Standalone examples. The small element tree renders both HTML and JSX without parsing user text. */
import { cssFill, pickOn, textOnLight, type Palette } from "./color";
import type { Values } from "./types";

type Attrs = Record<string, string | number | boolean>;
type Element = { tag: string; attrs: Attrs; children: (Element | string)[] };
const el = (tag: string, attrs: Attrs = {}, ...children: (Element | string)[]): Element => ({ tag, attrs, children });
const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const voidTags = new Set(["input", "br"]);
function render(node: Element | string, jsx: boolean): string {
  if (typeof node === "string") return jsx ? `{${JSON.stringify(node)}}` : escape(node);
  const attrs = Object.entries(node.attrs).map(([key, value]) => {
    if (value === false) return "";
    const name = jsx ? ({ class: "className", for: "htmlFor", tabindex: "tabIndex", checked: "defaultChecked", value: "defaultValue" }[key] ?? key) : key;
    if (value === true) return ` ${name}`;
    if (jsx && key === "style") {
      const style = Object.fromEntries(String(value).split(";").filter(Boolean).map(part => {
        const colon = part.indexOf(":");
        return [part.slice(0, colon).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()), part.slice(colon + 1)];
      }));
      return ` style={${JSON.stringify(style)}}`;
    }
    if (jsx && String(value).includes("__ID__")) return ` ${name}={id + ${JSON.stringify(String(value).replace("__ID__", ""))}}`;
    return jsx ? ` ${name}={${JSON.stringify(value)}}` : ` ${name}="${escape(String(value).replaceAll("__ID__", "ui-example"))}"`;
  }).join("");
  return `<${node.tag}${attrs}${voidTags.has(node.tag) ? jsx ? " />" : ">" : `>${node.children.map(c => render(c, jsx)).join("")}</${node.tag}>`}`;
}
export const OUTPUT_IDS = ["button", "badge", "alert", "toggle-switch", "checkbox", "radio", "tabs", "accordion", "tooltip", "progress-bar", "slider", "spinner", "avatar", "pagination"] as const;
export const supportsOutput = (id: string) => (OUTPUT_IDS as readonly string[]).includes(id);
const colors: Record<string, string> = { ink: "#171717", orange: "#9a3412", blue: "#1d4ed8", green: "#15803d", red: "#b91c1c" };
const radii: Record<string, string> = { sharp: "0", soft: "8px", round: "16px", pill: "999px" };
const baseCSS = `.example{font-family:system-ui,sans-serif;color:#171717;max-width:100%;overflow-wrap:anywhere}.example *{box-sizing:border-box}.example [hidden]{display:none!important}.example button,.example summary,.example label{min-height:44px}.example button{cursor:pointer;font:inherit;padding:10px 16px}.example button:disabled{cursor:not-allowed;opacity:.5}.example :focus-visible{outline:3px solid #1d4ed8;outline-offset:3px}.example label{display:flex;align-items:center;gap:10px}.example .row{display:flex;flex-wrap:wrap;align-items:center;gap:8px}.example .sr-only{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.example [aria-current=page]{font-weight:bold;text-decoration:underline}.example [role=tab][aria-selected=true]{font-weight:bold;text-decoration:underline}.example .spin{animation:ui-spin linear infinite}.example .pulse{animation:ui-pulse ease-in-out infinite alternate}@keyframes ui-spin{to{transform:rotate(360deg)}}@keyframes ui-pulse{to{opacity:.25}}@media(prefers-reduced-motion:reduce){.example .spin,.example .pulse{animation:none}}`;

export function generateCode(id: string, v: Values, palette: Palette): { html: string; react: string } {
  if (!supportsOutput(id)) throw new Error(`No generator for ${id}`);
  const custom = v.color === "custom";
  const fill = custom ? cssFill(palette) : colors[String(v.color)] ?? colors.ink;
  const foreground = custom ? pickOn(palette).on : "#ffffff";
  const accent = custom ? textOnLight(palette.c1) : fill;
  const radius = radii[String(v.radius)] ?? (v.shape === "square" ? "0" : "999px");
  const size = v.size === "sm" ? 14 : v.size === "lg" ? 20 : 16;
  const solid = `background:${fill};color:${foreground};border:1px solid transparent;border-radius:${radius};font-size:${size}px`;
  const variant = v.variant === "outline" ? `background:white;color:${accent};border:1px solid ${accent}` : v.variant === "text" ? `background:transparent;color:${accent};border:0` : v.variant === "soft" ? `background:#f5f5f5;color:${accent};border:1px solid transparent` : "";
  const gradientClass = custom ? palette.mode === "gradient" ? `bg-[${cssFill(palette).replaceAll(" ", "")}]` : `bg-[${palette.c1}]` : "";
  const paint = { style: `${solid};${variant}`, class: `min-h-11 rounded-lg px-4 ${gradientClass}` };
  const button = (text: string, attrs: Attrs = {}) => el("button", { type: "button", ...paint, ...attrs }, text);
  let tree: Element;
  let behavior = "";
  let css = baseCSS;
  switch (id) {
    case "button":
      tree = button(String(v.label) || "Save changes", { disabled: Boolean(v.disabled || v.loading), "aria-busy": String(Boolean(v.loading)) });
      if (v.loading) tree.children.unshift(el("span", { "aria-hidden": "true" }, "Loading… "));
      break;
    case "badge":
      tree = el("span", { ...paint, class: `row ${gradientClass}` }, ...(v.dot ? [el("span", { "aria-hidden": "true" }, "●")] : []), String(v.label) || "New", ...(v.removable ? [button("×", { "aria-label": `Remove ${v.label || "badge"}`, "data-dismiss": true })] : []));
      behavior = `on(root, 'click', e => { if (e.target.closest('[data-dismiss]')) root.hidden = true; });`;
      break;
    case "alert": {
      const messages: Record<string, [string, string, string]> = { info: ["Information", "Your changes are saved locally.", "#1d4ed8"], success: ["Success", "Your changes have been saved.", "#15803d"], warning: ["Warning", "Review your changes before continuing.", "#9a3412"], error: ["Error", "Your changes could not be saved. Try again.", "#b91c1c"] };
      const [title, message, color] = messages[String(v.type)];
      tree = el("div", { role: v.type === "error" ? "alert" : "status", style: `padding:16px;border:1px solid ${color};border-radius:${radius};color:${color};background:white` }, ...(v.title ? [el("strong", {}, title)] : []), el("p", {}, message), ...(v.dismissible ? [button("Dismiss", { "data-dismiss": true })] : []));
      behavior = `on(root, 'click', e => { if (e.target.closest('[data-dismiss]')) root.hidden = true; });`;
      break;
    }
    case "toggle-switch":
      tree = el("label", {}, el("input", { type: "checkbox", role: "switch", disabled: Boolean(v.disabled), style: `appearance:none;width:${size * 3}px;height:${size * 1.5}px;border:2px solid ${accent};border-radius:${v.shape === "square" ? "0" : "999px"}`, class: "switch" }), String(v.label) || "Notifications");
      css += `.example .switch{background:#e5e5e5;position:relative;cursor:pointer}.example .switch:before{content:'';position:absolute;top:2px;left:2px;width:${size}px;height:${size}px;background:#171717;border-radius:${v.shape === "square" ? "0" : "999px"}}.example .switch:checked{background:${fill}}.example .switch:checked:before{left:auto;right:2px;background:${foreground}}`;
      break;
    case "checkbox":
    case "radio": {
      const radio = id === "radio";
      const input = (label: string, i: number, parent = false) => el("label", {}, el("input", { type: radio ? "radio" : "checkbox", name: radio ? "__ID__-plan" : `option-${i}`, value: label, "data-parent": parent, "data-option": !parent, disabled: Boolean(v.disabled || (v.lockLast && i === 2)), style: `width:${size + 4}px;height:${size + 4}px;accent-color:${accent}`, checked: radio && i === 0 }), label);
      tree = el("fieldset", { style: "border:0;padding:0;margin:0" }, el("legend", {}, radio ? "Choose a plan" : "Notifications"), ...(v.parent ? [input("Select all", -1, true)] : []), el("div", { class: radio && v.layout === "inline" ? "row" : "" }, ...["Basic", "Standard", "Premium"].map((label, i) => input(label, i))));
      if (!radio && v.parent) behavior = `const parent = root.querySelector('[data-parent]'); const options = [...root.querySelectorAll('[data-option]')]; on(root, 'change', e => { if (e.target === parent) options.forEach(input => input.checked = parent.checked); const count = options.filter(input => input.checked).length; parent.checked = count === options.length; parent.indeterminate = count > 0 && count < options.length; });`;
      break;
    }
    case "slider":
      tree = el("label", {}, "Volume", el("input", { type: "range", min: 0, max: Number(v.max), step: Number(v.step), value: Math.min(40, Number(v.max)), disabled: Boolean(v.disabled), style: `min-height:44px;width:100%;accent-color:${accent}` }), ...(v.showValue ? [el("output", { "aria-live": "off" }, String(Math.min(40, Number(v.max))))] : []));
      behavior = `on(root, 'input', e => { const output = root.querySelector('output'); if (output) output.value = e.target.value; });`;
      break;
    case "progress-bar":
      tree = el("div", {}, el("p", {}, "Uploading photos", ...(v.showPercent ? [`: ${v.value}%`] : [])), el("div", { role: "progressbar", "aria-label": "Uploading photos", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": Number(v.value), style: `background:#e5e5e5;overflow:hidden;border-radius:${radius};height:${v.size === "sm" ? 8 : v.size === "lg" ? 20 : 12}px` }, el("div", { class: gradientClass, style: `width:${v.value}%;height:100%;background:${v.striped ? "repeating-linear-gradient(45deg,transparent,transparent 8px,#ffffff55 8px,#ffffff55 16px)," : ""}${fill}` })));
      break;
    case "spinner": {
      const dimension = v.size === "sm" ? 20 : v.size === "lg" ? 52 : 32;
      const graphic = v.kind === "ring" ? el("span", { "aria-hidden": "true", class: "spin", style: `display:inline-block;width:${dimension}px;height:${dimension}px;border:3px solid #d4d4d4;border-top-color:${accent};border-radius:50%;animation-duration:${v.speed}s` }) : el("span", { "aria-hidden": "true", class: "row" }, ...Array.from({ length: v.kind === "dots" ? 3 : 4 }, (_, i) => el("span", { class: "pulse", style: `display:inline-block;background:${fill};width:${dimension / 4}px;height:${v.kind === "dots" ? dimension / 4 : dimension}px;border-radius:${v.kind === "dots" ? "50%" : "2px"};animation-duration:${v.speed}s;animation-delay:${i * .12}s` })));
      tree = el("div", { role: "status", class: "row" }, graphic, el("span", { class: v.label ? "" : "sr-only" }, "Loading…"));
      break;
    }
    case "avatar": {
      const dimension = ({ sm: 40, md: 56, lg: 80, xl: 112 } as Record<string, number>)[String(v.size)];
      const avatar = (name: string) => el("span", { role: "img", "aria-label": `${name}${v.status === "none" ? "" : `, ${v.status}`}`, style: `display:inline-grid;place-items:center;position:relative;width:${dimension}px;height:${dimension}px;background:${fill};color:${foreground};border-radius:${v.shape === "circle" ? "50%" : v.shape === "rounded" ? "16px" : "4px"}`, class: gradientClass }, name.trim().split(/\s+/).slice(0, 2).map(word => word[0] ?? "").join("").toUpperCase() || "?", ...(v.status !== "none" ? [el("span", { "aria-hidden": "true", style: `position:absolute;bottom:0;right:0;border:2px solid white;border-radius:50%;width:16px;height:16px;background:${({ online: "#15803d", away: "#a16207", busy: "#b91c1c" } as Record<string, string>)[String(v.status)]}` })] : []));
      tree = el("div", { class: "row" }, ...[String(v.name) || "Unknown user", ...(v.group ? ["Ana Reyes", "Ben Cruz", "Cathy Lim"] : [])].map(avatar));
      break;
    }
    case "accordion":
      tree = el("div", {}, ...Array.from({ length: Number(v.count) }, (_, i) => el("details", { ...(v.mode === "single" ? { name: "__ID__-sections" } : {}), open: i === 0, style: v.style === "cards" ? "background:#f5f5f5;border-radius:16px;padding:12px;margin:8px 0" : "border-bottom:1px solid #d4d4d4;padding:12px 0" }, el("summary", {}, el("span", { class: "indicator", "aria-hidden": "true" }), `Section ${i + 1}`), el("p", {}, `Content for section ${i + 1}.`))));
      css += `.example summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:8px}.example summary::-webkit-details-marker{display:none}.example .indicator:before{content:'${v.icon === "plus" ? "+" : "›"}'}.example details[open] .indicator:before{content:'${v.icon === "plus" ? "−" : "⌄"}'}`;
      break;
    case "tabs": {
      const names = ["Overview", "Details", "Reviews", "Shipping", "Support"].slice(0, Number(v.count));
      css += `.example [role=tab][aria-selected=true]{${v.style === "underline" ? `border-bottom-color:${accent}!important` : `background:${fill}!important;color:${foreground}!important`}}`;
      tree = el("div", {}, el("div", { role: "tablist", "aria-label": "Product information", class: "row", style: v.fill ? "width:100%" : "width:fit-content" }, ...names.map((name, i) => button(name, { role: "tab", id: `__ID__-tab-${i}`, "aria-controls": `__ID__-panel-${i}`, "aria-selected": String(i === 0), tabindex: i === 0 ? 0 : -1, style: `color:${accent};background:${v.style === "boxed" ? "#f5f5f5" : "white"};border:${v.style === "underline" ? "0;border-bottom:2px solid transparent" : "1px solid currentColor"};border-radius:${v.style === "pill" ? "999px" : "0"};${v.fill ? "flex:1" : ""}` }))), ...names.map((name, i) => el("div", { role: "tabpanel", id: `__ID__-panel-${i}`, "aria-labelledby": `__ID__-tab-${i}`, tabindex: 0, hidden: i !== 0 }, el("p", {}, `${name} content.`))));
      behavior = `const tabs = [...root.querySelectorAll('[role=tab]')]; const panels = [...root.querySelectorAll('[role=tabpanel]')]; function select(index) { tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; panels[i].hidden = i !== index; }); } tabs.forEach((tab, i) => { on(tab, 'click', () => select(i)); on(tab, 'keydown', e => { const next = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1; if (next >= 0) { e.preventDefault(); select(next); tabs[next].focus(); } }); });`;
      break;
    }
    case "tooltip": {
      const positions: Record<string, string> = { top: "bottom:100%;left:0", bottom: "top:100%;left:0", left: "right:100%;top:0", right: "left:100%;top:0" };
      tree = el("div", { style: "position:relative;display:inline-block;margin:64px;max-width:calc(100% - 128px)" }, button("Save", { "aria-describedby": "__ID__-tip" }), el("span", { id: "__ID__-tip", role: "tooltip", hidden: true, style: `position:absolute;${positions[String(v.placement)]};padding:8px;border:1px solid #525252;border-radius:6px;min-width:100px;max-width:160px;background:${v.theme === "dark" ? "#171717;color:white" : "white;color:#171717"}` }, String(v.text) || "Saves your work", ...(v.arrow ? [el("span", { "aria-hidden": "true", style: "display:block;font-size:10px" }, "◆")] : [])));
      behavior = `const tip = root.querySelector('[role=tooltip]'); const trigger = root.querySelector('button'); const wrap = trigger.parentElement; let timer; const hide = () => { clearTimeout(timer); tip.hidden = true; }; const show = () => { clearTimeout(timer); timer = setTimeout(() => tip.hidden = false, ${Number(v.delay)}); }; on(wrap, 'mouseenter', show); on(wrap, 'mouseleave', hide); on(trigger, 'focus', show); on(trigger, 'blur', hide); on(root, 'keydown', e => { if (e.key === 'Escape') hide(); }); cleanups.push(() => clearTimeout(timer));`;
      break;
    }
    case "pagination":
      tree = el("nav", { "aria-label": "Search results pages" }, el("div", { class: "row", "data-pages": true }), el("p", { "aria-live": "polite", "data-status": true }, `Page 1 of ${v.pages}`));
      behavior = `let current = 1; const total = ${Number(v.pages)}; const siblings = ${Number(v.siblings)}; const list = root.querySelector('[data-pages]'); function draw() { list.replaceChildren(); function add(label, page, disabled = false) { const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.disabled = disabled; button.style.cssText = ${JSON.stringify(`border:${v.style === "outline" ? "1px solid #737373" : "0"};border-radius:${radius};background:white;color:${accent}`)}; button.dataset.page = String(page); button.setAttribute('aria-label', /^\\d+$/.test(label) ? 'Page ' + label : label); if (page === current && /^\\d+$/.test(label)) button.setAttribute('aria-current', 'page'); list.append(button); } ${v.arrows ? "add('Previous', current - 1, current === 1);" : ""} let last = 0; for (let i = 1; i <= total; i++) { if (i !== 1 && i !== total && Math.abs(i - current) > siblings) continue; if (i - last > 1) { const gap = document.createElement('span'); gap.textContent = '…'; gap.setAttribute('aria-hidden', 'true'); list.append(gap); } add(String(i), i); last = i; } ${v.arrows ? "add('Next', current + 1, current === total);" : ""} root.querySelector('[data-status]').textContent = 'Page ' + current + ' of ' + total; } on(list, 'click', e => { const button = e.target.closest('button'); if (!button || button.disabled) return; current = Number(button.dataset.page); draw(); list.querySelector('[aria-current=page]').focus(); }); draw();`;
      break;
    default: throw new Error(id);
  }
  const markup = render(tree, false);
  if (id !== "spinner") css = css.replace(/\.example \.spin\{[^}]*\}|\.example \.pulse\{[^}]*\}|@keyframes ui-(?:spin|pulse)\{[^}]*\}\}|@media\(prefers-reduced-motion:reduce\)\{[^}]*\}\}/g, "");
  if (id !== "tabs") css = css.replace(/\.example \[role=tab\]\[aria-selected=true\]\{[^}]*\}/g, "");
  if (id !== "pagination") css = css.replace(/\.example \[aria-current=page\]\{[^}]*\}/g, "");
  if (!markup.includes('class="sr-only"')) css = css.replace(/\.example \.sr-only\{[^}]*\}/g, "");
  css = css.replaceAll("}", "}\n").trim();
  const setup = `const controller = new AbortController();\nconst cleanups = [];\nconst on = (node, event, handler) => node.addEventListener(event, handler, { signal: controller.signal });\n${behavior}`;
  const html = `<style>\n${css}\n</style>\n<div id="ui-example" class="example">\n${markup}\n</div>${behavior ? `\n<script>\n(() => {\nconst root = document.getElementById('ui-example');\n${setup}\n})();\n</script>` : ""}`;
  const react = `"use client";\nimport { useId${behavior ? ", useEffect, useRef" : ""} } from "react";\n\nexport default function Example() {\n  const id = useId();${behavior ? `\n  const ref = useRef(null);\n  useEffect(() => {\n    const root = ref.current;\n    ${setup}\n    return () => { controller.abort(); cleanups.forEach(cleanup => cleanup()); };\n  }, []);` : ""}\n  return (\n    <div className="example"${behavior ? " ref={ref}" : ""}>\n      <style>{${JSON.stringify(css)}}</style>\n      ${render(tree, true)}\n    </div>\n  );\n}`;
  return { html, react };
}

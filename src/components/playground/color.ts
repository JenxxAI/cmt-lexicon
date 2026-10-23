/** Pure color helpers for the Colors panel. No DOM access. */

export type Palette = { mode: "solid" | "gradient"; c1: string; c2: string; angle: number; all: boolean };

export const DEFAULT_PALETTE: Palette = { mode: "gradient", c1: "#ff9a3c", c2: "#ff6b8a", angle: 135, all: false };

/** Every preset passes 4.5:1 with its automatic text color (checked in dev). */
export const PRESETS: { name: string; c1: string; c2: string; angle: number }[] = [
  { name: "Sunset", c1: "#ff9a3c", c2: "#ff6b8a", angle: 135 },
  { name: "Keeby", c1: "#f28c28", c2: "#ffc58a", angle: 135 },
  { name: "Ocean", c1: "#38bdf8", c2: "#818cf8", angle: 135 },
  { name: "Mint", c1: "#34d399", c2: "#a3e635", angle: 135 },
  { name: "Peach", c1: "#fdba74", c2: "#fda4af", angle: 135 },
  { name: "Berry", c1: "#7c3aed", c2: "#be185d", angle: 135 },
  { name: "Forest", c1: "#15803d", c2: "#0f766e", angle: 135 },
  { name: "Night", c1: "#111111", c2: "#3a3a3c", angle: 135 },
];

const INK = "#111111";
const WHITE = "#ffffff";
/** The darkest surface our samples sit on; text on a tint must pass here. */
const STAGE = "#ededed";

export function normalizeHex(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let s = input.trim().toLowerCase();
  if (!s.startsWith("#")) s = `#${s}`;
  if (/^#[0-9a-f]{3}$/.test(s)) s = `#${[...s.slice(1)].map((c) => c + c).join("")}`;
  return /^#[0-9a-f]{6}$/.test(s) ? s : null;
}

const rgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function toHsl(hex: string): [number, number, number] {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}

export function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${[f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("")}`;
}

const stops = (p: Palette) => (p.mode === "solid" ? [p.c1] : [p.c1, p.c2]);

/** Best text color for the fill and the worst-case contrast across its stops. */
export function pickOn(p: Palette): { on: string; ratio: number } {
  const score = (text: string) => Math.min(...stops(p).map((c) => contrast(text, c)));
  const white = score(WHITE);
  const ink = score(INK);
  return white >= ink ? { on: WHITE, ratio: white } : { on: INK, ratio: ink };
}

/** Nudge lightness until the automatic text color reaches 4.5:1. */
export function fixContrast(p: Palette): Palette {
  let next = { ...p };
  for (let i = 0; i < 40 && pickOn(next).ratio < 4.5; i++) {
    const darken = pickOn(next).on === WHITE;
    const move = (hex: string) => {
      const [h, s, l] = toHsl(hex);
      return hslToHex(h, s, Math.max(0, Math.min(100, l + (darken ? -2 : 2))));
    };
    next = { ...next, c1: move(next.c1), c2: move(next.c2) };
  }
  return next;
}

/** Darken a color until it is readable as text on our lightest-to-grayest surfaces. */
export function textOnLight(hex: string): string {
  let [h, s, l] = toHsl(hex);
  let out = hex;
  for (let i = 0; i < 60 && contrast(out, STAGE) < 4.6; i++) {
    l = Math.max(0, l - 2);
    out = hslToHex(h, s, l);
  }
  return out;
}

export function cssFill(p: Palette): string {
  return p.mode === "solid" ? p.c1 : `linear-gradient(${Math.round(p.angle)}deg, ${p.c1}, ${p.c2})`;
}

export function cssVars(p: Palette): Record<string, string> {
  return {
    "--cx-fill": cssFill(p),
    "--cx-on": pickOn(p).on,
    "--cx-text": textOnLight(p.c1),
    "--cx-soft": `color-mix(in srgb, ${p.c1} 14%, white)`,
    "--cx-css": p.c1,
  };
}

export function randomPalette(keepAll: boolean, rand: () => number = Math.random): Palette {
  const hue = rand() * 360;
  const dark = rand() < 0.4;
  const c1 = hslToHex(hue, 72 + rand() * 18, dark ? 34 + rand() * 8 : 62 + rand() * 10);
  const c2 = hslToHex((hue + 30 + rand() * 60) % 360, 72 + rand() * 18, dark ? 30 + rand() * 8 : 58 + rand() * 10);
  return fixContrast({ mode: "gradient", c1, c2, angle: Math.round(rand() * 8) * 45, all: keepAll });
}

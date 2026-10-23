import type { Control } from "./types";

export type Tone = "ink" | "orange" | "blue" | "green" | "red" | "custom";

/**
 * Static class strings so Tailwind can see them.
 * `fill` is for graphical parts (switch, progress) and stays at 3:1 or better; bright orange is fills-on-text only.
 */
export const TONES: Record<Tone, { solid: string; soft: string; outline: string; text: string; fill: string; css: string; grad: string }> = {
  ink: { solid: "bg-ink text-white", soft: "bg-line text-ink", outline: "border-ink text-ink", text: "text-ink", fill: "bg-ink", css: "var(--color-ink)", grad: "bg-gradient-to-br from-ink to-body text-white" },
  orange: { solid: "bg-accent text-ink", soft: "bg-accent-soft text-accent-deep", outline: "border-accent-deep text-accent-deep", text: "text-accent-deep", fill: "bg-accent-deep", css: "var(--color-accent-deep)", grad: "bg-gradient-to-br from-accent to-hi text-ink" },
  blue: { solid: "bg-blue text-white", soft: "bg-blue-soft text-blue", outline: "border-blue text-blue", text: "text-blue", fill: "bg-blue", css: "var(--color-blue)", grad: "bg-gradient-to-br from-blue to-ink text-white" },
  green: { solid: "bg-green text-white", soft: "bg-green-soft text-green", outline: "border-green text-green", text: "text-green", fill: "bg-green", css: "var(--color-green)", grad: "bg-gradient-to-br from-green to-ink text-white" },
  red: { solid: "bg-red text-white", soft: "bg-red-soft text-red", outline: "border-red text-red", text: "text-red", fill: "bg-red", css: "var(--color-red)", grad: "bg-gradient-to-br from-red to-ink text-white" },
  // Driven by CSS variables the Playground sets from the saved palette (see color.ts cssVars).
  custom: {
    solid: "[background:var(--cx-fill)] text-[color:var(--cx-on)]",
    soft: "bg-[color:var(--cx-soft)] text-[color:var(--cx-text)]",
    outline: "border-[color:var(--cx-text)] text-[color:var(--cx-text)]",
    text: "text-[color:var(--cx-text)]",
    fill: "[background:var(--cx-fill)]",
    css: "var(--cx-css)",
    grad: "[background:var(--cx-fill)] text-[color:var(--cx-on)]",
  },
};

export const tone = (value: string): (typeof TONES)[Tone] => TONES[value as Tone] ?? TONES.ink;

export const RADIUS: Record<string, string> = {
  sharp: "rounded-none",
  soft: "rounded-lg",
  round: "rounded-2xl",
  pill: "rounded-full",
};

export const colorControl = (fallback: Tone = "ink", key = "color"): Control => ({
  type: "choice",
  key,
  label: "Color",
  default: fallback,
  options: [
    { value: "ink", label: "Ink" },
    { value: "orange", label: "Orange" },
    { value: "blue", label: "Blue" },
    { value: "green", label: "Green" },
    { value: "red", label: "Red" },
    { value: "custom", label: "Custom" },
  ],
});

export const radiusControl = (fallback = "pill", key = "radius"): Control => ({
  type: "choice",
  key,
  label: "Corners",
  default: fallback,
  options: [
    { value: "sharp", label: "Sharp" },
    { value: "soft", label: "Soft" },
    { value: "round", label: "Round" },
    { value: "pill", label: "Pill" },
  ],
});

export const sizeControl = (fallback = "md", key = "size"): Control => ({
  type: "choice",
  key,
  label: "Size",
  default: fallback,
  options: [
    { value: "sm", label: "Small" },
    { value: "md", label: "Medium" },
    { value: "lg", label: "Large" },
  ],
});

/** Corner radius for boxes (cards, panels). `radiusControl` is for pill-capable controls like buttons. */
export const BOX_RADIUS: Record<string, string> = {
  sharp: "rounded-none",
  soft: "rounded-lg",
  round: "rounded-2xl",
  xl: "rounded-[28px]",
};

export const boxRadiusControl = (fallback = "round", key = "radius"): Control => ({
  type: "choice",
  key,
  label: "Corners",
  default: fallback,
  options: [
    { value: "sharp", label: "Sharp" },
    { value: "soft", label: "Soft" },
    { value: "round", label: "Round" },
    { value: "xl", label: "Extra round" },
  ],
});

import type { Control } from "./types";

export type Tone = "ink" | "orange" | "blue" | "green" | "red";

/**
 * Static class strings so Tailwind can see them.
 * `fill` is for graphical parts (switch, progress) and stays at 3:1 or better; bright orange is fills-on-text only.
 */
export const TONES: Record<Tone, { solid: string; soft: string; outline: string; text: string; fill: string; css: string }> = {
  ink: { solid: "bg-ink text-white", soft: "bg-line text-ink", outline: "border-ink text-ink", text: "text-ink", fill: "bg-ink", css: "var(--color-ink)" },
  orange: { solid: "bg-accent text-ink", soft: "bg-accent-soft text-accent-deep", outline: "border-accent-deep text-accent-deep", text: "text-accent-deep", fill: "bg-accent-deep", css: "var(--color-accent-deep)" },
  blue: { solid: "bg-blue text-white", soft: "bg-blue-soft text-blue", outline: "border-blue text-blue", text: "text-blue", fill: "bg-blue", css: "var(--color-blue)" },
  green: { solid: "bg-green text-white", soft: "bg-green-soft text-green", outline: "border-green text-green", text: "text-green", fill: "bg-green", css: "var(--color-green)" },
  red: { solid: "bg-red text-white", soft: "bg-red-soft text-red", outline: "border-red text-red", text: "text-red", fill: "bg-red", css: "var(--color-red)" },
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

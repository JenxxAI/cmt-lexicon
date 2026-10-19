/** Server-safe list of components that have an interactive playground. Keep in sync with samples.tsx (it is type-checked there). */
export const SAMPLE_IDS = [
  "button",
  "badge",
  "alert",
  "toggle-switch",
  "checkbox",
  "radio",
  "tabs",
  "accordion",
  "tooltip",
  "progress-bar",
  "slider",
  "spinner",
  "avatar",
  "pagination",
] as const;

export type SampleId = (typeof SAMPLE_IDS)[number];

export function hasSample(id: string): id is SampleId {
  return (SAMPLE_IDS as readonly string[]).includes(id);
}

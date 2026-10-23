/** Server-safe list of components that have an interactive playground (every component). Keep in sync with samples.tsx (it is type-checked there). */
export const SAMPLE_IDS = [
  "accordion",
  "alert",
  "avatar",
  "badge",
  "bento-grid",
  "bottom-sheet",
  "breadcrumb",
  "button",
  "card",
  "carousel",
  "checkbox",
  "command-palette",
  "data-table",
  "date-picker",
  "drawer",
  "dropdown-menu",
  "empty-state",
  "file-upload",
  "footer",
  "hamburger-icon",
  "hero-section",
  "kebab-menu",
  "modal",
  "navbar",
  "pagination",
  "popover",
  "progress-bar",
  "radio",
  "select",
  "sidebar",
  "skeleton-loader",
  "slider",
  "spinner",
  "stepper",
  "sticky-header",
  "tabs",
  "text-input",
  "toast",
  "toggle-switch",
  "tooltip",
] as const;

export type SampleId = (typeof SAMPLE_IDS)[number];

export function hasSample(id: string): id is SampleId {
  return (SAMPLE_IDS as readonly string[]).includes(id);
}

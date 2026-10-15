/** Category ids (used in content JSON) and their display labels, in display order. */
export const CATEGORIES = {
  navigation: "Navigation",
  overlay: "Overlays",
  input: "Inputs",
  feedback: "Feedback",
  layout: "Layout",
  "icons-assets": "Icons & assets",
} as const;

export type CategoryId = keyof typeof CATEGORIES;

export const categoryIds = Object.keys(CATEGORIES) as [CategoryId, ...CategoryId[]];

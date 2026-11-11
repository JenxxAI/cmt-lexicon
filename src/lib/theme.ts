export type ThemePreference = "system" | "light" | "dark";
export const THEME_KEY = "ui-lexicon-theme";
export function themePreference(value: unknown): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}
// Runs before first paint. Keep this independent of React and external requests.
export const THEME_SCRIPT = `(function(){var preference="system";try{var saved=localStorage.getItem("${THEME_KEY}");if(saved==="light"||saved==="dark")preference=saved;}catch{}var dark=preference==="dark"||(preference==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=dark?"dark":"light";})();`;

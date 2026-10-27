import type { SampleSource } from "./sample-source";

export const COMMUNITY_LIMITS = {
  fileBytes: 100_000,
  totalBytes: 300_000,
  hourlySubmissions: 5,
  dailySubmissions: 20,
} as const;
export type CommunityKind = "component" | "website";
export type CommunityStatus = "pending" | "approved" | "rejected" | "withdrawn";
export type CommunityDraft = SampleSource & {
  title: string;
  description: string;
  kind: CommunityKind;
  tags: string[];
  licenseAccepted: boolean;
  remixOf: string | null;
};
export type CommunityProject = SampleSource & {
  id: string;
  owner_id: string;
  author: string;
  title: string;
  description: string;
  kind: CommunityKind;
  tags: string[];
  status: CommunityStatus;
  created_at: string;
  reviewed_at: string | null;
  review_note: string;
  remix_of: string | null;
  license: string;
};
export type CommunitySummary = Omit<
  CommunityProject,
  "html" | "css" | "js" | "review_note"
>;
export const SUMMARY_COLUMNS =
  "id,owner_id,author,title,description,kind,tags,status,created_at,reviewed_at,remix_of,license";
export const EMPTY_DRAFT: CommunityDraft = {
  title: "",
  description: "",
  kind: "component",
  tags: [],
  licenseAccepted: false,
  remixOf: null,
  html: '<main class="card">\n  <h1>Hello, community.</h1>\n  <p>Make something useful and share it.</p>\n  <button type="button">Say hello</button>\n  <p id="message" role="status"></p>\n</main>',
  css: "body { margin: 0; padding: 24px; font: 16px/1.5 system-ui; background: whitesmoke; color: black; }\n.card { max-width: 480px; margin: auto; padding: 24px; background: white; border-radius: 24px; }\nbutton { min-height: 44px; padding: 12px 20px; border: 0; border-radius: 24px; background: black; color: white; cursor: pointer; }\nbutton:focus-visible { outline: 3px solid royalblue; outline-offset: 3px; }",
  js: 'document.querySelector("button").addEventListener("click", () => {\n  document.getElementById("message").textContent = "Thanks for stopping by!";\n});',
};
export function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}
export function sourceError(source: SampleSource): string | null {
  for (const key of ["html", "css", "js"] as const)
    if (byteLength(source[key]) > COMMUNITY_LIMITS.fileBytes)
      return `${key.toUpperCase()} exceeds 100 KB. Reduce it before previewing, exporting, or submitting.`;
  if (
    byteLength(source.html) + byteLength(source.css) + byteLength(source.js) >
    COMMUNITY_LIMITS.totalBytes
  )
    return "Project code exceeds 300 KB.";
  return null;
}
export function draftError(draft: CommunityDraft): string | null {
  return (
    sourceError(draft) ||
    (draft.title.trim().length < 3 || draft.title.trim().length > 80
      ? "Use a title between 3 and 80 characters."
      : null) ||
    (draft.description.trim().length < 20 ||
    draft.description.trim().length > 600
      ? "Use a description between 20 and 600 characters."
      : null) ||
    (!["component", "website"].includes(draft.kind)
      ? "Choose a component or website type."
      : null) ||
    (draft.tags.length > 5 ||
    draft.tags.some((tag) => !/^[a-z0-9][a-z0-9-]{0,31}$/.test(tag))
      ? "Use up to five tags containing lowercase letters, numbers, or hyphens (32 characters each)."
      : null) ||
    (!draft.licenseAccepted
      ? "Confirm that you can share this code under the MIT license."
      : null)
  );
}
export function isProjectId(value: string | null): value is string {
  return (
    !!value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}
const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
/** Defense in depth: always use this document in a sandbox with allow-scripts only. */
export function communityDocument(
  source: SampleSource,
  title = "Community preview",
): string {
  const error = sourceError(source);
  if (error) throw new Error(error);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; worker-src 'none'; object-src 'none'"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title><style>${source.css.replace(/<\/style/gi, "<\\/style")}</style></head><body>${source.html}<script>${source.js.replace(/<\/script/gi, "<\\/script")}</script></body></html>`;
}
export function downloadCommunity(
  source: SampleSource,
  title: string,
  author?: string,
) {
  const comment = author
    ? `<!-- Shared under MIT by ${author.replaceAll("--", "").replaceAll("<", "").replaceAll(">", "")}. -->\n`
    : "";
  const url = URL.createObjectURL(
    new Blob([comment + communityDocument(source, title)], {
      type: "text/html",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "community-project.html";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

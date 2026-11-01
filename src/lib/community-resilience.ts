import { isProjectId, sourceError, type CommunityDraft } from "./community";

export const DRAFT_KEY = "ui-lexicon-community-draft-v1";
export const PRESERVE_DRAFT_EVENT = "ui-lexicon-preserve-draft";
export const REQUEST_TIMEOUT_MS = 20_000;

/** Never show arbitrary API/database details to visitors. */
export function communityError(error: unknown, offline = false): string {
  if (offline)
    return "You appear to be offline. Check your connection, then try again. Your open editor is still available.";
  const value =
    error && typeof error === "object"
      ? (error as {
          message?: unknown;
          code?: unknown;
          status?: unknown;
          name?: unknown;
        })
      : {};
  const text =
    `${value.code ?? ""} ${value.name ?? ""} ${value.message ?? ""}`.toLowerCase();
  if (
    value.status === 429 ||
    /rate.limit|limit reached|too many requests/.test(text)
  )
    return "Too many requests. Wait before trying again. Project submissions are limited to 5 per hour and 20 per day; keep editing or export your draft meanwhile.";
  if (
    value.status === 401 ||
    /jwt|session.*expired|refresh.token|sign in|not authenticated/.test(text)
  )
    return "Your session is no longer available. Sign in with GitHub again. Your current edits remain in the editor; check the local-save status before leaving.";
  if (
    value.status === 403 ||
    /42501|permission denied|moderator access|verified github/.test(text)
  )
    return "You do not have permission for this action. Use the correct GitHub account, or return to the community library.";
  if (/timeout|timed out|abort/.test(text))
    return "This request took too long. Check your connection and try again. If you were submitting, check My submissions first to avoid a duplicate.";
  if (/fetch|network|connection/.test(text))
    return "We could not reach the community service. Check your connection and try again. If you were submitting, check My submissions before retrying.";
  if (/already changed/.test(text))
    return "This submission has changed. Refresh the project before trying again.";
  if (/unavailable|pgrst116/.test(text))
    return "This project is unavailable or private. Sign in with the owning account, or return to the community library.";
  return "This action could not be completed. Try again, or return to the community library. Your current edits remain in the editor.";
}

/** Bounds the complete response, including its body, while preserving caller cancellation. */
export async function communityFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  fetcher: typeof fetch = fetch,
  timeout = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const signal =
    init?.signal ?? (input instanceof Request ? input.signal : undefined);
  const cancel = () => controller.abort(signal?.reason);
  if (signal?.aborted) cancel();
  else signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(
    () =>
      controller.abort(new DOMException("Request timed out", "TimeoutError")),
    timeout,
  );
  try {
    const response = await fetcher(input, {
      ...init,
      signal: controller.signal,
    });
    const body = await response.arrayBuffer();
    return new Response(
      [101, 204, 205, 304].includes(response.status) ? null : body,
      {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      },
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}

export function parseLocalDraft(raw: string): CommunityDraft {
  if (raw.length > 2_000_000) throw new Error("Draft too large");
  const value = JSON.parse(raw);
  if (
    !value ||
    !["html", "css", "js", "title", "description"].every(
      (key) => typeof value[key] === "string",
    ) ||
    value.title.length > 80 ||
    value.description.length > 600 ||
    !["component", "website"].includes(value.kind) ||
    !Array.isArray(value.tags) ||
    value.tags.length > 165 ||
    !value.tags.every(
      (tag: unknown) => typeof tag === "string" && tag.length <= 164,
    ) ||
    sourceError(value)
  )
    throw new Error("Invalid draft");
  return {
    html: value.html,
    css: value.css,
    js: value.js,
    title: value.title,
    description: value.description,
    kind: value.kind,
    tags: value.tags,
    licenseAccepted: false,
    remixOf: isProjectId(value.remixOf) ? value.remixOf : null,
  };
}
export function writeLocalDraft(
  storage: Pick<Storage, "setItem">,
  draft: CommunityDraft,
): void {
  const raw = JSON.stringify(draft);
  const checked = parseLocalDraft(raw);
  // Persist only draft fields; consent must be confirmed again after restoration.
  storage.setItem(DRAFT_KEY, JSON.stringify(checked));
}

export function shouldRestoreDraft(
  draft: CommunityDraft,
  remix: string | null,
): boolean {
  return !remix || draft.remixOf === remix;
}

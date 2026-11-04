import { communityError } from "./community-resilience";

/** UI-only helpers: deliberately independent of React and the auth client. */
export type AuthDialogState =
  | { kind: "redirecting" }
  | { kind: "confirm-sign-out" }
  | { kind: "signed-in"; name: string }
  | { kind: "signed-out" }
  | {
      kind: "error";
      retry: "in" | "out";
      cancelled?: boolean;
      detail?: string;
    };

export function dialogCopy(state: AuthDialogState) {
  switch (state.kind) {
    case "redirecting":
      return {
        title: "Redirecting to GitHub…",
        description: "Continue on GitHub to finish signing in.",
      };
    case "confirm-sign-out":
      return {
        title: "Sign out?",
        description: "Save your local draft before signing out.",
      };
    case "signed-in":
      return {
        title: state.name ? `Signed in as @${state.name}` : "You are signed in",
        description: "You can now submit projects and view your submissions.",
      };
    case "signed-out":
      return {
        title: "You've been signed out.",
        description:
          "Your saved local draft is still available in this browser.",
      };
    case "error":
      return {
        title:
          state.retry === "in"
            ? "Sign-in didn't finish"
            : "Sign-out didn't finish",
        description: state.cancelled
          ? "GitHub sign-in was cancelled or did not finish. You can try again."
          : (state.detail ?? communityError({})),
      };
  }
}

type UserIdentity = {
  identities?: { provider: string; identity_data?: Record<string, unknown> }[];
  user_metadata?: Record<string, unknown>;
};
export function displayName(user: UserIdentity): string {
  const identity = user.identities?.find(
    (value) => value.provider === "github",
  )?.identity_data;
  // Only GitHub login-shaped fields, never full names or email addresses.
  for (const value of [
    identity?.user_name,
    user.user_metadata?.user_name,
    user.user_metadata?.preferred_username,
  ]) {
    if (typeof value === "string" && /^[a-z\d](?:[a-z\d-]{0,38})$/i.test(value))
      return value;
  }
  return "";
}

export function oauthReturnError(
  search: string,
  hash: string,
): "cancelled" | "failed" | null {
  for (const part of [search, hash]) {
    const params = new URLSearchParams(part.replace(/^[?#]/, ""));
    if (
      params.has("error") ||
      params.has("error_code") ||
      params.has("error_description")
    ) {
      return [params.get("error"), params.get("error_code")].includes(
        "access_denied",
      )
        ? "cancelled"
        : "failed";
    }
  }
  return null;
}

type FlagStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const SIGN_IN_KEY = "ui-lexicon-sign-in-started";
export const SIGN_IN_TTL = 10 * 60 * 1000;
function tabStorage(): FlagStorage | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}
export function markSignIn(storage = tabStorage(), now = Date.now()) {
  try {
    storage?.setItem(SIGN_IN_KEY, String(now));
  } catch {
    /* Storage is optional. */
  }
}
export function consumeSignIn(
  storage = tabStorage(),
  now = Date.now(),
): boolean {
  try {
    const raw = storage?.getItem(SIGN_IN_KEY);
    storage?.removeItem(SIGN_IN_KEY);
    if (!raw) return false;
    const started = Number(raw);
    return (
      Number.isFinite(started) && now >= started && now - started < SIGN_IN_TTL
    );
  } catch {
    return false;
  }
}

export function submitButtonState({
  submitting,
  busy,
  submitted,
  connected,
  signedIn,
}: {
  submitting: boolean;
  busy: boolean;
  submitted: boolean;
  connected: boolean;
  signedIn: boolean;
}) {
  return {
    disabled: submitting || busy || submitted || !connected || !signedIn,
    label: submitting
      ? "Submitting…"
      : submitted
        ? "Submitted ✓"
        : busy
          ? "Working…"
          : "Submit for review",
    busy: submitting,
  };
}

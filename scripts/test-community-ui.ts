import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  consumeSignIn,
  dialogCopy,
  displayName,
  markSignIn,
  oauthReturnError,
  SIGN_IN_TTL,
  submitButtonState,
  type AuthDialogState,
} from "../src/lib/community-ui";

for (let mask = 0; mask < 32; mask++) {
  const [submitting, busy, submitted, connected, signedIn] = Array.from(
    { length: 5 },
    (_, i) => !!(mask & (1 << i)),
  );
  const result = submitButtonState({
    submitting,
    busy,
    submitted,
    connected,
    signedIn,
  });
  assert.equal(
    result.disabled,
    submitting || busy || submitted || !connected || !signedIn,
  );
  assert.equal(result.busy, submitting);
  assert.equal(
    result.label,
    submitting
      ? "Submitting…"
      : submitted
        ? "Submitted ✓"
        : busy
          ? "Working…"
          : "Submit for review",
  );
}
const dialogs: [AuthDialogState, string][] = [
  [{ kind: "redirecting" }, "Redirecting to GitHub…"],
  [{ kind: "confirm-sign-out" }, "Sign out?"],
  [{ kind: "signed-in", name: "octocat" }, "Signed in as @octocat"],
  [{ kind: "signed-in", name: "" }, "You are signed in"],
  [{ kind: "signed-out" }, "You've been signed out."],
  [{ kind: "error", retry: "in" }, "Sign-in didn't finish"],
  [{ kind: "error", retry: "out" }, "Sign-out didn't finish"],
];
for (const [state, title] of dialogs) {
  assert.equal(dialogCopy(state).title, title);
  assert.ok(dialogCopy(state).description.length > 10);
}
assert.match(
  dialogCopy({ kind: "error", retry: "in", cancelled: true }).description,
  /cancelled/,
);
assert.equal(
  displayName({
    identities: [
      { provider: "github", identity_data: { user_name: "octocat" } },
    ],
    user_metadata: { user_name: "fallback" },
  }),
  "octocat",
);
assert.equal(
  displayName({
    identities: [{ provider: "other", identity_data: { user_name: "wrong" } }],
    user_metadata: { preferred_username: "fallback" },
  }),
  "fallback",
);
assert.equal(
  displayName({
    user_metadata: {
      email: "secret@example.com",
      full_name: "secret@example.com",
      user_name: "secret@example.com",
    },
  }),
  "",
);
assert.equal(displayName({}), "");
assert.equal(
  oauthReturnError("?error=access_denied&error_description=secret", ""),
  "cancelled",
);
assert.equal(oauthReturnError("", "#error=access_denied"), "cancelled");
assert.equal(
  oauthReturnError("?error=server_error&error_description=secret", ""),
  "failed",
);
assert.equal(oauthReturnError("", "#error_description=secret"), "failed");
assert.equal(oauthReturnError("?code=123", "#access_token=secret"), null);
const data = new Map<string, string>();
const storage = {
  getItem: (key: string) => data.get(key) ?? null,
  setItem: (key: string, value: string) => {
    data.set(key, value);
  },
  removeItem: (key: string) => {
    data.delete(key);
  },
};
markSignIn(storage, 1000);
assert.equal(consumeSignIn(storage, 1001), true);
assert.equal(consumeSignIn(storage, 1002), false);
markSignIn(storage, 1000);
assert.equal(consumeSignIn(storage, 1000 + SIGN_IN_TTL), false);
markSignIn(storage, 1000);
assert.equal(consumeSignIn(storage, 999), false);
const broken = {
  getItem() {
    throw Error("blocked");
  },
  setItem() {
    throw Error("blocked");
  },
  removeItem() {
    throw Error("blocked");
  },
};
assert.doesNotThrow(() => markSignIn(broken));
assert.equal(consumeSignIn(broken), false);
assert.doesNotThrow(() => markSignIn());
assert.equal(consumeSignIn(), false);
const css = readFileSync("src/components/community-ui.css", "utf8");
for (const rule of [
  "cursor: pointer",
  "cursor: not-allowed",
  "170ms",
  "translateY(-1px)",
  "scale(0.98)",
  "focus-visible",
  "prefers-reduced-motion",
  "outline-offset: -3px",
])
  assert.ok(css.includes(rule), rule);
assert.ok(!/#[0-9a-f]{3,8}\b/i.test(css));
const dialog = readFileSync("src/components/AuthDialog.tsx", "utf8");
for (const rule of [
  'role="dialog"',
  'aria-modal="true"',
  "aria-labelledby",
  "aria-describedby",
  "showModal()",
  "onCancel",
  "data-auth-trigger",
])
  assert.ok(dialog.includes(rule), rule);
const app = readFileSync("src/components/CommunityApp.tsx", "utf8");
assert.ok(app.includes('className="community-ui"'));
assert.ok(app.includes("submitPending.current"));
// The backend calls (including arguments and redirect URI) are a UI-only change boundary.
const compact = (value: string) => value.replace(/\s+/g, "");
const source = compact(app);
const originalCalls = [
  'client.rpc("is_community_moderator")',
  "client.auth.signOut()",
  'client.auth.signInWithOAuth({\n            provider: "github",\n            options: {\n              redirectTo: `${window.location.origin}${withBasePath("/community/auth/")}`,\n            },\n          })',
  'client.rpc("submit_community_project", {\n        p_title: draft.title.trim(),\n        p_description: draft.description.trim(),\n        p_kind: draft.kind,\n        p_tags: [...new Set(draft.tags)],\n        p_html: draft.html,\n        p_css: draft.css,\n        p_js: draft.js,\n        p_license_accepted: draft.licenseAccepted,\n        p_remix_of: draft.remixOf,\n      })',
  'client.rpc("withdraw_community_project", { p_id: project.id })',
  'client.rpc("review_community_project", {\n              p_id: project.id,\n              p_decision: decision,\n              p_note: note,\n            })',
];
for (const call of originalCalls)
  assert.ok(source.includes(compact(call)), call);
assert.equal(
  app.match(/client\.(?:auth\.(?:signInWithOAuth|signOut)|rpc)\(/g)?.length,
  originalCalls.length,
);
console.log("Community UI tests passed.");

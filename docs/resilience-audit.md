# UI state audit — 2026-10-31

Scope: the static glossary and network-backed community flows. “Success rate” is interpreted as action success feedback, not an analytics feature. This branch is independent of open feedback PR23 and full-preview/security-grant PR22.

| Requested state | Result |
| --- | --- |
| Empty | Existing glossary search and community gallery empty states retained. The disconnected backend already explains what remains usable. |
| Loading | Existing messages retained; delayed status explains waits after five seconds. The editor remains usable while auth initializes. |
| Error | Added safe actionable network/session/permission/rate-limit messages, retries, async rejection handling, and a route error boundary. No raw database errors are printed to the UI. |
| No internet | Added online/offline notice. Loaded content and editor remain available. No new service worker: a first visit or uncached navigation while offline still depends on browser caching. |
| Slow network | Added delayed explanations and a 20-second bound on each backend request including response-body reading. No fake percentage progress for APIs that do not expose measurable progress. Auth's own retry sequence can take longer than one request. |
| Permission denied | Added explanation and return link for moderation, plus safe API denial messages. Permissions remain enforced by the database; UI visibility is not authorization. |
| Session expired | Preserve edits on auth state loss; autosave/restore browser drafts, flush before OAuth/logout/page exit, and block our OAuth/logout action if saving fails. No forced logout or editor remount. Matching remix drafts are restored instead of overwritten by the original. |
| Validation | Existing title/description/tags/license/code-size validation and database constraints retained. Added validation for stored drafts, malformed JSON, bounded data and restored remix references. |
| Success | Existing submission/format/save confirmations retained; moderation/withdrawal now confirms the result. Local-save status is separate from publication. |
| Rate limits | Existing server-enforced 5/hour and 20/day project quotas retained; clearer limit recovery message. Feedback's separate quotas are in PR23. No new redundant limiter. |
| Exposed vulnerabilities | Raw backend error details removed from UI. Reviewed client/server boundaries, existing iframe CSP/sandbox, RLS and no-client-write design. `npm audit --omit=dev` returned 0 known advisories for the current production lockfile. No credentials were retrieved or changed. This is not a penetration test or a claim of guaranteed security. |

## Existing PR dependencies and limits

PR22 contains the explicit hosted anonymous RPC grant revocation, already applied to the hosted project during setup. It is not duplicated here. Merge it as part of the existing deployment work. PR23 owns feedback intake/security states and setup. This PR changes no schema, auth permissions or dependencies.

Browser drafts use one local saved slot, shared by users of that browser profile. A new/different remix can replace it after loading. The UI discloses local storage and offers Remove saved copy. Clearing that copy preserves current in-memory edits; editing again resumes autosave. MIT sharing consent is never carried across restoration. Storage can fail or be cleared by browser policy; failed saves warn users to keep the tab open, reduce oversized code or copy/export their work. Browser crashes and forced termination cannot guarantee preservation of the most recent unsaved keystrokes.

Requests are not automatically retried by the new UI. Timed-out submission messages direct users to My submissions before retrying, because the server may have saved a request whose response was lost. The existing backend does not have submission idempotency keys.

## Verification

- Required commands: validate, typecheck, test, build.
- Automated resilience tests: redacted errors, permission/session/rate-limit mapping, complete-response timeout, caller cancellation, local draft parsing, stripping unknown fields, consent reset, storage failure, code limits and matching-remix restoration policy.
- Existing community tests continue checking database authorization, private pending records and quotas.
- Browser: ordinary draft save/reload; static build with a local fake API demonstrated remix edit → save → reload → edited title and restoration notice retained. At 390px, no page overflow; console errors/warnings absent in the static fixture run.
- Final build returns to normal configuration. The fake API and test key are temporary local test fixtures, not committed or deployed.
- Real GitHub OAuth/session expiry, browser offline events, hosted moderation and storage-denied browser behavior still need owner smoke tests after backend activation. No axe audit or full security penetration test was run.

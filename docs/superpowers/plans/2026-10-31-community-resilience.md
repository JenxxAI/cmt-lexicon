# Community resilience plan

User request: add missing empty/loading/error/offline/slow-network/permission/session/form/success/rate-limit/security states; skip duplicates. Treat “success rate” as action success feedback, not new analytics.

Audit: glossary/search empty states and community empty/loading/validation/success/rate limits already exist. Feedback states are in open PR23; anonymous RPC grant fix is in open PR22 and applied to the hosted project. Do not duplicate those PRs. Scope this independent branch from main to community resilience.

Implementation:
1. Add tested safe error classification, bounded network fetch, and bounded local draft serialization/restoration. Never echo arbitrary server error details.
2. Add offline/online notice and delayed loading explanation, retry controls and permission recovery links. No fake progress percentages; loaded static content and editor remain usable offline. No service worker/offline navigation promise.
3. Autosave edits locally, restore on return, and flush before OAuth/logout and page exit. Preserve the editor on session loss; show actual storage failures and allow export. Do not store auth tokens in draft records. Clear MIT consent on restore. Leave existing validation and server quotas intact.
4. Catch rejected asynchronous reads/writes and clear busy state in finally. Provide success confirmation for moderation/withdrawal. Check npm production advisories and document limits of security review.
5. Add tests for timeout/abort, error redaction, malformed/oversized drafts and failed storage. Run validate, typecheck, test, build; browser check editor restoration, keyboard access and 390px layout. Review and PR to main.

Security boundaries: no new client permissions, dependencies, or schema changes; private submissions remain RLS-controlled and previews remain sandboxed. Local drafts are browser-local on a shared device, with explicit disclosure and a discard control. Owner-configured hosted auth and network failure scenarios need post-deployment smoke testing.

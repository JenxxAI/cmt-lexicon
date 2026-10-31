# Private footer feedback

The footer offers Bug / Feedback / Suggest a component, a message, optional reply email and optional screenshot. It works without a user account. The curated site still exports statically. No new npm runtime package is required.

## Enable it (owner setup)

Until all public settings are provided, the form shows a GitHub issue fallback and cannot submit. This PR does not deploy a database migration, function, or secrets.

1. Apply `supabase/migrations/20261031015512_footer_feedback.sql` to the project's database using the SQL editor or your normal migration workflow. It creates `public.feedback_inbox`, the service-only `receive_feedback` function and private `feedback-screenshots` bucket. Do not add public storage policies or client table grants.
2. Create a Cloudflare Turnstile widget for your production hostname. Choose Managed mode. Add localhost only for development. The client uses action `feedback`; the server checks both action and the requesting origin's hostname. Never use Cloudflare test keys in production.
3. In Supabase Edge Function secrets set:
   - `FEEDBACK_ALLOWED_ORIGINS=https://cmt-lexicon.vercel.app` (comma-separated exact origins if needed; no trailing slash, no wildcard).
   - `TURNSTILE_SECRET_KEY`: the private Turnstile key.
   - `FEEDBACK_HASH_SECRET`: a randomly generated, long secret used to hash network hints. Raw IP addresses are not stored by this code.
   - Supabase supplies `SUPABASE_URL` and backend keys. The function uses `SUPABASE_SECRET_KEYS.default` if available, otherwise the supplied `SUPABASE_SERVICE_ROLE_KEY`. Neither belongs in Vercel's public variables.
4. Deploy the `feedback` function from this repository with Supabase CLI: `supabase functions deploy feedback --project-ref ztalqkwgaahxexkjquzl`. The committed config disables JWT verification because this is anonymous intake; mandatory server-side Turnstile verification and database quotas protect it instead. Keep all three function files together.
5. To receive notifications in Gmail, create a Resend account and verify a sender domain (or use its approved testing sender/recipient for a smoke test). Add **server-only** secrets `RESEND_API_KEY`, `FEEDBACK_EMAIL_FROM` (verified sender), and `FEEDBACK_EMAIL_TO` (your Gmail address). Gmail receives mail; it needs no app password or OAuth grant. Resend sends only the report reference and dashboard link, not visitor content. Email configuration is optional: the private inbox still receives reports without it.
6. Set Vercel's public build variables:
   - `NEXT_PUBLIC_SUPABASE_URL=https://ztalqkwgaahxexkjquzl.supabase.co`
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: public widget key
   - `NEXT_PUBLIC_FEEDBACK_ENABLED=true`
7. Rebuild/redeploy the site. Submit a harmless test report yourself, including one screenshot. Verify the inbox record, private bucket object, and Gmail notification. Verify the screenshot has no public URL. Test an expired challenge and a second browser session. Do this before announcing the feature.

No keys or email addresses should be committed. Preview deployments require an explicitly allowed origin and Turnstile hostname; don't enable feedback on arbitrary preview domains.

## Read and manage reports

Use Supabase Table Editor → `public.feedback_inbox`, newest first. The optional email is for manual replies. Screenshots are in Storage → private `feedback-screenshots`, under the record's `screenshot_path`. Access these through the authenticated owner dashboard. No public/moderator client inbox is exposed.

`notification_status` is `not_sent`, `sent`, or `failed`. A network timeout can leave `not_sent`; consult function logs, which contain report IDs but not content or secrets. Saved feedback remains successful if notification delivery fails. There is no automatic mail retry in this first version: inspect the inbox regularly. If a screenshot fails, the message remains saved and the visitor is explicitly told the screenshot was not attached.

Delete resolved reports and their screenshot objects through the dashboard within 30 days; this is an owner-operated retention policy, not an automated job. Remove storage objects first, then matching records. Check for unreferenced screenshot objects after an interrupted attachment operation. The form warns users not to include private keys or personal information in screenshots. Disclose Cloudflare/Supabase processing in any broader privacy policy you add later.

## Limits and security

- 10–4,000 message characters; optional email ≤254 characters; page path only (no query string or fragment).
- PNG/JPEG/WebP only, server-checked signatures and MIME types, ≤3 MiB per screenshot. SVG/HTML are rejected. Private files are not embedded into the site.
- Streaming request cap of 3 MiB +32 KiB, even without Content-Length.
- 50 submissions per rolling 24 hours globally, 5 per rolling hour per hashed network hint. An advisory transaction lock serializes checks and insertion. These are conservative shared quotas, not per-person guarantees: proxies can share/change network hints, and forwarded headers are not an authentication boundary. CAPTCHA and the global quota remain mandatory even if a network hint changes.
- Maximum accepted attachments: 150 MiB/day before retention. Monitor storage/service quotas; no guarantee that third-party billing remains free under abuse.
- No anonymous or authenticated direct reads/writes/RPC execution. The function uses service privileges with a security-invoker RPC; RLS is enabled with no client policies. Supabase may report the intentional RLS-with-no-policy informational finding.
- Exact CORS origin allowlist is defense in depth, not authentication. Unconfigured verification fails closed. Service secrets never enter the browser bundle.
- CAPTCHA script loads only when interacting with the form. CSP permits the specific Cloudflare script/frame origin. No wildcard script permission is added.

## Validation

`npm test` includes PGlite database tests and isolated Edge handler tests: private grants, invalid content, quotas, expiry of quotas, CAPTCHA refusal, origin rejection, upload failure, email failure, request cancellation, and successful persistence. `npm run typecheck` checks the handler and bootstrap as well as the UI. Live Supabase/Turnstile/Resend delivery still needs the owner smoke test above.

References: [Supabase function configuration](https://supabase.com/docs/guides/functions/function-configuration), [Turnstile server verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [Resend email API](https://resend.com/docs/api-reference/emails/send-email).

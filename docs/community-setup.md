# Community setup

Glossary pages render per request to issue fresh script nonces. Community uses same-origin Next.js server endpoints on Vercel; a static-only host cannot run authenticated Community. The curated component and website JSON files are independent. No project has been provisioned automatically and no OAuth secret belongs in this repository.

## Create the backend

1. Create a Supabase project in your own account and choose an appropriate region and spending limits.
2. Run all SQL files in `supabase/migrations/` in filename order once in the project's SQL editor, or apply it using the Supabase CLI migration workflow. This creates tables, read policies, and submission/moderation functions. Do not expose the `community_private` schema through the Data API.
3. In Supabase Authentication, configure GitHub as the sign-in provider. Create a GitHub OAuth App with the callback URL shown by Supabase (`https://YOUR_PROJECT.supabase.co/auth/v1/callback`). Put the OAuth client ID and secret in Supabase's GitHub provider settings, never in a `NEXT_PUBLIC_` variable. No repository-write permission is needed for community authors.
4. Set the Supabase Site URL to your production origin. Allow `https://YOUR_SITE/api/community/callback/?state=*` in the redirect allowlist (include any configured base path). The wildcard is limited to the random state query on this exact host and callback path. Add the equivalent localhost callback only for local development. Never allow arbitrary hosts or paths. Disable sign-in providers you do not intend to support, including email signup if GitHub-only access is desired. Submissions also require a GitHub identity in the database.
5. Set these **server-only** environment variables locally and in Vercel:
   ```text
   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
   COMMUNITY_ORIGIN=https://YOUR_SITE
   COMMUNITY_COOKIE_KEY=BASE64_ENCODED_RANDOM_32_BYTE_KEY
   ```
   Generate `COMMUNITY_COOKIE_KEY` securely (32 random bytes, base64); never commit or paste it into chat. Keep it stable across instances. Rotating it signs everyone out. Do not prefix these variables with `NEXT_PUBLIC_`. Use the publishable/anon key, **not** service-role or secret keys: API calls run with the user's JWT and retain RLS. `COMMUNITY_ORIGIN` must be the exact origin with no trailing slash. Only development permits HTTP on localhost/127.0.0.1. Configure a separate origin and cookie key for each preview environment.

   Sessions use AES-256-GCM encrypted `__Host-community-session` cookies with HttpOnly, Secure, SameSite=Lax, Path=/, no Domain, and a seven-day absolute lifetime. Credentials are never returned in JSON; only ID, GitHub handle and permitted avatar URL reach the browser. PKCE verification stays server-side in a separate ten-minute cookie. POST endpoints require the configured Origin and JSON content type, and session responses are not cached. The server refreshes credentials near expiry and verifies the user with Supabase. Community checks the signed session ID and user ID against an active Auth session for private reads and writes. Apply the active-session migration before deploying the API code. After Supabase commits session removal, subsequent requests lose authenticated access even while the JWT is unexpired.

   On rollout, existing browser SDK sessions are discarded; users must sign in again. Keep the existing public Supabase URL/key variables only if needed by the separate feedback form. Deploy using Vercel's Next.js preset with its default output directory (remove any `out` override). Use `npm run start` after building locally. GitHub Pages cannot host this version's API routes.
6. Sign in with your own GitHub account. In Supabase Auth → Users, copy your user UUID and appoint yourself via the SQL editor:
   ```sql
   insert into community_private.moderators (user_id)
   values ('REPLACE_WITH_YOUR_AUTH_USER_UUID');
   ```
   Users cannot appoint themselves, approve through metadata, or write tables directly. Grant moderator access only to trusted maintainers. Reload the page to see Review queue.

Provider reference: https://supabase.com/docs/guides/auth/social-sign-in/auth-github
RLS reference: https://supabase.com/docs/guides/database/postgres/row-level-security

## Publication and limits

- Visitors can browse approved projects and use the editor without an account. Local drafts are saved manually in the current browser; save before leaving to sign in.
- Submit requires GitHub sign-in and an MIT-license confirmation. All new submissions start `pending`. Only the author and moderators can read them. Public metadata and code are readable only after approval.
- Projects are immutable to authors after submission. Remix/resubmit to propose a revision; the new submission goes through approval again. Withdraw removes the original from public browsing. Moderators can reject pending items or unpublish approved ones.
- GitHub author handles come from the provider identity record, not user-editable profile metadata. Remixes retain the original project ID.
- PostgreSQL enforces 100,000 UTF-8 bytes per file, 300,000 bytes total, 5 submissions per rolling hour and 20 per rolling 24 hours per account. A per-user transaction lock prevents concurrent requests from evading the quota. Invalid transactions do not consume a submission. Withdrawing does not reset quotas.
- Exports have the same source-size limit and a small HTML wrapper. They happen locally. Once code is public, users can copy it; client-side download counts are not a meaningful security boundary. There is no claim to limit offline exports.
- Limits are per account, not per IP. Before broad promotion, configure Supabase Auth abuse controls/CAPTCHA as appropriate and monitor database/API usage and costs. Approval is still a human responsibility.
- Private submission events older than 48 hours may be removed with a scheduled database job to limit log growth; never delete recent events to reset a user's quota.

## Preview safety and supported source

HTML/CSS/JavaScript only. No package installation, file uploads, React compilation, external scripts, or remote assets in this first version. Gallery cards do not run user code. Visitors explicitly choose Run preview. The iframe uses `sandbox="allow-scripts"` without same-origin, forms, popups, or top-navigation privileges. A CSP inside the document blocks network connections, child frames, workers, and external resources. All author text outside the iframe uses normal React escaping. Previews are isolated but cannot guarantee protection from CPU-heavy loops or every browser bug: review source before running it and reload if needed.

Never enter secrets into a community project. Exported HTML contains executable JavaScript and should be treated as untrusted code. Human approval is not a guarantee of security.

## Verify before launch

Run `npm run validate`, `npm run typecheck`, `npm test`, and `npm run build`. The database test uses an isolated in-memory PostgreSQL engine with simulated Supabase auth claims; it does not replace a hosted smoke test.

With two real GitHub accounts and one moderator, verify: OAuth callback, a saved local draft surviving sign-in, a pending submission invisible to the other account/anonymous browser, forbidden direct updates, approval making it public, rejection notes visible to its author, withdrawal removing it from the gallery, quota errors, and mobile editor/export behavior. No real Supabase credentials were available during implementation, so production OAuth and hosted database activation require this setup and smoke test.

## UI Lexicon hosted project

Created in CMT on the quoted $0/month option, Singapore region: [ui-lexicon dashboard](https://supabase.com/dashboard/project/ztalqkwgaahxexkjquzl). Database migrations are already applied; do not rerun the initial migration on this project.

- Project URL: `https://ztalqkwgaahxexkjquzl.supabase.co`
- GitHub OAuth App callback: `https://ztalqkwgaahxexkjquzl.supabase.co/auth/v1/callback`
- Production Site URL: `https://cmt-lexicon.vercel.app`
- Allowed production redirect: `https://cmt-lexicon.vercel.app/api/community/callback/?state=*`

The owner handles GitHub OAuth credentials and the server-only Vercel variables above. No keys were retrieved or added during setup. After enabling GitHub sign-in, sign in once and appoint the owner's actual Auth user UUID as moderator. Real OAuth and two-account smoke tests remain required.

Hosted checks confirmed RLS on all three tables, no direct client writes, and no anonymous execution of submit/review/withdraw. The follow-up migration explicitly removes Supabase's default anonymous function grants. Advisor notices for private tables without policies are intentional deny-all behavior. The anonymous moderator-check helper returns false and supports the public read policy; authenticated SECURITY DEFINER functions are intentional API endpoints with internal authorization checks. See [function advisor guidance](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) and [private-table policy guidance](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Session-fix verification

`npm test` covers PKCE callback binding, CSRF rejection, encrypted cookie integrity and flags, refresh, user-scoped queries, and credential-free JSON using synthetic fixtures. Production activation still requires the server variables and callback allowlist above, followed by a real GitHub sign-in. No hosted configuration or database migration was changed for this fix.

## Script policy

The Next.js proxy issues a new script nonce for each HTML response. Pages render per request with private, no-store caching. The parent page blocks inline event handlers and allows the configured Cloudflare Turnstile script host. Development also permits eval for framework tooling.

The editor uses a separate sandboxed frame so sample scripts and event handlers can run without the application nonce. The preview receives draft HTML locally through a one-use MessagePort. Its response policy blocks network connections, external scripts and form submissions, and forces an opaque origin. Keep this route frameable by the application origin.

To check the policy locally, run the production server on port 3218 and run `node scripts/test-csp-http.mjs`.

## Hosted isolation verification

Use two disposable, non-moderator accounts with one known pending fixture each. For each account, confirm its own fixture is visible (count 1) and the other fixture is hidden (count 0). Anonymous reads of both pending fixtures should return 0. Use only these fixture IDs and record counts and HTTP statuses. Use local transaction tests or isolated staging data for write checks. Production verification requires project access and both fixtures.

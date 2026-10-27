# Community setup

The site remains a Next.js static export. Community pages fetch from Supabase in the browser. The curated component and website JSON files are independent. No project has been provisioned automatically and no OAuth secret belongs in this repository.

## Create the backend

1. Create a Supabase project in your own account and choose an appropriate region and spending limits.
2. Run `supabase/migrations/202610270001_community.sql` once in the project's SQL editor, or apply it using the Supabase CLI migration workflow. This creates tables, read policies, and submission/moderation functions. Do not expose the `community_private` schema through the Data API.
3. In Supabase Authentication, configure GitHub as the sign-in provider. Create a GitHub OAuth App with the callback URL shown by Supabase (`https://YOUR_PROJECT.supabase.co/auth/v1/callback`). Put the OAuth client ID and secret in Supabase's GitHub provider settings, never in a `NEXT_PUBLIC_` variable. No repository-write permission is needed for community authors.
4. Set the Supabase Site URL to your production origin. Add the exact redirect URL `https://YOUR_SITE/community/auth/` to the redirect allowlist. Add `http://localhost:3000/community/auth/` only for local development. Avoid wildcard production callbacks. Disable sign-in providers you do not intend to support, including email signup if GitHub-only access is desired. Submissions also require a GitHub identity in the database.
5. Set these public environment variables locally and in Vercel, then rebuild:
   ```text
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
   ```
   The publishable key (or legacy anon key) is designed for browser use; access is controlled by RLS and function permissions. Never use a secret or service-role key in the frontend. `vercel.json` permits connections only to standard `*.supabase.co` origins; custom domains require an explicit CSP update.
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

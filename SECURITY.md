# Security Policy

Thanks for helping keep UI Lexicon and the people who use it safe. This is a small open-source project maintained by one person, so the process below is simple and best-effort.

## Supported versions

Only the latest commit on `main`, and deployments built from it, receive security fixes. The project has no versioned releases, so there are no older supported lines.

## Reporting a vulnerability

**Please do not open a public issue, pull request or discussion for a security problem.**

Report it privately through GitHub:

1. Open [**Report a vulnerability**](https://github.com/JenxxAI/cmt-lexicon/security/advisories/new) (Security tab → Advisories → Report a vulnerability).
2. Describe the problem using the checklist below.

If that form is not available, open a regular issue titled "Security contact request" with **no technical details**, and a private channel will be arranged.

### What to include

- What the problem is and which part of the project it affects (page, file, endpoint or table).
- Steps to reproduce, ideally with a minimal proof of concept.
- The impact you believe it has (for example, "a signed-in user can read another user's draft").
- The commit, deployment URL or browser you tested against.

### What to expect

These are targets, not guarantees:

- An acknowledgement within **7 days**.
- An assessment and a plan, or a request for more detail, within **14 days**.
- A fix or mitigation, then a public advisory crediting you (if you want credit), once the issue is resolved or after a reasonable disclosure period agreed with you.

## Scope

In scope, because the project handles them:

- **Community library** (`/community/`): row-level security and function permissions in `supabase/migrations/`, GitHub sign-in and its redirect handling, moderator-only actions, and anything that lets a user read, change or publish content they should not.
- **User-submitted and editable HTML/CSS/JavaScript**: escaping a preview or sample iframe sandbox, script injection into the surrounding site, or stored content that runs for other visitors.
- **Footer feedback form**: abuse of the form or its screenshot upload, access to the private feedback inbox or screenshot bucket, or bypassing its origin and bot checks.
- **Secrets and data exposure**: committed credentials, or private data reachable from the static site.
- **Dependencies**: a vulnerable dependency that is actually exploitable through how this project uses it.

Out of scope:

- The Supabase **publishable (anon) key** and project URL appearing in the browser bundle. They are designed to be public; access is controlled by row-level security. A way to read or write data despite those rules *is* in scope.
- Misconfiguration of someone else's deployment or Supabase project, including a fork or self-hosted copy.
- Denial of service, volumetric or automated traffic, and social engineering or phishing of the maintainer or users.
- Missing security headers or best-practice hardening on a host the project does not control, without a concrete attack.
- Findings from automated scanners with no demonstrated impact.

## Testing guidelines

Good-faith research that follows these guidelines is welcome:

- Test against your own account, or your own copy of the project and Supabase instance, rather than other people's data.
- Do not access, change or delete data that is not yours, and stop once you have shown the issue exists.
- Do not run denial-of-service, spam or large-scale automated tests against any live deployment.
- Give me a reasonable chance to fix the problem before you disclose it publicly.

## For contributors

Never commit keys, tokens or `.env` files. `NEXT_PUBLIC_*` variables end up in the browser bundle, so they must only ever hold public values; secrets such as `TURNSTILE_SECRET_KEY` and `FEEDBACK_HASH_SECRET` stay on the server. See [docs/community-setup.md](docs/community-setup.md) and [docs/feedback-setup.md](docs/feedback-setup.md).

# AGENTS.md

Instructions for AI coding agents (Codex, Claude Code, Cursor) working in this repo. Humans: see `README.md` and `CONTRIBUTING.md`.

## What this is

**UI Lexicon** (repo `cmt-lexicon`): a free, open-source web app that helps beginners and AI-assisted developers name UI components, with token-lean prompts. It is a portfolio piece, so code quality and polish matter. Audience: beginners who lack the vocabulary, and devs who want speed and minimal token usage.

## Stack and commands

Next.js (App Router, static export) · React 19 · TypeScript · Tailwind CSS 4 · Zod 4. No backend, no database.

```bash
npm run dev         # exports + dev server
npm run validate    # schema check of content/components/*.json
npm test            # search quality tests
npm run typecheck   # tsc --noEmit
npm run build       # validate + exports + static build into out/
```

**Definition of done for any change:** `validate`, `typecheck`, `test`, and `build` all pass.

## Layout

```
content/components/*.json   One file per component. THE source of truth. id == file name.
src/lib/schema.ts           Zod schema + types (EntrySummary is what the browser gets)
src/lib/content.ts          Server-only loader (uses fs). Never import it in a client component.
src/lib/search.ts           Describe-it search. Pure, client-safe, tested.
src/lib/categories.ts       Category ids and labels (client-safe, no zod)
src/components/             UI. Files with "use client" are Explorer, CopyButton, PromptPanel, CodeTabs.
src/components/previews.tsx Decorative mini-illustrations keyed by component id (fallback exists)
src/app/globals.css         Design tokens (@theme). Use token names, not raw hex.
scripts/                    validate-content, build-exports, test-search (run with tsx)
public/glossary.min.json    GENERATED (gitignored). So is public/llms.txt.
```

## Rules

- **Content is data.** Add or change components by editing JSON, not React. Run `npm run validate`.
- **Client bundle stays small.** Client components may `import type` from `schema.ts` but must not import `zod` or `content.ts`.
- **Accessibility is not optional.** Real `<button>` / `<a>`, visible focus, 44px touch targets, `aria-label` on icon-only buttons, 4.5:1 text contrast, works at 390px wide with no horizontal scroll.
- **No new runtime dependency** unless it clearly earns its weight. Search is intentionally dependency-free.
- **Match the design.** Light theme, indigo accent, Bricolage Grotesque (display), Geist (body), Geist Mono (prompts/labels). Keep the existing look.
- Short prompts must stay under 40 estimated tokens (enforced by `validate`).
- Don't commit `out/`, `.next/`, or the generated files in `public/`.

## Roadmap (in order)

Completed original roadmap items:

- **1. DONE — Grow content:** 40 components with previews and beginner search cases.
- **2. DONE — Search quality:** relative score cutoff and regression coverage.
- **3. DONE — Interactive live previews:** Drawer, Modal, Popover, and Toast, with reduced-motion support.
- **4. DONE — Icons & assets:** icon, SVG, favicon, sprite, Lottie, Open Graph image, and library name table.

Remaining roadmap (renumbered):

1. **Vue snippets** (`snippets.vue` is already supported by the schema and UI).
2. **Dark mode** (tokens are in `globals.css`).
3. **Deploy** to Vercel (static output, no config needed) and add the live URL to the README and the portfolio.
4. **Reverse lookup:** upload a screenshot, get the component name (AI-assisted, opt-in, keep the core site static).
5. **Later, separate package:** a browser inspector extension. Click an element, see what it is, its icon and CSS, and (with a build plugin) its source file and line. Reuse `glossary.min.json` for naming. Expose it to coding agents via an MCP server. Do not start this before remaining items 1 to 3 are done.

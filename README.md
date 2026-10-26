# UI Lexicon

**Can't name it? Describe it.**

Live demo: [UI Lexicon](https://cmt-lexicon.vercel.app)

A free, open-source glossary of UI components for people who build with AI. Search by what something *looks like* ("a panel that slides in from the side"), get the real name (**Drawer**), what your library calls it (shadcn `Sheet`, MUI `Drawer`), and a short prompt that keeps your token bill small.

> Repo: `cmt-lexicon`. Product name: **UI Lexicon**.

## Why

Vibe coders often can't prompt well because they lack the words. "That thing that slides from the side" costs tokens and gets guesses. "Add a right-side drawer. Close on overlay click and Esc." gets it right the first time.

## Features

- **Describe-it search**: matches names, aliases, plain-language descriptions, and weighted query synonyms. Share filters through `?q=&cat=`; press `/` to focus search.
- **Copy-ready prompts**: a short and a detailed version per component, with a rough token count.
- **Look-alike guidance**: "Don't mix it up with" (Drawer vs Modal vs Popover).
- **Library cheat sheet**: what shadcn/ui, MUI, Chakra, Mantine, and Radix each call it.
- **Icons & assets**: a [beginner guide](src/app/assets/page.tsx) to icons, SVGs, favicons, sprites, Lottie, and Open Graph images, with verified React icon names across three libraries. Browse `/assets/`; edit the guide data in `content/assets.json`.
- **Prompt cheat sheet**: `/cheat-sheet/` groups all component and asset prompts with copy buttons, estimated token counts, and a plain-text download.
- **Exports**: `glossary.min.json` and a compact `llms.txt` you can paste into `CLAUDE.md` / `AGENTS.md`.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Generate exports, start the dev server |
| `npm run validate` | Check every `content/components/*.json` against the schema |
| `npm test` | Search quality tests (beginner phrases must find the right component) |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Validate, export, and build a fully static site into `out/` |

The JSON export keeps component `entries` and `count` compatible; asset topics live in `assets` with their own `assetCount` and detail URLs. The text cheat sheet includes both.

## Stack

Next.js (static export) · React · TypeScript · Tailwind CSS 4 · Zod. No database and no API: content is JSON files in the repo.

## Add a component

It's one JSON file. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Roadmap

See [AGENTS.md](AGENTS.md#roadmap-in-order).

## License

[MIT](LICENSE)

### Vue snippets

All 40 component pages include a **Vue** code tab. Paste an example into a `.vue` single-file component in a Vue 3.5+ project. Examples use native HTML, scoped CSS, and Vue state where needed; no Tailwind or UI library is required. Replace example links and connect application actions (such as uploads) to your own app.

Examples follow Vue’s [script setup](https://vuejs.org/api/sfc-script-setup.html), [form bindings](https://vuejs.org/guide/essentials/forms.html), and [useId](https://vuejs.org/api/composition-api-helpers.html#useid) APIs. Dialog examples use native `showModal()` for modal focus handling and Escape dismissal; disclosure menus use normal Tab navigation.

## Website types

`content/website-types/*.json` defines 20 website blueprints. Each ordered section links to existing component IDs; component pages derive their “Used in” links from those references. The browser receives only searchable summaries, not the full blueprints.

Run `npm run validate` after editing content. Validation checks filenames, IDs, prompt limits, and component/related links. Website types appear in home search, `/websites/`, `glossary.min.json`, `llms.txt`, and the generated sitemap.

Set `NEXT_PUBLIC_SITE_URL` to the public origin (for example, your own HTTPS domain) before building the sitemap. On Vercel, `VERCEL_PROJECT_PRODUCTION_URL` is used if available. Without either, the sitemap uses the published URL in `src/lib/site.ts`, taken from this repository’s homepage metadata. Override it when deploying to a different domain. `public/sitemap.xml` is generated and should not be committed.

### Interactive website samples

Each website detail page includes an editable example from `content/website-samples/<id>.html`. The server embeds the color tokens from `globals.css`; the browser receives only that page's example. Keep samples standalone, accessible, and free of external dependencies. The build fails if a website type has no matching sample.

Users can edit the HTML/CSS/JavaScript, run changes in a sandboxed iframe, switch to a phone-width preview, copy the source, or export one `.html` file. Edits are temporary until exported. Sample interactions are local demonstrations; forms do not submit data and there is no real checkout, booking, or account creation.

The shared code editor uses file tabs, an Explorer sidebar, line numbers, syntax colors, and a cursor-position status bar. Keyboard users can move between tabs with arrow keys, Home, and End; Tab exits the code field normally. Alt+Shift+F formats the source and Ctrl/Cmd+Enter runs it.

[Prettier's browser formatter](https://prettier.io/docs/browser) and the HTML, CSS, Babel, and ESTree plugins load on demand. Source formats when the editor first opens, when a file loses focus (optional), and before Run, Copy, or Export. Formatting uses two spaces and an 80-column print width. Invalid code stays in the editor with a file-specific error; the last working preview remains available. Formatting results are discarded if the user edits or resets while they are pending. Each file has a 100,000-character formatting limit to keep the small sample editor responsive. Sample designs are unchanged.

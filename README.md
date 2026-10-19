# UI Lexicon

**Can't name it? Describe it.**

Live demo: [PASTE LIVE URL]

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

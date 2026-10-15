# Contributing

The easiest contribution is a new component. It takes about five minutes and needs no React.

## Add a component

1. Copy `content/components/drawer.json` to `content/components/<your-id>.json`.
2. Edit every field (see the table below). The `id` must match the file name.
3. Run `npm run validate`. It tells you exactly what's wrong.
4. Run `npm test` and `npm run dev`, then check your page at `/components/<your-id>/`.
5. Open a pull request.

## Fields

| Field | Notes |
|---|---|
| `id` | lowercase-kebab-case, same as the file name |
| `name` | The most common name, e.g. `Drawer` |
| `category` | `navigation`, `overlay`, `input`, `feedback`, `layout`, or `icons-assets` |
| `aliases` | Other names people use. Each name or alias may belong to only one entry |
| `looksLike` | How a **beginner would describe it** in their own words (at least 2). This powers the search, so write the way a non-developer talks |
| `definition` | One or two plain sentences |
| `whenToUse` | Short list of real use cases |
| `notConfusedWith` | Look-alikes: `{ "id": "modal", "difference": "..." }`. The `id` must be an existing entry |
| `related` | Ids of related entries |
| `prompts.short` | The token-lean prompt (see below) |
| `prompts.detailed` | The same request with the details that matter |
| `snippets` | Optional `html`, `reactTailwind`, `vue`. Each is an **array of lines** |
| `libraries` | Library name to what it calls this component |
| `a11yNotes` | Short accessibility checklist |
| `tags` | Extra search words |

## Writing a good prompt

- **Short**: one or two sentences, under 40 tokens, imperative ("Add a right-side drawer. Close on overlay click and Esc.").
- Name the component and the one or two behaviors that matter most.
- Don't lock to a framework unless the component needs it.
- **Detailed**: add sizes, animation, accessibility, and edge cases. Keep it under 500 characters.

## Writing `looksLike`

Describe what you *see*, not what it's called: "gray boxes that stand in for content while it loads", not "skeleton screen". If a beginner might type it into Google, it belongs here. After adding phrases, check that searching them finds your entry (add a case to `scripts/test-search.ts` if it's a good example).

## Code changes

- Keep `npm run validate`, `npm run typecheck`, `npm test`, and `npm run build` passing.
- Keep the UI accessible: real buttons and links, visible focus, 44px touch targets, labels on icon-only buttons.
- Use the design tokens in `src/app/globals.css` instead of raw hex values.

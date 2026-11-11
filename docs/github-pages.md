# Deploying to GitHub Pages

UI Lexicon is a fully static export, so it can be hosted on GitHub Pages. A **project site** lives under the repository name (`https://<user>.github.io/<repo>/`), so the build needs to know that prefix. Hosts that serve the site from the root (Vercel, Netlify, a custom domain, a `<user>.github.io` user site) need nothing: leave the variable unset and every URL stays exactly as it is.

## Build settings

| Variable | Value | Purpose |
|---|---|---|
| `NEXT_PUBLIC_BASE_PATH` | `/<repo>`, for example `/cmt-lexicon` | Prefix for every page, asset, link, canonical URL, `robots.txt`, sitemap entry and generated download. Unset or `/` means the host root. |
| `NEXT_PUBLIC_SITE_URL` | Origin only, for example `https://<user>.github.io` | Public origin for canonical links, social cards, the sitemap and `robots.txt`. Do not put the repository path here. |

The base path accepts letters, numbers and `. _ ~ -` in each segment (what a repository name allows). Anything else fails the build with a clear message instead of producing broken URLs. It is read at build time and inlined into the client bundle, so rebuild after changing it.

## Build and check locally

```bash
NEXT_PUBLIC_BASE_PATH=/cmt-lexicon NEXT_PUBLIC_SITE_URL=https://<user>.github.io npm run build
npm run check:base-path -- /cmt-lexicon
```

`check:base-path` inspects the `out/` folder and fails if any of these is wrong under `/cmt-lexicon/`:

- a page links to a root path outside the base path, or a prefixed URL does not resolve to a real file
- canonical, `og:url`, `og:image` or `twitter:image` URLs are not absolute, prefixed and resolvable
- `robots.txt` or the sitemap points outside the base path
- `glossary.min.json` or `llms.txt` contain unprefixed site links
- `.nojekyll` or `404.html` is missing

To look at it in a browser the way Pages serves it, put the contents of `out/` inside a folder named after the repository and serve the parent folder, for example `mkdir -p /tmp/site && cp -r out /tmp/site/cmt-lexicon && npx serve /tmp/site`, then open `http://localhost:3000/cmt-lexicon/`. `npm run dev` with `NEXT_PUBLIC_BASE_PATH` set also serves under the prefix.

## Deploy with GitHub Actions

1. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Add `.github/workflows/pages.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          NEXT_PUBLIC_BASE_PATH: /${{ github.event.repository.name }}
          NEXT_PUBLIC_SITE_URL: https://${{ github.repository_owner }}.github.io
      - run: npm run check:base-path -- /${{ github.event.repository.name }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Using the repository name from the workflow context keeps the base path correct if the repository is renamed or forked.

## Things to know

- **Custom domain or user site.** If the site is served at the root of a domain, do not set `NEXT_PUBLIC_BASE_PATH`.
- **`.nojekyll`.** `public/.nojekyll` ships in the export so branch-based Pages does not drop the `/_next` folder. The Actions flow above does not need it but it is harmless.
- **Unknown URLs.** The export includes `404.html`, which Pages serves for missing paths.
- **Community sign-in.** The GitHub sign-in redirect is built from the base path, so add `https://<user>.github.io/<repo>/community/auth/` to the Supabase redirect URL allow list (see [community-setup.md](community-setup.md)).
- **Hard-coded links.** Use `next/link` for in-app navigation (it adds the prefix itself) and `withBasePath("/path/")` from `src/lib/base-path.ts` for plain `<a>` links, downloads and redirects. `npm test` fails if a plain `<a>` points at an unprefixed root path.

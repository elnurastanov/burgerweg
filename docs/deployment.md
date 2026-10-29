# Deployment: website, PWA and landing page

The whole web presence is one **static site**, so any free static host works: Codeberg Pages, GitHub Pages,
Cloudflare Pages, Netlify and others.

```
site/
  index.html, en/index.html   landing page (German at /, English at /en/), no JavaScript
  styles.css, images/, favicon.ico, icon-192.png, apple-touch-icon.png, robots.txt, sitemap.xml
  404.html                    landing-style "page not found"
  _headers, _redirects        Cloudflare / Netlify rules (security + cache headers, question rewrite)
  app/                        the Expo web app (PWA), exported with base path /app
    question-page.html        copy of questions/[id].html, served for /app/questions/<id> via _redirects
    404.html                  copy of +not-found.html (app-style 404)
    index.html, exam.html, …  one pre-rendered HTML file per route
    _expo/static/…            hashed JS bundles
    manifest.webmanifest, sw.js, icons/
```

## Build

```bash
SITE_URL=https://your-domain.example \
REPO_URL=https://github.com/elnurastanov/burgerweg \
npm run build:site          # = node scripts/build-site.mjs
npm run serve:site          # local preview at http://localhost:8090
```

`scripts/build-site.mjs`:

1. runs `npx expo export -p web` into `dist/`, with `EXPO_PUBLIC_WEB_APP_URL=$SITE_URL/app` baked in (used for
   transfer links);
2. copies `landing/` to `site/`, replacing `{{SITE_URL}}`, `{{REPO_URL}}` and `{{YEAR}}` in HTML, XML and TXT
   files;
3. copies `dist/` to `site/app/`;
4. writes the PWA and SEO head tags (title, description, manifest, Apple touch icon, theme color, canonical) into
   the static HTML of every app page. Expo adds them at runtime via `<Head>`, but install prompts and crawlers read
   the static HTML. (A custom `src/app/+html.tsx` is **not** used: it broke Expo's dev-server script injection.)

`--skip-export` reuses an existing `dist/`, which is handy when only the landing page changed.

## Cloudflare Workers (chosen host)

The repository is connected in *Workers & Pages → Create → Workers → Import a repository*. The site is served as
**static assets only** (no server code), configured by `wrangler.jsonc`: upload `./site`, clean URLs
(`auto-trailing-slash`), and the nearest `404.html` for unknown paths.

| Build setting | Value |
| --- | --- |
| Production branch | `master` |
| Build command | `npm run build:site` |
| Deploy command | `npx wrangler deploy` (default) |
| Root directory | *(empty)* |
| Build variable | `SITE_URL` = the production URL, e.g. `https://burgerweg.example.com` (domain root, see below) |

- **`wrangler.jsonc` must stay in the repo.** Without it, `wrangler deploy` auto-detects "Expo", runs
  `expo export` again and uploads only `dist/`: the bare app at `/` without the landing page, with broken asset
  paths. This is what happened on the first deploy.
- Node comes from `.node-version` (22). Dependencies are installed from `package-lock.json`. No Python is needed:
  generated data and images are committed.
- `_redirects` (question detail rewrite) and `_headers` (`no-cache` for `sw.js`, immutable hashed bundles, security
  headers) in `site/` are applied by Cloudflare and not served as files.
- **Domain:** the site must be at a domain **root** (`https://burgerweg.example.com/`), not under a path like
  `https://example.com/burgerweg/` (see *Hosting requirements*). Add it in the Worker under
  *Settings → Domains & Routes → Custom domain*, set `SITE_URL` to it and redeploy. Progress is stored per origin, so
  settle the final domain before announcing the site.
- Without `SITE_URL` the build falls back to `CF_PAGES_URL` (only set on Cloudflare Pages) or `https://example.org`.
- The same `site/` folder also works on Cloudflare Pages (build output directory `site`), Netlify and others.
- `scripts/serve-site.mjs` imitates these rules locally. `npx wrangler dev` would be the exact runtime, but npm's
  install-script approval must allow `workerd` first.

## Hosting requirements

- Serve `site/` as the web root.
- **Clean URLs**: `/app/exam` must serve `app/exam.html`. GitHub Pages, Codeberg Pages, Cloudflare Pages and
  Netlify do this by default, Cloudflare Workers via `wrangler.jsonc`; `scripts/serve-site.mjs` imitates it locally.
- HTTPS is required for the service worker (PWA) everywhere except `localhost`.
- Unknown paths: serving `app/+not-found.html` with status 404 is nice but not required.
- If the site is **not** at the domain root (e.g. `https://user.codeberg.page/buergerweg/`), the base paths have to
  change: `experiments.baseUrl` in `app.json`, `WEB_BASE` in `src/lib/config.ts`, the manifest's `start_url`/`scope`/
  `id`/icon paths, and the absolute `/…` links in `landing/*.html`. A custom domain (or a user/organization pages
  site) avoids all of that.

## PWA details

| Piece | File |
| --- | --- |
| Manifest | `public/manifest.webmanifest` (scope and start URL `/app/`, standalone, theme `#4A4544`) |
| Icons | `public/icons/` (192, 512, maskable 512, Apple touch 180), generated by `assets/icon-src/make_icons.py` |
| Service worker | `public/sw.js`: network-first for pages (falls back to the cached page or the app shell), cache-first for static files; cache name `buergerweg-v1`, bump `VERSION` to reset |
| Registration | `src/app/_layout.tsx`, web production builds only (`!__DEV__`), scope `/app/` |

Installing on iPhone/iPad: Safari → Share → *Add to Home Screen*. On Android/desktop Chrome or Edge: the install
prompt or the install icon in the address bar.

**Storage note:** progress lives in `localStorage` of the site's origin. Changing the domain later means users
start fresh unless they move their progress with a transfer link, so pick the final domain before launch.

## Landing page

- Source: `landing/index.html` (de), `landing/en/index.html` (en), `landing/styles.css`. Plain HTML/CSS, no build
  step besides the placeholder replacement.
- Visuals: `landing/images/` is generated by `python3 scripts/landing_assets.py` (needs `pillow` and `pymupdf`)
  from the app screenshots in `scripts/shots/` and the icon artwork: phone-framed WebP screenshots, `hero.svg`,
  Open Graph cards `og-de.png` / `og-en.png`, favicons.
- To refresh screenshots: run the built site, use a 375×812 viewport, and save `de-*.jpg` / `en-*.jpg`
  (home; exam with translation on a short, friendly question with the right answer selected, currently question 6;
  flashcards answered correctly; transfer) to `scripts/shots/`. Then rerun the
  script. The same screenshots feed the F-Droid listing (`fastlane/`).
- SEO checklist (verified): titles ≤ 60 chars, descriptions ≤ 160, one `h1`, canonical + `hreflang` (de, en,
  x-default), Open Graph/Twitter cards, JSON-LD `WebApplication` + `FAQPage`, `robots.txt`, `sitemap.xml`, `alt` text
  and `width`/`height` on every image, no broken internal links.
- After deploying: submit `sitemap.xml` in Google Search Console and Bing Webmaster Tools.

## Before going live

- [ ] Choose the domain (a domain root) → `SITE_URL` build variable on the Cloudflare Worker. Repository: published.
- [ ] Decide whether a legal notice (*Impressum*) and privacy page are required for the operator, and add them to
      the landing footer.
- [ ] Update the F-Droid badge on the landing page once the app is listed (`badge-soon` → link to
      `https://f-droid.org/packages/com.buergerweg.app/`).

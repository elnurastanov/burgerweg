#!/usr/bin/env node
/**
 * Builds the deployable static website into ./site:
 *
 *   site/<base>/       ← landing page (./landing), SEO files with SITE_URL filled in
 *   site/<base>/app/   ← the Expo web app (PWA), exported with base path <base>/app
 *   site/_headers, site/_redirects  ← host rules, paths prefixed with <base>
 *
 * <base> is the path of SITE_URL: empty for https://example.com, "/burgerweg" for https://example.com/burgerweg.
 * Hosts map URL paths to files 1:1, so the site sits in that sub-folder of ./site.
 *
 * Usage:
 *   SITE_URL=https://your-domain.example node scripts/build-site.mjs           # export app + build site
 *   SITE_URL=… node scripts/build-site.mjs --skip-export                         # reuse an existing ./dist
 *
 * SITE_URL is used for canonical URLs, Open Graph tags, the sitemap and transfer links. On Cloudflare Pages
 * it falls back to CF_PAGES_URL (the deployment's own URL), which suits preview deployments; set SITE_URL
 * for production. REPO_URL is the public source repository linked from the landing page.
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const SITE_URL = (process.env.SITE_URL || process.env.CF_PAGES_URL || 'https://example.org').replace(/\/+$/, '');
const REPO_URL = process.env.REPO_URL || 'https://github.com/elnurastanov/burgerweg';
const BASE = new URL(SITE_URL).pathname.replace(/\/+$/, ''); // '' or e.g. '/burgerweg'
const out = join(root, 'site');
const content = join(out, BASE); // where the site's files go
const dist = join(root, 'dist');

if (!process.env.SITE_URL) console.warn(`⚠ SITE_URL is not set; using ${SITE_URL}. Set it for production deployments.`);
if (!process.env.REPO_URL) console.warn(`⚠ REPO_URL is not set; linking the source code to ${REPO_URL}.`);

if (!process.argv.includes('--skip-export')) {
  rmSync(dist, { recursive: true, force: true });
  execSync('npx expo export -p web', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, EXPO_NO_TELEMETRY: '1', EXPO_PUBLIC_WEB_APP_URL: `${SITE_URL}/app`, EXPO_PUBLIC_BASE_PATH: BASE },
  });
}
if (!existsSync(dist)) throw new Error('No ./dist found. Run without --skip-export first.');

rmSync(out, { recursive: true, force: true });

// 1. Landing page, with {{SITE_URL}} and {{YEAR}} filled in for text files, and root-relative links
//    (href="/…", src="/…") moved under BASE.
cpSync(join(root, 'landing'), content, { recursive: true });
walk(content, (file) => {
  if (!/\.(html|xml|txt|webmanifest|json)$/.test(file)) return;
  let text = readFileSync(file, 'utf8');
  text = text.replaceAll('{{SITE_URL}}', SITE_URL).replaceAll('{{YEAR}}', String(new Date().getFullYear())).replaceAll('{{REPO_URL}}', REPO_URL);
  if (file.endsWith('.html')) text = text.replace(/\b(href|src)="\/(?!\/)/g, `$1="${BASE}/`);
  writeFileSync(file, text);
});

// Host rules belong at the root of ./site; their paths get the BASE prefix.
for (const name of ['_headers', '_redirects']) {
  const lines = readFileSync(join(content, name), 'utf8').split('\n');
  rmSync(join(content, name));
  const prefixed = lines.map((line) =>
    name === '_headers'
      ? line.replace(/^\//, `${BASE}/`)
      : line.replace(/^(\/\S*)(\s+)(\/\S*)/, (_, from, gap, to) => `${BASE}${from}${gap}${BASE}${to}`),
  );
  if (name === '_redirects' && BASE) prefixed.push(`/  ${BASE}/  302`);
  writeFileSync(join(out, name), prefixed.join('\n'));
}

// 2. The web app under /app. Hosts can't serve "questions/[id].html" for /app/questions/<id> on their own,
//    so the template gets a plain name that _redirects rewrites to; the app's 404 page lives at app/404.html.
const app = join(content, 'app');
cpSync(dist, app, { recursive: true });
cpSync(join(app, 'questions', '[id].html'), join(app, 'question-page.html'));
cpSync(join(app, '+not-found.html'), join(app, '404.html'));
const manifest = join(app, 'manifest.webmanifest');
writeFileSync(manifest, readFileSync(manifest, 'utf8').replaceAll('"/app/', `"${BASE}/app/`));

// 3. PWA + SEO tags in the static HTML of every app page. Expo adds them at runtime via <Head>,
//    but install prompts and crawlers read the static HTML.
const headTags = [
  '<title>Bürgerweg – Einbürgerungstest App</title>',
  '<meta name="description" content="Kostenlos und ruhig für den Einbürgerungstest lernen: alle 310 Fragen, Testsimulation, Lernkarten. Ohne Konto, offline.">',
  '<meta name="theme-color" content="#4A4544">',
  `<link rel="manifest" href="${BASE}/app/manifest.webmanifest">`,
  `<link rel="apple-touch-icon" href="${BASE}/app/icons/apple-touch-icon.png">`,
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-title" content="Bürgerweg">',
  `<link rel="canonical" href="${SITE_URL}/app/">`,
].join('');
walk(app, (file) => {
  if (!file.endsWith('.html')) return;
  const html = readFileSync(file, 'utf8');
  if (!html.includes('rel="manifest"')) writeFileSync(file, html.replace('</head>', `${headTags}</head>`));
});

console.log(`✓ Site built in ./site for ${SITE_URL}  (landing at ${BASE}/, app at ${BASE}/app/)`);

function walk(dir, fn) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, fn);
    else fn(p);
  }
}

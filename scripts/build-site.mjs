#!/usr/bin/env node
/**
 * Builds the deployable static website into ./site:
 *
 *   site/            ← landing page (./landing), SEO files with SITE_URL filled in
 *   site/app/        ← the Expo web app (PWA), exported with base path /app
 *
 * Usage:
 *   SITE_URL=https://your-domain.example node scripts/build-site.mjs           # export app + build site
 *   SITE_URL=… node scripts/build-site.mjs --skip-export                         # reuse an existing ./dist
 *
 * SITE_URL is used for canonical URLs, Open Graph tags, the sitemap and transfer links.
 * REPO_URL is the public source repository linked from the landing page.
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const SITE_URL = (process.env.SITE_URL || 'https://example.org').replace(/\/+$/, '');
const REPO_URL = process.env.REPO_URL || 'https://github.com/elnurastanov/burgerweg';
const out = join(root, 'site');
const dist = join(root, 'dist');

if (!process.env.SITE_URL) console.warn('⚠ SITE_URL is not set; using https://example.org. Set it before deploying.');
if (!process.env.REPO_URL) console.warn(`⚠ REPO_URL is not set; linking the source code to ${REPO_URL}.`);

if (!process.argv.includes('--skip-export')) {
  rmSync(dist, { recursive: true, force: true });
  execSync('npx expo export -p web', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, EXPO_NO_TELEMETRY: '1', EXPO_PUBLIC_WEB_APP_URL: `${SITE_URL}/app` },
  });
}
if (!existsSync(dist)) throw new Error('No ./dist found. Run without --skip-export first.');

rmSync(out, { recursive: true, force: true });

// 1. Landing page, with {{SITE_URL}} and {{YEAR}} filled in for text files.
cpSync(join(root, 'landing'), out, { recursive: true });
walk(out, (file) => {
  if (!/\.(html|xml|txt|webmanifest|json)$/.test(file)) return;
  const text = readFileSync(file, 'utf8');
  writeFileSync(file, text.replaceAll('{{SITE_URL}}', SITE_URL).replaceAll('{{YEAR}}', String(new Date().getFullYear())).replaceAll('{{REPO_URL}}', REPO_URL));
});

// 2. The web app under /app.
cpSync(dist, join(out, 'app'), { recursive: true });

// 3. PWA + SEO tags in the static HTML of every app page. Expo adds them at runtime via <Head>,
//    but install prompts and crawlers read the static HTML.
const headTags = [
  '<title>Bürgerweg – Einbürgerungstest App</title>',
  '<meta name="description" content="Kostenlos und ruhig für den Einbürgerungstest lernen: alle 310 Fragen, Testsimulation, Lernkarten. Ohne Konto, offline.">',
  '<meta name="theme-color" content="#4A4544">',
  '<link rel="manifest" href="/app/manifest.webmanifest">',
  '<link rel="apple-touch-icon" href="/app/icons/apple-touch-icon.png">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-title" content="Bürgerweg">',
  `<link rel="canonical" href="${SITE_URL}/app/">`,
].join('');
walk(join(out, 'app'), (file) => {
  if (!file.endsWith('.html')) return;
  const html = readFileSync(file, 'utf8');
  if (!html.includes('rel="manifest"')) writeFileSync(file, html.replace('</head>', `${headTags}</head>`));
});

console.log(`✓ Site built in ./site for ${SITE_URL}  (landing at /, app at /app/)`);

function walk(dir, fn) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, fn);
    else fn(p);
  }
}

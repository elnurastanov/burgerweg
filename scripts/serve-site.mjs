#!/usr/bin/env node
/**
 * Serves ./site locally the way Cloudflare Pages does: clean URLs (/app/exam → /app/exam.html), the
 * question rewrite from _redirects, and the nearest 404.html with status 404. A site built for a sub-path
 * (SITE_URL=https://example.com/burgerweg) is served at http://localhost:8090/burgerweg/.
 * Usage: node scripts/serve-site.mjs [port]   (default 8090)
 */
import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = join(new URL('..', import.meta.url).pathname, 'site');
const port = Number(process.argv[2] || 8090);
// Sub-path the site was built for: the folder holding the landing page when ./site has no index.html.
const base = existsSync(join(root, 'index.html'))
  ? ''
  : `/${readdirSync(root).find((name) => existsSync(join(root, name, 'index.html'))) ?? ''}`.replace(/\/$/, '');
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain', '.ttf': 'font/ttf',
};

function resolve(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const base = join(root, clean);
  for (const candidate of [base, `${base}.html`, join(base, 'index.html')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

// Nearest 404.html, walking up from the requested path (like Cloudflare's "404-page" handling).
function notFound(urlPath) {
  const parts = urlPath.split('/').filter(Boolean);
  for (let i = parts.length; i >= 0; i--) {
    const file = resolve(`/${parts.slice(0, i).join('/')}/404.html`.replace('//', '/'));
    if (file) return file;
  }
  return null;
}

createServer((req, res) => {
  const path = (req.url || '/').split('?')[0];
  const rewritten = path.replace(/^(.*\/app)\/questions\/[^/]+\/?$/, '$1/question-page');
  const found = resolve(rewritten);
  if (!found && path === '/' && base) return res.writeHead(302, { Location: `${base}/` }).end();
  const file = found || notFound(path);
  if (!file) return res.writeHead(404).end('Not found');
  res.writeHead(found ? 200 : 404, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Serving ./site at http://localhost:${port}${base}/`));

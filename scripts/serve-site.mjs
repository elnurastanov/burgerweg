#!/usr/bin/env node
/**
 * Serves ./site locally the way Cloudflare Pages does: clean URLs (/app/exam → /app/exam.html), the
 * question rewrite from _redirects, and the nearest 404.html with status 404.
 * Usage: node scripts/serve-site.mjs [port]   (default 8090)
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = join(new URL('..', import.meta.url).pathname, 'site');
const port = Number(process.argv[2] || 8090);
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

createServer((req, res) => {
  const path = (req.url || '/').split('?')[0];
  const rewritten = /^\/app\/questions\/[^/]+\/?$/.test(path) ? '/app/question-page' : path;
  const found = resolve(rewritten);
  const file = found || resolve(path.startsWith('/app/') ? '/app/404.html' : '/404.html');
  if (!file) return res.writeHead(404).end('Not found');
  res.writeHead(found ? 200 : 404, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Serving ./site at http://localhost:${port}`));

#!/usr/bin/env node
/**
 * Serves ./site locally the way static hosts do (clean URLs: /app/exam → /app/exam.html).
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
  const file = resolve(req.url || '/') || resolve('/app/+not-found');
  if (!file) return res.writeHead(404).end('Not found');
  res.writeHead(file.endsWith('+not-found.html') ? 404 : 200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Serving ./site at http://localhost:${port}`));

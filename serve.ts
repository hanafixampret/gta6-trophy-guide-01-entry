// A tiny static server for app/ (Node 22, standard library only), so the guide
// can be run locally without a build step: `node serve.ts` serves app/ on
// http://localhost:8080 (`--port <n>` for another port). It sends the MIME types
// a browser needs, refuses any path outside app/, and otherwise does nothing
// clever: this is a development convenience, not a web server for the internet.
import { createReadStream, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const requested = portIndex === -1 ? 8080 : Number(args[portIndex + 1]);
const port = Number.isInteger(requested) && requested > 0 && requested < 65536 ? requested : 8080;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

// v3: fail fast at startup if the guide data is broken — 55 trophies, every
// trophy with at least one cited step, every step naming a listed source.
{
  const trophies = JSON.parse(readFileSync(join(root, 'data', 'trophies.json'), 'utf-8'));
  const steps = JSON.parse(readFileSync(join(root, 'data', 'steps.json'), 'utf-8'));
  const known = new Set((steps.sources || []).map((s) => s.id));
  if (!Array.isArray(trophies.trophies) || trophies.trophies.length !== 55) {
    console.error(`data error: trophies.json must list 55 trophies, found ${trophies.trophies?.length}`);
    process.exit(1);
  }
  let total = 0;
  for (const t of trophies.trophies) {
    const list = (steps.trophies || {})[String(t.id)]?.steps || [];
    if (!list.length) {
      console.error(`data error: trophy ${t.id} (${t.name}) has no cited steps`);
      process.exit(1);
    }
    for (const s of list) {
      if (typeof s.s !== 'string' || !known.has(s.s)) {
        console.error(`data error: trophy ${t.id} has a step with an unknown source: ${JSON.stringify(s.s)}`);
        process.exit(1);
      }
      total += 1;
    }
  }
  console.log(`data: 55 trophies, ${total} cited steps, ${known.size} sources (checked ${steps.checked})`);
}

createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400).end('bad request');
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = resolve(join(root, normalize(pathname)));
  if (file !== root && !file.startsWith(root + sep)) {
    response.writeHead(403).end('forbidden');
    return;
  }
  let size: number;
  try {
    const stats = statSync(file);
    if (!stats.isFile()) throw new Error('not a file');
    size = stats.size;
  } catch {
    response.writeHead(404).end('not found');
    return;
  }
  response.writeHead(200, {
    'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'content-length': size,
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`app/ is on http://localhost:${port}`);
});

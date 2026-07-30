#!/usr/bin/env node
/** Static server for the preview gallery. No dependencies — the gallery is
 *  plain HTML, and it only needs a server because ES modules will not load
 *  over file://. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT) || 4321;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path === '/') path = '/preview/index.html';

  // Keep traversal inside the repo.
  const file = join(root, normalize(path).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(root)) {
    res.writeHead(403).end('forbidden');
    return;
  }

  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});

/* A busy port is the normal case, not an exception — a preview server from an
   earlier session, or one a headless screenshot run left behind. Walk up to the
   next free port instead of dying on an unhandled 'error' event.

   The success handler is registered ONCE, outside the retry, and reads the port
   back off the server. Passing a callback to listen() per attempt leaves the
   un-fired callback from the failed attempt still registered, so a retry prints
   a line for every port it tried. Console text stays ASCII: the Windows console
   is not UTF-8 by default and turns an em-dash into mojibake. */
let attempts = 0;

server.on('listening', () => {
  const actual = server.address().port;
  console.log(`preview  http://localhost:${actual}/preview/index.html`);
  if (actual !== port) {
    console.log(`(port ${port} was busy - something else is still serving there)`);
  }
});

server.on('error', (err) => {
  if (err.code !== 'EADDRINUSE') throw err;
  if (++attempts > 10) {
    console.error(`\nPorts ${port}-${port + 10} are all in use.`);
    console.error(`Free one, or choose your own:  PORT=5000 npm run preview\n`);
    process.exit(1);
  }
  const next = port + attempts;
  console.warn(`port ${next - 1} is in use, trying ${next}`);
  server.listen(next);
});

server.listen(port);

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

/* A busy port is a real error, not something to route around. This server used
   to walk up to the next free port, which reads as friendly but hid the actual
   problem. A headless screenshot run backgrounds this script with its output
   discarded, so when the session ended the server stayed up. The next run found
   4321 busy, took 4322 without anyone seeing the warning, and so on - seven
   abandoned servers across 4321-4327 before it was noticed. The port was never
   the problem; the fallback just made the leak invisible.

   Failing here surfaces a stale server on the first collision instead of the
   seventh. A second server is still available, but you have to ask for it:
   PORT=5000 npm run preview.

   Console text stays ASCII: the Windows console is not UTF-8 by default and
   turns an em-dash into mojibake. */

server.on('listening', () => {
  console.log(`preview  http://localhost:${server.address().port}/preview/index.html`);
});

server.on('error', (err) => {
  if (err.code !== 'EADDRINUSE') throw err;
  console.error(`\nPort ${port} is already in use.`);
  console.error(`Most likely a preview server from an earlier session is still running.`);
  console.error(`\nFind it:`);
  console.error(`  Windows    Get-NetTCPConnection -LocalPort ${port} -State Listen | Select-Object OwningProcess`);
  console.error(`  macOS/Lnx  lsof -iTCP:${port} -sTCP:LISTEN`);
  console.error(`\nStop it, or pick another port:  PORT=5000 npm run preview\n`);
  process.exit(1);
});

server.listen(port);

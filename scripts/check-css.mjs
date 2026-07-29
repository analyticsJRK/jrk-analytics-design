#!/usr/bin/env node
/**
 * Structural check over the CSS library.
 *
 *   1. Braces balance in every file (catches a selector list running into an
 *      @media block, which silently kills every rule after it).
 *   2. Every var(--jrk-…) a component references is actually defined in
 *      dist/jrk-tokens.css or declared locally. A typo'd token name is
 *      invisible in the browser — the property just does not apply — so this
 *      is the check that earns its keep.
 *   3. No raw hex outside the token layer. Components must go through tokens
 *      or the theme toggle will not reach them.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith('.css')) out.push(p);
  }
  return out;
}

const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const declared = (s) => [...s.matchAll(/(--jrk-[\w-]+)\s*:/g)].map((m) => m[1]);

const files = walk(join(root, 'css'));

// A token counts as defined if it is declared anywhere the consumer will load:
// the generated token layer, or any file in css/ (base.css declares
// --jrk-transition, which every component references).
const sources = files.map((f) => [f, strip(readFileSync(f, 'utf8'))]);
const tokensCss = readFileSync(join(root, 'dist/jrk-tokens.css'), 'utf8');
const defined = new Set([
  ...declared(tokensCss),
  ...sources.flatMap(([, src]) => declared(src)),
]);

let failures = 0;
const fail = (m) => { console.error(`  FAIL  ${m}`); failures++; };

console.log(`checking ${files.length} css files against ${defined.size} defined tokens\n`);

for (const [file, src] of sources) {
  const rel = relative(root, file).replace(/\\/g, '/');

  // ---- 1. brace balance
  const open = (src.match(/\{/g) || []).length;
  const close = (src.match(/\}/g) || []).length;
  if (open !== close) fail(`${rel}: ${open} '{' vs ${close} '}' — unbalanced`);

  // A selector line ending in a comma immediately before an at-rule is the
  // specific mistake that swallows a whole block.
  const runIn = src.match(/,\s*\n\s*@[a-z-]+/);
  if (runIn) fail(`${rel}: selector list runs into an at-rule — "${runIn[0].trim().slice(0, 40)}…"`);

  // ---- 2. undefined token references
  // Locally declared custom properties (--series, --btn-h, …) are legitimate,
  // and so is var(--x, fallback): the fallback makes the token an optional
  // per-instance override (--jrk-bars-label, --jrk-grid-min) rather than a
  // dependency. Only a bare, undeclared reference is a typo.
  const local = new Set([...src.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  for (const m of src.matchAll(/var\(\s*(--jrk-[\w-]+)\s*(,?)/g)) {
    const [, name, hasFallback] = m;
    if (hasFallback) continue;
    if (!defined.has(name) && !local.has(name)) {
      fail(`${rel}: var(${name}) is declared nowhere — typo?`);
    }
  }

  // ---- 3. raw hex outside the token layer
  // Pure white/black are allowed: a label on a solid accent fill and the knob
  // of a switch are fixed against their own fill, not against the theme.
  for (const m of src.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    const hex = m[0].toLowerCase();
    if (hex === '#ffffff' || hex === '#fff' || hex === '#000' || hex === '#000000') continue;
    // data: URIs carry their own encoded colors and are checked by eye.
    const before = src.slice(Math.max(0, m.index - 80), m.index);
    if (before.includes('data:image/svg+xml') || before.includes('%23')) continue;
    fail(`${rel}: raw hex ${m[0]} — use a token so the theme toggle reaches it`);
  }
}

console.log(failures ? `\nFAILED — ${failures} problem(s)\n` : '\nOK — css structure, token references, and hex discipline all clean\n');
process.exit(failures ? 1 : 0);

#!/usr/bin/env node
/**
 * Prepares a DesignSync push and prints the canonical file list.
 *
 *   npm run sync:check
 *
 * Why this exists: the push to claude.ai is manual and one-way, and `dist/` is
 * generated. The silent failure mode is pushing preview pages that reference a
 * `dist/jrk-tokens.css` you never rebuilt — the gallery on claude.ai then renders
 * with stale colors while the repo is correct, and nothing anywhere says so.
 *
 * This script does not push. It verifies the tree is publishable and emits the
 * exact path list, so the push is reproducible instead of remembered.
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sh = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8' }).trim();

/* The set of paths the design-system project mirrors. Keep in step with the
 * `writes` globs passed to finalize_plan — this list IS the plan. */
const PUBLISH = [
  'preview/*.html',
  'preview/preview.css',
  'preview/preview.js',
  'css/index.css',
  'css/base.css',
  'css/components/*.css',
  'dist/jrk-tokens.css',
  'dist/jrk-theme.tailwind.css',
  'dist/tokens.ts',
  'tokens/tokens.json',
  'react/src/*.ts',
  'react/src/*.tsx',
  'scripts/*.mjs',
  'README.md',
  'package.json',
  'tsconfig.json',
];

/* Blocked by the sync tool regardless of the plan: these carry instructions to
 * the design agent. They travel via git only — that is the correct home for a
 * skill anyway, since a design-system project is not where a skill is consumed. */
const NEVER_PUBLISH = ['.claude/**', 'CLAUDE.md'];

let problems = 0;
const fail = (m) => { console.error(`  FAIL  ${m}`); problems++; };
const warn = (m) => { console.warn(`  WARN  ${m}`); };

console.log('\n=== 1. is dist/ current? ===');
// Rebuild and see whether anything moved. Cheaper and more reliable than
// comparing mtimes, and it works whether or not dist/ is committed yet.
const before = new Map();
for (const f of ['dist/jrk-tokens.css', 'dist/jrk-theme.tailwind.css', 'dist/tokens.ts']) {
  const p = join(root, f);
  before.set(f, existsSync(p) ? readFileSync(p, 'utf8') : null);
}
execFileSync(process.execPath, [join(root, 'scripts/build-tokens.mjs')], { cwd: root, stdio: 'pipe' });
let rebuilt = 0;
for (const [f, prev] of before) {
  const now = readFileSync(join(root, f), 'utf8');
  if (prev === null) { warn(`${f} did not exist — generated now`); rebuilt++; }
  else if (prev !== now) { warn(`${f} was STALE — rebuilt`); rebuilt++; }
}
if (!rebuilt) console.log('  pass  dist/ already matched tokens/tokens.json');
else console.log(`  note  ${rebuilt} generated file(s) refreshed — push these, not the old ones`);

console.log('\n=== 2. do the gates pass? ===');
for (const [label, script] of [['check:css', 'check-css.mjs'], ['validate', 'validate-colors.mjs']]) {
  try {
    execFileSync(process.execPath, [join(root, 'scripts', script)], { cwd: root, stdio: 'pipe' });
    console.log(`  pass  ${label}`);
  } catch {
    fail(`${label} — fix before publishing; do not ship a failing palette`);
  }
}

console.log('\n=== 3. is the repo the source of truth? ===');
// Publishing something that is not committed means git and claude.ai disagree,
// and git is the one people diff.
let dirty = '';
try { dirty = sh('git', ['status', '--porcelain', '--untracked-files=no']); } catch {}
if (dirty) {
  warn('uncommitted changes — commit first, or claude.ai will hold content git does not:');
  dirty.split('\n').slice(0, 12).forEach((l) => console.warn(`          ${l}`));
} else {
  console.log('  pass  working tree clean');
}

console.log('\n=== 4. every preview page carries a card marker? ===');
// The Design System pane builds its card index from this first-line comment.
// A page without one uploads fine and then never appears as a card.
for (const f of globSync('preview/*.html', { cwd: root })) {
  const first = readFileSync(join(root, f), 'utf8').split('\n', 1)[0];
  if (!/^<!--\s*@dsCard\s/.test(first)) fail(`${f} has no first-line @dsCard marker — it will not appear as a card`);
}
if (!problems) console.log('  pass  all preview pages marked');

console.log('\n=== 5. paths to publish ===');
const files = PUBLISH.flatMap((g) => globSync(g, { cwd: root })).sort();
files.forEach((f) => console.log(`  ${f.replace(/\\/g, '/')}`));
console.log(`\n  ${files.length} files`);
console.log(`  blocked by the sync tool (git only): ${NEVER_PUBLISH.join(', ')}`);

console.log(
  problems
    ? `\nNOT READY — ${problems} problem(s) to fix first\n`
    : '\nREADY — ask Claude in this repo to "sync the design system" and approve the plan\n',
);
process.exit(problems ? 1 : 0);

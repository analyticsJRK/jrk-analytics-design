#!/usr/bin/env node
/**
 * Pre-flight for a Design System sync.
 *
 *   npm run sync:check
 *
 * The sync itself is the `.design-sync` pipeline (`/design-sync`, driven by the
 * tooling in `.ds-sync/`), which builds the package and pushes component docs
 * and preview cards. This script does not push. It checks the things that fail
 * SILENTLY — where the repo and the published project drift without anything
 * saying so.
 *
 * Every check here exists because it has actually gone wrong at least once.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sh = (c, a) => execFileSync(c, a, { cwd: root, encoding: 'utf8' }).trim();

let problems = 0;
const fail = (m) => { console.error(`  FAIL  ${m}`); problems++; };
const warn = (m) => console.warn(`  WARN  ${m}`);
const pass = (m) => console.log(`  pass  ${m}`);

/* 1. Generated output current. dist/ and guides/ are both derived; publishing a
      stale copy means the project shows old colours while the repo is correct,
      and nothing anywhere reports it. */
console.log('\n=== 1. generated output current ===');
const snap = (f) => (existsSync(join(root, f)) ? readFileSync(join(root, f), 'utf8') : null);
const watched = ['dist/jrk-tokens.css', 'dist/icons.ts', 'guides/tokens.md', 'guides/jrk-design-overview.md'];
const before = new Map(watched.map((f) => [f, snap(f)]));
execFileSync(process.execPath, [join(root, 'scripts/build-tokens.mjs')], { cwd: root, stdio: 'pipe' });
execFileSync(process.execPath, [join(root, 'scripts/build-guides.mjs')], { cwd: root, stdio: 'pipe' });
let moved = 0;
for (const f of watched) {
  if (before.get(f) !== snap(f)) { warn(`${f} was STALE — regenerated`); moved++; }
}
if (!moved) pass('dist/ and guides/ already matched their sources');

/* 2. The gates. Never publish a failing palette as the team's reference. */
console.log('\n=== 2. gates ===');
// validate:skin is a separate gate because validate-colors.mjs measures against
// $meta.surfaces — one hex per theme — and a skin's page can be a gradient. It
// belongs here for the same reason the other two do: a skin ships to the app
// through the same vendored css/ and dist/ directories.
for (const [label, script] of [['check:css', 'check-css.mjs'], ['validate', 'validate-colors.mjs'], ['validate:skin', 'validate-skin.mjs']]) {
  try {
    execFileSync(process.execPath, [join(root, 'scripts', script)], { cwd: root, stdio: 'pipe' });
    pass(label);
  } catch {
    fail(`${label} — fix before publishing`);
  }
}

/* 3. Every export has a doc and a preview card, or it silently never appears in
      the Design System pane. */
console.log('\n=== 3. component coverage ===');
const index = readFileSync(join(root, 'react/src/index.ts'), 'utf8');
const exported = new Set();
for (const m of index.matchAll(/export \{([^}]*)\} from/g)) {
  for (const raw of m[1].split(',')) {
    const n = raw.trim();
    if (/^[A-Z][A-Za-z]*$/.test(n) && n !== 'STATUS_ICON') exported.add(n);
  }
}
const docs = new Set(readdirSync(join(root, '.design-sync/docs')).map((f) => f.replace(/\.md$/, '')));
const previews = new Set(readdirSync(join(root, '.design-sync/previews')).map((f) => f.replace(/\.tsx$/, '')));
const missing = [...exported].filter((n) => !docs.has(n) || !previews.has(n)).sort();
if (missing.length) {
  for (const n of missing) {
    fail(`${n} exported but missing ${!docs.has(n) ? '.design-sync/docs/' + n + '.md' : ''}${!docs.has(n) && !previews.has(n) ? ' and ' : ''}${!previews.has(n) ? '.design-sync/previews/' + n + '.tsx' : ''}`);
  }
} else {
  pass(`all ${exported.size} exported components have a doc and a preview`);
}
const orphans = [...docs].filter((n) => !exported.has(n) && n !== 'index').sort();
if (orphans.length) warn(`docs with no matching export (renamed or removed?): ${orphans.join(', ')}`);

/* 4. The repo is the source of truth. Publishing uncommitted work means git and
      the project disagree, and git is what people diff. */
console.log('\n=== 4. working tree ===');
let dirty = '';
try { dirty = sh('git', ['status', '--porcelain', '--untracked-files=no']); } catch {}
if (dirty) {
  warn('uncommitted changes — commit before publishing:');
  dirty.split('\n').slice(0, 12).forEach((l) => console.warn(`          ${l}`));
} else {
  pass('clean');
}

console.log(
  problems
    ? `\nNOT READY — ${problems} problem(s)\n`
    : '\nREADY — run /design-sync to publish\n',
);
process.exit(problems ? 1 : 0);

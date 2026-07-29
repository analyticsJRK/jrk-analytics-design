#!/usr/bin/env node
/**
 * Gates every color in tokens/tokens.json.
 *
 *   - Categorical chart palette -> the dataviz six-checks, both modes, both
 *     pairlists (adjacent for bars/lines/stacks, all-pairs for the scatter cap).
 *   - Text, status, accent, focus -> WCAG contrast against the surface each
 *     one actually renders on.
 *
 * Exits non-zero on any hard failure. Wire into CI: `npm run validate`.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const T = JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8'));

// The validator ships with the dataviz skill. Point JRK_DATAVIZ at the skill
// directory to run the full six-checks; without it we still run WCAG contrast.
const skillDir = process.env.JRK_DATAVIZ || join(root, 'vendor/dataviz');
const validator = join(skillDir, 'scripts/validate_palette.js');
const hasValidator = existsSync(validator);

let failures = 0;
let warnings = 0;
const fail = (m) => { console.error(`  FAIL  ${m}`); failures++; };
const warn = (m) => { console.warn(`  WARN  ${m}`); warnings++; };
const pass = (m) => console.log(`  pass  ${m}`);

// ---------- WCAG contrast (self-contained, so this runs without the skill) ----------
const srgb = (h) => {
  const v = h.replace('#', '');
  const n = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
};
const lum = (h) => {
  const [r, g, b] = srgb(h).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

const SURFACE = T.$meta.surfaces;
const CANVAS = { light: T.color.surface.canvas.light, dark: T.color.surface.canvas.dark };

console.log('\n== WCAG contrast ==');

// Body text must clear 4.5:1 on BOTH the card surface and the page plane.
for (const key of ['primary', 'secondary', 'muted', 'link']) {
  const t = T.color.text[key];
  for (const mode of ['light', 'dark']) {
    for (const [bgName, bg] of [['surface', SURFACE[mode]], ['canvas', CANVAS[mode]]]) {
      const c = contrast(t[mode], bg);
      const msg = `text.${key} ${mode} on ${bgName} ${c.toFixed(2)}:1`;
      c >= 4.5 ? pass(msg) : fail(`${msg} — needs 4.5:1 for body text`);
    }
  }
}

// Status: `text` steps are read as text (4.5:1). `mark` steps are non-text
// marks (3:1) — warning/serious sit below on light BY DESIGN, mitigated by the
// mandatory icon + label pairing, so those are warnings, not failures.
for (const [name, parts] of Object.entries(T.color.status)) {
  if (name.startsWith('$')) continue;
  for (const mode of ['light', 'dark']) {
    const ct = contrast(parts.text[mode], SURFACE[mode]);
    ct >= 4.5 ? pass(`status.${name}.text ${mode} ${ct.toFixed(2)}:1`)
              : fail(`status.${name}.text ${mode} ${ct.toFixed(2)}:1 — needs 4.5:1`);

    const cm = contrast(parts.mark[mode], SURFACE[mode]);
    cm >= 3 ? pass(`status.${name}.mark ${mode} ${cm.toFixed(2)}:1`)
            : warn(`status.${name}.mark ${mode} ${cm.toFixed(2)}:1 — sub-3:1, icon + label pairing is mandatory`);

    // Soft badge: the text step must be legible on its own wash, not just the surface.
    const cw = contrast(parts.text[mode], parts.wash[mode]);
    cw >= 4.5 ? pass(`status.${name} text-on-wash ${mode} ${cw.toFixed(2)}:1`)
              : fail(`status.${name} text-on-wash ${mode} ${cw.toFixed(2)}:1 — needs 4.5:1`);
  }
}

// Solid accent button: the label sits on the fill, so check that pair.
for (const mode of ['light', 'dark']) {
  const c = contrast(T.color.text.inverse[mode], T.color.accent.solid[mode]);
  c >= 4.5 ? pass(`accent.solid + text.inverse ${mode} ${c.toFixed(2)}:1`)
           : fail(`accent.solid + text.inverse ${mode} ${c.toFixed(2)}:1 — needs 4.5:1`);

  const cw = contrast(T.color.accent.washText[mode], T.color.accent.wash[mode]);
  cw >= 4.5 ? pass(`accent.washText on accent.wash ${mode} ${cw.toFixed(2)}:1`)
            : fail(`accent.washText on accent.wash ${mode} ${cw.toFixed(2)}:1 — needs 4.5:1`);
}

// Focus ring is a non-text UI indicator: 3:1 against every surface it lands on.
for (const mode of ['light', 'dark']) {
  for (const [n, bg] of [['surface', SURFACE[mode]], ['canvas', CANVAS[mode]], ['subtle', T.color.surface.subtle[mode]]]) {
    const c = contrast(T.color.focus.ring[mode], bg);
    c >= 3 ? pass(`focus.ring ${mode} on ${n} ${c.toFixed(2)}:1`)
           : fail(`focus.ring ${mode} on ${n} ${c.toFixed(2)}:1 — needs 3:1`);
  }
}

// ---------- dataviz six-checks ----------
console.log('\n== categorical palette (dataviz six-checks) ==');
if (!hasValidator) {
  warn(`validator not found at ${validator}`);
  warn('set JRK_DATAVIZ=<dataviz skill dir> to run the full six-checks (band, chroma, CVD, normal-vision floor, contrast)');
} else {
  const slots = T.chart.categorical.slots;
  const cap = T.chart.categorical.seriesCapAllPairs;

  const runs = [
    { label: 'light, adjacent (bars/lines/stacks)', list: slots.map((s) => s.light), mode: 'light', pairs: 'adjacent' },
    { label: 'dark, adjacent (bars/lines/stacks)', list: slots.map((s) => s.dark), mode: 'dark', pairs: 'adjacent' },
    { label: `light, all-pairs (first ${cap} — scatter cap)`, list: slots.slice(0, cap).map((s) => s.light), mode: 'light', pairs: 'all' },
    { label: `dark, all-pairs (first ${cap} — scatter cap)`, list: slots.slice(0, cap).map((s) => s.dark), mode: 'dark', pairs: 'all' },
  ];

  for (const r of runs) {
    const args = [validator, r.list.join(','), '--mode', r.mode, '--surface', SURFACE[r.mode]];
    if (r.pairs === 'all') args.push('--pairs', 'all');
    try {
      const out = execFileSync(process.execPath, args, { encoding: 'utf8' });
      console.log(`\n  -- ${r.label} --`);
      for (const line of out.split('\n')) {
        const t = line.trim();
        if (t.startsWith('[PASS]') || t.startsWith('[WARN]') || t.startsWith('[FAIL]')) console.log(`  ${t}`);
      }
      if (out.includes('[WARN]')) warnings++;
      pass(`${r.label} — no hard failure`);
    } catch (e) {
      console.log(e.stdout || '');
      fail(`${r.label} — validator reported a hard failure`);
    }
  }

  // The relief list must match what the validator actually flags, or the docs lie.
  console.log('\n== relief list vs measured ==');
  const measured = slots.filter((s) => contrast(s.light, SURFACE.light) < 3).map((s) => s.light);
  const declared = [...T.chart.categorical.reliefRequired.light].sort();
  JSON.stringify(measured.sort()) === JSON.stringify(declared)
    ? pass(`reliefRequired.light matches measured sub-3:1 slots (${measured.length})`)
    : fail(`reliefRequired.light is stale — declared [${declared}] but measured [${measured.sort()}]`);
}

// ---------- ordinal ramp floor ----------
console.log('\n== sequential ramp ==');
{
  const steps = T.chart.sequential.steps;
  const ls = steps.map(lum);
  const monotone = ls.every((v, i) => i === 0 || v < ls[i - 1]);
  monotone ? pass('sequential steps are monotonically darkening')
           : fail('sequential steps are not monotonic — a sequential ramp must read light -> dark');

  for (const [mode, hex] of Object.entries(T.chart.sequential.ordinalFloor)) {
    if (mode === 'note') continue;
    const c = contrast(hex, SURFACE[mode]);
    c >= 2 ? pass(`ordinal floor ${mode} ${hex} ${c.toFixed(2)}:1`)
           : fail(`ordinal floor ${mode} ${hex} ${c.toFixed(2)}:1 — needs 2:1`);
  }
}

console.log(`\n${failures ? 'FAILED' : 'OK'} — ${failures} failure(s), ${warnings} warning(s)\n`);
if (warnings && !failures) {
  console.log('Warnings above are the documented relief cases: sub-3:1 marks ship with');
  console.log('visible direct labels or a table view, and status colors with an icon + label.\n');
}
process.exit(failures ? 1 : 0);

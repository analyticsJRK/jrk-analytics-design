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
import { CVD_FLOOR, worstAdjacent, worstSeparation, allPairsSafeCap } from './cvd.mjs';

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

// ---------- the constants this file measures against ----------
// A validator cannot check its own constant, which is exactly how $meta.surfaces
// stayed at #1c1c1e for as long as it did: every dark ratio below was computed
// against a card that no longer existed and read ~8% high, with nothing to say
// so. chart.chrome.surface had the same drift and worse consequences — it is
// STROKED as the ring around a dot, so a stale value paints a dark outline where
// a gap belongs. Both must equal color.surface.default; this is the check that
// says so out loud.
console.log('\n== measurement surfaces track surface.default ==');
for (const mode of ['light', 'dark']) {
  const truth = T.color.surface.default[mode];
  for (const [label, got] of [['$meta.surfaces', SURFACE[mode]], ['chart.chrome.surface', T.chart.chrome.surface[mode]]]) {
    got === truth
      ? pass(`${label}.${mode} = ${got}`)
      : fail(`${label}.${mode} is ${got} but surface.default.${mode} is ${truth} — every ${mode} measurement below is against the wrong surface`);
  }
}

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
// accent.onSolid is its own token rather than reusing text.inverse — the label
// on the dark indigo has to stay white, while text.inverse in dark mode is the
// dark ink that goes on the light inverse surface. One token cannot be both.
for (const mode of ['light', 'dark']) {
  const c = contrast(T.color.accent.onSolid[mode], T.color.accent.solid[mode]);
  c >= 4.5 ? pass(`accent.solid + accent.onSolid ${mode} ${c.toFixed(2)}:1`)
           : fail(`accent.solid + accent.onSolid ${mode} ${c.toFixed(2)}:1 — needs 4.5:1`);

  const ci = contrast(T.color.text.inverse[mode], T.color.surface.inverse[mode]);
  ci >= 4.5 ? pass(`text.inverse on surface.inverse ${mode} ${ci.toFixed(2)}:1`)
            : fail(`text.inverse on surface.inverse ${mode} ${ci.toFixed(2)}:1 — needs 4.5:1`);

  // The label does not change on hover or press, so every wash step the tinted
  // button can be showing has to hold it. washActive is the binding one: the
  // fill deepens TOWARD its ink there, the opposite of accent.solid's press
  // sequence, so this is the check that catches a wash stepped one shade too far.
  for (const key of ['wash', 'washHover', 'washActive']) {
    const cw = contrast(T.color.accent.washText[mode], T.color.accent[key][mode]);
    cw >= 4.5 ? pass(`accent.washText on accent.${key} ${mode} ${cw.toFixed(2)}:1`)
              : fail(`accent.washText on accent.${key} ${mode} ${cw.toFixed(2)}:1 — needs 4.5:1`);
  }
}

// The sheet banner is a filled band carrying text, so both its ink steps are
// measured against the band itself, not against the page.
for (const mode of ['light', 'dark']) {
  const band = T.color.surface.banner[mode];
  for (const key of ['onBanner', 'onBannerMuted']) {
    const c = contrast(T.color.text[key][mode], band);
    const need = key === 'onBanner' ? 4.5 : 4.5;
    c >= need ? pass(`text.${key} on surface.banner ${mode} ${c.toFixed(2)}:1`)
              : fail(`text.${key} on surface.banner ${mode} ${c.toFixed(2)}:1 — needs ${need}:1`);
  }
}

// Focus ring is a non-text UI indicator: 3:1 against every surface it lands on.
for (const mode of ['light', 'dark']) {
  for (const [n, bg] of [['surface', SURFACE[mode]], ['canvas', CANVAS[mode]], ['subtle', T.color.surface.subtle[mode]]]) {
    const c = contrast(T.color.focus.ring[mode], bg);
    c >= 3 ? pass(`focus.ring ${mode} on ${n} ${c.toFixed(2)}:1`)
           : fail(`focus.ring ${mode} on ${n} ${c.toFixed(2)}:1 — needs 3:1`);
  }
}

// ---------- CVD separation (vendored — always runs) ----------
// Kept in-repo rather than behind JRK_DATAVIZ. This is the property the eight
// slot order exists to provide, and it used to be checked only when an external
// skill directory happened to be present, which meant a fresh clone ran
// `npm test` green without ever testing it.
console.log('\n== CVD separation (Machado 2009 + CIEDE2000) ==');
{
  const slots = T.chart.categorical.slots;
  const cap = T.chart.categorical.seriesCapAllPairs;

  for (const mode of ['light', 'dark']) {
    const hexes = slots.map((s) => s[mode]);

    // Adjacent is the contract for stacks and neighbouring lines.
    const adj = worstAdjacent(hexes);
    const label = `${slots[adj.i].hue}|${slots[adj.j].hue}`;
    const msg = `${mode} worst adjacent dE ${adj.deltaE.toFixed(1)} (${label}, ${adj.kind})`;
    adj.deltaE >= CVD_FLOOR ? pass(msg) : fail(`${msg} — needs ${CVD_FLOOR}`);

    // The declared scatter cap must be the measured one. If a color edit ever
    // widens or narrows it, seriesCapAllPairs has to move with it or the docs
    // and the throw in seriesColor() start lying.
    const measuredCap = allPairsSafeCap(hexes);
    const capMsg = `${mode} all-pairs safe cap = ${measuredCap} (declared ${cap})`;
    measuredCap === cap ? pass(capMsg)
                        : fail(`${capMsg} — update chart.categorical.seriesCapAllPairs`);
  }

  // Every pair that collapses is SAME-PARITY — (n, n+2), (n, n+4) or (n, n+6),
  // never an odd distance. That is the side effect of optimising the adjacent
  // objective: the search pushed confusable hues apart, and "apart" landed on
  // even offsets. This used to be written as "(n, n+4)", which the run below
  // has always disproved — orange|yellow is the worst pair in the palette at
  // dE 0.8 and sits at (2, 4), and {orange, yellow, pink, brown} collapse
  // PAIRWISE, all six pairs. The measured invariant is the parity one, and it
  // is worth stating correctly because things outside this file lean on it:
  // anything walking the slots in order (org-chart rollup groups) gets its
  // adjacent-pair safety from odd distances always being clear.
  //
  // These pairs are exactly the ones the dash and shape channels have to
  // separate, so assert the channels are actually distinct rather than
  // trusting the table to stay hand-maintained.
  const collapsing = [];
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const worst = Math.min(
        worstSeparation(slots[i].light, slots[j].light).deltaE,
        worstSeparation(slots[i].dark, slots[j].dark).deltaE,
      );
      if (worst < CVD_FLOOR) collapsing.push([slots[i], slots[j], worst]);
    }
  }
  for (const [a, b, dE] of collapsing) {
    const where = `${a.hue}|${b.hue} (dE ${dE.toFixed(1)})`;
    if (a.dash === b.dash && a.shape === b.shape) {
      fail(`${where} collapses under CVD and shares BOTH dash and shape — no channel separates it`);
    } else if (a.dash === b.dash) {
      warn(`${where} collapses and shares dash '${a.dash}' — separated by shape only`);
    } else if (a.shape === b.shape) {
      warn(`${where} collapses and shares shape '${a.shape}' — separated by dash only`);
    } else {
      pass(`${where} collapses on hue, separated by dash AND shape`);
    }
  }

  // A duplicate anywhere in either channel is a silent identity collision.
  for (const ch of ['dash', 'shape']) {
    const seen = new Map();
    let dupes = 0;
    for (const s of slots) {
      if (seen.has(s[ch])) { fail(`${ch} '${s[ch]}' used by both slot ${seen.get(s[ch])} and slot ${s.slot}`); dupes++; }
      seen.set(s[ch], s.slot);
    }
    if (!dupes) pass(`all ${slots.length} ${ch} values distinct`);
  }
}

// ---------- dataviz six-checks ----------
// Band, chroma and the normal-vision floor still come from the skill. CVD is
// covered above regardless, so a missing skill is a gap, not a hole.
console.log('\n== categorical palette (dataviz six-checks) ==');
if (!hasValidator) {
  warn(`validator not found at ${validator}`);
  warn('set JRK_DATAVIZ=<dataviz skill dir> for band / chroma / normal-vision floor (CVD is gated above)');
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

// ---------- diverging cell ramp ----------
// These steps sit UNDER text, which no other chart colour in this file does, so
// they get their own gate. Three properties, and losing any one of them breaks a
// different thing: ink legibility, the ramp's direction, and the polarity signal.
//
// NOT checked here, deliberately: CVD separation between CONSECUTIVE steps in an
// arm. Those run deltaE 4.2-6.5 and that is what a magnitude ramp is supposed to
// look like. The categorical floor is for naming which series a mark belongs to;
// applying it here would be a category error and would force the arms apart until
// the ramp read as four unrelated colours. See $rampVsIdentity on the token.
console.log('\n== diverging cell ramp ==');
{
  const D = T.chart.diverging.steps;
  const INK = { light: T.color.text.primary.light, dark: T.color.text.primary.dark };

  for (const mode of ['light', 'dark']) {
    for (const arm of ['negative', 'positive']) {
      const steps = D[arm];

      // 1. The cell carries its number. This is the constraint that caps the ramp.
      for (const s of steps) {
        const c = contrast(INK[mode], s[mode]);
        c >= 4.5 ? pass(`div ${arm} ${s.step} ${mode} — text.primary ${c.toFixed(2)}:1`)
                 : fail(`div ${arm} ${s.step} ${mode} — text.primary ${c.toFixed(2)}:1, needs 4.5:1 (the cell shows its value)`);
      }

      // 2. A ramp that is not monotonic is not a ramp — magnitude stops reading.
      const ls = steps.map((s) => lum(s[mode]));
      const ok = mode === 'light'
        ? ls.every((v, i) => i === 0 || v < ls[i - 1])
        : ls.every((v, i) => i === 0 || v > ls[i - 1]);
      ok ? pass(`div ${arm} ${mode} — monotonic (${mode === 'light' ? 'pale -> saturated' : 'deep -> lifted'})`)
         : fail(`div ${arm} ${mode} — steps are not monotonic, so magnitude does not read`);
    }

    // 3. On a signed table the ARM is the meaning, so polarity must survive CVD.
    for (let i = 0; i < D.negative.length; i++) {
      const w = worstSeparation(D.negative[i][mode], D.positive[i][mode]);
      w.deltaE >= CVD_FLOOR
        ? pass(`div polarity rank ${i + 1} ${mode} — dE ${w.deltaE.toFixed(1)} (${w.kind})`)
        : fail(`div polarity rank ${i + 1} ${mode} — dE ${w.deltaE.toFixed(1)} under ${CVD_FLOOR}; negative and positive collapse under ${w.kind}`);
    }
  }
}

console.log(`\n${failures ? 'FAILED' : 'OK'} — ${failures} failure(s), ${warnings} warning(s)\n`);
if (warnings && !failures) {
  console.log('Warnings above are the documented relief cases: sub-3:1 marks ship with');
  console.log('visible direct labels or a table view, and status colors with an icon + label.\n');
}
process.exit(failures ? 1 : 0);

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

// CHROME SURFACES CARRY TEXT TOO, and the loop above cannot see it: it measures
// every ink against the card and the page, so a label on a recessed header fill
// is gated by nothing. That is not hypothetical — the sheet's block-head carried
// text.muted on surface.subtle (4.54:1, fine), and the same ink on surface.track
// would have been 4.15:1, under the body floor, with the gate still green. That
// header has since gone to the solid accent, where accent.onSolid IS gated, but the
// hole it exposed is real. Each pair below is a pairing the CSS actually draws.
//
// It gates the TOKENS, not the CSS: it catches either value being re-stepped, and
// cannot catch a component swapping its own ink back. Add the pair when a
// component starts drawing text on a fill that is neither the card nor the page.
const CHROME_INK = [
  ['muted', 'subtle', 'the letter bar and the row-number gutter'],
  ['secondary', 'subtle', 'the sheet subsection band label'],
  ['secondary', 'track', 'an unselected segment in a segmented control'],
];
for (const [ink, bg, where] of CHROME_INK) {
  for (const mode of ['light', 'dark']) {
    const c = contrast(T.color.text[ink][mode], T.color.surface[bg][mode]);
    const msg = `text.${ink} on surface.${bg} ${mode} ${c.toFixed(2)}:1 — ${where}`;
    c >= 4.5 ? pass(msg) : fail(`${msg} — needs 4.5:1 for body text`);
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

  // The sheet's per-metric header band. Its own ink token rather than a borrowed
  // white, so it is gated as its own pair — and the STEP off the card is checked
  // too, because a filled band that does not separate from the surface it sits on
  // is not a band. Dark is the binding side: the same navy is 10.83:1 off the light
  // seam and only 1.30:1 off the #232326 card.
  const cbd = contrast(T.color.text.onBannerDeep[mode], T.color.surface.bannerDeep[mode]);
  cbd >= 4.5 ? pass(`surface.bannerDeep + text.onBannerDeep ${mode} ${cbd.toFixed(2)}:1`)
             : fail(`surface.bannerDeep + text.onBannerDeep ${mode} ${cbd.toFixed(2)}:1 — needs 4.5:1`);

  const cbs = contrast(T.color.surface.bannerDeep[mode], SURFACE[mode]);
  cbs >= 1.2 ? pass(`surface.bannerDeep steps off the card ${mode} ${cbs.toFixed(2)}:1`)
             : fail(`surface.bannerDeep steps off the card ${mode} ${cbs.toFixed(2)}:1 — needs 1.2:1 to read as a band`);

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

// ---------- vivid gradient tiles ----------
// A namespace nothing above can see: these stops are not the card, not the page
// and not a wash, so every loop so far measures around them. The tile brings its
// own surface, which means the ONLY thing holding it up is the white ink on it —
// so that is what is gated, at both stops of every ramp.
//
// Checking the two stops is sufficient for the whole ramp. sRGB gradient
// interpolation runs through the gamma-encoded values, and the decode is convex,
// so lum(mix) <= mix(lum) — no interior point can be lighter than the lighter
// endpoint. Verified by sampling all four ramps at 101 points during derivation:
// the worst white contrast was at 0% every time.
console.log('\n== vivid gradient tiles ==');
{
  const G = T.color.gradient;
  // `topbar` is excluded from the TILE loop and gated separately below. It has
  // from/to like a tone and is not one: it is chrome, it carries its own ink
  // rather than gradient.ink, and its two themes are different designs rather
  // than two values of one. Swept in here it fails four ways for reasons that are
  // all "a tile is not a bar" — white ink it does not use, a page step a
  // full-width band does not owe, and a lightness-match against tones it is not
  // in a row with. Excluding it is not an exemption; the block below asserts MORE
  // of it than this loop can (three stops, both inks, both themes).
  const tones = Object.entries(G).filter(
    ([k, v]) => !k.startsWith('$') && k !== 'topbar' && v.from && v.to,
  );
  const INK = G.ink;
  const lightest = [];

  for (const [name, tone] of tones) {
    for (const stop of ['from', 'to']) {
      for (const mode of ['light', 'dark']) {
        const fill = tone[stop][mode];

        // The tile carries a 12px caption, so this is a body-text floor, not a
        // large-text one. It is the constraint the entire namespace was derived
        // from and the only thing standing between these tiles and unreadable.
        const c = contrast(INK[mode], fill);
        c >= 4.5 ? pass(`gradient.${name}.${stop} + gradient.ink ${mode} ${c.toFixed(2)}:1`)
                 : fail(`gradient.${name}.${stop} + gradient.ink ${mode} ${c.toFixed(2)}:1 — needs 4.5:1 (the tile carries a 12px caption)`);

        // A filled band that does not separate from what it sits on is not a
        // band. Same 1.2:1 floor surface.bannerDeep is held to, but measured
        // against the PAGE — a vivid tile leads a dashboard, so it sits on the
        // canvas, not on a card.
        const cs = contrast(fill, CANVAS[mode]);
        cs >= 1.2 ? pass(`gradient.${name}.${stop} steps off the ${mode} page ${cs.toFixed(2)}:1`)
                  : fail(`gradient.${name}.${stop} steps off the ${mode} page ${cs.toFixed(2)}:1 — needs 1.2:1 to read as a band`);
      }
    }
    lightest.push([name, contrast(INK.light, tone.from.light)]);
  }

  // The four tones must stay LIGHTNESS-MATCHED. Hue is the only variable a vivid
  // row is allowed to carry, because hue here is decorative; a tone stepped
  // darker than its neighbours reads as "this tile matters more", which is a
  // magnitude claim the data does not make. Nothing else in this file would
  // catch a single re-stepped tone — each one would still pass its own ink check.
  const ratios = lightest.map(([, c]) => c);
  const spread = Math.max(...ratios) - Math.min(...ratios);
  const detail = lightest.map(([n, c]) => `${n} ${c.toFixed(2)}`).join(', ');
  spread <= 0.6
    ? pass(`gradient tones are lightness-matched — white spread ${spread.toFixed(2)} (${detail})`)
    : fail(`gradient tones drifted apart — white spread ${spread.toFixed(2)} over 0.60 (${detail}); a darker tone reads as a magnitude claim`);

  // gradient.barDeep is the .jrk-topbar--blue deep stop. The tone loop above skips
  // it — it has no from/to — so without this it would be the one colour in the
  // namespace nothing measured.
  //
  // Deliberately NOT held to the 1.2:1 page step the tones are: in dark it IS
  // surface.canvas, on purpose, so the bar dissolves into the page. That is why
  // shell.css restores the bar's bottom hairline under dark, and the token carries
  // a $hairlineNote saying the two move together. What IS gated is the ink, and the
  // light bar's parity with the tile — a stray theme value here would repaint the
  // masthead in light while looking like a dark-mode-only edit.
  for (const mode of ['light', 'dark']) {
    const c = contrast(INK[mode], G.barDeep[mode]);
    c >= 4.5 ? pass(`gradient.barDeep + gradient.ink ${mode} ${c.toFixed(2)}:1`)
             : fail(`gradient.barDeep + gradient.ink ${mode} ${c.toFixed(2)}:1 — needs 4.5:1 (the bar carries 13px labels)`);
  }
  G.barDeep.light === G.blue.to.light
    ? pass('gradient.barDeep light is gradient.blue.to verbatim — the light masthead is unchanged')
    : fail(`gradient.barDeep light is ${G.barDeep.light}, not gradient.blue.to (${G.blue.to.light}) — the light bar was changed by what should be a dark-only value`);

  // gradient.topbar is the .jrk-topbar--brand masthead ramp, and it is gated on
  // its OWN ink rather than gradient.ink. That is the fact the tile loop cannot
  // express: this is the one gradient in the namespace whose ink is theme-varying,
  // because its light ramp is PALE (white at 0%) and its dark ramp is saturated.
  // White would be 1.00:1 on the light bar's leading edge.
  //
  // Three stops, not two. The tiles get away with checking the endpoints because
  // they have only two; this has a `via` that is a selected value in its own right
  // and could be re-picked without either endpoint moving. Convexity still covers
  // the interior of each SEGMENT, so three checks cover the whole sweep.
  //
  // Deliberately NOT held to the 1.2:1 page step, same as barDeep and for the
  // mirrored reason: barDeep dissolves into the dark page at the trailing end,
  // this one sits ~1.09:1 off the light page at the LEADING end. Both are answered
  // by shell.css keeping the bar's bottom hairline, which is a CSS fact this
  // script cannot see — so the token carries the pairing note and this asserts the
  // half that is checkable.
  {
    const TB = G.topbar;
    // ONE WAIVED CELL, NAMED EXACTLY. The light via stop was re-specified to
    // #245ec6 on 2026-08-20 and no ink clears 4.5:1 on it — the required ink
    // luminance comes out NEGATIVE, so this is not a value that can be re-picked,
    // it is a stop that cannot carry text at all. It ships because nothing is inked
    // there: .jrk-spacer holds the middle of the bar empty and shell.css gives the
    // ghost buttons and the segmented control a bounded ground of their own for the
    // narrow-viewport case. See gradient.topbar.$measured for the full argument.
    //
    // Waived as a WARNING rather than deleted, and scoped to one stop in one theme.
    // Every other cell still fails hard, so re-picking `from` or `to`, or lightening
    // the ink, is caught. If the middle of the bar ever has to carry text, re-step
    // via toward #4d94ff (ink at 4.83:1) and delete this branch.
    /* EMPTY SINCE 2026-08-25, AND THAT IS THE POINT — leave it empty. The light via
       stop used to sit here at 2.48:1, waived because .jrk-spacer held the middle of
       the bar clear. The ramp is now #ffffff -> #cee0ff -> #ffffff and every stop
       passes on its own, so the mechanism stays wired up and gates nothing: re-darken
       a stop and it FAILS rather than being quietly excused by a waiver written for a
       ramp that no longer exists. Adding a name back here asserts a layout guarantee,
       so state which one, on gradient.topbar.$measured. */
    const INK_WAIVED = new Set();
    for (const stop of ['from', 'via', 'to']) {
      for (const mode of ['light', 'dark']) {
        const c = contrast(TB.ink[mode], TB[stop][mode]);
        const label = `gradient.topbar.${stop} + gradient.topbar.ink ${mode} ${c.toFixed(2)}:1`;
        if (c >= 4.5) { pass(label); continue; }
        INK_WAIVED.has(`${stop}:${mode}`)
          ? warn(`${label} — BELOW 4.5:1, waived: this stop carries no ink by layout. See gradient.topbar.$measured`)
          : fail(`${label} — needs 4.5:1 (the bar carries 13px labels)`);
      }
    }

    // The ink must genuinely DIFFER by theme. If someone "simplifies" it back to
    // white in both, the light bar keeps passing nothing and starts failing the
    // loop above — but if they instead lightened the whole light ramp to make
    // white work, the pale masthead that was asked for would be gone with no test
    // objecting. This states the design so that change has to be deliberate.
    TB.ink.light !== TB.ink.dark
      ? pass('gradient.topbar.ink is theme-varying — the pale light bar and the saturated dark one carry different inks')
      : fail('gradient.topbar.ink is the same in both themes — one of the two ramps is now carrying an ink nothing measured it for');

    // The focus ring on this variant is gradient.topbar.RING, not gradient.focus
    // (white, and the light ramp is white at both ends) and not the ink either. It was
    // split off the ink when the light via stop measured 2.48:1 — under this very
    // floor — and it stays split now that the ramp is pale, because the two floors are
    // still different problems: the ink's miss was survivable by layout and a ring's
    // never was, a ring being drawn around whichever control has focus. Assert it
    // clears 3:1 at every stop of both ramps. NO WAIVER HERE, deliberately.
    for (const stop of ['from', 'via', 'to']) {
      for (const mode of ['light', 'dark']) {
        const cf = contrast(TB.ring[mode], TB[stop][mode]);
        cf >= 3
          ? pass(`topbar focus ring on ${stop} ${mode} ${cf.toFixed(2)}:1`)
          : fail(`topbar focus ring on ${stop} ${mode} ${cf.toFixed(2)}:1 — needs 3:1`);
      }
    }
    // The ring is a SEPARATE value from the ink, and that has to stay true. Folding
    // them together now LOOKS free — the pale ramp carries both comfortably — which is
    // exactly why this matters more than it did, not less: the two would pass together
    // today and diverge silently at the next re-step, which has now happened three
    // times. Keep them distinct while it costs nothing.
    TB.ring.light !== TB.ink.light
      ? pass('gradient.topbar.ring is its own value, not gradient.topbar.ink — the ring floor and the ink floor are different problems on this ramp')
      : fail('gradient.topbar.ring has been aliased to gradient.topbar.ink — one of them is now carrying a floor it was not measured for');

    const focusOnPale = contrast(G.focus.light, TB.from.light);
    focusOnPale < 3
      ? pass(`gradient.focus is ${focusOnPale.toFixed(2)}:1 on the pale bar — the topbar ink override is load-bearing, not a duplicate`)
      : warn(`gradient.focus now reads ${focusOnPale.toFixed(2)}:1 on gradient.topbar.from — re-check whether the --brand ring override is still needed`);
  }

  // gradient.focus exists because focus.ring does NOT work here, and this is the
  // check that says so out loud: the ring is the brand anchor, which is the blue
  // tone's own light stop. Assert the replacement clears 3:1 and that the base
  // ring genuinely fails, so nobody "simplifies" the two back together.
  for (const [name, tone] of tones) {
    const cf = contrast(T.color.gradient.focus.light, tone.from.light);
    cf >= 3 ? pass(`gradient.focus on ${name} ${cf.toFixed(2)}:1`)
            : fail(`gradient.focus on ${name} ${cf.toFixed(2)}:1 — needs 3:1`);
  }
  const ringOnBlue = contrast(T.color.focus.ring.light, G.blue.from.light);
  ringOnBlue < 3
    ? pass(`focus.ring is ${ringOnBlue.toFixed(2)}:1 on gradient.blue.from — gradient.focus is load-bearing, not a duplicate`)
    : warn(`focus.ring now reads ${ringOnBlue.toFixed(2)}:1 on gradient.blue.from — re-check whether gradient.focus is still needed`);

  // The categorical floor is deliberately NOT applied. These four tones collapse
  // under CVD and are documented as doing so ($hueIsNotIdentity) — the white-safe
  // slice of sRGB is too narrow to hold eight-way separation as well. Printed so
  // the register stays measured rather than asserted, and so that anyone tempted
  // to walk these like chart slots sees the numbers first.
  for (let i = 0; i < tones.length; i++) {
    for (let j = i + 1; j < tones.length; j++) {
      const w = worstSeparation(tones[i][1].from.light, tones[j][1].from.light);
      const msg = `gradient ${tones[i][0]}|${tones[j][0]} dE ${w.deltaE.toFixed(1)} (${w.kind})`;
      console.log(`  ..    ${msg} — ${w.deltaE >= CVD_FLOOR ? 'separable' : 'COLLAPSES'}; hue is not the identity channel here, the label is`);
    }
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

// ---------- chart.deep — the org chart's solid fill ----------
// A THIRD namespace over the same eight hues, and the reason it needs its own
// section is that it is measured against the OPPOSITE thing. A categorical mark
// is measured against the card it is drawn on; a deep fill is measured against
// the ink drawn on IT. Nothing above sees that, and this palette exists solely
// so a filled org node can carry white — which on chart.categorical is
// impossible for all eight slots at once.
//
// Four properties are asserted, and the last two are what let this file stop
// re-arguing the colourblind doctrine for a new palette: the deep set is the
// SAME hues in the SAME searched order, so if adjacency, the all-pairs cap and
// the same-parity structure of the collapsing pairs all carry over, then the
// categorical palette's texture bucketing separates this one too and the
// "first 8 groups fully distinguishable" claim holds unchanged. If a slot is
// ever hand-edited, the parity check is the one that catches the damage —
// adjacency can survive a bad edit that quietly moves a pair onto an odd
// distance, where no texture is waiting for it.
console.log('\n== chart.deep (org filled node) ==');
{
  const deep = T.chart.deep.slots;
  const cat = T.chart.categorical.slots;
  const ink = T.chart.deep.ink;

  // 0. It must BE the categorical palette's hue order, or nothing below transfers.
  const sameOrder = deep.length === cat.length && deep.every((s, i) => s.hue === cat[i].hue && s.slot === cat[i].slot);
  sameOrder
    ? pass('same eight hues in the same slot order as chart.categorical')
    : fail('chart.deep diverges from chart.categorical hue order — the CVD doctrine no longer transfers, re-derive from scratch');

  for (const mode of ['light', 'dark']) {
    const hexes = deep.map((s) => s[mode]);

    // 1. THE WHOLE POINT: white ink on every slot. Worst case is what ships.
    let worstInk = { r: Infinity, hue: null };
    for (const s of deep) {
      const r = contrast(s[mode], ink[mode]);
      if (r < worstInk.r) worstInk = { r, hue: s.hue };
    }
    const inkMsg = `${mode} worst ink ${ink[mode]} on a deep fill: ${worstInk.r.toFixed(2)}:1 (${worstInk.hue})`;
    worstInk.r >= 4.5 ? pass(inkMsg) : fail(`${inkMsg} — needs 4.5:1, this palette exists only to carry it`);

    // 2. The fill bounds itself, so a filled node needs no hairline to be a
    //    shape. Hand-recorded on the token because nothing else gates a fill
    //    against the fill beneath it — see the note in tokens.json.
    const declared = T.chart.deep.boundsSelf[mode];
    let worstPlane = Infinity;
    for (const s of deep) worstPlane = Math.min(worstPlane, contrast(s[mode], SURFACE[mode]));
    const planeMsg = `${mode} worst fill-vs-plane ${worstPlane.toFixed(2)}:1 on ${SURFACE[mode]} (declared ${declared})`;
    Math.abs(worstPlane - declared) <= 0.05
      ? pass(planeMsg)
      : fail(`${planeMsg} — update chart.deep.boundsSelf.${mode}`);
    if (worstPlane < 3) fail(`${mode} a deep fill is ${worstPlane.toFixed(2)}:1 on its own plane — the filled node stops being a shape`);

    // 3. Adjacency, the contract for consecutive rollup slots.
    const adj = worstAdjacent(hexes);
    const adjMsg = `${mode} worst adjacent dE ${adj.deltaE.toFixed(1)} (${deep[adj.i].hue}|${deep[adj.j].hue}, ${adj.kind})`;
    adj.deltaE >= CVD_FLOOR ? pass(adjMsg) : fail(`${adjMsg} — needs ${CVD_FLOOR}`);

    // 4. The declared scatter cap is shared with the categorical palette rather
    //    than restated, because a divergence there means the two are no longer
    //    the same palette at two volumes.
    const cap = T.chart.categorical.seriesCapAllPairs;
    const measured = allPairsSafeCap(hexes);
    const capMsg = `${mode} all-pairs safe cap = ${measured} (categorical declares ${cap})`;
    measured === cap ? pass(capMsg) : fail(`${capMsg} — chart.deep no longer matches the palette it is derived from`);
  }

  // 5. EVERY COLLAPSING PAIR IS SAME-PARITY. This is the load-bearing one. The
  //    org chart's texture buckets are (1,2)(3,4)(5,6)(7,8), which puts the two
  //    members of each bucket an ODD distance apart — so as long as every
  //    collapse lands on an even offset, all of them are separated by texture
  //    and none of them shares a bucket. An odd-distance collapse has no
  //    texture waiting for it and is invisible to the author.
  const odd = [];
  const collapsing = [];
  for (let i = 0; i < deep.length; i++) {
    for (let j = i + 1; j < deep.length; j++) {
      const worst = Math.min(
        worstSeparation(deep[i][ 'light' ], deep[j].light).deltaE,
        worstSeparation(deep[i].dark, deep[j].dark).deltaE,
      );
      if (worst >= CVD_FLOOR) continue;
      collapsing.push(`${deep[i].slot}|${deep[j].slot} ${worst.toFixed(1)}`);
      if ((j - i) % 2 === 1) odd.push(`${deep[i].hue}|${deep[j].hue} (dE ${worst.toFixed(1)}, distance ${j - i})`);
    }
  }
  odd.length === 0
    ? pass(`all ${collapsing.length} collapsing pairs are same-parity — texture separates every one: ${collapsing.join('  ')}`)
    : fail(`ODD-DISTANCE collapse, no texture separates it: ${odd.join('; ')}`);

  // 6. The ink is not text.inverse. They agree in light and must not be
  //    collapsed, because text.inverse is #000000 in dark and 4.0:1 at best here.
  ink.dark === T.color.text.inverse.dark
    ? fail('chart.deep.ink.dark equals text.inverse.dark — one of them is wrong, they are different roles')
    : pass('chart.deep.ink stays distinct from text.inverse');
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

// ---------- accent variants (data-accent) ----------
/* THE HUE AXIS IS RE-MEASURED, NOT TRUSTED. Every variant restates the accent
   namespace plus the four roles that take the anchor, so each one is a complete
   second palette and gets the complete second run: the same floors the default
   accent is held to above, plus a CVD check against this library's own status
   marks, which is what closes the hue circle down to the 265-330deg arc.

   THREE THINGS THIS CATCHES THAT NOTHING ELSE WOULD.

   (1) accent.solid IS PINNED FROM BOTH SIDES and the window is about 0.7 of a
   CIELAB lightness step. It is ONE value for both themes, so it has to be dark
   enough to be ink on surface.subtle and light enough to bound its own fill on the
   dark card, and those pull in opposite directions. The shipped blue sits exactly
   on the lower edge at 3.00:1 — tangency, not headroom. A hue re-stepped by hand
   for the light half alone falls out of the window with no light-mode check
   noticing a thing.

   (2) shadow.focus CARRIES ITS COLOUR INSIDE AN rgba() STRING, which every loop
   above is blind to — this library shipped a violet halo around a blue core for
   exactly that reason, across two accents. Each variant must restate it, and it
   must agree with that variant's own focus.ring.

   (3) A VARIANT MAY NOT SILENTLY DROP A ROLE. If a hue restates accent.text but
   not text.link, links stay the default blue in that hue alone. Every variant is
   required to carry the same role set as every other. */
console.log('\n== accent variants (data-accent) ==');
{
  const AV = T.accentVariants;
  if (!AV) {
    warn('tokens.json declares no accentVariants — the data-accent axis is gone');
  } else {
    const names = Object.keys(AV.variants).filter((k) => !k.startsWith('$'));
    const keysets = names.map((n) => Object.keys(AV.variants[n].vars).filter((k) => !k.startsWith('$')).sort().join(','));
    new Set(keysets).size === 1
      ? pass(`all ${names.length} variants declare the same ${keysets[0].split(',').length} roles`)
      : fail('accent variants declare DIFFERENT role sets — a hue that omits a role leaves the default colour behind in it');

    for (const name of names) {
      const V = AV.variants[name].vars;
      const g = (k, mode) => (typeof V[k] === 'string' ? V[k] : V[k][mode]);
      for (const mode of ['light', 'dark']) {
        const tag = `${name} ${mode}`;
        let c = contrast(g('accent-on-solid', mode), g('accent-solid', mode));
        c >= 4.5 ? pass(`${tag} — onSolid on solid ${c.toFixed(2)}:1`)
                 : fail(`${tag} — onSolid on solid ${c.toFixed(2)}:1, needs 4.5:1`);
        for (const k of ['accent-wash', 'accent-wash-hover', 'accent-wash-active']) {
          c = contrast(g('accent-wash-text', mode), g(k, mode));
          c >= 4.5 ? pass(`${tag} — washText on ${k.replace('accent-', '')} ${c.toFixed(2)}:1`)
                   : fail(`${tag} — washText on ${k.replace('accent-', '')} ${c.toFixed(2)}:1, needs 4.5:1`);
        }
        for (const [n, bg] of [['surface', T.color.surface.default[mode]], ['canvas', T.color.surface.canvas[mode]],
                               ['subtle', T.color.surface.subtle[mode]], ['raisedHover', T.color.surface.raisedHover[mode]]]) {
          c = contrast(g('text-link', mode), bg);
          c >= 4.5 ? pass(`${tag} — link on ${n} ${c.toFixed(2)}:1`)
                   : fail(`${tag} — link on ${n} ${c.toFixed(2)}:1, needs 4.5:1`);
          c = contrast(g('focus-ring', mode), bg);
          c >= 3 ? pass(`${tag} — focus.ring on ${n} ${c.toFixed(2)}:1`)
                 : fail(`${tag} — focus.ring on ${n} ${c.toFixed(2)}:1, needs 3:1`);
        }
        c = contrast(g('border-accent', mode), T.color.surface.default[mode]);
        c >= 3 ? pass(`${tag} — border.accent on the card ${c.toFixed(2)}:1`)
               : fail(`${tag} — border.accent on the card ${c.toFixed(2)}:1, needs 3:1 as a signifier`);
        for (const ink of ['onBanner', 'onBannerMuted']) {
          const inkHex = ink === 'onBanner' ? T.color.text.onBanner[mode] : g('text-on-banner-muted', mode);
          c = contrast(inkHex, g('surface-banner', mode));
          c >= 4.5 ? pass(`${tag} — text.${ink} on the banner ${c.toFixed(2)}:1`)
                   : fail(`${tag} — text.${ink} on the banner ${c.toFixed(2)}:1, needs 4.5:1`);
        }
        const sh = g('shadow-focus', mode);
        const m = /rgba\((\d+),\s*(\d+),\s*(\d+)/.exec(sh);
        if (!m) {
          fail(`${tag} — shadow.focus "${sh}" has no parseable rgba(); the halo colour is unreachable to every gate`);
        } else {
          const got = '#' + [m[1], m[2], m[3]].map((x) => Number(x).toString(16).padStart(2, '0')).join('');
          got === g('focus-ring', mode)
            ? pass(`${tag} — shadow.focus halo is this hue's own focus.ring (${got})`)
            : fail(`${tag} — shadow.focus halo is ${got} but focus.ring is ${g('focus-ring', mode)} — a stale halo blooms a colour from another accent`);
        }
      }
      const solid = g('accent-solid', 'light');
      const cl = contrast(solid, T.color.surface.subtle.light);
      const cd = contrast(solid, T.color.surface.default.dark);
      cl >= 4.5 && cd >= 3
        ? pass(`${name} — accent.solid holds the two-sided window: ${cl.toFixed(2)}:1 on subtle, ${cd.toFixed(2)}:1 on the dark card`)
        : fail(`${name} — accent.solid is OUTSIDE the window: ${cl.toFixed(2)}:1 on subtle (needs 4.5) / ${cd.toFixed(2)}:1 on the dark card (needs 3). One value serves both themes, so it is pinned from both sides at once.`);
      for (const st of ['critical', 'warning', 'serious', 'good', 'neutral']) {
        for (const mode of ['light', 'dark']) {
          const mark = T.color.status[st].mark[mode];
          const ink = mode === 'light' ? g('accent-solid', 'light') : g('accent-text', 'dark');
          const w = worstSeparation(ink, mark);
          w.deltaE >= CVD_FLOOR
            ? pass(`${name} ${mode} — vs status.${st} dE ${w.deltaE.toFixed(1)} (${w.kind})`)
            : fail(`${name} ${mode} — vs status.${st} dE ${w.deltaE.toFixed(1)} under ${CVD_FLOOR}; the accent and the ${st} signal collapse under ${w.kind}`);
        }
      }
      const s1 = worstSeparation(g('accent-solid', 'light'), T.chart.categorical.slots[0].light);
      const s0 = worstSeparation(T.color.accent.solid.light, T.chart.categorical.slots[0].light);
      console.log(`  ..    ${name} vs chart slot 1 — dE ${s1.deltaE.toFixed(1)} (${s1.kind}); the default blue is dE ${s0.deltaE.toFixed(1)}`);
    }

    /* ---- THE GALLERY PICKER MUST OFFER EXACTLY THE HUES THAT EXIST — the same gate
       validate-skin runs on a skin's picker, for the same two silent failures: a hue
       in the token file with no button is invisible, and a button with no variant
       stamps an attribute nothing reads and quietly shows the default. */
    const page = readFileSync(join(root, 'preview/components.html'), 'utf8');
    const listed = [...page.matchAll(/data-accent-btn="([a-z0-9-]*)"/g)].map((mm) => mm[1]);
    const declared = names.slice().sort();
    const offered = listed.filter((x) => x).sort();
    const missing = declared.filter((x) => !offered.includes(x));
    const extra = offered.filter((x) => !declared.includes(x));
    if (!listed.length) {
      fail(`preview/components.html declares no data-accent-btn list, so ${declared.length} hues have no picker`);
    } else if (missing.length || extra.length) {
      fail(`preview/components.html picker is out of step — ${missing.length ? `missing ${missing.join(', ')}` : ''}${missing.length && extra.length ? '; ' : ''}${extra.length ? `offers ${extra.join(', ')} which no variant defines` : ''}`);
    } else if (!listed.includes('')) {
      fail(`preview/components.html picker offers no button for ${AV.variantAxis.default}, the default hue — it is the ABSENCE of the attribute, so its button carries an empty value`);
    } else {
      pass(`the gallery picker offers exactly the ${declared.length} declared hues, plus ${AV.variantAxis.default}`);
    }
  }
}

console.log(`\n${failures ? 'FAILED' : 'OK'} — ${failures} failure(s), ${warnings} warning(s)\n`);
if (warnings && !failures) {
  console.log('Warnings above are the documented relief cases: sub-3:1 marks ship with');
  console.log('visible direct labels or a table view, and status colors with an icon + label.\n');
}
process.exit(failures ? 1 : 0);

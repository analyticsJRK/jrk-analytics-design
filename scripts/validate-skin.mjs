#!/usr/bin/env node
/**
 * Colour gate for tokens/skins/*.json.
 *
 * scripts/validate-colors.mjs is 568 lines of assertions written against the
 * BASE token tree — its namespaces, its ramps, its chart derivation — and it
 * measures everything against `$meta.surfaces`, one hex per theme. A skin has
 * none of that shape: its palette is a flat map of variable names, and its page
 * is a gradient rather than a hex. Extending that file would have meant
 * teaching every one of its checks about a second tree. This is the separate
 * gate instead, and it checks the things a skin can actually get wrong.
 *
 * It re-derives every ratio from the skin's own values. The figures written in
 * the $note strings are documentation; this script does not read them, so a note
 * that drifts from its value is caught by the note being wrong next to a number
 * printed here, not by being trusted.
 *
 *   node scripts/validate-skin.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// Vendored in this repo precisely so a CVD check can never silently not run —
// see the header of scripts/cvd.mjs for the gate-that-was-off story.
import { worstSeparation, CVD_FLOOR } from './cvd.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODES = ['light', 'dark'];
const TEXT_FLOOR = 4.5;
const MARK_FLOOR = 3;

// ── colour maths ───────────────────────────────────────────────────────────
const srgb = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function luminance(hex) {
  const h = hex.trim().replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => srgb(parseInt(full.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
const isHex = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v.trim());

/** Every hex stop in a gradient string, in source order. A skin's page may be a
 *  ramp, and an ink that lands on it owes the WORST stop — measuring the token
 *  as if it were one colour is the specific mistake this exists to prevent. */
const stops = (v) => (v.match(/#[0-9a-fA-F]{6}/g) ?? []);

// ── reporting ──────────────────────────────────────────────────────────────
let failures = 0;
let checks = 0;
const pass = (m) => { checks++; console.log(`  ok    ${m}`); };
const fail = (m) => { checks++; failures++; console.error(`  FAIL  ${m}`); };
const note = (m) => console.log(`  ..    ${m}`);
const r2 = (n) => n.toFixed(2);

function floor(label, ink, ground, min) {
  if (!isHex(ink) || !isHex(ground)) return note(`${label}: not a flat colour, skipped`);
  const c = contrast(ink, ground);
  const msg = `${label} — ${ink} on ${ground} = ${r2(c)}:1 (floor ${min})`;
  c >= min ? pass(msg) : fail(msg);
  return c;
}

function differs(label, a, b) {
  if (a?.toLowerCase() === b?.toLowerCase()) {
    fail(`${label} — both are ${a}. A token that names a plane is broken when it EQUALS the plane it sits on, and nothing else in the toolchain gates that.`);
  } else {
    pass(`${label} — ${a} vs ${b}, a real step (${r2(contrast(a, b))}:1)`);
  }
}

function equals(label, a, b) {
  a?.toLowerCase() === b?.toLowerCase()
    ? pass(`${label} — tracks at ${a}`)
    : fail(`${label} — ${a} does not track ${b}. A measuring or ring colour that drifts from the surface it names fails silently: it paints the wrong colour rather than nothing.`);
}

// ── the skin files ─────────────────────────────────────────────────────────
const skinsDir = join(root, 'tokens/skins');
const files = existsSync(skinsDir) ? readdirSync(skinsDir).filter((f) => f.endsWith('.json')).sort() : [];
if (!files.length) {
  console.log('no skins in tokens/skins — nothing to validate');
  process.exit(0);
}

for (const file of files) {
  const S = JSON.parse(readFileSync(join(skinsDir, file), 'utf8'));
  const stamp = S.stamp;
  console.log(`\n=== skin "${stamp}" (${file}) ===`);

  /** One mode's value for a variable name, from `vars` or `skinOnly`. */
  const src = { ...(S.vars ?? {}), ...(S.skinOnly ?? {}) };
  const v = (name, mode) => {
    const e = src[name];
    if (e === undefined) return undefined;
    if (typeof e === 'string') return e;
    return e[mode];
  };
  const have = (name) => src[name] !== undefined;

  for (const mode of MODES) {
    console.log(`\n-- ${mode} --`);
    const panel = v('surface-default', mode);
    if (!isHex(panel)) {
      fail(`surface-default is not a flat colour in ${mode}; every other check measures against it`);
      continue;
    }

    // ---- the page, at every stop. A gradient canvas is the reason this gate
    // exists at all: nothing else in the toolchain can measure one.
    const canvas = v('surface-canvas', mode) ?? '';
    const ends = isHex(canvas) ? [canvas] : stops(canvas);
    if (!ends.length) fail(`surface-canvas in ${mode} yields no measurable stop`);
    else note(`page has ${ends.length} stop(s): ${ends.join(' -> ')}`);

    for (const ink of ['text-primary', 'text-secondary', 'text-muted']) {
      floor(`${ink} on the panel`, v(ink, mode), panel, TEXT_FLOOR);
      // The binding surface is the WORST stop of the page, not the panel. This
      // is the check that re-stepped text-muted twice: a value can clear on the
      // panel and on the light end and still fail on the dark end, i.e. pass
      // everywhere a single-hex gate would look and fail on part of the screen.
      let worst = null;
      for (const stop of ends) {
        const c = contrast(v(ink, mode), stop);
        if (worst === null || c < worst[0]) worst = [c, stop];
      }
      if (worst) {
        const msg = `${ink} on the page's worst stop ${worst[1]} = ${r2(worst[0])}:1 (floor ${TEXT_FLOOR})`;
        worst[0] >= TEXT_FLOOR ? pass(msg) : fail(msg);
        checks++;
      }
    }

    // ---- inks that name their own ground
    floor('accent-on-solid on accent-solid', v('accent-on-solid', mode), v('accent-solid', mode), TEXT_FLOOR);
    floor('accent-wash-text on accent-wash', v('accent-wash-text', mode), v('accent-wash', mode), TEXT_FLOOR);
    // The default hue owes the topbar-wedge check too — see the variant loop for
    // why the wedge is a wash rather than the vivid fill.
    floor('text-primary on accent-wash (the topbar wedge)', v('text-primary', mode), v('accent-wash', mode), TEXT_FLOOR);
    floor('accent-text on the panel', v('accent-text', mode), panel, TEXT_FLOOR);
    floor('text-link on the panel', v('text-link', mode), panel, TEXT_FLOOR);
    floor('text-inverse on surface-inverse', v('text-inverse', mode), v('surface-inverse', mode), TEXT_FLOOR);
    floor('text-on-banner on surface-banner', v('text-on-banner', mode), v('surface-banner', mode), TEXT_FLOOR);
    floor('text-on-banner-deep on surface-banner-deep', v('text-on-banner-deep', mode), v('surface-banner-deep', mode), TEXT_FLOOR);
    floor('text-on-banner-muted on surface-banner', v('text-on-banner-muted', mode), v('surface-banner', mode), TEXT_FLOOR);
    floor('text-muted on surface-subtle', v('text-muted', mode), v('surface-subtle', mode), TEXT_FLOOR);

    // ---- status: the mark is a mark (3:1), the text is text (4.5:1) on BOTH
    // the panel and its own wash. Those are different jobs and this library has
    // already shipped a .text role that failed on its own wash.
    for (const s of ['good', 'warning', 'serious', 'critical', 'neutral']) {
      if (!have(`status-${s}-mark`)) continue;
      floor(`status-${s}-mark on the panel`, v(`status-${s}-mark`, mode), panel, MARK_FLOOR);
      floor(`status-${s}-text on the panel`, v(`status-${s}-text`, mode), panel, TEXT_FLOOR);
      floor(`status-${s}-text on its own wash`, v(`status-${s}-text`, mode), v(`status-${s}-wash`, mode), TEXT_FLOOR);
      floor(`text-primary on the ${s} wash`, v('text-primary', mode), v(`status-${s}-wash`, mode), TEXT_FLOOR);
    }
    if (have('status-critical-on-solid')) {
      floor('status-critical-on-solid on status-critical-solid', v('status-critical-on-solid', mode), v('status-critical-solid', mode), TEXT_FLOOR);
    }

    // ---- a boundary that means something owes 3:1
    floor('border-strong on the panel', v('border-strong', mode), panel, MARK_FLOOR);
    if (have('border-accent')) {
      floor('border-accent on the panel', v('border-accent', mode), panel, MARK_FLOOR);
    }

    // ---- equalities, in both directions
    differs('surface-raised-hover vs surface-raised', v('surface-raised-hover', mode), v('surface-raised', mode));
    differs('surface-disabled vs surface-default', v('surface-disabled', mode), panel);
    differs('surface-card-hover vs surface-default', v('surface-card-hover', mode), panel);
    differs('surface-subtle vs surface-default', v('surface-subtle', mode), panel);
    if (have('chart-surface')) equals('chart-surface vs surface-default', v('chart-surface', mode), panel);
    if (have('focus-offset')) equals('focus-offset vs surface-default', v('focus-offset', mode), panel);

    // ---- recorded, never gated: the fills that are steps rather than ink.
    // A hairline at 1.3:1 is correct and would fail any floor worth setting, so
    // these are printed so a change shows up in a diff instead of being checked.
    for (const [n, ground, what] of [
      ['border-subtle', panel, 'tile edge'],
      ['border-default', panel, 'divider'],
      ['accent-solid', panel, 'THE WEDGE — chroma-only separation if this is near 1'],
      ['accent-wash', panel, 'wash fill'],
      ['surface-subtle', panel, 'recess'],
    ]) {
      if (isHex(v(n, mode)) && isHex(ground)) note(`${n} vs the panel = ${r2(contrast(v(n, mode), ground))}:1  (${what})`);
    }
  }

  // ---- the shadow strings, which no colour gate can see
  const focusShadow = src['shadow-focus'];
  if (focusShadow) {
    for (const mode of MODES) {
      const bands = stops(focusShadow[mode] ?? '');
      const panel = v('surface-default', mode);
      if (bands.length < 2) {
        fail(`shadow-focus (${mode}) has ${bands.length} colour band(s). A focus ring on this palette needs two: the accent alone is near the luminance of the light panel, so a single-tone ring is the one indicator in the system and it is invisible.`);
      } else {
        const best = Math.max(...bands.map((b) => contrast(b, panel)));
        const msg = `shadow-focus (${mode}) — bands ${bands.join(' + ')}, best ${r2(best)}:1 against the panel`;
        best >= MARK_FLOOR ? pass(msg) : fail(`${msg} — no band reaches ${MARK_FLOOR}:1, so the ring cannot be seen`);
      }
    }
  }

  // ---- the chart palette carries over, or it does not
  const T = JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8'));
  const baseSurf = T.$meta.surfaces;
  console.log('\n-- chart slots on this skin\'s panel --');
  for (const mode of MODES) {
    const panel = v('surface-default', mode);
    const moved = [];
    for (const s of T.chart.categorical.slots) {
      if (src[`chart-${s.slot}`] !== undefined) continue; // the skin overrode it; base derivation no longer applies
      const before = contrast(s[mode], baseSurf[mode]);
      const after = contrast(s[mode], panel);
      // A slot changing category is what matters — a mark that cleared 3:1 on
      // the base card and does not on this panel is a silent regression, and a
      // percentage drift is not.
      if (before >= MARK_FLOOR && after < MARK_FLOOR) moved.push(`slot ${s.slot} ${r2(before)} -> ${r2(after)}`);
    }
    if (moved.length) fail(`${mode}: chart slots dropped under the ${MARK_FLOOR}:1 mark floor on this panel — ${moved.join(', ')}. Either override the slot or state the relief requirement.`);
    else pass(`${mode}: no inherited chart slot crosses the ${MARK_FLOOR}:1 mark floor on ${panel}`);
  }

  /* ---- hazard variants. Each one replaces the accent namespace and NOTHING
     else, so every check here is an accent check — but run against the skin's own
     surfaces, which do not vary. A variant value falls back to the skin's base
     value for anything it does not override, which is how the fallback below
     mirrors the cascade. */
  const STATUS_ROLES = ['critical-solid', 'critical-mark', 'warning-mark', 'serious-mark', 'good-mark'];
  for (const [vName, V] of Object.entries(S.variants ?? {})) {
    if (vName.startsWith('$')) continue;
    console.log(`\n-- hazard variant "${vName}" --`);
    const vv = (name, mode) => {
      const e = V.vars?.[name];
      if (e === undefined) return v(name, mode);
      return typeof e === 'string' ? e : e[mode];
    };

    for (const mode of MODES) {
      const panel = v('surface-default', mode);
      const canvas = v('surface-canvas', mode) ?? '';
      const ends = isHex(canvas) ? [canvas] : stops(canvas);

      floor(`[${vName}/${mode}] accent-on-solid on accent-solid`, vv('accent-on-solid', mode), vv('accent-solid', mode), TEXT_FLOOR);
      floor(`[${vName}/${mode}] accent-text on the panel`, vv('accent-text', mode), panel, TEXT_FLOOR);
      floor(`[${vName}/${mode}] text-link on the panel`, vv('text-link', mode), panel, TEXT_FLOOR);
      floor(`[${vName}/${mode}] accent-wash-text on accent-wash`, vv('accent-wash-text', mode), vv('accent-wash', mode), TEXT_FLOOR);
      floor(`[${vName}/${mode}] border-accent on the panel`, vv('border-accent', mode), panel, MARK_FLOOR);
      // The page is the binding surface for anything that lands on it, variants
      // included — an accent used as a link on the page owes its worst stop.
      let worst = null;
      for (const stop of ends) {
        const c = contrast(vv('accent-text', mode), stop);
        if (worst === null || c < worst[0]) worst = [c, stop];
      }
      if (worst) {
        checks++;
        const msg = `[${vName}/${mode}] accent-text on the page's worst stop ${worst[1]} = ${r2(worst[0])}:1 (floor ${TEXT_FLOOR})`;
        worst[0] >= TEXT_FLOOR ? console.log(`  ok    ${msg}`) : (failures++, console.error(`  FAIL  ${msg}`));
      }
      // In light the strictest thing a wash carries is MUTED ink, which is what
      // set the wash mix in the first place.
      if (mode === 'light') floor(`[${vName}/light] text-muted on accent-wash`, v('text-muted', mode), vv('accent-wash', mode), TEXT_FLOOR);

      /* THE TOPBAR WEDGE. css/skins/industry.css paints the bar's trailing band
         with accent-wash and the bar is inked with text-primary, so this is the
         check that lets the wedge exist without a layout guarantee. It is here
         rather than folded into the wash checks because the reason is different:
         the others are about a wash under a LABEL, this one is about a wash under
         whatever the consumer put in the bar. If this fails, the wedge needs a
         paler step — not a narrower band. */
      floor(`[${vName}/${mode}] text-primary on accent-wash (the topbar wedge)`, v('text-primary', mode), vv('accent-wash', mode), TEXT_FLOOR);

      // The wash edge must stay WEAKER than border-accent or a wash-filled
      // control starts to read as selected.
      const wb = vv('accent-wash-border', mode);
      const ba = vv('border-accent', mode);
      if (isHex(wb) && isHex(ba) && isHex(panel)) {
        checks++;
        const [cw, cb] = [contrast(wb, panel), contrast(ba, panel)];
        const msg = `[${vName}/${mode}] accent-wash-border ${r2(cw)}:1 stays under border-accent ${r2(cb)}:1`;
        cw < cb ? console.log(`  ok    ${msg}`) : (failures++, console.error(`  FAIL  ${msg} — a wash-filled control will read as selected`));
      }

      // A fill and its own wash have to be different things.
      differs(`[${vName}/${mode}] accent-wash vs accent-solid`, vv('accent-wash', mode), vv('accent-solid', mode));

      // The two-tone ring, per variant.
      const bands = stops(vv('shadow-focus', mode) ?? '');
      checks++;
      if (bands.length < 2) {
        failures++;
        console.error(`  FAIL  [${vName}/${mode}] shadow-focus has ${bands.length} band(s); this palette needs two`);
      } else {
        const best = Math.max(...bands.map((b) => contrast(b, panel)));
        const msg = `[${vName}/${mode}] shadow-focus best band ${r2(best)}:1 against the panel`;
        best >= MARK_FLOOR ? console.log(`  ok    ${msg}`) : (failures++, console.error(`  FAIL  ${msg} — the ring cannot be seen`));
      }
    }

    /* The collision that actually matters. Two hazard hues are never on screen
       together — exactly one is stamped — so their separation from EACH OTHER is
       not a requirement, which is the real difference between an exclusive choice
       and a positional chart slot. The skin's own STATUS colours are on screen
       with the accent, so those are gated: a collision must be acknowledged in
       the variant's $acknowledgedStatusCollisions, or this fails. Acknowledged is
       not the same as fine — it means someone wrote down that a red accent and a
       red danger button are one hue under protanopia. */
    const acked = (V.$acknowledgedStatusCollisions ?? []).join(' | ');
    const found = [];
    for (const role of STATUS_ROLES) {
      const s = v(`status-${role}`, 'light');
      const a = vv('accent-solid', 'light');
      if (!isHex(s) || !isHex(a)) continue;
      const w = worstSeparation(a, s);
      if (w.deltaE < CVD_FLOOR) found.push({ role, ...w });
    }
    for (const f of found) {
      checks++;
      const label = `status.${f.role.replace('-', '.')}`;
      const msg = `[${vName}] accent-solid vs ${label} — CVD dE ${f.deltaE.toFixed(1)} under ${CVD_FLOOR} (${f.kind})`;
      acked.includes(f.role.replace('-', '.'))
        ? console.log(`  ok    ${msg}, acknowledged`)
        : (failures++, console.error(`  FAIL  ${msg}, NOT acknowledged — add it to $acknowledgedStatusCollisions with the deltaE, or change the hue`));
    }
    if (!found.length) pass(`[${vName}] accent-solid clears dE ${CVD_FLOOR} against every status colour`);
    // An acknowledgement for a collision that no longer exists is stale prose,
    // and stale prose next to a number is how this repo's worst notes happened.
    for (const line of V.$acknowledgedStatusCollisions ?? []) {
      const role = STATUS_ROLES.find((rr) => line.includes(rr.replace('-', '.')));
      if (role && !found.some((f) => f.role === role)) {
        fail(`[${vName}] acknowledges a collision with status.${role.replace('-', '.')} that no longer measures under ${CVD_FLOOR} — delete the line`);
      }
    }
  }

  /* ---- the gallery's picker must offer exactly the hues that exist. A variant
     added to the token file and not to the picker is invisible; one removed from
     the file and left in the picker is a button that stamps an attribute nothing
     answers, and the page just silently shows the default. Neither fails
     anywhere else, which is what makes this worth a check rather than a habit. */
  const previewPath = join(root, 'preview', `skin-${stamp}.html`);
  const declared = Object.keys(S.variants ?? {}).filter((k) => !k.startsWith('$')).sort();
  if (declared.length && existsSync(previewPath)) {
    const html = readFileSync(previewPath, 'utf8');
    const m = html.match(/const HAZARDS = \[([^\]]+)\]/);
    if (!m) {
      fail(`preview/skin-${stamp}.html declares no HAZARDS list, so ${declared.length} variants have no picker`);
    } else {
      const offered = m[1].split(',').map((x) => x.trim().replace(/['"]/g, '')).filter(Boolean);
      const missing = declared.filter((d) => !offered.includes(d));
      const extra = offered.filter((o) => o !== 'yellow' && !declared.includes(o));
      if (missing.length || extra.length) {
        fail(`preview/skin-${stamp}.html picker is out of step — ${missing.length ? `missing ${missing.join(', ')}` : ''}${missing.length && extra.length ? '; ' : ''}${extra.length ? `offers ${extra.join(', ')} which no variant defines` : ''}`);
      } else {
        pass(`the gallery picker offers exactly the ${declared.length} declared variants, plus the default`);
      }
    }
  }

  // ---- dead skin-only tokens
  const cssPath = join(root, 'css/skins', `${stamp}.css`);
  if (!existsSync(cssPath)) {
    note(`no css/skins/${stamp}.css — colour-only skin, nothing to cross-check`);
  } else {
    const css = readFileSync(cssPath, 'utf8');
    const orphans = Object.keys(S.skinOnly ?? {})
      .filter((k) => !k.startsWith('$'))
      .filter((k) => !css.includes(`--jrk-${k}`));
    if (orphans.length) {
      fail(`skinOnly tokens nothing reads: ${orphans.join(', ')}. These are exempt from the build's exists-in-base assertion, so this is the only check standing between them and a colour that ships and does nothing.`);
    } else {
      pass(`every skinOnly token is referenced by css/skins/${stamp}.css`);
    }
    const hexes = css.replace(/\/\*[\s\S]*?\*\//g, '').match(/#[0-9a-fA-F]{3,8}\b/g);
    if (hexes) fail(`css/skins/${stamp}.css contains raw colour: ${[...new Set(hexes)].join(', ')} — the skin stylesheet is geometry only`);
    else pass(`css/skins/${stamp}.css holds no colour value`);
  }
}

console.log(`\n${checks} checks, ${failures} failed`);
process.exit(failures ? 1 : 0);

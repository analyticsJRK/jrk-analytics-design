#!/usr/bin/env node
/**
 * Generates dist/ from tokens/tokens.json.
 *
 *   dist/jrk-tokens.css          CSS custom properties, light + dark
 *   dist/jrk-theme.tailwind.css  Tailwind v4 @theme mapping onto those vars
 *   dist/tokens.ts               typed JS/TS exports (chart configs, inline styles)
 *   dist/jrk-skin-<stamp>.css    one per tokens/skins/*.json — opt-in overrides
 *
 * Never hand-edit dist/. Edit tokens/tokens.json and re-run `npm run build`.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const T = JSON.parse(readFileSync(join(root, 'tokens/tokens.json'), 'utf8'));

const PREFIX = 'jrk';
const isMeta = (k) => k.startsWith('$');

/** Token keys are authored for readability (`solidHover`, `1.5`); CSS idents
 *  allow neither camelCase convention nor a bare `.`. Normalize both here so
 *  tokens.json stays readable and the emitted names stay valid. */
function kebab(s) {
  return String(s)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/\./g, '_')
    .toLowerCase();
}

/** Collected as [cssVarName, lightValue, darkValue]. darkValue null = mode-invariant. */
const vars = [];
const add = (name, light, dark = null) => vars.push([`--${PREFIX}-${name}`, light, dark]);

/** A themed leaf is an object with both `light` and `dark` string values. */
const isThemed = (v) => v && typeof v === 'object' && typeof v.light === 'string' && typeof v.dark === 'string';

/** Walk a plain map of scalars: { sm: '4px' } -> --jrk-<ns>-sm: 4px */
function addFlat(ns, obj) {
  for (const [k, v] of Object.entries(obj)) {
    if (isMeta(k)) continue;
    if (typeof v === 'string') add(`${ns}-${kebab(k)}`, v);
    else if (v && typeof v === 'object') addFlat(`${ns}-${kebab(k)}`, v);
  }
}

/** Walk a map whose leaves may be themed: { canvas: {light, dark} } */
function addThemed(ns, obj) {
  for (const [k, v] of Object.entries(obj)) {
    if (isMeta(k)) continue;
    if (isThemed(v)) add(`${ns}-${kebab(k)}`, v.light, v.dark);
    else if (v && typeof v === 'object') addThemed(`${ns}-${kebab(k)}`, v);
  }
}

// ---- ramps (mode-invariant: the raw scale is available but components use semantics)
for (const [hue, steps] of Object.entries(T.ramp)) {
  if (isMeta(hue)) continue;
  // The step key needs the same $meta guard as the hue key: without it each
  // ramp's own $comment was emitted as `--jrk-neutral-$comment: <prose>;`,
  // which is invalid CSS in the shipped token layer. check-css missed it
  // because its declared() regex does not match a `$` in the ident.
  for (const [step, hex] of Object.entries(steps)) {
    if (isMeta(step)) continue;
    add(`${hue}-${step}`, hex);
  }
}

// ---- semantic color
addThemed('surface', T.color.surface);
addThemed('text', T.color.text);
addThemed('border', T.color.border);
addThemed('accent', T.color.accent);
// Vivid gradient tiles. Every stop is authored {light, dark} with the SAME value
// rather than as a bare scalar, so it goes through addThemed and the `use` /
// `$note` siblings are skipped the way they are everywhere else. -> --jrk-gradient-rose-from
addThemed('gradient', T.color.gradient);
addThemed('status', T.color.status); // -> --jrk-status-good-mark / -text / -wash
addThemed('focus', T.color.focus);
// Full-viewport washes (modal backdrop, spotlight cutout). Themed, and NOT
// reached by validate — see the $comment on the namespace for why the figures
// are recorded on the tokens by hand.
addThemed('overlay', T.color.overlay);

// ---- chart
T.chart.categorical.slots.forEach((s) => add(`chart-${s.slot}`, s.light, s.dark));
// Non-color redundancy channel. Hue alone only separates ADJACENT slots; the
// pairs that collapse under CVD are all (n, n+4). Emitted unthemed — a dash
// pattern is geometry, identical in both modes.
T.chart.categorical.slots.forEach((s) => add(`chart-dash-${s.slot}`, s.dash));
// Pastel fills for large, already-labelled marks. Separate namespace from the
// categorical slots so the two can never be confused at the call site.
T.chart.tint.slots.forEach((s) => add(`chart-tint-${s.slot}`, s.light, s.dark));
add('chart-tint-ink', T.chart.tint.ink.light, T.chart.tint.ink.dark);
// Deep fills that carry WHITE ink — the org chart's filled node. Same eight hues
// in the same searched order as the categorical slots, stepped down until white
// clears 4.5:1, so this is a VOLUME of that palette rather than a second one and
// the CVD doctrine carries over intact. Third namespace on purpose: the call site
// must never be able to confuse a mark, a tint and a deep fill, because the ink
// that survives on each is a different colour (black / theme / white).
T.chart.deep.slots.forEach((s) => add(`chart-deep-${s.slot}`, s.light, s.dark));
add('chart-deep-ink', T.chart.deep.ink.light, T.chart.deep.ink.dark);
T.chart.sequential.steps.forEach((hex, i) => add(`chart-seq-${i + 1}`, hex));
add('chart-div-negative', T.chart.diverging.negative);
add('chart-div-positive', T.chart.diverging.positive);
add('chart-div-mid', T.chart.diverging.midpoint.light, T.chart.diverging.midpoint.dark);
// Signed cell fills. Themed, because a tint that sits under text has to be pale
// in light and deep in dark — this ramp is never flipped.
for (const arm of ['negative', 'positive']) {
  const short = arm === 'negative' ? 'neg' : 'pos';
  for (const s of T.chart.diverging.steps[arm]) add(`chart-div-${short}-${s.step}`, s.light, s.dark);
}
addThemed('chart', T.chart.chrome); // -> --jrk-chart-grid / -axis / -tick / -label / -deltaUp…

// ---- scalars
addFlat('font', T.font.family);
addFlat('font-feature', T.font.feature); // --jrk-font-feature-sans
addFlat('text', T.font.size);       // --jrk-text-md (size)
addFlat('weight', T.font.weight);
addFlat('leading', T.font.lineHeight);
addFlat('tracking', T.font.tracking);
addFlat('space', T.space);
addFlat('radius', T.radius);
addFlat('control', T.size.control);
addFlat('icon', T.size.icon);
addFlat('sidebar', T.size.sidebar);
addFlat('topbar', T.size.topbar);
addFlat('container', T.size.container);
addFlat('sheet', T.size.sheet);
add('min-touch', T.size.minTouch);
/* No card-edge: the brand tile edge was removed and a tile is bounded by its fill
   step. This line used to read `add('card-edge', T.size.cardEdge)`, and deleting
   the token without deleting the line emitted `--jrk-card-edge: undefined` — a
   valid-looking declaration that check:css does not catch, because it scans
   authored CSS for raw hex and undefined token REFERENCES, not for undefined
   values in its own generated output. If you remove a token from tokens.json,
   grep this file for its name. */
addFlat('duration', T.motion.duration);
addFlat('ease', T.motion.easing);
addFlat('z', T.z);

// ---- shadows (themed)
addThemed('shadow', T.shadow);

// ============================== emit CSS ==============================
const light = vars.map(([n, l]) => `  ${n}: ${l};`).join('\n');
const dark = vars.filter(([, , d]) => d !== null).map(([n, , d]) => `    ${n}: ${d};`).join('\n');

const css = `/* GENERATED by scripts/build-tokens.mjs — do not edit. Source: tokens/tokens.json */
/* ${T.$meta.name} v${T.$meta.version} */

:root {
  color-scheme: light;
${light}
}

/* Dark values are SELECTED for the dark surface, not an automatic flip.
   Declared under both scopes so the OS setting and an explicit theme stamp
   both work, and the stamp wins in either direction. */
@media (prefers-color-scheme: dark) {
  :root:where(:not([data-theme="light"])) {
    color-scheme: dark;
${dark}
  }
}

:root[data-theme="dark"] {
  color-scheme: dark;
${dark}
}
`;

// ============================== emit accent variants ==============================
/* THE UNSKINNED LIBRARY'S OWN HUE AXIS, stamped with data-accent and crossed with
   the theme. Same shape as a skin's variants and validated the same way, with one
   difference that is the whole point of the selector below.

   SCOPED :root:not([data-skin]), DELIBERATELY. A skin OWNS its accent — that is
   what industry's data-hazard and vitrine's data-tint are — so data-accent under a
   skin is a question with two answers. Left unscoped it would also leak: a skin
   overrides only the accent tokens it happens to declare, so any variable here that
   a skin does not restate would survive into it at equal specificity and paint one
   base hue into a skinned palette. :not() makes the axis unambiguous and total.

   Variant blocks come AFTER the base block, so the default hue is the ABSENCE of
   the attribute and no existing consumer changes by one value. */
const AV = T.accentVariants ?? null;
const accentVariants = [];
if (AV) {
  const ax = AV.variantAxis;
  if (!ax?.attr || !ax?.default) {
    throw new Error('tokens.json: accentVariants declares no "variantAxis": { attr, default }.');
  }
  if (Object.keys(AV.variants ?? {}).includes(ax.default)) {
    throw new Error(
      `tokens.json: "${ax.default}" is variantAxis.default AND a declared variant. The default hue is ` +
      `the absence of the attribute, not a value of it — declaring both means a picker button that changes nothing.`
    );
  }
  const known = new Set(vars.map(([n]) => n));
  for (const [vName, V] of Object.entries(AV.variants ?? {})) {
    if (isMeta(vName)) continue;
    if (!/^[a-z][a-z0-9-]*$/.test(vName)) throw new Error(`tokens.json: accent variant "${vName}" is not a plain lowercase ident`);
    const ve = [];
    for (const [k, v] of Object.entries(V.vars ?? {})) {
      if (isMeta(k)) continue;
      const name = `--${PREFIX}-${k}`;
      /* The same assertion the skins get, and for the same reason: the tree-to-
         variable mapping is namespace-specific, so a typo here becomes a variable
         nothing reads, which is invisible in a browser. */
      if (!known.has(name)) {
        throw new Error(
          `tokens.json: accent variant "${vName}" declares "${k}", which is not a base token — ` +
          `${name} would be a colour nothing reads.`
        );
      }
      if (isThemed(v)) ve.push([name, v.light, v.dark]);
      else if (typeof v === 'string') ve.push([name, v, v]);
      else throw new Error(`tokens.json: accent variant "${vName}" -> "${k}" is neither a {light,dark} pair nor a scalar`);
    }
    if (!ve.length) throw new Error(`tokens.json: accent variant "${vName}" declares no vars`);
    accentVariants.push({ name: vName, entries: ve });
  }
}

const accentCss = accentVariants.map(({ name, entries: ve }) => {
  const vsel = `:root:not([data-skin])[data-${AV.variantAxis.attr}="${name}"]`;
  const l = ve.map(([n, lv]) => `  ${n}: ${lv};`).join('\n');
  const dPairs = ve.filter(([, lv, dv]) => dv !== lv);
  const d = dPairs.map(([n, , dv]) => `    ${n}: ${dv};`).join('\n');
  return `
/* ── accent: ${name} ${'─'.repeat(Math.max(0, 60 - name.length))} */
${vsel} {
${l}
}
${dPairs.length ? `
@media (prefers-color-scheme: dark) {
  ${vsel}:not([data-theme="light"]) {
${d}
  }
}

${vsel}[data-theme="dark"] {
${d}
}
` : ''}`;
}).join('');

const accentHeader = accentVariants.length
  ? `
/* ACCENT HUES, stamped with data-${AV.variantAxis.attr}. A second attribute, crossed with the theme:
     <html data-${AV.variantAxis.attr}="${accentVariants[0].name}">
   Available: ${accentVariants.map((v) => v.name).join(', ')}. Omit the attribute for
   ${AV.variantAxis.default} — the default hue is the ABSENCE of a variant, not one of them, so
   nothing that does not stamp it changes. Scoped :root:not([data-skin]) because a
   skin owns its own accent axis; see tokens.json -> accentVariants for the
   derivation and for what deliberately does NOT follow the hue. */
`
  : '';

// ============================== emit skins ==============================
/* A SKIN IS NOT A THIRD THEME. Each one carries its own light and dark halves,
   so it is orthogonal to the light/dark axis and gets its own stamp:
   [data-skin="x"] CROSSED with the theme, which is four blocks rather than one.
   That is why `vars` above is still [name, light, dark] and must stay that way —
   a third value per token would model an axis that does not exist, and
   `data-theme="industry"` has nowhere to put the second half of a skin's palette.

   A skin declares CSS variable names directly rather than mirroring tokens.json's
   tree, because the mapping from that tree to a variable name is namespace-specific
   (color.text.onBanner -> text-on-banner, font.family.sans -> font-sans,
   chart.chrome.surface -> chart-surface) and a mirror would need a second,
   divergent copy of it. The cost is that a typo becomes a variable nothing reads,
   which is invisible in a browser — so the name is ASSERTED against the base layer
   here, and only `skinOnly` is exempt. */
const baseNames = new Set(vars.map(([n]) => n));
const skinsDir = join(root, 'tokens/skins');
const skinFiles = existsSync(skinsDir)
  ? readdirSync(skinsDir).filter((f) => f.endsWith('.json')).sort()
  : [];
const skins = [];

for (const file of skinFiles) {
  const S = JSON.parse(readFileSync(join(skinsDir, file), 'utf8'));
  const stamp = S.stamp;
  if (!stamp) throw new Error(`tokens/skins/${file}: no "stamp" — nothing to key the selector on`);
  if (!/^[a-z][a-z0-9-]*$/.test(stamp)) throw new Error(`tokens/skins/${file}: stamp "${stamp}" is not a plain lowercase ident`);

  const entries = []; // [cssVarName, light, dark]
  const collect = (obj, requireBase) => {
    for (const [k, v] of Object.entries(obj)) {
      if (isMeta(k)) continue;
      const name = `--${PREFIX}-${k}`;
      if (requireBase && !baseNames.has(name)) {
        throw new Error(
          `tokens/skins/${file}: "${k}" is not a token in the base layer, so ${name} would be a ` +
          `colour nothing reads. Fix the name, or move it to "skinOnly" if the skin adds a value ` +
          `of its own (and then make sure css/skins/${stamp}.css actually references it).`
        );
      }
      if (isThemed(v)) entries.push([name, v.light, v.dark]);
      else if (typeof v === 'string') entries.push([name, v, v]);
      else throw new Error(`tokens/skins/${file}: "${k}" is neither a {light,dark} pair nor a scalar`);
    }
  };
  collect(S.vars || {}, true);
  collect(S.skinOnly || {}, false);

  /* ---- accent variants: a THIRD attribute, not a fourth theme.
     `data-skin` x `data-<attr>` x `data-theme`. Only the accent namespace moves;
     the neutrals, the status set and the geometry belong to the skin and do not
     vary, which is the whole reason a hue can be a one-attribute swap. A variant
     name is checked against the base layer AND against this skin's own skinOnly
     block, because the hazard tape is a skin invention and each hue restates it.

     THE ATTRIBUTE IS NAMED BY THE SKIN, and that is not decoration. industry's
     hue is a hazard SIGNAL, so `data-hazard` says what a value means; vitrine's
     is a MATERIAL, so the same attribute would have been a name that lies. The
     axis is declared in `variantAxis` — { attr, default } — and it is required
     rather than defaulted, because a skin that ships hues without saying what
     they are called is exactly the kind of silent contract this build exists to
     refuse. `default` names the hue that is the ABSENCE of the attribute; it
     never appears as a variant. */
  const axis = S.variantAxis ?? null;
  const hasVariants = Object.keys(S.variants ?? {}).some((k) => !isMeta(k));
  if (hasVariants) {
    if (!axis?.attr || !axis?.default) {
      throw new Error(
        `tokens/skins/${file}: declares variants but no "variantAxis": { attr, default }. ` +
        `attr is the data-* attribute that stamps a hue (industry uses "hazard"), default names ` +
        `the hue that is the absence of it.`
      );
    }
    if (!/^[a-z][a-z0-9-]*$/.test(axis.attr)) throw new Error(`tokens/skins/${file}: variantAxis.attr "${axis.attr}" is not a plain lowercase ident`);
    if (Object.keys(S.variants).includes(axis.default)) {
      throw new Error(
        `tokens/skins/${file}: "${axis.default}" is variantAxis.default AND a declared variant. ` +
        `The default hue is the absence of the attribute, not a value of it — declaring both means ` +
        `the picker offers a button that changes nothing.`
      );
    }
  }
  const vAttr = axis?.attr ?? 'hazard';
  const skinOwn = new Set(Object.keys(S.skinOnly ?? {}).filter((k) => !isMeta(k)).map((k) => `--${PREFIX}-${k}`));
  const variants = [];
  for (const [vName, V] of Object.entries(S.variants ?? {})) {
    if (isMeta(vName)) continue;
    if (!/^[a-z][a-z0-9-]*$/.test(vName)) throw new Error(`tokens/skins/${file}: variant "${vName}" is not a plain lowercase ident`);
    const vEntries = [];
    for (const [k, v] of Object.entries(V.vars ?? {})) {
      if (isMeta(k)) continue;
      const name = `--${PREFIX}-${k}`;
      if (!baseNames.has(name) && !skinOwn.has(name)) {
        throw new Error(
          `tokens/skins/${file}: variant "${vName}" declares "${k}", which is neither a base token nor ` +
          `one of this skin's own skinOnly names — ${name} would be a colour nothing reads.`
        );
      }
      if (isThemed(v)) vEntries.push([name, v.light, v.dark]);
      else if (typeof v === 'string') vEntries.push([name, v, v]);
      else throw new Error(`tokens/skins/${file}: variant "${vName}" -> "${k}" is neither a {light,dark} pair nor a scalar`);
    }
    if (!vEntries.length) throw new Error(`tokens/skins/${file}: variant "${vName}" declares no vars`);
    variants.push({ name: vName, entries: vEntries });
  }

  const sel = `:root[data-skin="${stamp}"]`;
  const lightDecls = entries.map(([n, l]) => `  ${n}: ${l};`).join('\n');
  // Only the values that actually differ are restated under the dark selectors —
  // a skin's mode-invariant tokens (accent.solid, the tape, the notch sizes) are
  // inherited from the block above rather than duplicated three times.
  const darkPairs = entries.filter(([, l, d]) => d !== l);
  const darkDecls = darkPairs.map(([n, , d]) => `    ${n}: ${d};`).join('\n');

  const out = `/* GENERATED by scripts/build-tokens.mjs — do not edit. Source: tokens/skins/${file} */
/* ${S.$meta?.name ?? stamp} skin v${S.$meta?.version ?? '0'} — ${entries.length} vars, ${darkPairs.length} theme-dependent */

/* OPT-IN. Import AFTER dist/jrk-tokens.css and stamp the root:
     <html data-skin="${stamp}">                     follows the OS light/dark setting
     <html data-skin="${stamp}" data-theme="dark">   pinned dark
   The skin is orthogonal to the theme — it has its own light and dark halves —
   so data-theme="${stamp}" is not a thing and matches nothing here. */
${sel} {
${lightDecls}
}

@media (prefers-color-scheme: dark) {
  ${sel}:not([data-theme="light"]) {
${darkDecls}
  }
}

${sel}[data-theme="dark"] {
${darkDecls}
}
`;

  /* Variant blocks come AFTER the skin's own, so an unstamped data-<attr> leaves
     the skin exactly as it was and no existing consumer changes. The default hue
     is therefore not a variant at all — it is the absence of one. */
  const variantCss = variants.map(({ name, entries: ve }) => {
    const vsel = `${sel}[data-${vAttr}="${name}"]`;
    const l = ve.map(([n, lv]) => `  ${n}: ${lv};`).join('\n');
    const dPairs = ve.filter(([, lv, dv]) => dv !== lv);
    const d = dPairs.map(([n, , dv]) => `    ${n}: ${dv};`).join('\n');
    return `
/* ── ${vAttr}: ${name} ${'─'.repeat(Math.max(0, 56 - name.length - vAttr.length))} */
${vsel} {
${l}
}
${dPairs.length ? `
@media (prefers-color-scheme: dark) {
  ${vsel}:not([data-theme="light"]) {
${d}
  }
}

${vsel}[data-theme="dark"] {
${d}
}
` : ''}`;
  }).join('');

  const header = variants.length
    ? `
/* ACCENT HUES, stamped with data-${vAttr}. A third attribute, crossed with the theme:
     <html data-skin="${stamp}" data-${vAttr}="${variants[0].name}">
   Available: ${variants.map((v) => v.name).join(', ')}. Omit the attribute for
   ${axis.default} — the default hue is the ABSENCE of a variant, not one of them, so
   nothing that does not stamp it can change. Only the accent namespace varies. */
`
    : '';

  skins.push({
    stamp,
    file: `dist/jrk-skin-${stamp}.css`,
    css: out + header + variantCss,
    count: entries.length,
    themed: darkPairs.length,
    variants: variants.length,
    attr: vAttr,
  });
}

// ============================== emit Tailwind v4 theme ==============================
const tw = [];
const twMap = (twName, jrkName) => tw.push(`  --${twName}: var(--${PREFIX}-${jrkName});`);

for (const g of ['surface', 'text', 'border', 'accent']) {
  for (const k of Object.keys(T.color[g])) {
    if (isMeta(k)) continue;
    twMap(`color-${g === 'text' ? 'ink' : g}-${kebab(k)}`, `${g}-${k}`);
  }
}
for (const [s, parts] of Object.entries(T.color.status)) {
  if (isMeta(s)) continue;
  for (const p of Object.keys(parts)) twMap(`color-${s}-${p}`, `status-${s}-${p}`);
}
T.chart.categorical.slots.forEach((s) => twMap(`color-chart-${s.slot}`, `chart-${s.slot}`));
T.chart.tint.slots.forEach((s) => twMap(`color-tint-${s.slot}`, `chart-tint-${s.slot}`));
// The isMeta guard here is not optional and its absence failed LOUDLY, one
// consumer downstream: font.size carries a $comment, so this emitted
// `--text-$comment: Apple's type ladder …;` into the Tailwind theme, and the
// apostrophe made Tailwind's parser die with "Unterminated string" — the whole
// app build, not just this rule. Every sibling line already had the guard.
for (const [k, v] of Object.entries(T.font.size)) if (!isMeta(k)) tw.push(`  --text-${kebab(k)}: ${v};`);
for (const [k, v] of Object.entries(T.space)) if (!isMeta(k)) tw.push(`  --spacing-${kebab(k)}: ${v};`);
for (const [k, v] of Object.entries(T.radius)) if (!isMeta(k)) tw.push(`  --radius-${kebab(k)}: ${v};`);
tw.push(`  --font-sans: ${T.font.family.sans};`);
tw.push(`  --font-mono: ${T.font.family.mono};`);
for (const k of Object.keys(T.shadow)) if (!isMeta(k)) twMap(`shadow-${k}`, `shadow-${k}`);

const tailwind = `/* GENERATED by scripts/build-tokens.mjs — do not edit. Source: tokens/tokens.json */
/* Tailwind v4 theme. Import AFTER tailwindcss and AFTER jrk-tokens.css:
     @import "tailwindcss";
     @import "@jrk/design/dist/jrk-tokens.css";
     @import "@jrk/design/dist/jrk-theme.tailwind.css";
   Utilities resolve to the same CSS vars the plain-CSS components use, so a
   Tailwind app and a Jinja template render identically and both follow the theme. */

@theme inline {
${tw.join('\n')}
}
`;

// ============================== emit TS ==============================
const ts = `/* GENERATED by scripts/build-tokens.mjs — do not edit. Source: tokens/tokens.json */

export type Mode = 'light' | 'dark';

/** Categorical series colors. Assign slots in order, never cycle.
 *  A 9th series folds into "Other" or facets — it is never a generated hue. */
export const chartSeries = {
  light: [${T.chart.categorical.slots.map((s) => `'${s.light}'`).join(', ')}],
  dark: [${T.chart.categorical.slots.map((s) => `'${s.dark}'`).join(', ')}],
} as const;

export const chartSeriesHues = [${T.chart.categorical.slots.map((s) => `'${s.hue}'`).join(', ')}] as const;

/** Non-color redundancy channel, parallel to chartSeries and indexed the same.
 *  Hue only separates ADJACENT slots — every pair that collapses under CVD is
 *  (n, n+4) — so anything comparing non-adjacent series (grouped bars, a
 *  multi-series line, a scatter, a legend read out of order) must also carry
 *  dash or shape. Slot 1 is solid: a single-series chart must not look
 *  provisional. */
export const chartSeriesDash = [${T.chart.categorical.slots.map((s) => `'${s.dash}'`).join(', ')}] as const;

export const chartSeriesShape = [${T.chart.categorical.slots.map((s) => `'${s.shape}'`).join(', ')}] as const;

export type SeriesShape = typeof chartSeriesShape[number];

/** Scatter / bubble / choropleth / small-multiples cap: any two marks can sit
 *  side by side, so only the first N slots clear the all-pairs CVD floor. */
export const SERIES_CAP_ALL_PAIRS = ${T.chart.categorical.seriesCapAllPairs};

/** Sub-3:1 on the light surface — using these as fills obligates visible direct
 *  labels or a table view. Not dismissable. */
export const reliefRequiredLight: readonly string[] = [${T.chart.categorical.reliefRequired.light.map((h) => `'${h}'`).join(', ')}];

/** Deep fills that carry WHITE ink — the org chart's filled node.
 *  The SAME eight hues in the SAME searched order as chartSeries, stepped down
 *  until white clears 4.5:1, so it is a volume of that palette rather than a
 *  second one: adjacency, the all-pairs cap of 3 and the same-parity structure of
 *  the collapsing pairs all carry over (worst adjacent dE 15.9 light / 18.4 dark).
 *
 *  NOT a series palette. A line or a bar takes chartSeries, which is tuned
 *  against the card plane; these are tuned against their own ink and are ~4.5:1
 *  on the card, which is a shape rather than a mark. Cycle at 8 the same way. */
export const chartDeep = {
  light: [${T.chart.deep.slots.map((s) => `'${s.light}'`).join(', ')}],
  dark: [${T.chart.deep.slots.map((s) => `'${s.dark}'`).join(', ')}],
} as const;

/** The one ink that survives on every chartDeep slot, both halves. White in
 *  both — it is NOT text.inverse, which is #000000 in dark and 4.0:1 at best on
 *  these fills. */
export const chartDeepInk = { light: '${T.chart.deep.ink.light}', dark: '${T.chart.deep.ink.dark}' } as const;

export const chartSequential = [${T.chart.sequential.steps.map((h) => `'${h}'`).join(', ')}] as const;

export const chartDiverging = {
  negative: '${T.chart.diverging.negative}',
  positive: '${T.chart.diverging.positive}',
  midpoint: { light: '${T.chart.diverging.midpoint.light}', dark: '${T.chart.diverging.midpoint.dark}' },
  steps: {
    negative: ${JSON.stringify(T.chart.diverging.steps.negative)},
    positive: ${JSON.stringify(T.chart.diverging.steps.positive)},
  },
} as const;

/** Signed value -> diverging step 1..4. 'max' is the largest ABSOLUTE value in
 *  the set being compared, so every cell in one table shares a scale — a
 *  per-cell scale would make two different numbers the same colour. Returns
 *  null at exactly zero, which is the midpoint and takes no fill. */
export function divergingStep(value: number, max: number): { arm: 'negative' | 'positive'; step: 1 | 2 | 3 | 4 } | null {
  if (!value || !max) return null;
  const ratio = Math.min(Math.abs(value) / Math.abs(max), 1);
  const step = Math.min(4, Math.max(1, Math.ceil(ratio * 4))) as 1 | 2 | 3 | 4;
  return { arm: value < 0 ? 'negative' : 'positive', step };
}

export const chartChrome = ${JSON.stringify(T.chart.chrome, null, 2).replace(/"([^"]+)":/g, '$1:').replace(/"/g, "'")} as const;

export const status = ${JSON.stringify(T.color.status, (k, v) => (k.startsWith('$') ? undefined : v), 2).replace(/"([^"]+)":/g, '$1:').replace(/"/g, "'")} as const;

export type StatusName = keyof typeof status;

/** Read a token off the live cascade, so it follows the active theme.
 *  Prefer this over importing hexes when the value goes into the DOM. */
export function token(name: string, el: Element = document.documentElement): string {
  return getComputedStyle(el).getPropertyValue(\`--${PREFIX}-\${name}\`).trim();
}

/** Series color for slot i (0-based) in the given mode. Throws past slot 8 —
 *  that is the signal to fold into "Other" or facet, not to generate a hue. */
export function seriesColor(i: number, mode: Mode = 'light'): string {
  const p = chartSeries[mode];
  if (i < 0 || i >= p.length) {
    throw new RangeError(
      \`No categorical slot \${i}. The palette has \${p.length} slots and is never cycled — \` +
      \`fold the extra series into "Other", use small multiples, or add a second encoding.\`
    );
  }
  return p[i];
}

/** Dash pattern for slot i (0-based) as an SVG stroke-dasharray. 'none' for
 *  slot 1. Only legal on a series line when the chart has opted into redundant
 *  encoding — charts.md reserves the dashed stroke for .jrk-threshold. */
export function seriesDash(i: number): string {
  if (i < 0 || i >= chartSeriesDash.length) {
    throw new RangeError(\`No categorical slot \${i}. The palette has \${chartSeriesDash.length} slots and is never cycled.\`);
  }
  return chartSeriesDash[i];
}

/** Mark shape for slot i (0-based). The only channel that survives when two
 *  non-adjacent hues collapse under CVD, so scatter and line markers should
 *  always set it — see SERIES_CAP_ALL_PAIRS for the colour-only limit. */
export function seriesShape(i: number): SeriesShape {
  if (i < 0 || i >= chartSeriesShape.length) {
    throw new RangeError(\`No categorical slot \${i}. The palette has \${chartSeriesShape.length} slots and is never cycled.\`);
  }
  return chartSeriesShape[i];
}

/** Current mode from the cascade (explicit stamp wins over the OS setting). */
export function currentMode(): Mode {
  if (typeof document === 'undefined') return 'light';
  const stamped = document.documentElement.dataset.theme;
  if (stamped === 'dark' || stamped === 'light') return stamped;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
`;

// ============================== emit icons ==============================

/* One glyph source, two consumers: the React <Icon> and the plain-JS previews
   (which have no build step and cannot import TS). Generating both from
   tokens/icons.json is what stops a path being defined twice and drifting. */
const I = JSON.parse(readFileSync(join(root, 'tokens/icons.json'), 'utf8'));
const outline = Object.fromEntries(Object.entries(I.outline).filter(([k]) => !isMeta(k)));
const filled = Object.fromEntries(Object.entries(I.filled).filter(([k]) => !isMeta(k)));
const statusMap = Object.fromEntries(Object.entries(I.statusMap).filter(([k]) => !isMeta(k)));

const iconBody = `/* GENERATED by scripts/build-tokens.mjs — do not edit. Source: tokens/icons.json */

/* Stroked glyphs. CSS (.jrk-icon) supplies stroke-width, linecap and linejoin. */
export const OUTLINE = ${JSON.stringify(outline, null, 2)};

/* Filled glyphs. One path each; the inner mark is punched out with
   fill-rule="evenodd" so the badge wash behind shows through. */
export const FILLED = ${JSON.stringify(filled, null, 2)};

/* Which filled glyph each status tone renders. */
export const STATUS_ICON = ${JSON.stringify(statusMap, null, 2)};

export const ICON_NAMES = [...Object.keys(OUTLINE), ...Object.keys(FILLED)];

/** Markup for one glyph, for consumers without JSX (previews, Jinja). */
export function iconSvg(name, extraClass = '') {
  const fill = FILLED[name];
  const cls = ['jrk-icon', fill ? 'jrk-icon--fill' : '', extraClass].filter(Boolean).join(' ');
  const attrs = \`class="\${cls}" viewBox="0 0 16 16" aria-hidden="true"\${fill ? ' data-fill="true"' : ''}\`;
  return fill
    ? \`<svg \${attrs}><path fill-rule="evenodd" d="\${fill}"/></svg>\`
    : \`<svg \${attrs}><path d="\${OUTLINE[name]}"/></svg>\`;
}
`;

// The .ts copy adds the literal types the React layer needs.
const iconTs = iconBody
  .replace('export const OUTLINE =', 'export const OUTLINE: Record<string, string> =')
  .replace('export const FILLED =', 'export const FILLED: Record<string, string> =')
  .replace('export const STATUS_ICON =', 'export const STATUS_ICON: Record<string, string> =')
  .replace('export function iconSvg(name, extraClass = \'\')',
           'export function iconSvg(name: string, extraClass = \'\'): string');

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/jrk-tokens.css'), css + accentHeader + accentCss);
for (const s of skins) writeFileSync(join(root, s.file), s.css);
writeFileSync(join(root, 'dist/jrk-theme.tailwind.css'), tailwind);
writeFileSync(join(root, 'dist/tokens.ts'), ts);
writeFileSync(join(root, 'dist/icons.ts'), iconTs);
writeFileSync(join(root, 'dist/icons.js'), iconBody);

console.log(`built dist/`);
console.log(`  jrk-tokens.css          ${vars.length} vars (${vars.filter((v) => v[2] !== null).length} themed, ${accentVariants.length} data-accent variants)`);
console.log(`  jrk-theme.tailwind.css  ${tw.length} mappings`);
for (const s of skins) console.log(`  jrk-skin-${s.stamp}.css${" ".repeat(Math.max(1, 15 - s.stamp.length))}${s.count} vars (${s.themed} theme-dependent, ${s.variants ? `${s.variants} data-${s.attr} variants` : 'no variants'})`);
console.log(`  tokens.ts`);
console.log(`  icons.ts / icons.js     ${Object.keys(outline).length} outline + ${Object.keys(filled).length} filled`);

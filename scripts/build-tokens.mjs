#!/usr/bin/env node
/**
 * Generates dist/ from tokens/tokens.json.
 *
 *   dist/jrk-tokens.css          CSS custom properties, light + dark
 *   dist/jrk-theme.tailwind.css  Tailwind v4 @theme mapping onto those vars
 *   dist/tokens.ts               typed JS/TS exports (chart configs, inline styles)
 *
 * Never hand-edit dist/. Edit tokens/tokens.json and re-run `npm run build`.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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
addThemed('status', T.color.status); // -> --jrk-status-good-mark / -text / -wash
addThemed('focus', T.color.focus);

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
T.chart.sequential.steps.forEach((hex, i) => add(`chart-seq-${i + 1}`, hex));
add('chart-div-negative', T.chart.diverging.negative);
add('chart-div-positive', T.chart.diverging.positive);
add('chart-div-mid', T.chart.diverging.midpoint.light, T.chart.diverging.midpoint.dark);
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
add('card-edge', T.size.cardEdge);
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
for (const [k, v] of Object.entries(T.font.size)) tw.push(`  --text-${kebab(k)}: ${v};`);
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

export const chartSequential = [${T.chart.sequential.steps.map((h) => `'${h}'`).join(', ')}] as const;

export const chartDiverging = {
  negative: '${T.chart.diverging.negative}',
  positive: '${T.chart.diverging.positive}',
  midpoint: { light: '${T.chart.diverging.midpoint.light}', dark: '${T.chart.diverging.midpoint.dark}' },
} as const;

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
writeFileSync(join(root, 'dist/jrk-tokens.css'), css);
writeFileSync(join(root, 'dist/jrk-theme.tailwind.css'), tailwind);
writeFileSync(join(root, 'dist/tokens.ts'), ts);
writeFileSync(join(root, 'dist/icons.ts'), iconTs);
writeFileSync(join(root, 'dist/icons.js'), iconBody);

console.log(`built dist/`);
console.log(`  jrk-tokens.css          ${vars.length} vars (${vars.filter((v) => v[2] !== null).length} themed)`);
console.log(`  jrk-theme.tailwind.css  ${tw.length} mappings`);
console.log(`  tokens.ts`);
console.log(`  icons.ts / icons.js     ${Object.keys(outline).length} outline + ${Object.keys(filled).length} filled`);

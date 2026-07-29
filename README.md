# JRK Analytics Design

Design library for JRK analytics dashboards and web apps: one token layer, a
plain-CSS component library, and React wrappers over the same class names.

It serves both stacks in the org as they actually are:

| Stack | How it consumes the library |
|---|---|
| `jrk_agents` — Next.js 15 / React 19 / Tailwind v4 | Tokens as a Tailwind `@theme`, plus the React components |
| `jrk-audit-platform`, `JRK_FORMS` — Python + Jinja | One `<link>` to `css/index.css`, plain `jrk-*` classes |

Both paths resolve to the same CSS custom properties, so a Tailwind utility and
a `jrk-*` class produce the same color and both follow the theme toggle.

---

## Quick start

```bash
npm install
npm run build      # tokens/tokens.json -> dist/
npm run preview    # gallery at http://localhost:4321/preview/index.html
npm test           # build + css check + color gate + typecheck
```

Open the gallery first — it is the fastest way to see what exists.

### Jinja / plain HTML

```html
<link rel="stylesheet" href="/static/jrk/index.css">

<button class="jrk-btn jrk-btn--primary">Run audit</button>
<span class="jrk-badge jrk-badge--good">Reconciled</span>
```

Copy or symlink `css/` and `dist/` into the app's static directory. No build
step, no framework.

### Tailwind v4 + React

```css
/* app/globals.css */
@import "tailwindcss";
@import "@jrk/design/dist/jrk-tokens.css";
@import "@jrk/design/dist/jrk-theme.tailwind.css";
@import "@jrk/design/css/index.css";
```

```tsx
import { Stat, DataTable, ChartCard, LineChart } from '@jrk/design';

<Stat label="Collected rent" value="$4.2M"
      delta={{ value: 3.1, vs: 'vs last month' }} />
```

The React layer has no Tailwind dependency — it emits the same `jrk-*` classes.
Tailwind utilities compose alongside them via `className`.

### Theming

```ts
import { setTheme } from '@jrk/design';
setTheme('dark');    // 'light' | 'dark' | 'system'
```

Stamps `data-theme` on `<html>`. Dark values are **selected** for the dark
surface, not flipped from light. An explicit stamp beats the OS preference in
both directions.

---

## Repo layout

```
tokens/tokens.json          source of truth — the only file you hand-edit
scripts/build-tokens.mjs    -> dist/ (CSS vars, Tailwind @theme, typed TS)
scripts/validate-colors.mjs the color gate — six checks + WCAG, both themes
scripts/check-css.mjs       brace balance, token typos, raw-hex discipline
css/                        plain-CSS library, works with no build step
react/src/                  React wrappers over the same class names
preview/                    static gallery — no build step
dist/                       GENERATED — never hand-edit
```

**Changing a color means editing `tokens/tokens.json` and re-running
`npm run build`.** Nothing else is a source of truth.

---

## The rules this library enforces

These are gates, not conventions. They fail `npm test`, not a review comment.

### Color is computed, not chosen

`npm run validate` runs the categorical palette through a lightness band, a
chroma floor, colorblind separation under simulated protanopia and deuteranopia,
a normal-vision floor, and contrast against the real surface — in both themes,
on both pairlists. Then it WCAG-checks every text, status, accent, and focus
token against each surface it actually renders on.

It has already caught real near-misses: `blue-450` as the button fill measured
4.42:1 with white text, so the fill is `blue-500`.

The full six-checks run needs the `dataviz` skill's validator:

```bash
JRK_DATAVIZ=/path/to/dataviz npm run validate
```

Without it the WCAG half still runs and the six-checks half warns.

### Surfaces are inverted, on purpose

In **light** mode the page plane is white and the **cards carry a soft
gray-purple tint** (`surface.default` = `#f5f5fa`). Popovers, modals, and inputs
then go white so they still lift off the cards. Cards have no border — they
separate from the page by their fill, and the transparent border exists only to
hold the box model steady and to let the forced-colors rule put a real one back.

In **dark** mode the same layering goes achromatic: a true black page
(`#000000`) with neutral shadow-grey tiles (`#1a1a1a`), stepping up through
`#212121` and `#262626` for wells and popovers. Ink is neutral grey too — a
violet-tinted ink on neutral tiles reads as a color cast rather than a choice.
The indigo accent and the chart hues are the only color in the dark UI.

Two practical consequences:

- **The card, not the page, is the chart surface.** Marks are validated against
  `#f5f5fa` / `#1a1a1a`, not against white or black.
- **In dark mode the grey tile *is* the elevation cue.** A drop shadow is
  invisible against a true black page, so the surface step does that work and
  the dark shadow tokens only tighten the edge.

### Two chart color sets, for two different jobs

| Set | Tokens | For |
|---|---|---|
| **Categorical** | `--jrk-chart-1..8` | Series identity. Fixed order, validated for colorblind separation. |
| **Tint** | `--jrk-chart-tint-1..8` | Pastel fills for large marks whose identity is already carried elsewhere. |

The tints are what produce the soft look. They sit **above** the lightness band
and **below** the chroma floor, so they physically cannot do identity work, and
the validator does not check them for CVD separation — that is not their job.

A tint is legal when the mark is **axis-labelled, direct-labelled, or has its
value printed in the legend**. Using one where color *is* the identity channel —
an unlabelled multi-series line chart, a scatter plot — is a bug, and no gate
will catch it for you.

The categorical set was softened as far as the gates allow: lightness lifted,
chroma cut about a quarter, hue held. The **lightness spread was preserved** —
protan and deutan viewers separate colors mostly by lightness, so making
everything uniformly pale is exactly what collapses CVD separation. Light and
dark were tuned independently because their bands differ (light 0.43–0.77 is
much wider than dark 0.48–0.67). Pushing further fails: light hits the adjacent
CVD floor, dark runs out of lightness band.

### The series palette is never cycled

Eight slots in a fixed order. The **order** is the colorblind-safety
mechanism — neighbors are what touch in a stack or a line chart, so adjacent
pairs are what the gate measures. A ninth series is never a generated hue: it
folds into "Other", facets into small multiples, or takes a second encoding.
`seriesColor(8)` throws rather than wrapping around.

Scatter, bubble, choropleth, and small multiples cap at **three** series — there
any two marks can sit side by side, so the harder all-pairs test applies. That is
a series cap, not a palette change; no ordering of eight can pass it.

### Color is never the only signal

- Status badges ship an icon and a label. `<Badge tone="warning">` renders the
  icon automatically — on the light surface `warning` and `serious` sit below
  3:1 by design, and the pairing is the documented mitigation.
- Deltas state direction in text for screen readers, and take direction and
  interpretation as **separate** inputs. Falling delinquency is good; the
  library never assumes up means good.
- Every chart has a table view. It is the relief channel for the three
  light-mode series hues below 3:1, and the answer for screen readers.
- `tokens.json` lists those three hues in `reliefRequired.light`, and the
  validator fails if the list goes stale.

### Chart marks

Bars cap at 24px with a 4px data-end, square at the baseline. Lines are 2px.
Markers are ≥ 8px with a 2px surface ring. Grid and axes are hairline and
**solid** — a dashed line reads as data, so dashes are reserved for threshold
lines. Touching fills are separated by a **2px gap in the surface color**, never
by a stroke; a stroke adds ink that is not data.

**No dual-axis charts.** Two y-scales let the author pick the correlation by
picking the scales. Two measures of different magnitude become two charts, small
multiples, or values indexed to a common base.

### Chart SVGs size their viewBox from the container

A fixed viewBox stretched by `width: 100%` scales the text and strokes with it —
12px axis labels land near 18px on a wide card and hairlines stop being
hairlines. `<LineChart>` measures with a `ResizeObserver` so user units stay 1:1
with CSS pixels. Hand-written chart SVGs must do the same.

---

## Verifying

```bash
npm test
```

Runs, in order:

1. `build` — regenerates `dist/` from `tokens/tokens.json`
2. `check:css` — brace balance, undefined `var(--jrk-*)` references, raw hex
   outside the token layer
3. `validate` — the color gate described above
4. `typecheck` — `tsc --noEmit` over the React layer

Then look at it, because none of those check layout:

```bash
npm run preview
```

Toggle light/dark in the gallery nav. The foundations page recomputes every
contrast readout live against the active theme.

---

## Adding a component

1. Add the CSS to `css/components/<name>.css` and import it in `css/index.css`.
   Reference tokens only — `check:css` fails on a raw hex.
2. Add the React wrapper in `react/src/<Name>.tsx` emitting those class names,
   and export it from `react/src/index.ts`.
3. Add it to `preview/components.html` so it is visible in both themes.
4. `npm test`, then look at the gallery.

If a component needs a new color, it goes in `tokens/tokens.json` with a light
and a dark value and gets re-validated — not inline in the component.

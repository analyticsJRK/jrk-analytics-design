# CLAUDE.md — jrk-analytics-design

Design library for JRK analytics dashboards: one token layer, a plain-CSS
component library, and React wrappers over the same class names. Consumed by
`jrk_agents` (Next.js / Tailwind v4) and by `jrk-audit-platform` / `JRK_FORMS`
(Python + Jinja).

## Before you change anything

```bash
npm test    # build + check:css + validate + typecheck
```

`npm test` is the gate. It is fast; run it after every change.

## Hard rules

**`tokens/tokens.json` is the only source of truth for design values.**
`dist/` is generated — never hand-edit it. Adding or changing a color means
editing `tokens.json` and running `npm run build`. `check:css` fails on a raw
hex in a component file, so there is no way around this.

**Never hand-pick a color.** `npm run validate` is the arbiter: a lightness
band, chroma floor, colorblind separation (protanopia + deuteranopia), a
normal-vision floor, and WCAG contrast, in both themes against the real
surfaces. If you add a color and it fails, re-step it — do not lower the gate.

The full six-checks run needs the `dataviz` skill's validator. Point at it:
```bash
JRK_DATAVIZ=/path/to/skills/dataviz npm run validate
```
Without it the WCAG half still runs and the six-checks half warns rather than
silently passing.

**The chart series palette is never cycled.** Eight slots, fixed order; the
order is the colorblind-safety mechanism. A ninth series folds into "Other",
facets, or takes a second encoding. Do not add a slot 9. `seriesColor(8)` throws
on purpose. Scatter/bubble/choropleth/small-multiples cap at three series.

**Color is never the only signal.** Status needs icon + label. Deltas state
direction in text. Charts have a table view. If you write a component where a
color alone conveys meaning, it is wrong.

**Surfaces are inverted, and the two modes are not the same family.** Light:
white page, gray-purple (`#f5f5fa`) cards, white popovers and inputs. Dark:
true black page (`#000000`), neutral shadow-grey tiles (`#1a1a1a`), neutral grey
ink — achromatic on purpose, so the indigo accent and the chart hues are the
only color. Do not reintroduce a violet cast into the dark surfaces or ink.

Cards are borderless in both modes — they separate by fill, and chrome (sidebar,
topbar) sits on the page plane so the cards read as the raised thing. Because
the card is the chart surface, marks are validated against `#f5f5fa` / `#1a1a1a`,
never against white or black. In dark mode the grey tile is the elevation cue:
a shadow does not read against a black page.

**`--jrk-chart-*` and `--jrk-chart-tint-*` are not interchangeable.** The
categorical set carries identity and is CVD-validated. The tint set is pastel
fills for large marks that are *already* labelled — axis category, direct value,
or a number in the legend. Tints are deliberately outside the lightness band and
under the chroma floor, so the validator skips them. Reaching for a tint where
color is the identity channel is a bug no gate will catch.

**Do not "soften" the categorical palette by flattening its lightness.** It is
already at the softest setting that passes. Protan/deutan separation comes
mostly from lightness differences, so making every slot uniformly pale collapses
CVD separation — the spread has to survive; only the mean can move.

**Dark values are selected, not flipped.** Every themed token has an explicit
`light` and `dark` entry chosen for that surface. Do not compute one from the
other.

**`.jrk-sheet` is a grid, not a table, and that is on purpose.** One shared
`--jrk-sheet-cols` track list is the only way a single Excel-style column bar can
align with many stacked metric blocks. Do not "fix" it into a `<table>`, and do
not set the track list per row. Because it is a grid, ARIA roles are mandatory:
`role="grid"` / `row` / `rowheader` / `gridcell`, with the letter bar and number
gutter `aria-hidden` (they are a coordinate system, not data).

In a sheet, tone comes from the metric's `inverted` flag, never from the sign of
the number — for delinquency or an expense variance, down is the good outcome.

## Layout gotchas that have already bitten

- **`display: block` on bar fills is load-bearing.** `.jrk-cell-bar__fill` and
  friends are `<span>`s; an inline box ignores width and height, so the bar
  renders as an empty track. This shipped broken once.
- **`flex-wrap: wrap` on a COLUMN flex container** makes it multi-line, and
  `align-content: stretch` then inflates each line. It silently tripled a grid's
  height in the gallery CSS.
- **Chart SVG viewBoxes must be measured from the container.** A fixed viewBox
  stretched by `width: 100%` scales the text and strokes too — 12px axis labels
  render near 18px on a wide card. `<LineChart>` uses a `ResizeObserver`; hand-
  written chart SVGs must do the same.

## Verifying visually

The automated checks do not check layout. After a UI change:

```bash
npm run preview     # http://localhost:4321/preview/index.html
```

Toggle light/dark in the nav — both must be checked, they are different
palettes. To capture headlessly:

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless --disable-gpu \
  --virtual-time-budget=4000 --window-size=1200,1500 \
  --screenshot=out.png http://localhost:4321/preview/dashboard.html
```

Screenshot at roughly the page's real width — a downscaled capture makes 2px
marks and hairlines look broken when they are correct.

## Adding a component

1. `css/components/<name>.css`, imported from `css/index.css`. Tokens only.
2. `react/src/<Name>.tsx` emitting the same class names, exported from
   `react/src/index.ts`. No Tailwind dependency in the React layer.
3. Add it to `preview/components.html` so it is visible in both themes.
4. `npm test`, then look at the gallery.

## Conventions

- CSS classes are `jrk-block__element--modifier`.
- CSS custom properties are `--jrk-<category>-<name>`, generated from
  `tokens.json` (camelCase keys are kebab-cased, `.` becomes `_`).
- Components reference semantic tokens (`--jrk-surface-default`), never ramp
  steps (`--jrk-neutral-100`) and never raw hex.
- Transitions use `var(--jrk-transition)`, which the reduced-motion guard in
  `base.css` zeroes globally — do not hand-roll durations.

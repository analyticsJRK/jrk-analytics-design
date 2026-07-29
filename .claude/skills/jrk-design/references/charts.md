# Charts

Color comes **last**. Most bad charts pick colors first.

## 1. Pick the form from the data's job

| The data's job | Form |
|---|---|
| one headline number | **stat tile** — never a one-bar chart |
| magnitude across nominal categories | ranked horizontal bars, all one hue |
| change over time | line (2px) or area (single series, ~10% wash) |
| part-to-whole, few parts | stacked bar with a 2px surface gap |
| position in a sequence (funnel, tier) | **ordinal** — one hue, monotone steps |
| polarity around a baseline | diverging — two hues, neutral grey middle |
| state (good → critical) | status tokens, with icon + label |

**Categorical or ordinal?** If swapping the category order would change the
meaning (funnel stages, size tiers, age bands) it is ordinal and takes a one-hue
ramp. If not (property names, regions, teams) it is nominal — and nominal bars
all take **slot 1**. Coloring nominal bars by their value spends the identity
channel re-encoding what bar length already shows.

## 2. Two color sets, two jobs

| Set | Tokens / classes | For |
|---|---|---|
| **Categorical** | `--jrk-chart-1..8`, `.jrk-s1..8` | series identity; CVD-validated |
| **Tint** | `--jrk-chart-tint-1..8`, `.jrk-t1..8` | pastel fills for already-labelled marks |

A tint is legal **only** when identity is carried by something else: a category
label on the axis, a direct value label, or a number in the legend. Tints sit
above the lightness band and below the chroma floor, so the validator
deliberately skips them — reaching for one where color *is* the identity channel
is a bug no gate will catch.

Set a series color via `--series` on the mark's container, or the helper classes.

**Never cycle the palette.** Eight slots, fixed order — the order is the
colorblind-safety mechanism, because neighbors are what touch in a stack or a
line chart. A ninth series folds into "Other", facets into small multiples, or
takes a second encoding.

**Scatter, bubble, choropleth, and small multiples cap at 3 series.** There any
two marks can sit side by side, so the harder all-pairs test applies and only the
first three slots clear it. That is a series cap, not a palette change — no
ordering of eight can pass it.

**Color follows the entity, never its rank.** A filter that changes the series
count must not repaint the survivors.

**Status colors are reserved.** When a series *means* good/bad (error rate,
pass/fail) it wears status tokens; when it is just "series 4" it wears
categorical. Never both in one chart.

## 3. Mark specs

| Mark | Spec |
|---|---|
| bar / column | ≤ 24px thick; `--jrk-radius-data-end` on the data end, square at the baseline |
| line | 2px, round join and cap |
| marker / end dot | ≥ 8px (r ≥ 4), filled with the series color |
| area fill | series hue at ~10% opacity — a wash, never a saturated block |
| grid / axes | hairline 1px, **solid**, recessive |

Two spacers do the separating, and they are white space, not ink:
- **Surface gap** — a 2px gap in the *surface* color between touching marks,
  one consistent width across a stack. Use flex `gap`.
- **Surface ring** — a 2px ring in the surface color on dots, so they stay
  legible where they overlap. Part of the hover target too.

Never draw a border around a mark to separate it — a stroke adds data-weight ink
that is not data.

Dashed is reserved for `.jrk-threshold` (a reference value). A dashed gridline
reads as data.

## 4. Labels, legend, text

- **A legend appears for ≥ 2 series and never for 1** — with one color the title
  already says what is plotted, and a one-swatch box just restates it.
  `<Legend>` returns null below two series.
- **Label selectively.** The endpoint, the extreme, or the one series the story is
  about. A number on every point is chaos and goes unread.
- **Text wears text tokens, never the series color.** A light hue is illegible as
  text. Identity comes from the colored mark *beside* the label. The one
  exception is a label set inside a filled mark — use `.jrk-chart__value--on-fill`
  / `--on-light` / `--on-tint` so it clears contrast against the fill.
- Y-axis ticks round to clean numbers, thousands-comma'd.
- **A label that will not fit is not clipped.** Move it outside the bar end, or
  let the legend and tooltip carry it. Never `overflow: hidden` on the segment.
- When end labels collide, do not stack them — use leader lines or facet into
  small multiples.

## 5. Interaction ships by default

An SVG chart *is* interactive. Crosshair + tooltip on line/area, per-mark tooltip
on bar/dot/cell. The only form that skips it is a bare stat tile with no plot.

`.jrk-chart__crosshair`, `.jrk-chart-tooltip` + `__header` `__row` `__swatch`
`__label` `__value`, and `.jrk-chart__hit` for hit targets **bigger than the
mark** — an 8px dot is far too small to hover reliably.

## 6. Every chart has a table view

`<ChartCard table={...}>` renders it behind a toggle. It is the relief channel
for the light-mode hues below 3:1, the answer for screen readers, and how anyone
gets exact values. Give the SVG a `role="img"` and an `aria-label` that carries
the gist; the table carries the numbers.

## 7. viewBox must match the container

A fixed viewBox stretched by `width: 100%` scales the **text and strokes** too —
12px axis labels land near 18px on a wide card and hairlines stop being
hairlines. `<LineChart>` measures with a `ResizeObserver` so user units stay 1:1
with CSS pixels. Hand-written chart SVGs must do the same.

## Components

- `.jrk-chart` (root, holds `--series`), `__plot`, `__value`, `__tick`, `__axis-title`
- `.jrk-chart-card` + `__header` `__title` `__subtitle` `__body` — the subtitle
  names the period and unit. A chart whose title does not say what window it
  covers is not finished
- `.jrk-line` (`--muted`), `.jrk-area`, `.jrk-dot`, `.jrk-bar` (`--muted`),
  `.jrk-threshold` + `.jrk-threshold-label`
- `.jrk-bars` + `__row` `__label` `__track` `__fill` `__value` (`--tinted`)
- `.jrk-stack-bar` + `__seg` (`--tinted`) — segments auto-assign slots 1..8
- `.jrk-meter` + `__fill` (`--warning` `--critical`) — the unfilled track is a
  lighter step of the same ramp, so severity reads across the whole bar
- `.jrk-legend` + `__item` `__swatch` (`--line` `--dot`)
- `.jrk-grid`, `.jrk-axis` (chart chrome, inside SVG)

## Anti-patterns

- **Dual-axis charts.** The #1 chart mistake — two y-scales let the author choose
  the correlation. Two charts, small multiples, or index to a common base.
- Rainbow sequential ramps; a hue at a diverging midpoint.
- Coloring nominal bars by value.
- A 9th generated hue.
- A tint carrying identity.
- Value labels on every point.
- Dashed gridlines.

## Texture — the backup channel

`data-texture="on"` on `.jrk-chart`, plus automatic under `@media print` and
`forced-colors`. One hand-drawn fill at 45° and its 135° mirror only —
horizontal or vertical hatching reads as gridlines. Never on by default.

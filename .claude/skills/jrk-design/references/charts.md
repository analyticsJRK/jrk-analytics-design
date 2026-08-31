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
| signed values in ONE table column | `.jrk-cell-bar--signed` — length from a centre axis |
| signed values across a table GRID | `.jrk-cell-heat` — diverging tint + `.jrk-heat-legend` |
| state (good → critical) | status tokens, with icon + label |

**Signed in a table — bar or tint?** Length is the precise channel and colour is
the coarse one, so a single column compared down its length takes the bar, and a
grid scanned to find *where* the problem is takes the tint. A grid of bars is
unreadable; a lone column of tints wastes the precise channel. Both print the
value, always — colour and direction are second channels, the sign in the text is
the first.

The tint draws from `--jrk-chart-div-{neg,pos}-1..4`, **never the poles**: those
steps are gated to keep `text.primary` above 4.5:1 because the fill sits under a
number, and the poles are mark colours that are not. Do not extend either arm for
"more contrast" — the ramp already stops exactly where legibility does (the
binding value is the deepest positive step in dark, 4.89:1). One `max` across the
whole set, or two different numbers get the same colour.

**Categorical or ordinal?** If swapping the category order would change the
meaning (funnel stages, size tiers, age bands) it is ordinal and takes a one-hue
ramp. If not (property names, regions, teams) it is nominal — and nominal bars
all take **slot 1**. Coloring nominal bars by their value spends the identity
channel re-encoding what bar length already shows.

## 2. Three color sets, three jobs — and three different inks

| Set | Tokens / classes | For | Ink that survives on it |
|---|---|---|---|
| **Categorical** | `--jrk-chart-1..8`, `.jrk-s1..8` | series identity; CVD-validated | black only |
| **Tint** | `--jrk-chart-tint-1..8`, `.jrk-t1..8` | pastel fills for already-labelled marks | the theme's own |
| **Deep** | `--jrk-chart-deep-1..8` | solid fills that carry white ink | white only |

**The ink column is the whole reason there are three.** They are not three levels
of the same thing that you pick by taste — each is measured against a different
neighbour, and the call site must never be able to confuse them.

A tint is legal **only** when identity is carried by something else: a category
label on the axis, a direct value label, or a number in the legend. Tints sit
above the lightness band and below the chroma floor, so the validator
deliberately skips them — reaching for one where color *is* the identity channel
is a bug no gate will catch.

**Deep is not a fourth palette, it is a VOLUME of the categorical one** — same
eight hues, same searched order, each stepped down in lightness until white clears
4.5:1 (worst 4.54:1 light, 4.58:1 dark). That is what let the whole CVD argument
below transfer to it unchanged rather than being re-derived: worst adjacent dE
**15.9 light / 18.4 dark**, the same all-pairs safe cap of 3, and all nine
collapsing pairs still same-parity so the same texture buckets separate them.
`validate` gates every one of those, including that it still IS the categorical
hue order.

It exists because on the categorical marks **no ink but black clears 4.5:1 and
white clears it on none** — so where a design needs a saturated fill under white
ink, the fill moves rather than the ink. **Read that as the general rule.** Its
one consumer today is the org chart's filled node (`.jrk-org--group-solid`).

**Deep is still NOT a series palette.** It is tuned against its own ink instead of
against the card, so every slot sits at ~4.5:1 on the plane — which reads as a
shape, not a mark. A line, a bar or a dot takes **categorical**; `seriesColor()`
does not know these values and should not.

Set a series color via `--series` on the mark's container, or the helper classes.

**Never cycle the palette.** Eight slots — `blue, orange, mint, yellow, purple,
pink, teal, brown` — seeded from Apple's system colours and then ORDERED BY
SEARCH to maximise the worst adjacent pair across both modes jointly. The order
is the colorblind-safety mechanism, because neighbours are what touch in a stack
or a line chart. Apple publishes no CVD-safe sequence, so this order is derived,
not adopted; worst adjacent ΔE is 16.3 light / 15.1 dark.

Blue is slot 1 deliberately — it is the default single-series colour. systemGreen
and systemRed are held out of the series entirely (they are status good/critical,
and a green or red series in a financial chart reads as a verdict), and
systemIndigo is held out as the UI accent. **That last reason is now stale** — the UI accent moved to a cyan at hue 197 degrees, which sits 7.6 degrees from slot 7 (teal), and indigo is reserved by nothing. The palette has NOT been re-derived; what separates accent from series in practice is lightness, not hue. See the note on `chart.categorical` in `tokens.json`.

A ninth series folds into "Other", facets into small multiples, or takes a second
encoding.

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
reads as data. **One exception:** under `data-encoding="redundant"` series lines
take their per-slot dash — see §3a. The threshold stays distinguishable there by
color (recessive tick grey, never a series hue) and weight (1.5 vs 2).

## 3a. The second identity channel

Hue is only an identity channel for **adjacent** marks. The eight-slot order was
searched to maximise the worst adjacent pair, and the arithmetic consequence is
that similar hues get pushed four slots apart — so every pair that collapses
under simulated dichromacy is `(n, n+4)`:

| pair | worst ΔE | type |
|---|---|---|
| orange \| yellow (2,4) | **0.8** | deuteranopia |
| mint \| teal (3,7) | 1.8 (dark) | tritanopia |
| pink \| brown (6,8) | 3.9 | deuteranopia |
| blue \| purple (1,5) | 4.4 | deuteranopia / protanopia |

The floor is 10. ΔE 0.8 is not "close" — it is the same color. Optimising
adjacency buys the stack and pays for it in the scatter, which is exactly why
the all-pairs cap is 3.

So every slot carries **three** channels, all keyed to the same slot number:

| channel | token / API | applies to |
|---|---|---|
| hue | `--jrk-chart-N`, `.jrk-sN` | everything |
| dash | `--jrk-chart-dash-N`, `seriesDash(i)` | line marks |
| shape | `seriesShape(i)` | scatter, line markers, legend keys |

**Dash is opt-in** via `data-encoding="redundant"` on `.jrk-chart`, because a
dashed stroke otherwise means *reference value*. `<LineChart>` defaults it on
for 2+ series and off for 1: a lone dashed line would read as a threshold, and
with one series there is nothing to confuse it with anyway.

**Shape is not optional on a scatter.** It is the only channel that survives a
full hue collapse on an isolated point.

Bars deliberately have no per-slot channel: `.jrk-bars` is single-series and
`.jrk-stack-bar` segments are adjacent by construction, so hue alone holds. The
`data-texture` hatch alternates 45°/135° for neighbours, which is the right
shape for that job — but note it can never separate `(n, n+4)`, since those
always share parity. **A grouped bar chart would need direct labels or shape.**

`npm run validate` gates all of this: it fails if a collapsing pair ever shares
both dash and shape, if either channel has a duplicate, or if the measured
all-pairs cap stops matching the declared `seriesCapAllPairs`.

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

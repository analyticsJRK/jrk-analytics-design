# Building with @jrk/design

JRK analytics design library. Plain-CSS components plus React wrappers that emit
**the same `jrk-*` class names**, so a React screen and a Jinja template render
identically. Components are on `window.JrkDesign`.

## Setup

**No provider or context wrapper is needed** — components read nothing from
React context. Load the stylesheet once at the app root and you are done:

```jsx
// styles.css pulls in the token layer, the component CSS, and the webfonts.
const { AppShell, Sidebar, Card, Button } = window.JrkDesign;
```

**Theme.** Light is the default. Switch with `window.JrkDesign.setTheme('dark')`
(`'light' | 'dark' | 'system'`), which stamps `data-theme` on `<html>`. An
explicit stamp beats the OS preference in both directions.

The look is **Apple** — macOS/iOS grouped surfaces, Apple system greys, and a
saturated blue accent at hue 212° anchored on `#0069d9`; compact non-touch
density for 1920x1080 desktop. The accent is **not** an Apple colour: systemBlue
`#007aff` gives a white button label only 4.02:1, and systemIndigo is 3.36:1 as
dark link text, so both are rejected here. The two modes are **not the same
palette** and dark is selected, never computed:

| | Light | Dark |
|---|---|---|
| page plane | `#f2f2f7` | `#141416` |
| card | `#ffffff` | `#232326` |
| popover / input | `#ffffff` | `#2c2c2e` |

The dark page is **not** true black: at 1920x1080 it halates against near-white
text, so `--jrk-text-primary` in dark is `#ebebf0` rather than `#ffffff` for the
same reason.

**A tile is bounded by its fill step off the page, in both themes, with no
border** — 1.12:1 in light, 1.17:1 in dark, the same Apple grouped mechanism on
both sides. `.jrk-card` carries `border: 1px solid transparent`: the width is
reserved so that an edge appearing never reflows the layout, and only three
things colour it in. Two you can ask for — `--outlined` (a neutral hairline, for
a card that has **no fill step to rely on**: one sitting on the card plane or on
a tinted surface) and `--raised` (elevation, opt-in) — and one that is automatic:
**a tile nested inside another tile gets a 1px hairline**, because a fill step
only works once. Do not reach for a border on a top-level card; the step is the
boundary.

The page is tinted and the **cards are white** — Apple grouped style, the
reverse of a conventional dashboard. Because of that, **the card is the chart
surface**, so marks are measured against `#ffffff` / `#232326`, never the page.
Never hand-pick a color for one mode.

## The styling idiom — classes and tokens, NOT utilities or style props

This is **not** a utility-class system and **not** a props-based theme system.
There is no Tailwind dependency and no `color`/`padding`/`bg` prop. You style by:

1. Passing `className` to a component (every component accepts it), and
2. Writing your own layout glue with the library's **real class names** and
   **semantic CSS custom properties**.

Classes follow `jrk-block__element--modifier`. Tokens follow `--jrk-<group>-<name>`.

**Layout and utility primitives** (use these instead of inventing classes):
`jrk-stack` `jrk-row` `jrk-row-between` `jrk-spacer` `jrk-grid` (`jrk-grid-2|3|4`)
`jrk-divider` `jrk-overflow-x` `jrk-sr-only` `jrk-tabular` `jrk-mono`
`jrk-caption` `jrk-overline` `jrk-focus-ring` `jrk-scroll-thin` `jrk-skip-link`

**Component roots** (each has `__element` parts and `--modifier` variants):
`jrk-btn` `jrk-btn-group` `jrk-field` `jrk-input` `jrk-select` `jrk-textarea`
`jrk-check` `jrk-switch` `jrk-card` `jrk-section` `jrk-stat` `jrk-stat-row`
`jrk-delta` `jrk-badge` `jrk-status` `jrk-dot` `jrk-tag` `jrk-table`
`jrk-table-wrap` `jrk-num` `jrk-cell-bar` `jrk-app` `jrk-sidebar` `jrk-main`
`jrk-topbar` `jrk-content` `jrk-nav-item` `jrk-page-header` `jrk-tabs` `jrk-tab`
`jrk-alert` `jrk-empty` `jrk-spinner` `jrk-chart` `jrk-chart-card` `jrk-bars`
`jrk-legend` `jrk-sheet` `jrk-icon` `jrk-list`

**Tokens you will reach for most** — never a raw hex, never a ramp step:
surfaces `--jrk-surface-canvas|default|tinted|subtle|raised` · text
`--jrk-text-primary|secondary|muted` · borders `--jrk-border-subtle|default|strong`
· accent `--jrk-accent-solid|-solid-hover|-on-solid|-text|-wash|-wash-hover|-wash-active|-wash-border|-wash-text`
(the `-wash-*` family is the tinted button's whole surface: fill, its hover and
pressed steps, its hairline, and the only ink that measures on it — the plain
anchor is 4.49:1 on the wash, under the floor, so use `-wash-text` for text on a
wash and never `-text`) · status
`--jrk-status-{good|warning|serious|critical|neutral}-{mark|text|wash}` · series
`--jrk-chart-1..8` · spacing `--jrk-space-0_5…--jrk-space-24` (4px grid) · radius
`--jrk-radius-sm|md|lg|xl|2xl|full` · type `--jrk-text-2xs…--jrk-text-5xl` ·
motion `var(--jrk-transition)` (never hand-roll a duration).

## Rules this library enforces — breaking them is a bug, not a style choice

- **Color is never the only signal.** A status carries an icon **and** a label;
  a delta states direction in text; every chart has a table view.
- **`Delta` requires `vs`** (a percentage with no comparison window is
  meaningless), and `good`/`bad` mean *interpretation*, not sign — pass
  `upIsGood={false}` for delinquency, churn, turnover, error rate.
- **A card is bounded by its fill step, not by an edge** — see the surfaces
  section above for the mechanism and for when to reach for `--outlined`.
  Elevation (`--raised`) stays opt-in: a dashboard of many tiles reads calmer flat.
- **Two button volumes, and picking the wrong one is the most visible mistake you
  can make.** `variant="primary"` is **tinted** — a pale accent wash with accent
  ink — and it is the everyday button; use it freely. `variant="cta"` is the solid
  accent with a white label and there is **at most one per view**, for the action
  that commits (Run report, Post close, Save). Two ctas on a screen and neither
  reads as the action. `secondary` is the white hairline button, `ghost` is
  transparent, and `danger` wears red *text* on a white button — a saturated red
  rectangle is reserved for `danger-solid`, the confirm inside a destructive
  dialog.
- **"This one is selected" is a tinted pill, everywhere it appears.** The current
  row in `jrk-nav-item` / `jrk-sidebar__action`, and the selected segment in
  `jrk-btn-group` / `jrk-tabs--pills`, all take the accent wash with
  `--jrk-accent-wash-text` ink **and semibold**. The weight is not decoration: the
  wash is only ~1.05:1 against what surrounds it, so weight is the channel that
  survives greyscale and colour-blindness. If you build a selection state of your
  own, carry a second channel the same way.
- **Right-align money and counts** with `jrk-num` on the cell **and** its header.
- **Never cycle the 8-slot chart palette** — the fixed order is the
  colorblind-safety mechanism. A 9th series folds into "Other" or facets.
- **Hue only separates ADJACENT slots, so charts need a second channel.** The
  order was searched to maximise the worst *adjacent* pair, and the arithmetic
  consequence is that similar hues get pushed four apart — every pair that
  collapses under simulated dichromacy is `(n, n+4)`. Slot 2 orange against slot
  4 yellow is ΔE 0.8: the same colour. So each slot also carries a dash,
  `--jrk-chart-dash-1…8`, which `.jrk-s1…8` expose as `--series-dash` alongside
  `--series`. It is **opt-in** — set `data-encoding="redundant"` on the
  `.jrk-chart` root and the line strokes and legend keys pick it up. Opt-in
  because a dashed stroke otherwise reads as `.jrk-threshold`, a reference
  value rather than data, so a lone series stays solid. `LineChart` handles
  this for you (`encoding`, defaulting to `redundant` at 2+ series); hand-rolled
  SVG on the palette does not.
- **Every data surface needs an `Empty`** — say what would appear and give the
  action that produces it.

## Three live traps

- **Do not put an SVG inside a `jrk-grid` container.** `chart.css` scopes
  `.jrk-grid line, .jrk-grid path` to the chart gridline group, and the layout
  class shares the name at equal specificity — any SVG inside is repainted
  gridline-grey at 1px, silently erasing chart lines and delta arrows. Use
  `jrk-row` or an inline `display:grid` when the content holds SVG.
- **`BarList` needs a `.jrk-chart` ancestor.** Its bar fill is
  `background: var(--series)`, declared only on `.jrk-chart`; without it the bars
  compute to `transparent` and vanish with no error. `ChartCard` alone does not
  supply it — wrap in `<div className="jrk-chart">`.
- **Pair `Icon` with its label in a flex row, not in flowing text.** The base
  reset makes every `svg` a block box, so `<Icon /> Label` dropped straight into
  a paragraph puts the glyph on its own line. `jrk-btn`, `jrk-nav-item` and
  `jrk-list__row` are already flex, so icons inside them are fine; anywhere else
  wrap the pair in `jrk-row`. Icons are sized in `em` — they take the size and
  weight of the text beside them, so set `font-size` on the container, not the
  icon.

## Where the truth is

Read these before styling: **`styles.css`** and its `@import` closure (the whole
token layer and component CSS), **`guidelines/guides/*.md`** (this library's own
doctrine — `components.md`, `charts.md`, `tokens.md`, `sheet.md`), and each
component's **`<Name>.prompt.md`** (props + real usage examples) and
**`<Name>.d.ts`** (the API contract).

## Idiomatic example

```jsx
const { Card, Stat, Badge, Button, DataTable } = window.JrkDesign;

<Card
  title="Portfolio performance"
  subtitle="Current period · 5 properties"
  actions={<Button variant="secondary" size="sm">Export</Button>}
>
  {/* layout glue: the library's own primitives + tokens, not utilities */}
  <div className="jrk-row" style={{ gap: 'var(--jrk-space-4)', flexWrap: 'wrap' }}>
    <Stat label="Occupancy" value="94.2" unit="%"
          delta={{ value: 0.8, vs: 'vs last month' }} />
    <Stat label="Delinquency" value="2.4" unit="%"
          delta={{ value: 0.6, upIsGood: false, vs: 'vs last month' }} />
  </div>
  <p className="jrk-caption">Escalated properties carry a <Badge tone="serious">Watch</Badge> flag.</p>
</Card>
```

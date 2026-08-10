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

The look is **Apple** — macOS/iOS grouped surfaces, Apple system greys, compact
non-touch density for 1920x1080 desktop. The accent is **not** an Apple colour:
it is a saturated blue anchored on `#0069d9` (hue 212°), one step deeper than
systemBlue, which fails as both a button label and link text. The two modes are
**not the same palette** and dark is selected, never computed. These values are
read from the shipped token layer, not from intent:

| | Light | Dark |
|---|---|---|
| page plane | `#f2f2f7` | `#141416` |
| card | `#ffffff` | `#232326` |
| popover / input | `#ffffff` | `#2c2c2e` |

The dark page is **not** true black: at 1920x1080 it halates against near-white
text, so `--jrk-text-primary` in dark is `#ebebf0` rather than `#ffffff` for the
same reason.

**A card is bounded by its fill step off the page, in both themes, and carries no
border** — `#ffffff` on `#f2f2f7` in light (1.12:1), `#232326` on `#141416` in
dark (1.17:1). `.jrk-card` ships `border: 1px solid transparent`, so the step is
the boundary and an edge is opt-in. **When a tile has no fill step to rely on —
one nested inside another tile, or sitting on a tinted surface — ask for an edge:
`.jrk-card--outlined` (`--jrk-border-default`, 1.52:1 on white).** Nested tiles
get that hairline automatically, because a fill step only works once per plane.

The instinct in the previous sentence is the durable part: **do not assume a fill
step is doing the work — verify against `styles.css` before relying on it.** For
one period the light page was flattened to `#ffffff` while the brand edge that
had justified it was removed, so light cards had a 1.000:1 step and no border,
i.e. no boundary at all. The tokens are fixed; the habit of checking is not
optional.

Because the card is the surface a component sits on, **the card is the chart
surface** — marks are measured against `#ffffff` / `#232326`, never the page.
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
`jrk-legend` `jrk-sheet` `jrk-icon` `jrk-list` `jrk-org`

**Tokens you will reach for most** — never a raw hex, never a ramp step:
surfaces `--jrk-surface-canvas|default|tinted|subtle|raised` · text
`--jrk-text-primary|secondary|muted` · borders `--jrk-border-subtle|default|strong`
· accent `--jrk-accent-solid|wash` · status
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
- **A card's edge is a colour change, never a width change.** `.jrk-card` and
  friends ship `border: 1px solid transparent` and the modifiers only repaint it
  (`--outlined` → `--jrk-border-default`, `--seamless`/`--flush` → transparent),
  so an edge appearing never reflows the layout by a pixel. Elevation (`raised`)
  stays opt-in — a dashboard of many tiles reads calmer flat.
- **A tile inside another tile takes a hairline automatically.** A fill step only
  works once per plane, so a Card/Stat/table nested in a Card gets
  `--jrk-border-default` from the library. Do not add your own.
- **There are two accent button volumes and picking the wrong one is the common
  mistake.** `variant="primary"` is **tinted** (accent wash + wash-text + a faint
  hairline) and is the everyday button. `variant="cta"` is the solid accent with
  a white label and there is **at most one per view** — the action that commits.
  Four saturated blue rectangles on one screen tell the reader nothing.
- **"This one is selected" is a tinted pill, everywhere it appears.** The current
  row in `jrk-nav-item` / `jrk-sidebar__action`, the selected segment in
  `jrk-btn-group` / `jrk-tabs--pills`, and the current node in `OrgChart` all take
  the accent wash with `--jrk-accent-wash-text` ink **and semibold**. The weight is
  not decoration: the wash is only ~1.05:1 against what surrounds it, so weight is
  the one channel that survives greyscale and colour-blindness. If you build a
  selection state of your own, carry a second channel the same way.
- **Right-align money and counts** with `jrk-num` on the cell **and** its header.
- **Never cycle the 8-slot chart palette** — the fixed order is the
  colorblind-safety mechanism. A 9th series folds into "Other" or facets.
- **Hue only separates ADJACENT slots, so charts need a second channel.** The
  order was searched to maximise the worst *adjacent* pair, which pushes
  confusable hues apart — so every pair that collapses under simulated
  dichromacy is **same-parity**: `(n, n+2)`, `(n, n+4)` or `(n, n+6)`, never an
  odd distance. Consecutive slots are always safe (worst adjacent ΔE 22.3 light /
  16.5 dark). Slot 2 orange against slot 4 yellow is ΔE 0.8 — the same colour —
  and orange, yellow, pink and brown collapse *pairwise*, all six pairs. So each
  slot also carries a dash,
  `--jrk-chart-dash-1…8`, which `.jrk-s1…8` expose as `--series-dash` alongside
  `--series`. It is **opt-in** — set `data-encoding="redundant"` on the
  `.jrk-chart` root and the line strokes and legend keys pick it up. Opt-in
  because a dashed stroke otherwise reads as `.jrk-threshold`, a reference
  value rather than data, so a lone series stays solid. `LineChart` handles
  this for you (`encoding`, defaulting to `redundant` at 2+ series); hand-rolled
  SVG on the palette does not.
- **Every data surface needs an `Empty`** — say what would appear and give the
  action that produces it.

## Four live traps

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
- **`jrk-content--document` is a report plane, never a dashboard one.** It paints
  the content area with `--jrk-surface-default`, i.e. the *card* colour, so
  anything placed on it has no fill step left to separate with. `Sheet` is the
  one component built for it and draws its own hairline; everything else on that
  plane needs `.jrk-card--outlined`. Put a normal tile grid on it and the tiles
  dissolve into the background in both modes.

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

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

The look is **Apple** — macOS/iOS grouped surfaces, Apple system greys,
systemIndigo accent, compact non-touch density for 1920x1080 desktop. The two
modes are **not the same palette** and dark is selected, never computed:

| | Light | Dark |
|---|---|---|
| page plane | `#f2f2f7` | `#000000` |
| card | `#ffffff` | `#1c1c1e` |
| popover / input | `#ffffff` | `#2c2c2e` |

The page is tinted and the **cards are white** — Apple grouped style, the
reverse of a conventional dashboard. Because of that, **the card is the chart
surface**, so marks are measured against `#ffffff` / `#1c1c1e`, never the page.
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
- **Cards are borderless** and separate by fill. Elevation (`raised`) is opt-in;
  a dashboard of many tiles reads calmer flat.
- **Right-align money and counts** with `jrk-num` on the cell **and** its header.
- **Never cycle the 8-slot chart palette** — the fixed order is the
  colorblind-safety mechanism. A 9th series folds into "Other" or facets.
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

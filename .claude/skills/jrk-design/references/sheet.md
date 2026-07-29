# Sheet — workbook-style report rendering

For dense financial reports that mirror a workbook: a year of months across, many
years down, totals and growth on the right, a chart riding alongside. The AM
Report (`jrk-audit-platform/app/am_report.py`) is the reference case.

Use `.jrk-table` for ordinary tables. Use `.jrk-sheet` when the output is a
workbook.

Live example: `preview/report.html`.

## Why a grid and not a `<table>`

The Excel-style column bar (A, B, C…) and the continuous row-number gutter span
the **whole report**, across many stacked metric blocks. A per-block `<table>`
cannot align with one global column bar without duplicating the track widths in a
`<colgroup>` — two sources of truth that drift. One shared track list makes the
alignment structural instead of coincidental.

The cost: semantics must be **declared**, not inherited. That is not optional.

## Markup contract

```html
<div class="jrk-sheet" role="grid" aria-label="AM Report — Summit at Red Rocks">

  <div class="jrk-sheet__toolbar">…</div>

  <!-- coordinate system, not data -->
  <div class="jrk-sheet__colbar" aria-hidden="true">
    <span class="jrk-sheet__col"></span>
    <span class="jrk-sheet__col">A</span> …
  </div>

  <div class="jrk-sheet__title" role="row">
    <div class="jrk-sheet__gutter" aria-hidden="true">1</div>
    <div class="jrk-sheet__title-code" role="rowheader">6TH</div>
    <div class="jrk-sheet__title-name" role="gridcell">Summit at Red Rocks</div>
  </div>

  <div class="jrk-sheet__meta" role="row">
    <div class="jrk-sheet__gutter" aria-hidden="true">2</div>
    <div class="jrk-sheet__meta-cells">
      <div class="jrk-sheet__meta-cell" role="gridcell">
        <span class="jrk-sheet__meta-label">City</span>
        <span class="jrk-sheet__meta-value">Golden</span>
      </div> …
    </div>
  </div>

  <div class="jrk-sheet__band" role="row">
    <div class="jrk-sheet__gutter" aria-hidden="true">3</div>
    <div class="jrk-sheet__band-label" role="rowheader">Financials</div>
  </div>

  <div class="jrk-sheet__block">
    <div class="jrk-sheet__block-head" role="row">…</div>
    <div class="jrk-sheet__row" role="row">
      <div class="jrk-sheet__gutter" aria-hidden="true">5</div>
      <div class="jrk-sheet__cell jrk-sheet__cell--label" role="rowheader">2024</div>
      <div class="jrk-sheet__cell jrk-sheet__cell--num" role="gridcell">$506,212</div> …
    </div>
    <div class="jrk-sheet__chart" style="--span:16">…</div>
  </div>
</div>
```

The letter bar and the number gutter are `aria-hidden` — they are a coordinate
system, not data. Every real header still needs `role="columnheader"` or
`role="rowheader"`.

## The track list

Every row shares `--jrk-sheet-cols`. Default shape:

```
gutter · label · 12 months · total · ytd · yoy · cagr · chart
```

Override it **on `.jrk-sheet`** to change the report's shape. Never per row, or
the column bar stops lining up with the data underneath it.

Derive the letter count from the track count. A hardcoded A–Y overflows a
19-track grid and wraps onto a second row.

## Rows and cells

| Class | Purpose |
|---|---|
| `.jrk-sheet__row` | one data row; carries an explicit fill so the frozen columns are opaque |
| `--budget` | a plan, not an actual — tinted so the eye never confuses the two |
| `--variance` | signed deltas, smaller and lighter; reads as an annotation |
| `--total` | totals / current-year emphasis |
| `.jrk-sheet__cell` | base cell |
| `--num` | right-aligned tabular figures — the point of a financial sheet |
| `--label` | the frozen row-label column (year, metric name) |
| `--center` | centered |
| `--good` `--warning` `--critical` | threshold shading from the metric's own cut-offs |

Value tone: `.jrk-sheet__val--pos` `--neg` `--flat`, and `--empty` which renders
an en dash. **An empty cell is ambiguous — it reads as zero.**

## Tone comes from `inverted`, never the sign

`METRICS` entries carry an `inverted` flag. `pos`/`neg` mean **good/bad**, not
up/down — for delinquency, an expense line, or an expense variance, a decrease is
the good outcome. Pick the class from the metric, not from the number's sign.

The signed number is always printed; the color only reinforces it.

## Blocks and the spanning chart

A block is one grid so a single chart can span every row of it.

- `.jrk-sheet__block` — grid with the full track list
- rows inside become subgrid participants, which is what keeps their cells
  aligned with the global column bar
- when the block contains `.jrk-sheet__chart`, the rows stop one track short
  (handled by `:has()`); without that the rows occupy the chart's column and
  auto-placement drops the chart into a band **below** the block
- `.jrk-sheet__chart` takes `grid-row: 1 / span var(--span)` — set `--span` to
  the block's row count. Not `1 / -1`: the rows are implicit, so `-1` does not
  resolve to the end of them

## Bands and headers

- `.jrk-sheet__title` / `__title-code` / `__title-name` — the strong banner
- `.jrk-sheet__meta` / `__meta-cells` / `__meta-cell` / `__meta-label` / `__meta-value`
- `.jrk-sheet__band` (+ `--sub`) / `__band-label` — section and subsection
- `.jrk-sheet__block-head` / `.jrk-sheet__block-num` — per-metric header

Hierarchy is deliberate: title and metadata keep the heavy band, section headers
step down to a tint, metric headers step down again. In the source workbook every
band is the same navy, which flattens the hierarchy so nothing leads.

## Density and gridlines

26px rows, 11px type. Deliberately tighter than the rest of the library — a
financial report's job is to get a year of months on one screen, and the app's
normal row heights make that impossible.

`.jrk-sheet--gridlines` turns on full vertical rules for parity with the
workbook. Off by default: the row hairline already separates rows, and a full
grid of rules is most of what makes a spreadsheet feel like one.

## Frozen panes

The gutter, the label column, and the column bar are all sticky. Rows carry an
explicit background so the frozen columns stay opaque — without it the data
slides visibly underneath them.

They **unfreeze under `@media print`**: a sticky label column printed over the
data is worse than no freeze at all.

## Verifying a sheet

Headless screenshots of sticky-heavy layouts produce convincing artifacts —
blank bands, frozen columns that appear to fail on some rows. Both were observed
while building this and neither was real. **Measure positions instead:**

```js
// every frozen label must land on one x
new Set([...d.querySelectorAll('.jrk-sheet__cell--label')]
  .map(el => Math.round(el.getBoundingClientRect().left))).size === 1
```

## Overflow

A cell carrying two figures (the variance row) will not fit 78px. Compact the
value (`+$62K +13.6%`) and put the exact figure in a `title` and the CSV — never
let it clip, which eats the leading `$` and the digits that matter.

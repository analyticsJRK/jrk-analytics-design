# Sheet — workbook-style report rendering

For dense financial reports that mirror a workbook: a year of months across, many
years down, totals and growth on the right, a chart riding alongside. The AM
Report was the reference case, but it lived in `jrk-audit-platform`, which is no
longer a consumer — treat the shape as described here and in `preview/report.html`
rather than going looking for that file.

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

## Grouped blocks — `.jrk-sheet--grouped`

Puts a recessed seam between metric blocks, so each block reads as a panel instead
of the stack reading as one field of rows.

```
.jrk-sheet--grouped          seam between blocks; sheet fill becomes surface.subtle
--jrk-sheet-group-gap        between blocks (default space-3 / 12px)
--jrk-sheet-section-gap      above a band (default space-5 / 20px)
```

**It is a modifier because the two report shapes want opposite things.** The
reference AM Report runs ~16 rows per block with a chart alongside, and there the
block-head and the row hairlines already group it — continuous rows are also what
let a reader follow one year down the whole report. The shape this is for is the
inverse: twenty-odd blocks of two or three rows, no chart, where
*head / row / row* repeats until the repeated month header stops reading as a
header. The caller knows which they have; the component cannot.

**The seam is a gap, not a frame.** The complaint that asks for this is "cluttered",
and a border around each panel answers it with more ink — a dense sheet already
draws a hairline under every row, a strong rule under every block-head, a 2px
divide before the totals, and a rule per column under `--gridlines`. Space is the
channel that is still free.

**Never separate blocks with inline-axis geometry.** A border or inline padding on
`.jrk-sheet__block` shifts that block's tracks relative to the letter bar — and
because only the *filled* rows reveal their own width, it looks correct until
someone measures it. `margin-block-start` moves a block down without touching its
width or its inline origin. Measured on the current implementation: 0px drift
across all 18 tracks, all blocks and bands one width, every frozen label on one x.

**The seam is `surface.subtle`, and not `surface.default`, on purpose.** A seam in
the row colour merges *downward* into the data, and a 12px gap the colour of a row
reads as an empty row rather than as a break. It is the fill under the toolbar, the
letter bar and the number gutter, so the seam reads as more of the sheet's chrome.

The seam and the block-head under it were briefly the *same* fill, and the merge
into one header zone per panel was recorded as a feature. It isn't the design any
more — the header went one step deeper to `surface.track`, then to the solid accent
— so the seam is now the quietest band in the sheet and the header the loudest. The
seam never moved for any of it. The header did, twice.

The fill goes on the **container**, which makes the sheet the recessed plane and
its blocks the panels on it. One declaration, it also fills the slack under a
short report, and it does not slide: a scroll container's background paints
against its border box, so the seam stays filled however far right the reader has
scrolled.

**A band takes the wider gap; the first block under it takes none** — the band caps
the group, and a seam between a band and the block it heads orphans the band from
what it names. Written as "every band, then suppress the block after it" rather
than `.jrk-sheet__block + .jrk-sheet__band`, because a report that wraps each
section in a `display: contents` element (the portal does) leaves the band with no
previous sibling to match: `contents` affects layout, not selectors, so the rule
written the other way round silently does nothing there.

One consequence to know in light, and it is not what it used to be: the primary
band takes `surface.tinted` (`#eef4fd`) and a `--sub` band takes `surface.subtle`
(`#f2f2f7`), which against the white sheet measure **1.11:1 and 1.12:1** — the
same depth to within a rounding error, and **1.009:1 against each other**. So the
two bands do *not* separate by lightness. What tells them apart is hue (pale blue
against cool grey), the label's weight (bold vs semibold) and its colour
(`text.primary` vs `text.secondary`), plus the subsection band's own
`border-block` hairlines and the wider gap above it — which is why the section gap
exists rather than reusing the block gap. **Do not "simplify" either fill toward
the other**; depth is already spent here and weight is carrying the hierarchy.

## Bands and headers

- `.jrk-sheet__title` / `__title-code` / `__title-name` — the strong banner
- `.jrk-sheet__meta` / `__meta-cells` / `__meta-cell` / `__meta-label` / `__meta-value`
- `.jrk-sheet__band` (+ `--sub`) / `__band-label` — section and subsection
- `.jrk-sheet__block-head` / `.jrk-sheet__block-num` — per-metric header

**The metric head is a filled navy band** — `surface.bannerDeep` (`#14375e`, one
value for both themes) with a `text.onBannerDeep` white label. It took three tries:

| | |
|---|---|
| `surface.subtle` | the seam's own fill — announced nothing |
| `surface.track` | a recess, 1.09:1 / 1.27:1 off the seam — too quiet |
| `accent.solid` | unmistakable, and too **strong** |
| `surface.bannerDeep` | where it landed |

`#14375e` is Excel's "Blue, Accent 1, Darker 50%" — the navy the source workbook
actually draws — and it sits at hue 211.6° against this library's anchor at 211.0°.
The workbook's navy and the brand's blue are the same hue, which is the whole reason
adopting it needs no apology. What it measures:

```
white on it                12.08:1     off the light seam    10.83:1
below surface.banner        2.31:1     off the dark card      1.30:1
```

**That 2.31:1 is the point of the value, not just its taste.** Under `accent.solid`
a 28-metric report drew 28 bands in the `.jrk-btn--cta` fill — at most one per view,
the action that commits — and in light every metric header was the same value as the
masthead, since `surface.banner` *is* `accent.solid` there. The navy puts the
masthead a full step above and gives `accent.solid` back its one meaning. And 1.30:1
off the `#232326` dark card is wider than the card's own 1.17:1 step off the page, so
it is a band in dark rather than a smudge — `#0d2947` was tried and is 1.06:1 there,
i.e. invisible.

**What is still spent, in dark only:**

- `surface.banner.dark` is `#2c2c2e`, a grey, so **the masthead sits 1.15:1 below
  the band it leads**. Correcting it means moving that token to the anchor *and*
  `text.onBannerMuted.dark` with it — `#a1a1a6` is a grey selected for the grey
  band and is 2.50:1 on the anchor. Neither half works alone.
- The **section band** (`surface.tinted`, `#0f2b4b` dark) and this are two dark
  blues with hue between them, so they read as siblings there. In light the
  section band is `#eef4fd`, a pale blue 1.11:1 off the sheet — visible, but far
  quieter than its dark counterpart.

Everything in the head takes `text.onBannerDeep`, including the gutter's row number
(`text.muted` is 1.85:1 on this fill). It is **its own ink token** rather than
`text.onBanner` or `accent.onSolid` — all three are white today and they are not the
same fact; see the note on `accent.onSolid`, which `.jrk-btn--danger-solid` once
borrowed and paid for. Internal dividers take the title bar's
`rgba(255,255,255,0.15)`, because `border.default` is a grey line drawn on navy. The
ordinal chip is punched out — white fill, navy numeral — where tinting it stacked
three blues in one 22px row.

## Density and gridlines

26px rows, 11px type. Deliberately tighter than the rest of the library — a
financial report's job is to get a year of months on one screen, and the app's
normal row heights make that impossible.

`.jrk-sheet--gridlines` turns on full vertical rules for parity with the
workbook. Off by default: the row hairline already separates rows, and a full
grid of rules is most of what makes a spreadsheet feel like one.

## The plane a report sits on

`.jrk-content--document` gives the content plane the **card** fill instead of the
page fill — `#232326` on `#141416` in dark, where it does real work. **In light it
does faint work again**: the page is `#fbfbfb` and the card fill `#ffffff`, a
1.035:1 lift, where through the flat-white period it was exactly nothing. This
modifier has now flipped with `surface.canvas` **four** times, which is the tell
that it is downstream of the page value rather than a decision of its own — the
prediction written here last time ("expect it to start working again the next time
the page tints") is what just happened. Do not build anything that depends on how
strongly it paints in light.

The history is worth keeping, because it is a full round trip and the argument
against reaching for a flat plane casually. This modifier was scoped to one view
rather than applied to `surface.canvas` precisely because the tinted page existed
to separate a grid of cards, and a report is *one full-width object* with no grid
to separate — so the plane was doing no work there and the white read as paper. On
a dashboard the same move would flatten the hierarchy. The page then went white
globally anyway, survivably, but **only** because the tile edge became a 2px brand
line in the same change. Both halves were later reverted together — which is the
rule the round trip establishes: flat plane and heavy edge were each other's
justification, so neither could be undone alone. **The page is a `#fbfbfb` whisper
today**, and it is survivable for the same structural reason in a quieter form:
the brand line is gone, but `.jrk-card` carries `border.subtle` and a resting
`shadow.card`, so the edge is still paid for and the 1.035:1 step is a bonus
rather than a load-bearing channel. The pairing rule is what carries forward, not
any particular value.

It is not "white in both themes". Dark ink on a forced-white surface is 1.19:1;
a genuinely paper-white report would have to light-lock its entire ink set, not
just its background. That is a different, larger change.

Anything on this plane must carry its own edge, because the fill step that
normally separates a tile is gone — the plane IS the card fill, so a tile's own
`surface.default` matches it at 1.0:1. **`.jrk-sheet` is the one component in the
library that draws a real hairline by default** (`1px solid border.default`) for
exactly this reason, and it is the exception to "a tile has no border". Anything
else placed here needs `.jrk-card--outlined`.

**The frame is SQUARE** (`radius.none`), the same exception `.jrk-table-wrap`
takes — the two rectangular tiles are a pair. The sheet is the worse case of the
two because its full-width rows carry FILLS: a rounded frame clips the banner's
navy into a curve while every column rule beneath it stays square. Interior chrome
keeps its own radii; the `__block-num` chip is still `radius.sm`, because the
exception is about the frame meeting the grid, not about corners in general.

The sheet's **internal** rules use the same neutral namespace (`border.subtle` /
`border.default` / `border.strong`): column, group and total rules are structure
the reader parses. One hairline value doing both the frame and the internals is
now a feature rather than a compromise — nothing in a dense report is louder than
the data, which is what the removed brand edge could not promise.

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

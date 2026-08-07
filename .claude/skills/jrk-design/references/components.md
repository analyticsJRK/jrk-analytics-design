# Components

Two consumption paths, one class layer. The React components emit exactly the
`jrk-*` classes below, so a Jinja template and a React app render identically.

```html
<!-- Jinja / plain HTML -->
<link rel="stylesheet" href="/static/jrk/index.css">
```

```tsx
// React — no Tailwind dependency
import { Button, Stat, DataTable } from '@jrk/design';
```

React exports: `Alert AppShell Badge BarList Button ButtonGroup Card CellBar
ChartCard Checkbox Content DataTable Delta Empty Input Legend LineChart Main
NavGroup NavItem NavMenu NavMenuItem NavMenuSeparator PageHeader Select Sidebar
SidebarAction Sparkline Spinner Stat StatRow Status Switch TabPanel Tabs Tag
Textarea Topbar` plus `cx`, `setTheme`, `variantClass`, `MAX_SERIES`,
`MAX_SERIES_ALL_PAIRS`.

## Button

`.jrk-btn` + one variant + optional size.

- Variants: `--primary` `--secondary` `--ghost` `--danger` `--danger-quiet` `--link`
- Sizes: `--sm` `--lg` (md is default), plus `--icon` (square), `--block`
- Loading: `data-loading="true"` + `aria-busy` — content stays in flow at zero
  opacity so the button does not resize mid-action
- `.jrk-btn-group` for segmented controls; selected child takes `aria-pressed="true"`

An icon-only button has no text, so it **needs `aria-label`**. `<Button iconOnly>`
warns in development if you forget.

`--danger` is reserved for actions that lose data. Never as an accent.

## Forms

`.jrk-field` wraps label + control + help/error so spacing and the error state
are declared once.

- `.jrk-field__label` (add `data-required` for the asterisk), `__help`, `__error`
- `.jrk-input` `.jrk-select` `.jrk-textarea` — sizes `--sm` `--lg`; `--numeric`
  right-aligns on tabular figures; `--filled` for white chrome (topbar)
- `.jrk-select` stays a real `<select>` — do NOT build a custom listbox. Its OPEN
  list is styled to match the grouped list via `appearance: base-select`, behind
  `@supports`, so unsupporting browsers keep the native popup untouched. Selection
  there is a checkmark + semibold label; the accent fill means *hovered*. When two
  precedents disagree — `.jrk-list__row[aria-selected]` fills, `.jrk-daterange__option`
  checks — a popup takes the popup's convention
- `.jrk-input-group` + `.jrk-input-group__icon` for adornments
- `.jrk-check` wraps a checkbox/radio + `.jrk-check__label` (+ `__hint`)
- `.jrk-switch` for settings that apply **immediately** — if the change needs a
  Save press, use a checkbox instead
- `.jrk-filter-bar` — filters sit in ONE row above the charts they govern, never
  scattered between them and never inside a chart card
- `.jrk-daterange` — preset rows, bold check on the selected one, custom range
  behind a hairline in the footer

An error is never signalled by the red border alone. `<Input error="...">` sets
`aria-invalid`, wires `aria-describedby` to the message, and renders an icon.

## Card / Section

`.jrk-card` (white fill, **no border** — bounded by its fill step off the page)
with `__header` `__title` `__subtitle` `__actions` `__body` `__footer`. Modifiers:
`--raised` (elevation is opt-in — a dashboard of many tiles reads calmer flat),
`--tinted`, `--outlined` (an explicit neutral hairline, for a card with no fill
step to use: one on the card plane or on a tinted surface), `--seamless`
(transparent edge — a no-op at the top level, and the only way to suppress the
nested-tile hairline), `--interactive`, `--flush`.

The card declares `border: 1px solid transparent`. **Never change that to
`border: 0`** — the reserved width keeps an appearing edge from reflowing the
layout, and `border: 0` sets `border-style: none`, after which `border-color`
paints nothing.

`--interactive:hover` sets **both** `surface-card-hover` and `shadow-lg`, and
neither is redundant: the shadow carries light mode and is invisible in dark (a
black shadow on `#141416`), while the fill lifts 1.125:1 in dark and is a
deliberate no-op in light. Do not "simplify" it to the fill alone with
`surface-hover` — that token is the page colour in light and would erase the step
that bounds the tile. `:focus-visible` lists `shadow-focus` first, because setting
only the lift would replace base.css's focus bloom rather than add to it.

`.jrk-section` + `__header` + `__title` groups several cards under one heading.

## Stat / KPI

When the data is a single headline number, a tile beats a one-bar chart.

`.jrk-stat` + `__label` `__value` (`--sm`) `__unit` `__meta` `__spark`.
`--tinted`, `--with-spark`.

Bands: `.jrk-stat-row` (joined — the **band** is the one enclosure and takes the
fill step, the tiles inside it are divided by neutral hairlines and carry no edge)
or `.jrk-stat-row--split` (discrete rounded tiles with a gap, each its own
enclosure sitting directly on the page and so each bounded by its own fill step,
white by default) and `--tinted`.

`.jrk-delta` + `--good` `--bad` `--flat`. **`good`/`bad` mean interpretation, not
direction** — pick from the metric, not the sign. `<Delta upIsGood={false}>` for
churn, delinquency, error rate. `vs` is required: a percentage with no comparison
window means nothing.

Stat values use proportional figures. `.jrk-tabular` is for columns that must
align vertically, not for a standalone hero number.

## Badge / Status / Tag

`.jrk-badge` + `--good` `--warning` `--serious` `--critical` `--accent`
`--outline` `--sm` `--square`. A status badge always carries an icon **and** a
label — `<Badge>` renders it for status tones automatically.

`.jrk-status` = `.jrk-dot` (+ `--good|warning|serious|critical`, `--pulse`) plus a
text label. The dot never appears alone in a cell — a bare color is unreadable to
a screen reader and to a colorblind reader both.

`.jrk-tag` + `__remove` for removable filter chips.

## Table

Real `<table>` inside `.jrk-table-wrap` (the wrapper owns the scroll, so a wide
table never scrolls the page body).

- `.jrk-table` + `--compact` `--comfortable` `--zebra` `--sticky-first`
- `.jrk-num` on every money/count cell **and** its header — right-aligns on
  tabular figures so digits stack
- `.jrk-table__sort` — sortable headers are real `<button>`s; put `aria-sort` on
  the `<th>`
- `.jrk-cell-bar` + `__track` `__fill` `__value` — in-cell magnitude with the
  number still visible beside it
- `.jrk-table-footer` + `.jrk-pagination`
- `.jrk-skeleton` for loading rows — keeps the table's geometry so the layout
  does not jump

`display: block` on `__fill` is load-bearing: these are `<span>`s, and an inline
box ignores width and height, so the bar renders as an empty track. This shipped
broken once.

For workbook-style financial reports use the **sheet** layer instead — see
`sheet.md`.

## App shell

```
.jrk-app > .jrk-sidebar + .jrk-main
.jrk-sidebar > __brand + __actions + __nav + __footer   (only __nav is required)
.jrk-main > .jrk-topbar + .jrk-content > .jrk-content__inner
```

- `.jrk-sidebar` + `__brand` `__actions` `__nav` `__group` `__footer`;
  `data-collapsed="true"` collapses to an icon rail, `data-open="true"` opens the
  mobile drawer
- `.jrk-sidebar__actions` — the rail's **verbs** (Home, Create), above a hairline
  and separate from `__nav`'s **destinations**. Icon-only, so every child needs
  `aria-label` + `title`; `<SidebarAction>` makes `label` required so there is no
  way to render a nameless one. Only add a rail Search if the shell has **no
  topbar** — otherwise it is the same mechanism twice
- `.jrk-nav-item` — set `aria-current="page"` on the anchor; the styling keys off
  the same attribute assistive tech reads, so the two cannot disagree. Renders on
  an `<a>` for a destination and a `<button>` for a flyout parent; the button
  resets live in the base rule so the two are pixel-identical
- **Second nav level** — `<NavMenu>`, or by hand: a `.jrk-nav-item` `<button>`
  with `aria-expanded` + `aria-controls`, then a **sibling**
  `.jrk-menu.jrk-nav-flyout` panel. Four things are load-bearing:
  - It is a **disclosure, not a `role="menu"`**. These are links to places; a
    labelled group of links that Tab walks and Escape dismisses is both less code
    and more correct than application-mode menu semantics
  - The panel is `position: fixed`, and has to be — `.jrk-sidebar__nav` is
    `overflow-y: auto` and CSS forces the other axis into a scroll container too,
    so an in-flow panel gets sliced off at the rail's edge. Fixed escapes the clip
    without a portal, which keeps it working in the Jinja apps
  - Therefore both offsets are viewport coordinates: **measure the rail** and
    write `--jrk-nav-flyout-top` / `--jrk-nav-flyout-inset`. Reading the width off
    a token assumes the rail starts at viewport x=0 — false the moment the shell
    sits inside anything. Re-place on scroll (capture), resize, and a
    `ResizeObserver` on the rail (collapsing animates width over 200ms without
    ever resizing the window)
  - `.jrk-nav-flyout__title` is not decoration: in the collapsed rail the row
    label is sr-only, so the title is the only thing naming the panel
  - **Hover does not open.** Click / Enter / Space / ArrowRight / ArrowDown do
- `.jrk-page-header` + `__title` `__desc` `__actions`
- `.jrk-breadcrumbs` — separator is generated content, so it is never announced
- `.jrk-tabs` (`--pills`) + `.jrk-tab` + `__count`. `role="tablist"` / `role="tab"`
  with `aria-selected` and `aria-controls`; arrow keys must move between tabs
  (`<Tabs>` handles this)

## Feedback

- `.jrk-alert` + tone modifiers, `__icon` `__body` `__title` `__text`.
  `role="alert"` for critical, `role="status"` otherwise
- `.jrk-empty` + `__icon` `__title` `__text` `__actions` (`--inline`). Every data
  surface needs one — an empty table with no explanation reads as a bug. Say what
  would appear and give the action that produces it
- `.jrk-spinner` (`--sm` `--lg`) and `.jrk-loading`. A spinner alone announces
  nothing: pair with visible or `sr-only` text and `aria-busy` on the region
- `.jrk-menu` + `__item` (`--danger`) `__separator` `__label`
- `.jrk-modal` — a native `<dialog>`, so focus trapping, Esc, and inertness come
  from the platform rather than a script that has to get them right
- `.jrk-toast-region` + `.jrk-toast`. `aria-live` goes on the **region**, not each
  toast, or nothing is announced
- `.jrk-progress` + `__fill`

## Icons

SF Symbols cannot be shipped: Apple does not publish them as a webfont, and the
outlines are theirs. `<Icon>` provides original glyphs drawn to SF's
*behaviour*, and `.jrk-icon` is the contract any icon set can inherit.

```tsx
<Icon name="checkFill" />
<Icon name="chevronRight" weight="semibold" />
```

What makes an icon read as SF rather than as Feather/Lucide:

- **Sized in `em`, not px.** Icons scale with the text beside them and sit on
  the baseline. This is the single biggest difference and almost nobody does it.
  Use `size="sm|md|lg|xl"` only where the icon genuinely is not text-relative.
- **Weight tracks the text weight** — `light | medium | semibold | bold`.
- Round caps and joins; compact geometry that fills the 16 grid.
- **Filled variants for status and selected states.** The inner mark is punched
  out with `fill-rule="evenodd"`, so the badge wash behind shows through and the
  glyph never needs to know its background colour.

`<Badge>` renders the filled status glyph automatically via `STATUS_ICON`.

**For app iconography beyond this set, use Phosphor (MIT)** — the closest open
family to SF: multiple weights, round terminals, a real fill variant. Give it
`className="jrk-icon"` and it inherits the sizing, weight and baseline rules.

Component CSS sizes bare `svg` elements with `svg:not(.jrk-icon)`, so a legacy
inline SVG keeps its fixed size while anything carrying `.jrk-icon` gets the
text-relative contract.

## Layout & a11y primitives

`.jrk-stack` `.jrk-row` `.jrk-row-between` `.jrk-spacer` `.jrk-grid`
(`-2|-3|-4`) `.jrk-overflow-x` `.jrk-divider` `.jrk-divider-v`
`.jrk-sr-only` `.jrk-skip-link` `.jrk-scroll-thin` `.jrk-focus-ring`
`.jrk-tabular` `.jrk-mono` `.jrk-overline` `.jrk-caption`.

Wide content (tables, charts, code) scrolls inside its own container — the page
body must never scroll horizontally.

**`flex-wrap: wrap` on a column flex container** makes it multi-line and
`align-content: stretch` then inflates each line. It silently tripled a grid's
height once. If a column container wraps, set `flex-wrap: nowrap`.

## Theming

```ts
setTheme('dark');   // 'light' | 'dark' | 'system'
```

Stamps `data-theme` on `<html>`. An explicit stamp beats the OS preference in
both directions.

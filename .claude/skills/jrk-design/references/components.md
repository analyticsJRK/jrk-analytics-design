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
NavGroup NavItem NavMenu NavMenuItem NavMenuSeparator OrgChart OrgNode
PageHeader Select Sidebar SidebarAction Sparkline Spinner Stat StatRow Status
Switch TabPanel Tabs Tag Textarea Topbar` plus `cx`, `setTheme`,
`variantClass`, `MAX_SERIES`, `MAX_SERIES_ALL_PAIRS`.

## Button

`.jrk-btn` + one variant + optional size.

- Variants: `--primary` `--cta` `--secondary` `--ghost` `--danger` `--danger-solid`
  `--danger-quiet` `--link`
- **`--primary` is TINTED** (accent wash + `accent.washText` + an
  `accent.washBorder` hairline) and is the everyday button. **`--cta` is the solid
  accent** — at most one per view, for the action that commits. Putting two `--cta`s
  on a screen removes the only reason either is loud
- The loading spinner's ink is set per variant and defaults to `text.secondary`;
  a new filled variant must name its own or it inherits the quiet one
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
  there is accent TEXT + semibold and hover is the soft neutral wash — no
  checkmark, no accent fill. A list you pick *from* should not shout; the closed
  control already says what is chosen
- **Hover inside any raised surface uses `--jrk-surface-raised-hover`**, never
  `--jrk-surface-hover`. `surface.hover.dark` and `surface.raised.dark` are the
  same value, so the obvious token paints a menu row the exact colour of the menu
  under it and dark mode gets no hover at all. Applies to `.jrk-menu__item`,
  `.jrk-daterange__option`, and the select popup
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

`.jrk-card` (white fill, a `border.subtle` hairline, and a resting `shadow.card`
in light) with `__header` `__title` `__subtitle` `__actions` `__body` `__footer`.
Modifiers: `--raised` (**more** elevation than resting — `shadow.cardRaise`; it
used to mean "has elevation at all", back when rest was flat), `--tinted`, `--outlined`
(a heavier neutral hairline, for a card with no fill step to use: one on the card
plane or on a tinted surface), `--seamless` (drops the hairline **and** the
shadow — both, or the modifier does not do what it says), `--interactive`,
`--flush` (drops fill, hairline and shadow).

The card declares `border: 1px solid transparent`. **Never change that to
`border: 0`** — the reserved width keeps an appearing edge from reflowing the
layout, and `border: 0` sets `border-style: none`, after which `border-color`
paints nothing.

`--interactive:hover` sets **both** `surface-card-hover` and `shadow-card-raise`,
and neither is redundant: the shadow carries light mode and is invisible in dark (a
black shadow on `#141416`), while the fill lifts 1.125:1 in dark and is a
deliberate no-op in light. Do not "simplify" it to the fill alone with
`surface-hover` — that token is the page colour in light and would erase the step
that bounds the tile. `:focus-visible` lists `shadow-focus` first, because setting
only the lift would replace base.css's focus bloom rather than add to it.

**There are TWO elevation ladders and they were split on 2026-08-14.** Cards rest
on `shadow.card` and raise to `shadow.cardRaise`; popovers sit at `shadow.lg` and
modals at `shadow.xl`. They used to share `shadow.lg` — a hovered card and an open
menu were one elevation — which meant the resting card could not be deepened
without restyling every menu in the product. If the ask is "make the cards float
more", move **both** card rungs and leave `shadow.lg` alone; the gap to hold is
3.3x by ambient weight (y-offset × alpha).

`.jrk-section` + `__header` + `__title` groups several cards under one heading.

## Expandable card

`.jrk-card.jrk-expander` — **both classes, always.** It composes on the card
rather than replacing it, which is what makes `nesting.css` and `table.css` give
the table inside its hairline and drop its resting shadow for free; those rules
match on `.jrk-card`. Parts: `__heading` (an `<h3>` wrapping the button, for the
document outline) `__summary` (a `<button>` — everything inside it is a `<span>`,
because a button takes phrasing content only) `__icon` `__text` `__tag` `__title`
`__desc` `__caret` `__panel` `__panel-inner` `__footer`.

State lives in two places on purpose: `aria-expanded` on the button is the
accessible truth, `data-expanded` on the block is what CSS can reach. `<Expander>`
sets both.

Tones: default (plain), `--pastel`, `--vivid`; hues `--rose` `--violet` `--blue`
`--teal` on either toned variant. **The tone treats the SUMMARY and the panel is
always the card plane** — every token a table uses (row hairlines, `text.muted`
captions, the `accent.text` header labels, every chart mark in a cell bar) was
measured against `surface.default`, so a toned panel would break all of them at
once and nothing in the library would report it. A vivid expander is a gradient
header on a white card, not a gradient card.

`__tag` is brand-inked, not neutral: **`accent.washText` in both the plain and
pastel tones** — one ink, so the chip is the same object across a row — with the
FILL doing the per-tone work by a single rule, *step away from what you sit on*.
On the white card that means `accent.wash` + the `accent.washBorder` hairline
(5.31:1 light / 6.73:1 dark ink; the fill step is 1.16:1 / 1.06:1, so the hairline
is load-bearing). On a pastel wash it steps back to `surface.default`, which
cannot collide with any tone — `accent.wash` there would be `#e3efff` on `#c7deff`
on the blue tone, the same colour. Chip-vs-wash steps run 1.27–1.37:1 light and
1.34–1.36:1 dark on blue/teal, dropping to 1.12:1 and 1.11:1 on the violet and
rose darks; accepted for an 18px pill whose label is 7.16:1, since nothing depends
on finding the chip's edge. **This is now the `.jrk-btn--primary` triple exactly,
so a tinted button must not sit in an expander summary** — 18px of pill against a
32px control is not enough to separate "label" from "commits an action".

Two more consequences worth carrying. On the pastel tone `__desc` is
**`text.secondary`, not `text.muted`** — muted is 3.70:1 on the light blue wash and fails the body
floor, where secondary is 7.99:1 light / 5.58:1 dark across all four tones. And the
summary's `border-bottom` when open is **structural**: in dark, two of the four
tints step only 1.11:1 off the card, so the hairline is the boundary rather than a
garnish.

Hover is three mechanisms, one per tone, none interchangeable: plain steps to
`surface.hover` (a plane to the next plane); pastel takes `overlay.hoverVeil`,
which darkens a light tint and lightens a dark one because a single white veil
would lift a dark tint 1.34:1 and a light one 1.03:1; vivid takes `gradient.hover`,
theme-independent because the ramp is.

`.jrk-expander-row` lays them side by side and a card **opens in place**, in the
column it already occupies; its neighbours neither move nor resize. It used to
promote an open card to the full row width and collapse the row to a single
column — removed on direction 2026-08-17, because collapsing the track list re-laid
the whole row, so opening one card stretched every *other* card to page width too.

**That moved the cost to the caller, so design the panel for a narrow column.**
Three tiles across puts a panel in a ~410px column, where a wide multi-column table
is correctly styled at a width no table can use: "947 of 982 units" wraps and rows
grow three or four lines tall. Use a compact list, wider tracks, or one full-width
expander per row when the panel really needs a table. The row is `align-items:
start` for the same reason the span went — under `stretch`, opening one card grows
its untouched neighbours to match its panel height.

Assign a hue by **position in the row**, never by what the card is about: half
these pairs collapse under simulated CVD on both toned variants, and identity is
carried by the tag and the title.

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
- `.jrk-num` on every money/count cell **and** its header — tabular figures, so a
  column of equal-length values stacks. Cells are **centred** by design direction,
  which throws away the scan line on mixed-magnitude columns; `.jrk-col-end` is
  the way back where comparing magnitudes matters. First column starts.
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

**The wrap is RECTANGULAR** (`radius.none`) — one of two, with `.jrk-sheet`, and
for the same reason: a grid of straight rules that run to its own edges has no
corner a radius can round without cutting the first and last cell of every row.
They are a pair; if one returns to the radius ladder, ask why the other did not.
Its header is
**white with `accent.text` labels** — 5.22:1 light, 7.16:1 dark. Both by explicit
direction. Consequences: the header's `border-bottom` is now the only separation
from the first row, since the fill step went with the grey; the sorted column is
marked by its arrow alone, because an accent label has nowhere brighter to go; and
the wrap rests on `shadow.card` like a card, **suppressed when nested** inside a
card or chart-card, where a shadow inside an existing enclosure reads as a smudge.

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
  - the current row is the **tinted button** — `accent.wash` + `accent.washText` +
    **semibold**, same as `.jrk-btn--primary` and the segmented thumb. It replaced a
    solid `accent.solid` pill that measured 5.22:1 against every neighbour; the wash
    is 1.04:1 against a hovered row and 1.08:1 against an open one, so hue and
    weight are what distinguish where-am-I from a pointer state. The semibold is
    the channel that survives greyscale — keep it
  - `.jrk-sidebar__action[aria-current]` tracks this rule; change both
- **Second nav level** — `<NavMenu>`, or by hand: a `.jrk-nav-item` `<button>`
  with `aria-expanded` + `aria-controls`, then a **sibling**
  `.jrk-menu.jrk-nav-flyout` panel. Four things are load-bearing:
  - It is a **disclosure, not a `role="menu"`**. These are links to places; a
    labelled group of links that Tab walks and Escape dismisses is both less code
    and more correct than application-mode menu semantics
  - The panel is `position: fixed`, and the clip it escapes is real —
    `.jrk-sidebar__nav` is `overflow-y: auto` and CSS forces the other axis into a
    scroll container too, so an in-flow panel gets sliced off at the rail's edge.
    **Fixed-over-portal was chosen to keep it working in the Jinja apps, which are
    no longer consumers.** The clip still has to be escaped, but a React portal is
    now available and would avoid the measuring dance below and the
    `[GRID_OVERFLOW]` warning the design-sync validator raises on this component.
    Revisit before adding a second flyout
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
  - the link form is `<nav> > <a aria-current="page">` with no roles — a row that
    changes the URL is not a tablist. Both variants style off `aria-current` as
    well as `aria-selected`
  - `--pills` is the same widget as `.jrk-btn-group`, rendered the same way: a
    `surface.track` well, unselected segments as bare labels, and the selected one
    as a raised tinted thumb (`accent.wash` + `accent.washText` + **semibold** +
    `shadow.md` + an `accent.washBorder` hairline). Change one and change the other
  - no channel on that thumb measures 3:1 — the semibold is the only one that
    survives greyscale and CVD, so it is load-bearing. Full numbers and the
    one-line way back to a measuring signal are in `button.css`

## Org chart

Hierarchy DOWN, peers ACROSS. Reporting lines, portfolio structure, entity
ownership — all the same shape. Nesting in the markup is nesting in the chart;
every connector is derived from the layout, so there is nothing to measure.

```html
<div class="jrk-org-scroll">
  <ul class="jrk-org" aria-label="Reporting structure">
    <li class="jrk-org__node">
      <div class="jrk-org__card" aria-current="true">
        <span class="jrk-org__name">Dana Whitfield</span>
        <span class="jrk-org__role">VP, Asset Management</span>
        <span class="jrk-org__meta">37 properties · 8,412 units</span>
        <span class="jrk-org__aside"><!-- Badge / Status / Delta --></span>
      </div>
      <button class="jrk-org__toggle" aria-expanded="true" aria-controls="b1">…</button>
      <ul class="jrk-org__branch" id="b1"> <li class="jrk-org__node">…</li> </ul>
    </li>
  </ul>
</div>
```

Card modifiers: `--link` (renders as `<a>`/`<button>`), `--vacant` (open post).
State is `aria-current` on the card, not a modifier. Branch modifiers:
`--stacked`, `--rollup`. Sizing knob: `--jrk-org-node` on `.jrk-org`
(default 176px).

- **It is a nested `<ul>`, not `role="tree"`.** A tree role promises roving
  tabindex and arrow-key movement between siblings, which nothing here
  implements — a claimed tree that ignores arrow keys is worse for a
  screen-reader user than the plain list they already know. Disclosure is the
  ordinary button + `aria-expanded` + `aria-controls` pattern. `aria-label` on
  the outer `<ul>` is required.
- **The connector is drawn at `text.muted`, not a border token** — 5.07:1 light,
  5.46:1 dark, recorded by hand because nothing gates the border namespace. The
  lines *are* the content: once a row is wide enough that a child is no longer
  visibly under its own parent, nothing else says who reports to whom, so
  1.4.11's 3:1 applies. `border.strong` at 1.71:1 is the value this obviously
  wants and it is wrong. Keep it thin instead — 1px, never 2px.
- **The card draws its own hairline**, like `.jrk-sheet`. A fill step bounds a
  tile exactly once per plane, and this is a plane covered in small boxes,
  usually already inside a `.jrk-card`.
- **`--stacked` is the escape valve for a wide fan**, and it is why the
  horizontal default is safe: twelve peers side by side is 2,300px no screen
  holds. LEAF CHILDREN ONLY — a stacked child with children of its own centres
  over its subtree and pulls off the spine. `<OrgNode>` warns in development.
- **Peers are spaced by PADDING, never `gap`.** The bus between siblings is two
  half-borders on adjacent nodes and needs them flush; a `gap` turns it into a
  dashed line nobody asked for. Same rule down the stacked spine.
- **Ends are trimmed with `border-color: transparent`, never `border: 0`** — the
  last node's stem shares a pseudo-element with its half of the bus, so removing
  the border takes the stem with it.
- **`aria-current` costs a measured signal**, exactly like the nav pill: the
  tinted wash is 1.16:1 on the light card. The **semibold name** is the channel
  that survives greyscale and both dichromacies. Do not drop it.
- The toggle's label is the **count** (`4 reports`), never a bare caret, so a
  collapsed node is still an answer. The caret does not rotate.

**`--rollup` is the one place the categorical palette is cycled.** Put it on the
branch whose children are the rollup units; each child takes the next slot and
its whole subtree inherits it through `--jrk-org-group`, which appears as a
keyline inside the card.

- **The no-cycling rule protects IDENTITY** — two chart lines sharing a colour
  cannot be told apart, because colour is the only thing naming them, which is
  why `seriesColor(8)` throws. Nothing in that reaches here: every node is
  labelled and the tree *draws* the grouping, so the keyline is an accelerator
  over a chart that already reads without it. Never promote it to the identity
  channel — no colour-only legend, no unlabelled node.
- **Guaranteed: adjacent siblings never collide.** Consecutive slots are exactly
  the pair the palette order was searched to maximise — dE 22.3 light / 16.5
  dark, floor 10. The org chart's adjacency requirement and the palette's search
  objective are the same objective, so cycle in canonical order and do not
  invent a different one for this.
- **The keyline carries TWO channels — hue and texture — and the first 8 groups
  are fully distinguishable because of it.** Texture is `ceil(slot / 2)`:
  slots 1–2 solid, 3–4 dashed, 5–6 dotted, 7–8 double-rail. That pairing is
  derived, not chosen: every collapsing pair is same-parity, so pairing slots up
  puts each bucket's two members an *odd* distance apart (always safe) and lands
  all nine collapsing pairs in different buckets. Hue alone leaves **9
  unseparable pairs in the first 8**; with texture it is **0**.
- **The ceiling is 3 × textures.** At most three hues here are pairwise CVD-safe
  (blue, orange, mint — the declared all-pairs cap), so four textures cap the
  theoretical maximum at **12**. Reaching 12 would mean abandoning the canonical
  slot order, which the palette forbids re-deriving, so this ships **8**.
- **Past 8, hue and texture repeat together** — group 9 is group 1 exactly.
  Deliberate: shifting texture on a second lap removes the exact repeats but
  buys 4 CVD collisions instead (7 unseparable → 4 at 15 groups). An exact
  repeat is visible to everyone and gets noticed; a CVD collision looks correct
  to the author and lands only on readers who cannot see it. Do not trade a
  visible failure for a silent one.
- **The texture definitions must be declared on `.jrk-org__node`, not
  `.jrk-org`.** A `var()` inside a custom property resolves against the element
  it is *declared* on, not where it is used — declared on `.jrk-org` (no
  `--jrk-org-group` there) all four become invalid-at-computed-value, the
  keyline falls back to the plain colour, and every texture silently vanishes
  with no error.
- **Keyline, not a wash and not a coloured connector.** A wash collides with
  `aria-current` (`accent.washHover` and `chart-tint-1` are the same colour);
  tinting the connectors would drop the one mark that must clear 3:1 to
  2.12–2.57:1 for mint, yellow, orange and teal in light.
- **A vacant card keeps its keyline.** The vacancy is about the seat, the rollup
  about the branch — and blanking it would leave the children wearing a group
  their own parent does not.
- **One `--rollup` per chart.** Two both start at slot 1, so B's first child can
  land beside A's last in the same colour. `<OrgNode>` warns on nesting.

## Hover card

The breakdown behind a headline number. `.jrk-hovercard-anchor` (a **block**
wrapper, so the tile keeps filling its grid track) holding the trigger and
`.jrk-hovercard` + `__header` `__row` `__label` `__value` `__note`. Modifiers
`--end` and `--above`; there is no auto-flip, because a measured position goes
stale the moment anything reflows under it.

**Opens on `:focus-within` as well as `:hover`.** That is the difference between
a disclosure and a decoration — hover alone makes the figures reachable only with
a pointer. The trigger must therefore be focusable (a `<button>` or a link, never
a bare `<div>`) and should carry `aria-describedby`.

On `surface.raised` with `shadow.lg`, not `.jrk-tooltip`'s `surface.inverse`: a
dark-on-light panel inverts at night to a near-white slab carrying a table of
numbers. It mirrors `.jrk-chart-tooltip`'s row grammar deliberately — if a fourth
label/value panel ever appears, merge all three rather than adding to the pile.

**Clipping trap:** the panel is `absolute` and escapes its anchor, so any ancestor
with `overflow: hidden` cuts it off — the **joined** `.jrk-stat-row` (the split
row is `overflow: visible` and is fine), `.jrk-expander`, and `.jrk-table-wrap`.
Nothing errors; the panel just does not appear.

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

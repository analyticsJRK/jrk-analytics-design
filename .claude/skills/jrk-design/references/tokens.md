# Tokens

Source of truth: `tokens/tokens.json`. Generated into:

| Output | For |
|---|---|
| `dist/jrk-tokens.css` | CSS custom properties, light + dark |
| `dist/jrk-theme.tailwind.css` | Tailwind v4 `@theme` mapping onto those vars |
| `dist/tokens.ts` | Typed JS/TS exports for chart configs |

Naming: `--jrk-<namespace>-<name>`. camelCase keys kebab-case
(`accent.solidHover` → `--jrk-accent-solid-hover`), and `.` becomes `_`
(`space.1.5` → `--jrk-space-1_5`).

## Rule of thumb

Components reference **semantic** tokens. They never reference a ramp step
(`--jrk-neutral-100`) and never a raw hex. The semantic layer is what makes the
dark theme a swap rather than a rewrite.

## Surfaces

| Token | Light | Dark | Use |
|---|---|---|---|
| `--jrk-surface-canvas` | `#fbfbfb` | `#141416` | page plane (the CONTENT area only — chrome takes `surface-default`) |
| `--jrk-surface-default` | `#ffffff` | `#232326` | cards, panels, **chart surface** |
| `--jrk-surface-tinted` | `#eef4fd` | `#0f2b4b` | KPI band, highlighted tiles |
| `--jrk-surface-subtle` | `#f2f2f7` | `#2c2c2e` | table header, inset wells, sheet toolbar |
| `--jrk-surface-raised` | `#ffffff` | `#2c2c2e` | popovers, menus, modals, inputs |
| `--jrk-surface-banner` | `#0069d9` | `#2c2c2e` | sheet title bar |
| `--jrk-surface-card-hover` | `#ffffff` | `#2c2c2e` | fill of an INTERACTIVE card while hovered |
| `--jrk-surface-hover` / `-active` / `-disabled` / `-inverse` | | | states |

**The light page is a `#fbfbfb` WHISPER, so in light a tile is really bounded by
the hairline and the shadow.** `.jrk-card` draws `border.subtle` (1.21:1 light,
1.24:1 dark) and rests on `shadow.card` (light only — a black shadow on `#141416`
renders nothing). Dark has a genuine third channel, the 1.17:1 fill step of
`#232326` on `#141416`; light's equivalent is 1.035:1. One mechanism in both
themes, per-theme values — not hairline-in-light / fill-in-dark, because two
mechanisms is what lets a change read correctly in one theme and vanish in the
other.

**The consequence to carry: the card-on-page step in light is 1.035:1 —
decoration, not a boundary.** Any new top-level tile must bring its own edge; you
cannot lean on a step that shallow. For scale, `#f5f5f7` gave 1.09:1 and `#f2f2f7`
gives 1.12:1, and even those were never treated as sufficient alone. `.jrk-card`,
`.jrk-topbar` and `.jrk-sidebar` each already carry `border.subtle`, which is what
makes the page safe to re-tone in either direction.

**Chrome no longer shares the canvas, and as of `#fbfbfb` that is faintly visible
in light again.** `.jrk-sidebar` and `.jrk-topbar` moved to `surface-default` on
2026-08-13, which matters in dark (`#232326` chrome around a `#141416` work area)
and was a no-op through the flat-white period; the white chrome now sits 1.035:1
above the page. Those two must still agree with each other: a bar meeting a
page-coloured rail puts a visible notch at their junction.

**`canvas.light` and that edge are a pair — never move one alone.** The page has
been `#ffffff`, `#f2f2f7`, `#f5f5f7` and now `#fbfbfb`, and it went `#ffffff` →
`#f5f5f7` → `#ffffff` inside 2026-08-13 alone. **Read the rule, not the value.**
Flat page → the card must draw its own edge; tinted page → the fill step *may* be
the edge and the border *may* go transparent. Note the direction of that
permission: **the safe move through a paired change is the one that leaves a tile
MORE bounded, never less**, which is why the tinted period kept every edge it had,
why flattening back was only safe once each plane was self-bounding, and why the
`#fbfbfb` move is the clean example — it added a step and kept every edge. The one
broken state on record was the half-finished revert, where the brand edge was
removed and the page was left flat: light cards had a 1.000:1 step behind a
*transparent* border, i.e. no boundary at all, and it shipped. Today's step is
barely better at 1.035:1 — what carries a tile is that the border is real.
`border.card` and `size.cardEdge` are still gone for good.

**The page must never land on `#f2f2f7`, because `surface-subtle` is pinned and
cannot move down** — `text.muted` is 4.59:1 on it and 4.23:1 one step deeper, so a
table header's own label would fail. A `#f2f2f7` page would force subtle to equal
the page, a state this library has shipped and regretted. `#f5f5f7` is the value
that was solved for last time; `#fbfbfb` avoids the problem from the other side by
staying *lighter* than subtle. Other surfaces are chosen around subtle.

Consequences worth knowing, none of them gated:
- **`--jrk-surface-subtle` is a 1.12:1 recess off the CARD** (`#f2f2f7`), so table
  headers and inset wells read as set in — and **1.08:1** off the `#fbfbfb` page,
  so it still recedes on both planes, but only just. **That page figure is not
  durable and is already faint:** through the `#f5f5f7` period it measured 1.02:1
  on the page, i.e. invisible there, while still working correctly inside a card.
  Every step the page takes toward subtle eats what is left. The failure is silent and one-sided — the component
  looks right everywhere it is normally tested. Do not build a PAGE-level wash on
  this token without re-measuring against the page of the day. It does not
  replace `--jrk-surface-track`, which is recessed in
  *both* themes where subtle is a recess in light and a lift in dark. `track` still
  has exactly one consumer, the segmented-control well. The sheet's block-head used
  it for part of 2026-08-12 and then went to `accent.solid`; the note left on the
  token records what a second consumer would have cost, because the two would have
  been coupled through one value. **Anything textual on `track` needs
  `text.secondary`, not `text.muted`** — muted is 4.15:1 there in light, under the
  body floor, and `validate` measures ink against the card and the page, so it could
  not see it. The chrome pairings the library actually draws are gated now.
- **`--jrk-surface-hover` on a whole tile is no longer the trap it was.** It is
  `#f2f2f7`, which used to be the page value and erased the card's fill step; the
  hairline and the resting shadow now hold the boundary regardless of what the
  page is doing.
  `--jrk-surface-card-hover` is still the token for a hovered card and is still a
  deliberate no-op in light, because the hover *shadow* carries that theme.
- **`.jrk-content--document` does faint work in light again.** The plane it paints
  (`surface.default`) is `#ffffff` on a `#fbfbfb` page in light — a 1.035:1 lift,
  where through the flat-white period it was exactly nothing — and `#232326` on
  `#141416` in dark, where it has always done real work. This modifier has now
  flipped **four** times with `surface.canvas`, which is the tell that it is
  downstream of the page value rather than a decision of its own; do not build
  anything that depends on how strongly it paints. What holds either way is the
  reason it exists: anything placed on that plane has no usable fill step to
  separate with and needs its own edge.

The card is what marks are measured against — `#ffffff` / `#232326`.

**Lifting the dark card was the cost of dropping the edge.** `#1c1c1e` on
`#141416` was only 1.08:1 and leaned on the edge to read as a tile at all, so the
card moved to `#232326` (1.17:1). The page was deliberately left alone: darkening
it would have re-opened the halation question that put it at `#141416` rather than
`#000000` in the first place. Two tokens had to move with the card —
`surface.disabled.dark` and `focus.offset.dark` — and every dark chart mark lost
~8% contrast (worst case 4.30:1, all still passing). Do not lift it again without
re-measuring those marks. `--jrk-text-primary` in dark stays `#ebebf0` rather than
`#ffffff` for the same halation reason.

## Text

| Token | Use |
|---|---|
| `--jrk-text-primary` | headings, values, body |
| `--jrk-text-secondary` | supporting copy, labels |
| `--jrk-text-muted` | axis ticks, captions, placeholders |
| `--jrk-text-disabled` | decorative only — never load-bearing |
| `--jrk-text-inverse` | on `surface-inverse` ONLY — not the solid accent |
| `--jrk-accent-on-solid` | the label ON the solid accent; DARK ink in both modes |
| `--jrk-text-link` | inline links, accent text |
| `--jrk-text-on-banner`, `--jrk-text-on-banner-muted` | on `surface-banner` |

All of `primary`/`secondary`/`muted`/`link` clear 4.5:1 on **both** the card and
the canvas — the validator checks both, because a token that passes on white can
fail on the plane behind it.

## Borders

`--jrk-border-subtle` (gridlines, table rules) · `--jrk-border-default` (inputs,
popover edges, **the nested-tile hairline**) · `--jrk-border-strong` (axis,
baselines, form controls) · `--jrk-border-accent` (active tab, selected input).

**There is no `--jrk-border-card` and no `--jrk-card-edge`.** Both were removed
with the brand edge; referencing either is a breaking change for a consumer that
still does. The tile edge is `border.subtle`, drawn by the component.

Every tile declares a 1px border — `.jrk-card` colours it `border.subtle`;
`.jrk-stat`, `.jrk-stat-row`, `.jrk-chart-card` and `.jrk-table-wrap` reserve the
width with `transparent`. **Never change any of them to `border: 0`:** the reserved width means an edge appearing changes only a
colour and never reflows, and `border: 0` sets `border-style: none`, after which
`border-color` paints nothing at all. Form controls use `border-strong` plus a
contrasting fill.

Where an edge IS drawn:

- **A nested tile takes `--jrk-border-default`**, a step heavier than the base
  card's `border.subtle`, because a tile inside a tile sits on the card plane where
  its own fill matches what it sits on. `nesting.css` is the single home for that
  rule. `--outlined` asks for that heavier weight at the top level — keep it above
  the base card or it becomes a no-op; `--seamless` is the way to suppress an edge.
- **`.jrk-sheet` draws it by default.** It is designed for
  `.jrk-content--document`, which *is* the card plane, so it has no step to inherit.

**No gate measures the border namespace** — the validator does not touch it. That
mattered most for the removed brand edge and it still matters for
`--jrk-border-accent`: a tab underline is a *signifier*, something depends on
seeing it, so it needs WCAG 1.4.11's 3:1 and its numbers are recorded by hand on
the token (`#0069d9`, 5.22:1 on the card and 5.04:1 on the `#fbfbfb` page). Decorative
separation may sit below 3:1; the moment state rides on a border it may not. Note
this token used to need a bespoke value to clear 3:1 at all; it now tracks
`accent.text`, which is always safe because its floor is the higher one.

## Accent (blue, hue 212 degrees)

`--jrk-accent-solid` (the `.jrk-btn--cta` fill) · `-solid-hover` ·
`-solid-active` · `-on-solid` · `-text` · `-wash` (selected row, soft badge, and
the `.jrk-btn--primary` fill) · `-wash-hover` · `-wash-active` · `-wash-border` ·
`-wash-text`.

**Two button volumes, and the split is deliberate.** `-solid` + `-on-solid` is
`--cta`, one per view; the `-wash` family is `--primary`, the everyday button.
Three things about the wash family are load-bearing. `-wash-text` is the label on
every step of it, so `validate` measures it against `-wash`, `-wash-hover` **and**
`-wash-active` — the press deepens the fill *toward* its ink, the opposite of
`-solid`'s sequence, and `-wash-active` is the last step that still clears 4.5:1.
`-wash-border` exists because a wash is a 1.16:1 fill step on the white card and
1.06:1 on the dark one: it cannot bound a control, and a button has to look
pressable. And `-wash-border` is kept far below `--jrk-border-accent` on purpose —
that one means *selected* on a segment or a tab, and the two must not converge.

**The anchor is `#0069d9`, a saturated mid-tone, and every role takes it.**
5.22:1 on the white card and 5.04:1 on the `#fbfbfb` page, white label at 5.22:1 —
so `-text`, `--jrk-text-link`, `--jrk-border-accent` and `--jrk-focus-ring` are
all the anchor itself. Only `-wash-text` steps away, and only because its
background does. **The PAGE is the binding surface and it is always the lower
number** — the anchor was pinned at 4.79:1 against the `#f5f5f7` page and sits at
5.04:1 here, so this is headroom, not licence to lighten the anchor. A deeper page
spends it straight back.

This is the second replacement — systemIndigo `#5856d6`, then a `#9ee4ff` cyan
pastel, now this. The pastel is worth remembering because it is the shape of the
mistake: at 1.40:1 on the card it could not be text or a signifier on any light
surface, so each of those four roles needed its own hand-derived step and the
banner turned the report's heaviest element into its palest. An accent whose
anchor cannot be used in the accent's own roles is the wrong anchor.

**It is not `systemBlue`.** `#007aff` gives a white label 4.02:1 and link text
3.60:1 on the page — it fails here exactly the way `systemGray` and
`systemIndigo` do. `#0069d9` is the shallowest step on the hue that clears 4.5:1
in every light-mode role. The accent is not an Apple colour; the neutrals, status
colours and chart palette still are.

| Role | Light | Dark | Note |
|---|---|---|---|
| `-solid` / `-solid-hover` / `-solid-active` | `#0069d9` / `#005ec4` / `#0057b8` | same | white label GAINS contrast through the press: 5.22 → 6.18 → 6.87 |
| `-on-solid` | `#ffffff` | `#ffffff` | see below |
| `-text` / `--jrk-text-link` | `#0069d9` | `#64b5ff` | dark is *selected* — the anchor is only 3.00:1 on the dark card |
| `-wash` | `#e3efff` | `#0d2947` | |
| `-wash-text` | `#005ec4` | `#64b5ff` | the anchor lands at **4.49:1** on the light wash — under the floor by 0.01 |
| `--jrk-border-accent` | `#0069d9` | `#64b5ff` | |
| `--jrk-focus-ring` | `#0069d9` | `#64b5ff` | |

**The page is the binding surface for light text roles, and it is easy to miss.**
It is what pins the anchor: a blue tuned only against the white card can sit a
full step lighter and fail on `#f2f2f7`.

**`--jrk-accent-on-solid` is the label ON the fill, and it is `#ffffff` in both
modes** at 5.22:1. It has now been white, then dark ink `#052f3b` for the pastel
era, then white again — so the rule is not a colour, it is **"whatever measures
against `accent.solid`"**. Re-measure it whenever the anchor moves. It is still
**not** `--jrk-text-inverse` (`#ffffff` light / `#000000` dark, for the inverse
surface): the two agree in light and disagree in dark, and have been separate
facts through all three accents.

**Do not borrow `-on-solid` as a generic "label on a filled control."**
`.jrk-btn--danger-solid` did exactly that, filling with `status.critical.mark`
and labelling with the accent's ink — so the red button's ink direction was
decided by the accent and moved silently every time the accent did, at 4.01:1,
gated by nothing. It now uses `--jrk-status-critical-solid` `#d81f14` with
`--jrk-status-critical-on-solid` `#ffffff` (5.09:1). The mark could not simply be
relabelled: white on `#ff3b30` is 3.55:1.

Because the banner tracks `accent.solid`, `--jrk-text-on-banner` went back to
white in light with it. `--jrk-text-on-banner-muted` is the tightest type pairing
in the library: white on the band is only 5.22:1, leaving 0.72 of headroom above
the floor, so the muted step is a near-white tint (`#e8f1fd`, 4.58:1) rather than
a grey. If the banner ever needs a genuinely muted label, deepen the band.

## Status — reserved, never a chart series

Each ships three steps: `mark` (fills/dots, 3:1 target), `text` (AA 4.5:1), and
`wash` (soft badge fill).

`--jrk-status-{good|warning|serious|critical|neutral}-{mark|text|wash}`

Always paired with an icon and a label. On light, `warning` and `serious` marks
sit below 3:1 by design — the pairing is the mitigation.

## Charts

- `--jrk-chart-1..8` — categorical series identity, fixed order, CVD-validated
- `--jrk-chart-tint-1..8` — pastel fills for already-labelled marks; **exempt
  from the CVD gate**
- `--jrk-chart-tint-ink` — label set inside a tint fill
- `--jrk-chart-seq-1..13` — sequential ramp (indigo), light → dark
- `--jrk-chart-div-negative` / `-positive` / `-div-mid` — diverging, neutral middle
- `--jrk-chart-surface` / `-grid` / `-axis` / `-tick` / `-label` — chrome
- `--jrk-chart-delta-up` / `-delta-down` — success/failure text steps

Apply a series color by setting `--series` on the mark's container, or use the
`.jrk-s1`…`.jrk-s8` / `.jrk-t1`…`.jrk-t8` helper classes.

## Scale

- **Type** `--jrk-text-2xs|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl` (11px → 42px; `md` = 14px is body)
- **Weight** `--jrk-weight-regular|medium|semibold|bold`
- **Leading** `--jrk-leading-tight|snug|normal|relaxed`
- **Tracking** `--jrk-tracking-tight|normal|wide|caps`
- **Space** `--jrk-space-0_5` … `--jrk-space-24` on a 4px grid
- **Radius** `--jrk-radius-sm|md|lg|xl|2xl|full` (6/10/14/18/24px) plus
  `--jrk-radius-data-end` (4px, bar tips). Softened from the tight Apple ladder
  (4/6/10/12/16) on 2026-08-13. Controls take `full`; **fields do not** — see
  `.jrk-input--pill` for the one exception.
- **Shadow** `--jrk-shadow-sm|card|md|lg|xl|focus`. `card` is the resting
  elevation of every tile and is `none` in dark.
- **Controls** `--jrk-control-sm|md|lg` (24/32/40px; md and lg stepped up 2026-08-13 for the softer look, sm held at the floor), `--jrk-icon-sm|md|lg` (13/15/18px). `--jrk-min-touch` is 24px — the WCAG 2.2 AA floor. Never lower. `.jrk-nav-item` is pinned to `control-md` rather than following `lg`, and `size.sheet.*` is a separate ladder that did not move.
- **Layout** `--jrk-sidebar-collapsed|expanded`, `--jrk-topbar-default`,
  `--jrk-container-sm|md|lg|xl`
- **Sheet** `--jrk-sheet-row|row-banner|row-meta|gutter|label|cell|total|wide|chart`
- **Motion** `--jrk-duration-*`, `--jrk-ease-*`, and `--jrk-transition`
- **Z** `--jrk-z-base|raised|sticky|overlay|modal|popover|toast|tooltip`

Radii are deliberately SOFT, and that reverses what stood here — "tight, because
Apple corners are smaller than most web systems and an over-rounded card is the
fastest way to stop reading as Apple". Reading as Apple is no longer the brief.
`radius-data-end` did **not** move and stays smallest: it rounds the loaded end of
a bar, where the corner eats length off the encoding, so a heavily rounded tip
makes the endpoint ambiguous and reading the bar against the axis is its job. It
will look like an oversight beside the softened ladder; it is not.

Elevation is a LADDER: rest (`shadow-card`) → hover (`shadow-lg`) → popover
(`shadow-lg`/`xl`). Protect the GAP between the steps — point rest and hover at the
same token and an interactive card stops responding to the pointer.

## Motion

Use `var(--jrk-transition)`. The reduced-motion guard in `css/base.css` zeroes
every duration token globally, so honoring the preference is not per-component
discipline. Do not hand-roll durations.

## Adding a token

```json
"surface": {
  "highlight": { "light": "#fff8e1", "dark": "#3a2f10", "use": "flagged row" }
}
```

`npm run build` emits `--jrk-surface-highlight` and adds it to the Tailwind
theme. Then `npm run validate` — if it carries text, add a contrast assertion in
`scripts/validate-colors.mjs` so it cannot drift later.

## Per-app override without forking

```css
:root { --jrk-accent-solid: #7c3aed; }
```

Works, but skips the validator. Fine for a one-off; change the token for
anything permanent.

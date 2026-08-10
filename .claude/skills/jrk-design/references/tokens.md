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
| `--jrk-surface-canvas` | `#ffffff` | `#141416` | page plane, sidebar, topbar |
| `--jrk-surface-default` | `#ffffff` | `#232326` | cards, panels, **chart surface** |
| `--jrk-surface-tinted` | `#e0f6ff` | `#0e3543` | KPI band, highlighted tiles |
| `--jrk-surface-subtle` | `#f2f2f7` | `#2c2c2e` | table header, inset wells, sheet toolbar |
| `--jrk-surface-raised` | `#ffffff` | `#2c2c2e` | popovers, menus, modals, inputs |
| `--jrk-surface-banner` | `#0069d9` | `#2c2c2e` | sheet title bar |
| `--jrk-surface-card-hover` | `#ffffff` | `#2c2c2e` | fill of an INTERACTIVE card while hovered |
| `--jrk-surface-hover` / `-active` / `-disabled` / `-inverse` | | | states |

**The light page is flat `#ffffff`, so a tile is bounded by a HAIRLINE.**
`.jrk-card` draws `border.subtle`: 1.26:1 on the light page, where it does the
whole job, and 1.24:1 in dark on top of the fill step that still bounds the tile
there (`#232326` on `#141416`, 1.17:1). One mechanism in both themes, per-theme
values — not hairline-in-light / fill-in-dark, because two mechanisms is what lets
a change read correctly in one theme and vanish in the other. Chrome (sidebar,
topbar) shares the canvas and is divided from the content by its own hairline.

**`canvas.light` and that edge are a pair — never move one alone.** The page has
been `#ffffff` and `#f2f2f7` more than once. Flat page → the card needs its own
edge; tinted page → the fill step is the edge and the border can go transparent.
The one broken state was the half-finished revert, where the brand edge was
removed and the page was left flat: light cards had a 1.000:1 step behind a
transparent border. `border.card` and `size.cardEdge` are still gone for good.

Consequences worth knowing, none of them gated:
- **`--jrk-surface-subtle` is a real recess in light again** (`#f2f2f7`, 1.12:1
  below both the white page and the white card), so table headers and inset wells
  read as set in. It does not replace `--jrk-surface-track`, which is recessed in
  *both* themes where subtle is a recess in light and a lift in dark.
- **`--jrk-surface-hover` on a whole tile is no longer the trap it was.** It is
  `#f2f2f7`, which used to be the page value and erased the card's fill step;
  with the flat page and a hairline it cannot dissolve the boundary.
  `--jrk-surface-card-hover` is still the token for a hovered card and is still a
  deliberate no-op in light, because the hover *shadow* carries that theme.
- **`.jrk-content--document` is a no-op in light again**, because the plane it
  paints (`surface.default`) is the same `#ffffff` as the page. It does real work
  in dark. What still holds in light is the reason it exists: anything on that
  plane has no fill step to separate with and needs its own edge.

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
the token (`#0069d9`, 5.22:1 on the card and on the flat white page). Decorative
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
5.22:1 on the white card and on the flat white page, white label at 5.22:1 —
so `-text`, `--jrk-text-link`, `--jrk-border-accent` and `--jrk-focus-ring` are
all the anchor itself. Only `-wash-text` steps away, and only because its
background does.

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
- **Radius** `--jrk-radius-sm|md|lg|xl|2xl|full` (4/6/10/12/16px) plus
  `--jrk-radius-data-end` (4px, bar tips). Apple corners are TIGHTER than most
  web systems — macOS controls sit near 6px and cards near 10-12px.
- **Shadow** `--jrk-shadow-sm|md|lg|xl|focus`
- **Controls** `--jrk-control-sm|md|lg` (24/28/32px, macOS-compact non-touch), `--jrk-icon-sm|md|lg` (13/15/18px). `--jrk-min-touch` is 24px — the WCAG 2.2 AA floor. Never lower.
- **Layout** `--jrk-sidebar-collapsed|expanded`, `--jrk-topbar-default`,
  `--jrk-container-sm|md|lg|xl`
- **Sheet** `--jrk-sheet-row|row-banner|row-meta|gutter|label|cell|total|wide|chart`
- **Motion** `--jrk-duration-*`, `--jrk-ease-*`, and `--jrk-transition`
- **Z** `--jrk-z-base|raised|sticky|overlay|modal|popover|toast|tooltip`

Radii are deliberately TIGHT — Apple corners are smaller than most web systems,
and an over-rounded card is the fastest way to stop reading as Apple.
`radius-data-end` stays smallest: a heavily rounded bar tip makes the endpoint
ambiguous, and reading the bar against the axis is its job.

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

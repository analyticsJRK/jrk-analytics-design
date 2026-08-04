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
| `--jrk-surface-default` | `#ffffff` | `#1c1c1e` | cards, panels, **chart surface** |
| `--jrk-surface-tinted` | `#eeeefc` | `#25253a` | KPI band, highlighted tiles |
| `--jrk-surface-subtle` | `#f2f2f7` | `#2c2c2e` | table header, inset wells, sheet toolbar |
| `--jrk-surface-raised` | `#ffffff` | `#2c2c2e` | popovers, menus, modals, inputs |
| `--jrk-surface-banner` | `#5856d6` | `#2c2c2e` | sheet title bar |
| `--jrk-surface-hover` / `-active` / `-disabled` / `-inverse` | | | states |

**The two themes separate their planes differently, and this is the trap in the
whole file.** Dark is Apple grouped: `#1c1c1e` cards lift off a `#141416` page by
fill. Light is flat: canvas and default are both `#ffffff`, a 1.0:1 step, so
`--jrk-border-card` is the only thing making a tile a tile. Chrome (sidebar,
topbar) shares the canvas, so in light it is divided from the content by its
hairline alone.

Three things follow, and none of them are caught by a gate:
- **`--jrk-surface-subtle` is light's only tint.** If something needs to recess in
  light, it must name `subtle` — the page will not do it for free.
- **`.jrk-card--seamless` has no boundary in light.** Dark-mode-or-nested only.
- **`.jrk-content--document` is a no-op in light**, still load-bearing in dark.

The card is what everything is measured against — in light that value now equals
the page, but they remain different facts and the card is the one to measure.

**In dark the fill step barely exists — the edge is the elevation cue.**
`#1c1c1e` on `#141416` is 1.08:1, so a dark card that drops its
`--jrk-border-card` edge stops reading as a card. The canvas is not `#000000`
on purpose (halation against near-white text at 1920x1080); `--jrk-text-primary`
in dark is `#ebebf0` rather than `#ffffff` for the same reason. Both are noted on
the tokens in `tokens.json` — do not restore either.

## Text

| Token | Use |
|---|---|
| `--jrk-text-primary` | headings, values, body |
| `--jrk-text-secondary` | supporting copy, labels |
| `--jrk-text-muted` | axis ticks, captions, placeholders |
| `--jrk-text-disabled` | decorative only — never load-bearing |
| `--jrk-text-inverse` | on `surface-inverse` ONLY — not the solid accent |
| `--jrk-accent-on-solid` | the label ON the solid accent; white in both modes |
| `--jrk-text-link` | inline links, accent text |
| `--jrk-text-on-banner`, `--jrk-text-on-banner-muted` | on `surface-banner` |

All of `primary`/`secondary`/`muted`/`link` clear 4.5:1 on **both** the card and
the canvas — the validator checks both, because a token that passes on white can
fail on the plane behind it.

## Borders

`--jrk-border-card` (**the outer edge of a card-like tile — 2px, brand blue**) ·
`--jrk-border-subtle` (gridlines, table rules) · `--jrk-border-default` (inputs,
card footers, the neutral-edge escape hatch) · `--jrk-border-strong` (axis,
baselines, form controls) · `--jrk-border-accent` (active tab, selected input).

Apple separators for everything internal; a brand edge on the outside. In dark a
card has a fill step *and* an edge; in light it has only the edge, which is why
the edge is unconditional. That edge is `2px solid var(--jrk-border-card)`
(`#48a9df`, both modes), drawn with
`var(--jrk-card-edge)` for the weight, and every outermost tile uses the same
pair: `.jrk-card`, `.jrk-stat`, `.jrk-stat-row`, `.jrk-chart-card`, `.jrk-sheet`.
Form controls use `border-strong` plus a contrasting fill.

Two rules keep the brand edge from turning into noise:

- **One brand edge per enclosure.** A card inside a card, or a tile inside
  `.jrk-stat-row`, takes `--jrk-border-default` (`.jrk-card--outlined`) or no
  edge at all. Nested blue rectangles read as a rendering bug.
- **Never on an internal rule.** Gridlines, table rows, card footers, sheet
  column and total rules, chart axes — all stay neutral 1px. The blue line means
  "this is one tile"; if it also meant "this is a row boundary" it would mean
  nothing.

`border.card` is the one color in `tokens.json` that was specified rather than
stepped, and **no gate measures it** — the validator does not touch the border
namespace. Light: 2.62:1 on the white card, 2.35:1 against the page. Dark: 6.5:1
and 7.0:1. The light figures are under WCAG 1.4.11's 3:1, legal only because the
edge is decorative separation — the tile is also carried by its fill step, radius
and padding. Do not make it a signifier, and do not put state on it.

## Accent (systemIndigo)

`--jrk-accent-solid` (button fill) · `-solid-hover` · `-solid-active` ·
`-on-solid` · `-text` · `-wash` (selected row, soft badge) · `-wash-text`.

systemIndigo `#5856d6` is Apple verbatim — white on it measures 5.65:1, so it
needs no darkening (systemBlue would).

**`--jrk-accent-on-solid` is the label ON the fill, and it is white in both
modes.** Do not use `--jrk-text-inverse` there: in dark mode that is the dark ink
for the light inverse surface, and black on the dark indigo is only 4.15:1.

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

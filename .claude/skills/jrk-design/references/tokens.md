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
| `--jrk-surface-canvas` | `#f2f2f7` | `#000000` | page plane, sidebar, topbar — systemGroupedBackground |
| `--jrk-surface-default` | `#ffffff` | `#1c1c1e` | cards, panels, **chart surface** |
| `--jrk-surface-tinted` | `#eeeefc` | `#25253a` | KPI band, highlighted tiles |
| `--jrk-surface-subtle` | `#f2f2f7` | `#2c2c2e` | table header, inset wells |
| `--jrk-surface-raised` | `#ffffff` | `#2c2c2e` | popovers, menus, modals, inputs |
| `--jrk-surface-banner` | `#5856d6` | `#2c2c2e` | sheet title bar |
| `--jrk-surface-hover` / `-active` / `-disabled` / `-inverse` | | | states |

Apple GROUPED style: the page is tinted and the cards are white — the reverse of
a conventional dashboard. The card is the surface everything is measured
against; chrome sits on the canvas so the cards read as the raised thing.

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

`--jrk-border-subtle` (gridlines, table rules) · `--jrk-border-default` (inputs,
card footers) · `--jrk-border-strong` (axis, baselines, form controls) ·
`--jrk-border-accent` (active tab, selected input).

Apple separators. Cards carry a fill *and* a `border-subtle` hairline — iOS uses
fill alone, but at desktop viewing distance a white-on-`#f2f2f7` edge is too
faint to hold a dense layout together, so this is the macOS treatment. Form
controls use `border-strong` plus a contrasting fill.

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

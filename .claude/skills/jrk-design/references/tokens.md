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
| `--jrk-surface-canvas` | `#ffffff` | `#000000` | page plane, sidebar, topbar |
| `--jrk-surface-default` | `#f5f5fa` | `#1a1a1a` | cards, panels, **chart surface** |
| `--jrk-surface-tinted` | `#eceefc` | `#242424` | KPI band, highlighted tiles |
| `--jrk-surface-subtle` | `#eeeef5` | `#212121` | table header, inset wells |
| `--jrk-surface-raised` | `#ffffff` | `#262626` | popovers, menus, modals, inputs |
| `--jrk-surface-banner` | `#353781` | `#2e2e2e` | sheet title bar |
| `--jrk-surface-hover` / `-active` / `-disabled` / `-inverse` | | | states |

The card is the surface everything is measured against. Chrome sits on the
canvas so the cards read as the raised thing.

## Text

| Token | Use |
|---|---|
| `--jrk-text-primary` | headings, values, body |
| `--jrk-text-secondary` | supporting copy, labels |
| `--jrk-text-muted` | axis ticks, captions, placeholders |
| `--jrk-text-disabled` | decorative only — never load-bearing |
| `--jrk-text-inverse` | on inverse surface / solid accent |
| `--jrk-text-link` | inline links, accent text |
| `--jrk-text-on-banner`, `--jrk-text-on-banner-muted` | on `surface-banner` |

All of `primary`/`secondary`/`muted`/`link` clear 4.5:1 on **both** the card and
the canvas — the validator checks both, because a token that passes on white can
fail on the plane behind it.

## Borders

`--jrk-border-subtle` (gridlines, table rules) · `--jrk-border-default` (inputs,
card footers) · `--jrk-border-strong` (axis, baselines, form controls) ·
`--jrk-border-accent` (active tab, selected input).

Deliberately near-invisible: cards separate by fill, not by a rule. Form
controls use `border-strong` plus a contrasting fill — an input must show where
it ends even though a card need not.

## Accent (periwinkle indigo)

`--jrk-accent-solid` (button fill) · `-solid-hover` · `-solid-active` · `-text` ·
`-wash` (selected row, soft badge) · `-wash-text`.

The solid fill is `indigo-600`, not `indigo-500` — 500 measures only 4.0:1 with
white text, under AA. This is the class of near-miss the gate exists for.

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

- **Type** `--jrk-text-2xs|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl` (11px → 48px; `md` is body)
- **Weight** `--jrk-weight-regular|medium|semibold|bold`
- **Leading** `--jrk-leading-tight|snug|normal|relaxed`
- **Tracking** `--jrk-tracking-tight|normal|wide|caps`
- **Space** `--jrk-space-0_5` … `--jrk-space-24` on a 4px grid
- **Radius** `--jrk-radius-sm|md|lg|xl|2xl|full` (6/10/14/18/24px) plus
  `--jrk-radius-data-end` (6px, bar tips)
- **Shadow** `--jrk-shadow-sm|md|lg|xl|focus`
- **Controls** `--jrk-control-sm|md|lg` (28/34/40px), `--jrk-icon-sm|md|lg`
- **Layout** `--jrk-sidebar-collapsed|expanded`, `--jrk-topbar-default`,
  `--jrk-container-sm|md|lg|xl`
- **Sheet** `--jrk-sheet-row|row-banner|row-meta|gutter|label|cell|total|wide|chart`
- **Motion** `--jrk-duration-*`, `--jrk-ease-*`, and `--jrk-transition`
- **Z** `--jrk-z-base|raised|sticky|overlay|modal|popover|toast|tooltip`

Radii are generous by design — that is the main lever for the soft look.
`radius-data-end` is the exception and stays small: a heavily rounded bar tip
makes the endpoint ambiguous, and reading the bar against the axis is its job.

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

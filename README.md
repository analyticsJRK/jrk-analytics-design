# JRK Analytics Design

Design library for JRK analytics dashboards and web apps: one token layer, a
plain-CSS component library, and React wrappers over the same class names.

It serves both stacks in the org as they actually are:

| Stack | How it consumes the library |
|---|---|
| `jrk_agents` — Next.js 15 / React 19 / Tailwind v4 | Tokens as a Tailwind `@theme`, plus the React components |
| `jrk-audit-platform`, `JRK_FORMS` — Python + Jinja | One `<link>` to `css/index.css`, plain `jrk-*` classes |

Both paths resolve to the same CSS custom properties, so a Tailwind utility and
a `jrk-*` class produce the same color and both follow the theme toggle.

---

## Quick start

```bash
npm install
npm run build      # tokens/tokens.json -> dist/
npm run preview    # gallery at http://localhost:4321/preview/index.html
npm test           # build + css check + color gate + typecheck
```

Open the gallery first — it is the fastest way to see what exists.

### Jinja / plain HTML

```html
<link rel="stylesheet" href="/static/jrk/index.css">

<button class="jrk-btn jrk-btn--primary">Run audit</button>
<span class="jrk-badge jrk-badge--good">Reconciled</span>
```

Copy or symlink `css/` and `dist/` into the app's static directory. No build
step, no framework.

### Tailwind v4 + React

```css
/* app/globals.css */
@import "tailwindcss";
@import "@jrk/design/dist/jrk-tokens.css";
@import "@jrk/design/dist/jrk-theme.tailwind.css";
@import "@jrk/design/css/index.css";
```

```tsx
import { Stat, DataTable, ChartCard, LineChart } from '@jrk/design';

<Stat label="Collected rent" value="$4.2M"
      delta={{ value: 3.1, vs: 'vs last month' }} />
```

The React layer has no Tailwind dependency — it emits the same `jrk-*` classes.
Tailwind utilities compose alongside them via `className`.

### Theming

```ts
import { setTheme } from '@jrk/design';
setTheme('dark');    // 'light' | 'dark' | 'system'
```

Stamps `data-theme` on `<html>`. Dark values are **selected** for the dark
surface, not flipped from light. An explicit stamp beats the OS preference in
both directions.

---

## Repo layout

```
tokens/tokens.json          source of truth — the only file you hand-edit
scripts/build-tokens.mjs    -> dist/ (CSS vars, Tailwind @theme, typed TS)
scripts/validate-colors.mjs the color gate — six checks + WCAG, both themes
scripts/check-css.mjs       brace balance, token typos, raw-hex discipline
css/                        plain-CSS library, works with no build step
css/components/sheet.css    workbook-style report grid (the AM Report shape)
react/src/                  React wrappers over the same class names
preview/                    static gallery — no build step
dist/                       GENERATED — never hand-edit
```

**Changing a color means editing `tokens/tokens.json` and re-running
`npm run build`.** Nothing else is a source of truth.

---

## The rules this library enforces

These are gates, not conventions. They fail `npm test`, not a review comment.

### Color is computed, not chosen

`npm run validate` runs the categorical palette through a lightness band, a
chroma floor, colorblind separation under simulated protanopia and deuteranopia,
a normal-vision floor, and contrast against the real surface — in both themes,
on both pairlists. Then it WCAG-checks every text, status, accent, and focus
token against each surface it actually renders on.

It has already caught real near-misses: `blue-450` as the button fill measured
4.42:1 with white text, so the fill is `blue-500`.

The full six-checks run needs the `dataviz` skill's validator:

```bash
JRK_DATAVIZ=/path/to/dataviz npm run validate
```

Without it the WCAG half still runs and the six-checks half warns.

### Surfaces are inverted, on purpose

In **light** mode the page plane is white and the **cards carry a soft
gray-purple tint** (`surface.default` = `#f5f5fa`). Popovers, modals, and inputs
then go white so they still lift off the cards. Cards have no border — they
separate from the page by their fill, and the transparent border exists only to
hold the box model steady and to let the forced-colors rule put a real one back.

In **dark** mode the same layering goes achromatic: a true black page
(`#000000`) with neutral shadow-grey tiles (`#1a1a1a`), stepping up through
`#212121` and `#262626` for wells and popovers. Ink is neutral grey too — a
violet-tinted ink on neutral tiles reads as a color cast rather than a choice.
The indigo accent and the chart hues are the only color in the dark UI.

Two practical consequences:

- **The card, not the page, is the chart surface.** Marks are validated against
  `#f5f5fa` / `#1a1a1a`, not against white or black.
- **In dark mode the grey tile *is* the elevation cue.** A drop shadow is
  invisible against a true black page, so the surface step does that work and
  the dark shadow tokens only tighten the edge.

### Two chart color sets, for two different jobs

| Set | Tokens | For |
|---|---|---|
| **Categorical** | `--jrk-chart-1..8` | Series identity. Fixed order, validated for colorblind separation. |
| **Tint** | `--jrk-chart-tint-1..8` | Pastel fills for large marks whose identity is already carried elsewhere. |

The tints are what produce the soft look. They sit **above** the lightness band
and **below** the chroma floor, so they physically cannot do identity work, and
the validator does not check them for CVD separation — that is not their job.

A tint is legal when the mark is **axis-labelled, direct-labelled, or has its
value printed in the legend**. Using one where color *is* the identity channel —
an unlabelled multi-series line chart, a scatter plot — is a bug, and no gate
will catch it for you.

The categorical set was softened as far as the gates allow: lightness lifted,
chroma cut about a quarter, hue held. The **lightness spread was preserved** —
protan and deutan viewers separate colors mostly by lightness, so making
everything uniformly pale is exactly what collapses CVD separation. Light and
dark were tuned independently because their bands differ (light 0.43–0.77 is
much wider than dark 0.48–0.67). Pushing further fails: light hits the adjacent
CVD floor, dark runs out of lightness band.

### Dense reports use the sheet layer, not the table

`.jrk-table` is for ordinary tables. `.jrk-sheet` is for workbook-style reports —
a year of months across, many years down, totals and growth on the right, and a
chart spanning the block. The AM Report is the reference case.

It is a **CSS grid, not a `<table>`**, and that is deliberate: the Excel-style
column bar and the row-number gutter span the whole report across many stacked
metric blocks, and a per-block `<table>` cannot align with one global column bar
without duplicating track widths in a `<colgroup>`. One shared track list
(`--jrk-sheet-cols`) makes the alignment structural.

The cost is that semantics must be declared — `role="grid"`, `role="row"`,
`role="rowheader"`, `role="gridcell"`. The letter bar and the number gutter are
`aria-hidden`: they are a coordinate system, not data.

Override `--jrk-sheet-cols` on `.jrk-sheet` to change the report's shape. Never
per row, or the letter bar stops lining up with the data under it.

Sheet density is deliberately tighter than the rest of the library (26px rows,
11px type). A financial report's job is to get a year of months on one screen,
and the app's normal row heights make that impossible.

### The series palette is never cycled

Eight slots in a fixed order. The **order** is the colorblind-safety
mechanism — neighbors are what touch in a stack or a line chart, so adjacent
pairs are what the gate measures. A ninth series is never a generated hue: it
folds into "Other", facets into small multiples, or takes a second encoding.
`seriesColor(8)` throws rather than wrapping around.

Scatter, bubble, choropleth, and small multiples cap at **three** series — there
any two marks can sit side by side, so the harder all-pairs test applies. That is
a series cap, not a palette change; no ordering of eight can pass it.

### Color is never the only signal

- Status badges ship an icon and a label. `<Badge tone="warning">` renders the
  icon automatically — on the light surface `warning` and `serious` sit below
  3:1 by design, and the pairing is the documented mitigation.
- Deltas state direction in text for screen readers, and take direction and
  interpretation as **separate** inputs. Falling delinquency is good; the
  library never assumes up means good.
- Every chart has a table view. It is the relief channel for the three
  light-mode series hues below 3:1, and the answer for screen readers.
- `tokens.json` lists those three hues in `reliefRequired.light`, and the
  validator fails if the list goes stale.

### Chart marks

Bars cap at 24px with a 4px data-end, square at the baseline. Lines are 2px.
Markers are ≥ 8px with a 2px surface ring. Grid and axes are hairline and
**solid** — a dashed line reads as data, so dashes are reserved for threshold
lines. Touching fills are separated by a **2px gap in the surface color**, never
by a stroke; a stroke adds ink that is not data.

**No dual-axis charts.** Two y-scales let the author pick the correlation by
picking the scales. Two measures of different magnitude become two charts, small
multiples, or values indexed to a common base.

### Chart SVGs size their viewBox from the container

A fixed viewBox stretched by `width: 100%` scales the text and strokes with it —
12px axis labels land near 18px on a wide card and hairlines stop being
hairlines. `<LineChart>` measures with a `ResizeObserver` so user units stay 1:1
with CSS pixels. Hand-written chart SVGs must do the same.

---

## Using this with Claude

A design system fails the same way whether a person or a model is building
against it: someone reaches for a hex that "looks about right." What makes this
library work with Claude is that most of its rules are **machine-checkable** —
`npm test` either passes or it doesn't, so an agent gets a correction signal
instead of a vibe.

### The loop that actually works

Give Claude the rules, then give it the feedback:

```
1. Claude writes UI                    -> jrk-* classes / React components
2. npm test                            -> tokens, hex discipline, color gate, types
3. npm run preview + screenshot        -> layout, both themes
4. Claude fixes what it sees, repeat
```

Step 3 is not optional. The gates check color and structure and **never check
layout** — every layout bug found while building this library (a bar fill
collapsing to zero height, chart text rendering 50% oversized, a grid stretching
to 3× its content) was invisible to `npm test` and obvious in a screenshot.

Headless capture, no dependencies:

```bash
npm run preview   # http://localhost:4321/preview/index.html
chrome --headless --disable-gpu --virtual-time-budget=4000 \
  --window-size=1200,1500 --screenshot=out.png \
  http://localhost:4321/preview/dashboard.html
```

Capture at roughly the page's real width. A downscaled screenshot makes correct
2px marks and 1px hairlines look broken, which sends the agent chasing bugs that
aren't there.

### Option 1 — CLAUDE.md in the consuming app

Cheapest path. In the app repo's `CLAUDE.md`:

```markdown
## UI

Use @jrk/design. Never write a raw hex, a raw px radius, or a one-off gray —
every value comes from a `--jrk-*` token. Components are `jrk-*` classes or the
React exports. Full rules: ../jrk-analytics-design/CLAUDE.md
```

The catch: CLAUDE.md loads into context on **every** turn, so it has to stay
short, and a short version drops the reasoning that stops the failure modes.

### Option 2 — a skill (recommended)

A skill's body loads **only when it's used**, so the full rules and reference
material cost almost nothing until Claude is actually building UI. That is the
whole reason to prefer it over CLAUDE.md for something this long.

```
.claude/skills/jrk-design/
├── SKILL.md              # the rules — loaded when relevant
└── references/
    ├── components.md     # class/prop reference per component
    ├── charts.md         # form choice, the two color sets, mark specs
    └── tokens.md         # the token namespaces and when to use each
```

`SKILL.md`:

```yaml
---
name: jrk-design
description: >
  JRK analytics design library — design tokens, jrk-* CSS classes, React
  components, and the automated color gate. Use when building or restyling any
  UI in a JRK app (dashboard, table, chart, form, app shell), or when choosing
  any color, spacing, radius, or chart palette value.
paths: "**/*.tsx,**/*.jsx,**/*.css,**/templates/**/*.html"
---

## Non-negotiables

- Never write a raw hex, rgb(), or one-off gray. Every value is a `--jrk-*`
  token. `npm run check:css` fails on a raw hex in a component file.
- Changing a design value means editing `tokens/tokens.json` and running
  `npm run build`. `dist/` is generated — never hand-edit it.
- `--jrk-chart-1..8` carry series identity and are colorblind-validated.
  `--jrk-chart-tint-1..8` are pastel fills for marks that are ALREADY labelled.
  They are not interchangeable.
- The palette is never cycled. A 9th series folds into "Other" or facets.
- Color is never the only signal: status needs icon + label, deltas state
  direction in text, every chart has a table view.
- No dual-axis charts.

## Before finishing

Run `npm test`. Then screenshot the result in BOTH themes — the gates do not
check layout.

See `references/` for the component and chart specifics.
```

Put it at `.claude/skills/` in the repo (shared with the team, and picked up by
cloud sessions) rather than `~/.claude/skills/` (your machine only, and not read
by Cowork or scheduled runs). Claude Code hot-reloads skill changes without a
restart.

The `paths` field means Claude loads it automatically when touching a component
or stylesheet, and leaves it out of context entirely when you're editing a
Lambda handler.

### Option 3 — `--add-dir`

When you want Claude to change the library *and* the app in one session:

```bash
claude --add-dir ../jrk-analytics-design
```

It reads this repo's `CLAUDE.md`, and can run the gates directly after a token
change.

### Keeping the claude.ai Design System project in sync

The library is mirrored to a claude.ai **Design System** project so teammates can
browse the gallery and Claude can read it back as a reference.

**The sync is one-way and manual: repo → claude.ai. This repo is the source of
truth.** There is no watcher, no hook, and no automatic push. Anything edited in
the Design System pane is overwritten by the next sync, so don't edit there.

To publish an update:

```bash
npm run sync:check     # verifies the tree is publishable, prints the path list
```

Then, in a Claude session in this repo, ask it to sync the design system and
approve the plan. Claude runs `list_files` → `finalize_plan` → `write_files`; the
plan shows you the exact paths and the source directory before anything uploads.

`sync:check` guards the failure modes that are otherwise silent:

| Check | Why it matters |
|---|---|
| `dist/` is current | It's generated. Push preview pages against a stale `dist/jrk-tokens.css` and the hosted gallery renders **old colors** while the repo is correct — nothing anywhere reports it. |
| `check:css` + `validate` pass | Don't publish a failing palette as the reference. |
| working tree clean | Publishing uncommitted work means git and claude.ai disagree, and git is what people diff. |
| every preview page has a `@dsCard` marker | The pane builds its card index from that first-line comment. A page without one uploads fine and then never appears as a card. |

#### What to re-push after a change

| You changed | Re-push |
|---|---|
| a token | `npm run build` first, then `dist/*` + `tokens/tokens.json` (+ any CSS you touched) |
| a component's CSS | that file, and `css/index.css` if you added an import |
| a new component | its CSS, `css/index.css`, its React file, `react/src/index.ts`, and the preview page |
| a gallery page | just that page |
| the `jrk-design` skill | **nothing** — see below |

Simplest correct habit: run `sync:check` and push the whole list. It's 43 files
and the upload reads them straight from disk, so a full push costs nothing and
can't leave a half-updated project.

#### Things that will surprise you

- **`.claude/**` and `CLAUDE.md` are refused**, by design — they carry
  instructions to the design agent. The skill reaches teammates through **git
  only**, which is the correct home for it anyway.
- **Deletions need to be in the plan.** Removing a component from the repo does
  not remove it from the project; the path has to be listed in the plan's
  `deletes`. Say so when you ask for the sync.
- **This can't be a cron job.** The push authenticates through your interactive
  claude.ai login, which isn't available in headless or scheduled runs. Treat it
  as a release step, not automation.
- **A renamed preview page leaves the old card behind** until the old path is
  deleted.

### Prompting that works

Anchor on the component and the constraint, not on the appearance:

| Instead of | Ask for |
|---|---|
| "make a dashboard with blue cards" | "build a portfolio overview using `StatRow`, a `ChartCard` with `LineChart`, and a `DataTable`" |
| "make the chart colors softer" | "soften the categorical palette as far as `npm run validate` allows, then show me what the binding constraint was" |
| "add a status column" | "add a status column using `Badge` — status tones, so it renders the icon" |
| "check it looks right" | "screenshot `/preview/dashboard.html` in both themes and fix what's wrong" |

### Failure modes to watch for

These are the ones that slip past a quick read of the diff:

- **A tint used for identity.** `--jrk-chart-tint-*` on an unlabelled
  multi-series line or a scatter. Legal-looking, quietly unreadable, and **no
  gate catches it** — the tints are deliberately exempt from the CVD check.
- **A 9th series.** `seriesColor(8)` throws, but hand-written CSS can just
  invent a hue. Check that a chart with many series folded or facetted.
- **Inline `style={{ color: '#...' }}` in a React file.** `check:css` only scans
  `css/` — it will not catch a hex in a `.tsx`.
- **"Fixing" a WARN.** The four standing warnings are documented relief cases,
  not bugs. An agent told to "make the validator clean" may re-step a correct
  color to chase them.
- **Softening by flattening lightness.** The categorical palette is already at
  the softest passing setting. Making the slots uniformly pale collapses
  colorblind separation, because that separation comes mostly from lightness.

---

## Verifying

```bash
npm test
```

Runs, in order:

1. `build` — regenerates `dist/` from `tokens/tokens.json`
2. `check:css` — brace balance, undefined `var(--jrk-*)` references, raw hex
   outside the token layer
3. `validate` — the color gate described above
4. `typecheck` — `tsc --noEmit` over the React layer

Then look at it, because none of those check layout:

```bash
npm run preview
```

Toggle light/dark in the gallery nav. The foundations page recomputes every
contrast readout live against the active theme.

---

## Adding a component

1. Add the CSS to `css/components/<name>.css` and import it in `css/index.css`.
   Reference tokens only — `check:css` fails on a raw hex.
2. Add the React wrapper in `react/src/<Name>.tsx` emitting those class names,
   and export it from `react/src/index.ts`.
3. Add it to `preview/components.html` so it is visible in both themes.
4. `npm test`, then look at the gallery.

If a component needs a new color, it goes in `tokens/tokens.json` with a light
and a dark value and gets re-validated — not inline in the component.

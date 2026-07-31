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

These are gates, not conventions — they fail `npm test`, not a review comment.

| Rule | Enforced by |
|---|---|
| No raw hex outside `tokens/tokens.json` | `check:css` |
| Every color clears the six checks + WCAG, both themes | `validate` |
| The 8-slot series palette is never cycled | `seriesColor()` throws past slot 8 |
| Color is never the only signal | `<Badge>` renders its icon; `<Delta>` states direction in text; every chart has a table view |
| Tints never carry identity | *nothing* — see below |
| React layer typechecks | `typecheck` |

**The one nothing catches:** `--jrk-chart-tint-*` is exempt from the colorblind
gate by design, so using a tint where color *is* the identity channel looks fine
and passes everything. That is the failure mode to review by eye.

The full six-checks run needs the `dataviz` skill's validator:

```bash
JRK_DATAVIZ=/path/to/dataviz npm run validate
```

Without it the WCAG half still runs and the six-checks half warns.

`npm run validate` exits 0 with five warnings. They are documented relief cases —
sub-3:1 marks that ship with visible labels or a table view, and status colors
paired with an icon + label. Do not re-step a correct color to silence them.

### The detail lives in the skill, not here

The full reference — every token namespace, every component's markup contract,
the chart method, the sheet grid — is in
`.claude/skills/jrk-design/references/`. It loads on demand in a Claude session
and is the single source; this README deliberately does not restate it.

| File | Covers |
|---|---|
| `tokens.md` | every token namespace and when to use each |
| `components.md` | class names, React props, markup contracts |
| `charts.md` | form choice, the two color sets, mark specs, anti-patterns |
| `sheet.md` | the workbook-style report grid |

### The look, in one paragraph

Apple: macOS/iOS grouped surfaces (`#f2f2f7` page with **white** cards in light;
`#141416` with `#1c1c1e` tiles in dark), Apple system greys, systemIndigo
accent, Inter standing in for SF, and macOS-compact density for non-touch
1920x1080. Apple's values are adopted only where they clear WCAG — `systemGray`
as body text is 2.92:1 and is rejected, and iOS's true-black dark page is
rejected too because it halates against near-white text at desktop size. The
card, not the page, is the chart surface.

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

The library is mirrored to the **JRK Analytics Design** project on claude.ai, so
the design agent there builds screens out of *these* components — every design it
produces is on-brand and maps 1:1 onto code we can ship — and teammates can
browse the components in the Design System pane.

**The sync is one-way and manual: repo → claude.ai. This repo is the source of
truth.** There is no watcher, no hook, and no automatic push. Anything edited in
the Design System pane is overwritten by the next sync, so don't edit there.

#### What actually gets uploaded

Not the repo's source. The sync uploads a **converted bundle** built from it:

| Uploaded | What it is |
|---|---|
| `_ds_bundle.js` | every export compiled to one IIFE on `window.JrkDesign` — what the design agent imports |
| `styles.css` + `_ds_bundle.css` + `fonts/` | the flattened token layer and component CSS, plus the bundled Inter / JetBrains Mono faces |
| `components/<group>/<Name>/` | per component: `.html` preview card, `.d.ts` API contract, `.prompt.md` usage reference |
| `guidelines/guides/*.md` | copies of the `jrk-design` skill references (doctrine the agent reads) |
| `_ds_sync.json` | content-hash anchor, so the next sync only re-verifies what changed |

`.design-sync/` holds the inputs: `config.json` (pins the project id),
`previews/*.tsx` (the authored preview cards), `conventions.md` (prepended to the
uploaded README and inlined into the design agent's prompt), and `NOTES.md`.

#### Publishing an update

Ask Claude in this repo to run **`/design-sync`**. It rebuilds, re-verifies, and
uploads, and you approve one plan that lists the exact paths and source
directory before anything is written.

To drive it by hand:

```bash
node .design-sync/prepare.mjs            # REQUIRED first — see below
node .ds-sync/resync.mjs --config .design-sync/config.json \
  --node-modules ./node_modules --entry ./react/src/index.ts \
  --out ./ds-bundle --remote .design-sync/.cache/remote-sync.json
```

**`prepare.mjs` is not optional and the driver does not run it for you.** This
package ships TS source rather than a compiled dist, so prepare.mjs generates the
`.d.ts` tree the component list and API contracts come from, flattens
`css/index.css` (it's a pure `@import` manifest — copied verbatim, *every
component renders unstyled*), rebuilds `dist/`, and stages `guides/`. Skip it
after changing a token, a component, or any CSS and the sync ships a stale bundle
while the repo looks correct.

A fresh clone also needs `react` and the converter deps installed first —
`.design-sync/NOTES.md` has the exact commands, and skipping the `@fontsource`
install silently ships a bundle with no brand fonts.

#### Things that will surprise you

- **`.claude/**` and `CLAUDE.md` are refused**, by design — they carry
  instructions to the design agent. That's why prepare.mjs copies the skill
  references into `guides/` before the sync; the skill itself reaches teammates
  through **git only**, which is the correct home for it anyway.
- **Deletions come from the anchor.** The driver diffs `_ds_sync.json` and emits
  the exact `deletePaths` for removed or regrouped components — pass them
  verbatim. With no anchor (a fresh project, or one that's never been synced) the
  diff can't see history and deletions have to be named explicitly.
- **This can't be a cron job.** The push authenticates through your interactive
  claude.ai login, which isn't available in headless or scheduled runs. Treat it
  as a release step, not automation.
- **Grouping depends on `.design-sync/docs/`.** Add a component without adding
  its frontmatter stub and it silently lands in a `general` group.

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

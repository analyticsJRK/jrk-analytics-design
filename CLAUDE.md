# CLAUDE.md — jrk-analytics-design

Design library for JRK analytics dashboards. One token layer, a plain-CSS
component library, and React wrappers over the same class names. Consumed by
`jrk_agents` (Next.js / Tailwind v4) and by `jrk-audit-platform` / `JRK_FORMS`
(Python + Jinja).

**This file loads every turn, so it holds only what you cannot derive from the
code.** Detail lives in the `jrk-design` skill, which loads on demand.

## Before you change anything

```bash
npm test    # build + check:css + validate + typecheck
```

That is the gate. It is fast; run it after every change.

## Where things live — one source per fact

| Fact | Single source | Generated, never edit |
|---|---|---|
| design values (color, space, type, radius) | `tokens/tokens.json` | `dist/jrk-tokens.css`, `dist/tokens.ts`, `dist/jrk-theme.tailwind.css` |
| icon glyph paths | `tokens/icons.json` | `dist/icons.ts`, `dist/icons.js` |
| component behaviour | `css/components/*.css` + `react/src/*.tsx` | — |
| design doctrine and the conflict register | `.claude/skills/jrk-design/references/philosophy.md` | — |
| detailed rules and API reference | `.claude/skills/jrk-design/references/*.md` | — |
| per-component docs and demos for the Design System pane | `.design-sync/{docs,previews}/` | `.design-sync/.cache/` |
| the local zero-build gallery | `preview/*.html` | — |

`dist/` is generated **and committed** — the Jinja apps have no Node toolchain.
`.ds-sync/`, `ds-bundle/`, `guides/` are sync tooling and build output: all
gitignored, none of it authored here, do not read them for reference.

Need more than the rules below? Load the **`jrk-design` skill** rather than
re-reading the CSS.

## The decision order

When a judgement call is not covered by a rule below, work these layers **in
order**, and let each spend only the budget the one above granted it:

**1 scope** (should this exist? default no) → **2 structure** (what pattern is
this an instance of?) → **3 behavior** (how is it operated and recovered?) →
**4 rendering** (how densely and quietly is it drawn?) → **5 epistemics** (can
the reader interrogate it?).

You cannot render your way out of a scope problem. Restraint applies to
decoration, never to signifiers or capability. Full doctrine and the conflict
register: `references/philosophy.md` in the `jrk-design` skill.

## Hard rules

**`tokens/tokens.json` is the only source of truth for design values.** Changing
a color means editing it and running `npm run build`. `check:css` fails on a raw
hex in a component file, so there is no way around it.

**Never hand-pick a color.** `npm run validate` is the arbiter: lightness band,
chroma floor, colorblind separation, normal-vision floor, WCAG contrast — both
themes, real surfaces. If a color fails, re-step it; do not lower the gate. The
full run needs the `dataviz` skill's validator:
`JRK_DATAVIZ=/path/to/skills/dataviz npm run validate`.

**The look is Apple.** macOS/iOS grouped surfaces. Light: `#f2f2f7` page,
**white** cards. Dark: `#141416` page, `#1c1c1e` cards. The page is tinted and
the cards are white — the reverse of a conventional dashboard, and not a bug.
Because the card is the chart surface, marks are validated against
`#ffffff` / `#1c1c1e`, never the page.

**The dark page is not `#000000`, and that is deliberate.** iOS grouped dark is
true black; at 1920x1080 it halates against near-white text and reads as a void.
The page follows macOS instead. Two consequences: the card is only a 1.08:1 fill
step off the page, so **`border.subtle` carries the card edge in dark** — never
drop the hairline there; and `text.primary` in dark is `#ebebf0`, not `#ffffff`,
because pure white on a near-black page is the glare. Both deviations are noted
on their tokens.

**Adopt Apple values only where they pass.** Apple's palette is not
accessibility-clean — `systemGray` is 2.92:1 as body text, `systemIndigo` is
3.36:1 as dark link text. Both are rejected here. Measure before reaching for an
Apple hex; the deviations are noted on each token.

**The chart series palette is never cycled.** Eight slots, fixed order — the
order is the colorblind-safety mechanism, derived by search across both modes
jointly. A ninth series folds into "Other" or facets. `seriesColor(8)` throws on
purpose. Scatter/bubble/choropleth/small-multiples cap at three.

**Color is never the only signal.** Status needs icon + label. Deltas state
direction in text. Charts have a table view.

**Hue only separates ADJACENT slots.** The order was searched to maximise the
worst adjacent pair, which pushes similar hues four apart — so every pair that
collapses under CVD is `(n, n+4)`, and orange/yellow is ΔE 0.8, i.e. the same
color. Each slot therefore also carries a **dash** (`--jrk-chart-dash-N`, lines,
opt-in via `data-encoding="redundant"` because a dash otherwise means
threshold) and a **shape** (`seriesShape(i)`, mandatory on scatter). `validate`
fails if a collapsing pair ever shares both.

**`--jrk-chart-*` and `--jrk-chart-tint-*` are not interchangeable.** The
categorical set carries identity and is CVD-validated. Tints are pastel fills
for marks that are *already* labelled; the validator deliberately skips them, so
using one where color is the identity channel is a bug no gate will catch.

**The typeface is Inter, loaded by `css/fonts.css`.** SF Pro cannot be shipped,
so Inter is the stand-in everywhere — including on Apple hardware, so that the
tracking tokens are right for one face instead of half-right for two.
`css/index.css` imports it from Google Fonts, which means a consuming app needs
`style-src fonts.googleapis.com` + `font-src fonts.gstatic.com` in its CSP and
should add the preconnect pair to its `<head>`. The self-host and `next/font`
escape hatches are both documented in `css/fonts.css`.

**Icons are `em`-sized and inherit text weight.** That is what makes them feel
native rather than bolted on. Status glyphs are filled with the inner mark
punched out, so they work on any badge wash. SF Symbols cannot be shipped — no
webfont, and the outlines are Apple's; use Phosphor (MIT) with
`className="jrk-icon"` beyond the built-in set.

**`accent.onSolid` is not `text.inverse`.** The label on the solid accent stays
white in both modes; `text.inverse` in dark is the dark ink for the light
inverse surface. Do not collapse them.

**Dark values are selected, not flipped.** Every themed token has an explicit
`light` and `dark` entry chosen for that surface.

**Non-touch, 1920x1080.** Controls are 24/28/32 and `minTouch` is 24px — the
WCAG 2.2 AA floor (2.5.8). Height is the real constraint. Never go below 24px.

**`.jrk-sheet` is a grid, not a table.** One shared `--jrk-sheet-cols` track list
is the only way a single Excel-style column bar can align with stacked metric
blocks, so ARIA roles are mandatory. In a sheet, tone comes from the metric's
`inverted` flag, never the sign of the number.

## Layout gotchas that have already bitten

- **`display: block` on bar fills is load-bearing.** They are `<span>`s; an
  inline box ignores width and height, so the bar renders as an empty track.
- **`flex-wrap: wrap` on a COLUMN flex container** goes multi-line, and
  `align-content: stretch` then inflates each line. It tripled a grid's height.
- **Chart SVG viewBoxes must be measured from the container.** A fixed viewBox
  stretched by `width: 100%` scales the text and strokes too.
- **Component CSS sizes bare `svg` with `svg:not(.jrk-icon)`.** A plain
  `.jrk-btn svg` rule out-specifies `.jrk-icon` and kills the `em` contract.

## Verifying visually

The gates do not check layout. After a UI change:

```bash
npm run preview     # http://localhost:4321/preview/index.html
```

Check **both themes** — they are different palettes. Screenshot near the page's
real width (1920x1080 is the target display); a downscaled capture makes correct
2px marks and hairlines look broken. For sticky-heavy layouts, measure element
positions rather than trusting a mid-scroll capture — headless compositing
produces convincing artifacts.

## Adding a component

1. `css/components/<name>.css`, imported from `css/index.css`. Tokens only.
2. `react/src/<Name>.tsx` emitting the same class names, exported from
   `react/src/index.ts`. No Tailwind dependency.
3. `preview/components.html`, so it is visible in both themes.
4. `.design-sync/docs/<Name>.md` + `.design-sync/previews/<Name>.tsx`, so it
   reaches the Design System pane.
5. `npm test`, then look at the gallery.

## Conventions

- Classes are `jrk-block__element--modifier`.
- Custom properties are `--jrk-<category>-<name>`, generated from `tokens.json`
  (camelCase kebab-cased, `.` becomes `_`).
- Components reference semantic tokens (`--jrk-surface-default`), never ramp
  steps (`--jrk-neutral-100`), never raw hex.
- Transitions use `var(--jrk-transition)`; the reduced-motion guard in
  `base.css` zeroes it globally — do not hand-roll durations.

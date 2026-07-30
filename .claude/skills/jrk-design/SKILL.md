---
name: jrk-design
description: >
  JRK analytics design library — design tokens, jrk-* CSS classes, React
  components, the workbook-style sheet grid, and the automated color gate. Use
  when building or restyling any UI in a JRK app (dashboard, data table,
  chart, financial report, form, app shell), or when choosing any color,
  spacing, radius, or chart palette value.
when_to_use: >
  Triggers: "build a dashboard", "add a chart", "style this table", "make a
  report", "pick a color", "what token", "AM report", "restyle", "dark mode",
  anything touching a .tsx/.css file or a Jinja template in a JRK app.
paths: "**/*.tsx,**/*.jsx,**/*.css,**/templates/**/*.html,**/static/**/*.html"
---

# JRK Analytics Design

Tokens, plain-CSS components, and React wrappers over the same class names. One
token layer serves both org stacks: `jrk_agents` (Next.js / Tailwind v4) and
`jrk-audit-platform` / `JRK_FORMS` (Python + Jinja).

Library root: `jrk-analytics-design/`. If it is not in the session, ask before
guessing class names — this skill lists the contract, not every modifier.

## Non-negotiables

**Never write a raw hex, `rgb()`, or a one-off gray.** Every value is a
`--jrk-*` token. `npm run check:css` fails the build on a raw hex in any file
under `css/`. It does **not** scan `.tsx` — an inline `style={{color:'#...'}}`
slips through the gate, so do not write one.

**Design values live in `tokens/tokens.json`.** Changing a color means editing
that file and running `npm run build`. `dist/` is generated output — never
hand-edit it. Every themed token carries an explicit `light` and `dark` value;
dark is *selected* for the dark surface, never computed from light.

**Colors are computed, not chosen.** `npm run validate` gates every color
against a lightness band, a chroma floor, colorblind separation (protanopia +
deuteranopia), a normal-vision floor, and WCAG contrast — in both themes,
against the real surfaces. If a color you add fails, re-step it. Do not lower
the gate, and do not "clean up" the standing warnings (see below).

**Color is never the only signal.**
- Status badges ship an icon *and* a label. `<Badge tone="warning">` renders the
  icon automatically; do not disable it on a status tone.
- Deltas state direction in text for screen readers, and take direction and
  interpretation as **separate** inputs. Falling delinquency is good — never
  assume up means good.
- Every chart has a table view.
- A bare colored dot never appears alone in a cell.

**`--jrk-chart-*` and `--jrk-chart-tint-*` are not interchangeable.** The
categorical set carries series identity and is CVD-validated. The tint set is
pastel fills for marks whose identity is *already* carried by an axis label, a
direct value label, or a number in the legend. Tints sit outside the lightness
band and under the chroma floor on purpose, so **the validator skips them** —
using a tint where color is the identity channel is a bug no gate will catch.

**The series palette is never cycled.** Eight slots, fixed order; the order is
the colorblind-safety mechanism. A ninth series folds into "Other", facets into
small multiples, or takes a second encoding. `seriesColor(8)` throws deliberately.

**No dual-axis charts.** Two y-scales let the author pick the correlation by
picking the scales. Two measures of different magnitude become two charts, small
multiples, or values indexed to a common base.

## The look is Apple

macOS/iOS grouped surfaces, Apple system greys, systemIndigo accent, Inter as
the SF stand-in, macOS-compact density for non-touch 1920x1080.

| | Light | Dark |
|---|---|---|
| page plane | `#f2f2f7` systemGroupedBackground | `#141416` |
| card | `#ffffff` | `#1c1c1e` |
| popover / input | `#ffffff` | `#2c2c2e` |

The page is tinted and the **cards are white** — the reverse of a conventional
dashboard, and the thing that most makes it read as Apple. Cards carry a fill
*and* a hairline: iOS uses fill alone, but at desktop viewing distance a
white-on-`#f2f2f7` edge is too faint to hold a dense layout together.

Two consequences that bite:
- **The card, not the page, is the chart surface.** Marks are validated against
  `#ffffff` / `#1c1c1e`, never against white or black.
- **In dark mode the hairline is the elevation cue, not the fill.** The card is
  only a 1.08:1 fill step off the `#141416` page, so `border.subtle` is what
  makes a tile read as a tile. Never drop the card hairline in dark.

**The dark page is `#141416`, not `#000000`.** iOS grouped dark is true black; on
a 1920x1080 desktop it halates against near-white text and reads as a void, so
the page follows macOS instead. For the same reason `text.primary` in dark is
`#ebebf0` (14.3:1 on the card), not `#ffffff` (15.9:1) — the excess contrast
showed up as glare on large semibold figures, not as legibility. Both deviations
are noted on their tokens; do not "restore" them.

**Type is Inter, delivered by `css/fonts.css`.** SF Pro cannot be shipped, so
Inter is the stand-in on every platform — the tracking tokens are tuned for one
face rather than half-tuned for two. `css/index.css` imports it from Google
Fonts, so a strict-CSP app needs `style-src fonts.googleapis.com` and
`font-src fonts.gstatic.com`; self-host and `next/font` alternatives are
documented in the file. `font.feature.sans` turns on Inter's tailed lowercase
`l` so `l` / `I` / `1` are distinguishable in property codes.

**Adopt Apple values only where they pass.** Apple's palette is not
accessibility-clean: `systemGray` is 2.92:1 as body text and `systemIndigo` is
3.36:1 as dark link text — both rejected here. Measure before reaching for an
Apple hex; deviations are noted on each token.

**Icons are `em`-sized and inherit text weight**, with filled status glyphs whose
inner mark is punched out so they work on any badge wash. SF Symbols cannot be
shipped (no webfont, outlines are Apple's) — use Phosphor (MIT) with
`className="jrk-icon"` beyond the built-in set.

**Non-touch density.** Controls are 24/28/32 and `minTouch` is 24px, the WCAG 2.2
AA floor (2.5.8). Height is the real constraint on a 1080px display.

## Before you finish

```bash
npm test        # build -> check:css -> validate -> typecheck
npm run preview # then LOOK at it, in BOTH themes
```

`npm test` checks color and structure and **never checks layout**. Every layout
bug in this library's history was invisible to it and obvious in a screenshot:

```bash
chrome --headless --disable-gpu --virtual-time-budget=4000 \
  --window-size=1200,1500 --screenshot=out.png \
  http://localhost:4321/preview/dashboard.html
```

Capture near the page's real width. A downscaled screenshot makes correct 2px
marks and 1px hairlines look broken and sends you chasing bugs that aren't there.
For sticky-heavy layouts (the sheet), **measure element positions** rather than
trusting a mid-scroll capture — headless compositing produces convincing
artifacts there.

## The standing warnings are correct

`npm run validate` exits 0 with five warnings. They are documented relief cases,
not bugs:
- Four light-mode series hues sit below 3:1 on the white card — Apple's system
  colours are bright and white is the least forgiving surface. Legal because
  those charts ship visible value labels or a table view.
- `status.good`, `warning` and `serious` marks sit below 3:1 on light by design;
  the mandatory icon + label pairing is the mitigation.

Do not re-step a correct color to make the output look clean.

## References

Load only what the task needs.

| File | Covers |
|---|---|
| `references/philosophy.md` | **The doctrine behind the other four.** The five-layer decision order (scope → structure → behavior → rendering → epistemics), and the settled answer wherever two principles disagree. Read this when a judgement call is not covered by a rule below, or when someone proposes relaxing one |
| `references/tokens.md` | Every token namespace and when to use each |
| `references/components.md` | Class names, React props, markup contracts |
| `references/charts.md` | Form choice, the two color sets, mark specs, interaction |
| `references/sheet.md` | The workbook-style report grid (AM Report shape) |

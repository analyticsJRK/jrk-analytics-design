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
  anything touching a .tsx or .css file in a JRK app.
paths: "**/*.tsx,**/*.jsx,**/*.css,**/templates/**/*.html,**/static/**/*.html"
---

# JRK Analytics Design

Tokens, plain-CSS components, and React wrappers over the same class names.

**One consumer: `jrk-analytics-web-app/apps/portal`** (Next.js 15 / React 19 /
Tailwind v4), which VENDORS this library — a change here is not live there until
someone re-runs `npm run sync:design`. `jrk_agents`, `jrk-audit-platform` and
`JRK_FORMS` are not consumers; a rule justified by "the Jinja apps" is justified
by nothing. The plain-CSS layer is still the primary interface, because the
portal imports the component files directly and uses the React wrappers on top.

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

## Apple grouped surfaces, a stepped-blue brand

Apple system greys, Inter as the SF stand-in, macOS-compact density for non-touch
1920x1080, and Apple's grouped surface hierarchy in **both** themes. The accent is
not Apple's — it is a blue at hue 212° anchored on `#0069d9`, one step deeper than
`systemBlue`, which fails both as a button label (4.02:1) and as link text.

| | Light | Dark |
|---|---|---|
| page plane | `#f5f5f7` | `#141416` |
| card / chrome | `#ffffff` | `#232326` |
| popover / input | `#ffffff` | `#2c2c2e` |

The GEOMETRY on top of that is not Apple's and stopped pretending to be on
2026-08-13: pill controls, 6/10/14/18/24 radii, tall chrome, and a resting shadow
on every card. **The colour layer did not move with it** — nothing measured
changed, and notes across the repo that argue for tight radii or a flat page from
an "Apple does it this way" premise are marked stale in their premise only.

**The light page is TINTED and a tile is bounded three ways** — a fill step, a
hairline, and `shadow.card`. `.jrk-card` draws `border.subtle` in both themes:
1.26:1 in light, 1.24:1 in dark on top of the 1.17:1 fill step. One mechanism
across themes with per-theme values — deliberately not hairline-in-light /
fill-in-dark, because two mechanisms is what lets a change read correctly in one
theme and vanish in the other.

**`canvas.light` and that edge are a PAIR.** Flat page → the card needs its own
edge; tinted page → the fill step *may* be the edge and the border *may* go
transparent. That permission is declined here: the current tint is shallow
(1.06:1 to the white card) so the step alone would bound *less* than the hairline
did. **The safe direction through this transition is the one that leaves a tile
more bounded, never less** — the library has shipped the broken combination once,
when the 2px `#48a9df` brand edge that justified the flat page was removed and the
page was not un-flattened with it, leaving light cards at a 1.000:1 step behind a
transparent border. `border.card` and `size.cardEdge` no longer exist.

**The page is `#f5f5f7`, not the `#f2f2f7` the palette would suggest, because
`surface.subtle` cannot move.** `text.muted` is 4.59:1 on `#f2f2f7` and 4.23:1 on
the next step down, so subtle is pinned from below and other surfaces are chosen
around it.

Three follow-on rules:
- **Tiles keep a 1px border, never `border: 0`.** `.jrk-card` colours it
  `border.subtle`; the other tiles reserve the width with `transparent`. The width
  is reserved so an edge changing is only ever a colour and never reflows. `border:
  0` sets `border-style: none`, after which `border-color` paints nothing.
- **A nested tile takes a 1px neutral hairline**, because a fill step only works
  once — a tile inside a tile sits on the card plane, where its own fill matches
  what it sits on. `nesting.css` is the single home for that rule; it used to
  *suppress* a brand edge and now *supplies* a hairline, with the same selectors.
- **`.jrk-sheet` is the exception** and draws `border.default` by default: it is
  built to sit on `.jrk-content--document`, which *is* the card plane.

In light, `surface.subtle` (`#f2f2f7`) is a 1.12:1 recess off the **card** — table
headers and inset wells read as set in. It is only 1.02:1 off the page, so it is
**not usable as a wash laid directly on the page plane**; reach for `surface.track`
there, or put the thing in a card. `surface.hover` is the same value. Interactive
cards still use `surface.cardHover`, because that is the token that means "hover on
a card" and the shadow is the better lift in light.

**Elevation is a ladder: rest (`shadow.card`) → hover (`shadow.lg`) → popover.**
Protect the gap between the steps; collapse it and a card stops responding to the
pointer. `shadow.card` is `none` in dark, where a black shadow renders nothing.

Two consequences that bite:
- **The card, not the page, is the chart surface.** Marks are validated against
  `#ffffff` / `#232326`. Lifting the dark card cost every dark mark ~8% (worst
  case 4.30:1, all still passing) — that headroom is nearly spent.
- **An interactive card's hover needs a shadow AND a fill.** The shadow carries
  light and is invisible in dark; `surface.cardHover` lifts 1.125:1 in dark and is
  a deliberate no-op in light. Which declaration does nothing depends on the theme,
  so neither can be dropped as redundant.

`.jrk-card--seamless` and `.jrk-content--document` both work in light again — they
were a no-op and a boundary-less card respectively during the flat-white period.

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

**The accent anchor is used in every accent role.** `#0069d9` measures 5.22:1 on
the white card and 4.79:1 on the `#f5f5f7` page, so `accent.text`, `text.link`,
`border.accent` and `focus.ring` are all the anchor itself, and `accent.onSolid`
is plain `#ffffff` (5.22:1). The **page** is the binding surface and it is what
pins the anchor — a blue tuned only to the card can sit a step lighter and fail
there. Only `accent.washText` steps away (`#005ec4`), because the anchor lands at
4.49:1 on the light wash, under the floor by 0.01. Dark text roles are *selected*,
not derived: `#64b5ff`, since the anchor is 3.00:1 on the dark card.

The previous accent was a `#9ee4ff` pastel at 1.40:1 on the card, which could not
be text or a signifier on any light surface — so each of those roles carried a
bespoke step and `accent.onSolid` was dark ink. If you find prose asserting that,
it is stale. The durable rule is that `accent.onSolid` is **whatever measures
against `accent.solid`**, and that it is never a generic "label on a filled
control" — `status.critical.solid` / `.onSolid` exist because
`.jrk-btn--danger-solid` used to borrow it.

**Icons are `em`-sized and inherit text weight**, with filled status glyphs whose
inner mark is punched out so they work on any badge wash. SF Symbols cannot be
shipped (no webfont, outlines are Apple's) — use Phosphor (MIT) with
`className="jrk-icon"` beyond the built-in set.

**Non-touch density.** Controls are 24/32/40 — md and lg stepped up on 2026-08-13
for the airier look, with `.jrk-nav-item` **pinned** to `control-md` so the rail
held its 32px row rather than following lg to a height it had already rejected,
and `size.sheet.*` untouched so a dense report stays dense. `minTouch` is 24px, the WCAG 2.2
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

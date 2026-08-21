# CLAUDE.md — jrk-analytics-design

Design library for JRK analytics dashboards. One token layer, a plain-CSS
component library, and React wrappers over the same class names.

## Output style
- Bullet points, not prose. No paragraphs over 2 sentences.
- No preamble, no summary of what you just did, no "Great question".
- Explain only when asked; otherwise show the code/command.
- Snowflake for SQL, Python for modeling/API, TypeScript for UI.

**There is exactly one consumer: `jrk-analytics-web-app`** — specifically
`apps/portal`, Next.js 15 / React 19 / Tailwind v4. It **vendors** this library:
`scripts/sync-design.mjs` there copies `package.json`, `LICENSE`, `dist`, `css`,
`react/src`, `tokens` into `vendor/jrk-analytics-design`, wiping the directory
first. So a change here is not live in the app until someone re-runs
`npm run sync:design`, and anything edited in that vendored copy is destroyed on
the next sync. Commit here before syncing — the script records the source SHA and
warns when the tree is dirty.

**NEVER vendor from a stale branch, and `git fetch` before you believe anything
about what this repo contains.** On 2026-08-10 a session on a feature branch that
was **9 commits behind `main`** ran `npm run sync:design`. The sync wiped
`react/src/Org.tsx` + `css/components/org.css` from the portal — the
`OrgChart` / `OrgNode` pair that `apps/portal/components/portfolio/OrgChart.tsx`
imports from `@jrk/design` and the org-chart page renders — because the branch
genuinely did not have them. They were merged to `main` in PR #9 while that branch
sat unfetched.

Two failures, and the second is the one that turned a small mistake into a wrong
conclusion recorded in this file:

1. **The vendor script is a mirror, so a stale source silently deletes.** The
   directory is wiped and re-copied; anything `main` has and your branch lacks is
   gone from the app. `.synced-from` records the SHA — read it, and check the
   portal's `git status` for **deletions** under `vendor/` after every sync.
2. **`git ls-tree origin/<branch>` against a ref you never fetched reports
   "absent", not "unknown".** That is how this file briefly claimed `Org.tsx` was
   "on no branch of this repo" and had been hand-edited into the vendored copy.
   It is on `main` and on `design/sso-login`, with docs stubs and authored
   previews. **Fetch first; a missing local ref is not evidence.**

Both were repaired the same day by re-vendoring from `main`, which left the
portal's `vendor/` byte-identical to its committed state apart from the
`.synced-from` SHA.

**A third source of `vendor/` deletions has nothing to do with branches, and
`git fetch` cannot catch it: an UNTRACKED artifact inside a directory the mirror
copies wholesale.** `dist/` is committed here, but `dist/types/` is gitignored —
it is design-sync's API-contract declarations from
`tsc -p .ds-sync/tsconfig.dts.json`, and `.gitignore` says outright it is "not
part of the library's committed dist/". The sync script copied the whole `dist`,
so the portal's `vendor/` carried whatever that scratch happened to hold in the
syncing developer's checkout. **Two people at the same SHA produced different
vendor trees**, and a sync from a copy predating `Menu` and `Spotlight` deleted
their `.d.ts` files from the portal on 2026-08-13. Nothing broke — the portal
resolves `@jrk/design` to `react/src/index.ts` and never referenced `dist/types`
— but the `D` lines were indistinguishable from the real failure above, and a
check that cries wolf stops being run. Fixed in the portal's `sync-design.mjs`
with a `SKIP` set and a `cpSync` filter, and `dist/types/` is gone from
`vendor/`. The durable rule: **the mirror copies directories, not git — anything
gitignored that lives inside `dist/`, `css/`, `react/src/` or `tokens/` ships to
the app as local scratch.** If you add generated output under those paths, either
commit it or add it to that `SKIP` set.

**`jrk_agents`, `jrk-audit-platform` and `JRK_FORMS` are NOT consumers**, and the
list that used to say so cost real design decisions. `jrk_agents` hand-rolls its
CSS and never wired the library at all; the two Jinja apps are out by decision.
Nothing here needs to run without a Node toolchain, work behind a `<link>` tag,
or avoid a React portal. If you find a constraint justified by "the Jinja apps",
it is justified by nothing — but check what else leans on it before removing it,
because some of those choices are still right for other reasons.

**This file loads every turn, so it holds only what you cannot derive from the
code.** Detail lives in the `jrk-design` skill, which loads on demand.

## Before you change anything

```bash
npm test    # build + check:css + validate + validate:skin + typecheck
```

That is the gate. It is fast; run it after every change.

## Where things live — one source per fact

| Fact | Single source | Generated, never edit |
|---|---|---|
| design values (color, space, type, radius) | `tokens/tokens.json` | `dist/jrk-tokens.css`, `dist/tokens.ts`, `dist/jrk-theme.tailwind.css` |
| a skin's colours, shadows and hazard hues | `tokens/skins/<stamp>.json` | `dist/jrk-skin-<stamp>.css` |
| a skin's geometry and type | `css/skins/<stamp>.css` (no colour, ever) | — |
| icon glyph paths | `tokens/icons.json` | `dist/icons.ts`, `dist/icons.js` |
| component behaviour | `css/components/*.css` + `react/src/*.tsx` | — |
| design doctrine and the conflict register | `.claude/skills/jrk-design/references/philosophy.md` | — |
| detailed rules and API reference | `.claude/skills/jrk-design/references/*.md` | — |
| per-component docs and demos for the Design System pane | `.design-sync/{docs,previews}/` | `.design-sync/.cache/` |
| the local zero-build gallery | `preview/*.html` | — |

`dist/` is generated **and committed**. The reason changed but the requirement did
not: it used to be that the Jinja apps had no Node toolchain; now it is that the
web app vendors `dist/` as a build input and never runs this library's build. A
stale committed `dist/` ships stale tokens to production.
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

**`validate` only sees NAMED colour tokens, so a colour hidden inside a string is
unreachable to it.** `shadow.focus.light` carried `rgba(3, 0, 192, …)` — the
systemIndigo accent from two accents ago — for that entire time, so every focus
ring in the product bloomed a violet that appears nowhere else in the file around a
`#0069d9` core, and the dark half was still the dead `#9ee4ff` pastel. Both are now
the theme's own `focus.ring`. The same blind spot covers the `border` and `overlay`
namespaces, whose figures are hand-recorded on their tokens. **If you put a colour
in a shadow, a gradient or a `data:` URL, nothing will check it — measure by hand
and write the number down.**

**AND THE LIBRARY NOW HAS ONE GRADIENT WHOSE SAFETY IS A LAYOUT FACT RATHER THAN A
COLOUR ONE.** The `.jrk-topbar--brand` light ramp was reversed on 2026-08-20 to
`#d5dfff → #245ec6 → #ffffff` under ink `#1d273d`. **Its middle stop measures
2.48:1 and it ships that way deliberately.** Both ENDS pass (11.23:1 leading,
14.90:1 trailing) and the ink fails from roughly 34% to 66% of the bar width —
note this is the *opposite* of the convexity argument the four positional tones
rely on, where the endpoints bound the interior; here the endpoints pass and the
interior fails, because this ink sits between the two ends in luminance rather
than below both. **On a ramp like that, checking the stops is not enough — the
spans between them have to be checked too.** What makes it shippable is that
`.jrk-topbar--brand` keeps the leading fifth and the trailing fifth inked and
holds the middle empty with `.jrk-spacer`. **So a change to the topbar's layout is
a change to its contrast**, which is true of nothing else in this file. The
guarantee is thin: the right-hand cluster is about 400px, so below roughly 1200px
of bar width it slides into the failing band. Put NOTHING ELSE on that bar in
plain ink — the segmented control and the ghost buttons there are given a bounded
ground of their own for this reason — and if the middle ever has to carry text,
re-step `via` toward `#4d94ff` (4.83:1 under this ink) rather than re-inking.

**THE LOOK IS A SOFT WEB UI ON AN APPLE COLOUR FOUNDATION** (since 2026-08-13).
White cards on a `#fbfbfb` page, pill controls, tall chrome.
**Geometry, elevation and the page plane changed; not one measured colour
did.** Several notes in this repo still argue for tight radii, a flat page and
no-resting-shadow using "Apple does it this way" as the premise — those are marked
where they stand, and the premise is what expired, not the measurement. **Anything
justified by a contrast ratio, a CVD ΔE or a WCAG floor is untouched and is not up
for restyling.**

**SQUARE TILES, ROUNDED OVERLAYS — and that split is the rule, not a list of
exceptions.** Directed 2026-08-14: `.jrk-card`, `.jrk-stat`, both `.jrk-stat-row`
forms, `.jrk-chart-card`, `.jrk-table-wrap`, `.jrk-sheet` and (by composition)
`.jrk-expander` are all `radius.none`. Anything that floats ABOVE the page keeps
its radius — `.jrk-modal`, `.jrk-menu`, `.jrk-hovercard`, `.jrk-tooltip`,
`.jrk-nav-flyout`, `.jrk-spotlight` — as do controls, badges, tags and the
interior chrome inside a tile. This supersedes "generous radii" in the paragraph
above for tiles only; the ladder is a CONTROL ladder now. Two consequences worth
carrying: `radius.xl` is referenced by exactly one component and is not dead, and
the enclosure is carried entirely by the hairline, the shadow and — in dark only —
the fill step, which is why none of those may be dropped on the grounds that a
tile "looks bounded enough". In light there are just the two.

**The light page is a `#fbfbfb` WHISPER, so in light the card is still bounded by
the hairline and the shadow — treat the fill step as decoration.** `.jrk-card`
draws `border.subtle` (1.21:1 light, 1.24:1 dark) and rests on `shadow.card`. In
light the card-on-page step is **1.035:1**, which is real but far below the
1.09:1 of the `#f5f5f7` era and the 1.12:1 of `#f2f2f7` — it cannot bound a tile
on its own, so a new top-level surface must still bring its own edge. Dark is
unchanged: `#232326` on `#141416`
(1.17:1) plus the same hairline, and `shadow.card` is `none` there because a black
shadow on `#141416` renders nothing. **One mechanism, both themes, per-theme
values** — a light-hairline/dark-fill split is the shape the conflict register
calls the most expensive thing in the file to forget.

**The standing cost survives the tint, and it is the thing to carry: a new
top-level tile must bring its own edge.** Every plane is self-bounding —
`.jrk-card`, `.jrk-topbar` and `.jrk-sidebar` all carry `border.subtle`, and the
first two carry `shadow.card` as well — which is what made the page safe to move
in either direction. A 1.035:1 step is not a boundary you can build on.

**`surface.canvas.light` and the card's edge are a PAIR. Never move one alone.**
This has been got wrong once, expensively: the flat page originally shipped with a
2px brand edge doing the bounding, the edge was later removed, the page was not
un-flattened with it, and light cards sat at a 1.00:1 step behind a transparent
border — no boundary at all — and shipped that way. So: **page flat → the card
needs its own edge; page tinted → the fill step *may* be the edge and the border
*may* go transparent.** Note the direction of that permission — the safe move
through this transition is the one that leaves a tile MORE bounded, never less,
which is why the `#f5f5f7` period kept every edge it had, why flattening back out
of it was safe, and why the `#fbfbfb` move on 2026-08-16 is the clean worked
example: it ADDS a step (1.000:1 → 1.035:1) and keeps every edge, so tiles came
out more bounded, not less. **Read the rule, not the value:** the page went
`#ffffff` → `#f5f5f7` → `#ffffff` inside 2026-08-13 alone, then to `#fbfbfb`
three days later. The tint grants permission to drop the hairline; that
permission is **declined**, because 1.035:1 is a whisper and the broken state
above was a 1.00:1 step behind a *transparent* border. The border being real is
the whole difference.

**If the page is ever tinted again it must not land on `#f2f2f7`:** that value is
`surface.subtle`, and **`surface.subtle.light` cannot move.** `text.muted` is
4.59:1 on it and 4.23:1 on the next step down, so the first deepening puts a table
header's own label under the floor. It is a fixed point that other surfaces are
chosen around, and a `#f2f2f7` page would force subtle to equal the page — a state
this library has shipped and regretted. `#f5f5f7` is the value that was solved for
last time, and `#fbfbfb` clears the constraint from the other side by staying
*lighter* than subtle. Subtle is currently a **1.08:1** recess off the page and
1.12:1 off the card — the page figure is not durable, and every step the page
takes toward subtle eats it: through the `#f5f5f7` period it was 1.02:1, i.e.
invisible there, while still working correctly inside a card. Want a recess that
survives a re-tint? `surface.track`, or put the thing in a card.

**Elevation is a LADDER now, not a switch: rest → hover → popover.** Every card
rests on `shadow.card`; both `--interactive:hover` and `--raised` step up to
`shadow.cardRaise`, a dedicated pair of card-only tokens rather than a rung of the
generic `sm/md/lg/xl` ladder (which still serves popovers — `.jrk-menu` is
`shadow.lg`). In dark `shadow.card` is `none` and `cardRaise` is a single soft
black, so the ladder collapses to one step there and `surface.cardHover` carries
the hover instead. This
reverses the old "elevation is opt-in at rest, a dashboard of tiles reads calmer
flat" rule. **What must be protected is the GAP** — point rest and hover at the
same token, or grow one without the other, and a card stops responding to the
pointer. `--seamless` and `--flush` drop the shadow with the border, or they stop
meaning what they say.

**Controls are pills (`radius.full`) and fields are not.** A text field is a
container for left-aligned text and a fully-rounded one curls in on the first
glyph. `.jrk-input--pill` is the opt-in for a short search box.

Because the card is the chart surface, marks are validated against `#ffffff` /
`#232326`.

**`.jrk-card` and friends carry a 1px border and that must never become
`border: 0`.** The base colour is now `border.subtle` rather than transparent, but
the rule is unchanged and is about the WIDTH: everything that gives a tile a
different edge — `--outlined` (heavier), `--seamless` / `--flush` (none), and the
nesting rules — only ever changes a COLOR, so an edge appearing or disappearing
never reflows the layout by a pixel. `border: 0` also sets `border-style: none`,
after which a `border-color` on its own paints nothing at all. That is the quiet
way this breaks.

**A NESTED tile gets a 1px neutral hairline, because a fill step only works
once.** A tile inside another tile sits on the card plane, where its own
`surface.default` equals what it sits on. `nesting.css` is the single home for
that rule. It used to enforce the opposite — suppressing a brand edge on nested
tiles — and the selectors did not change, only their reason.

**`.jrk-sheet` is the one tile with a real hairline by default.** It is designed
to sit on `.jrk-content--document`, which IS the card plane, so it has no fill
step to inherit and draws `border.default` itself.

**`surface.subtle` is a recess off the CARD** (`#f2f2f7`, 1.12:1) and is
effectively invisible on the page — see the pinning note above. It still does not
replace `surface.track`, which is recessed in both themes where this one is a
recess in light and a lift in dark (`#2c2c2e` is lighter than the `#232326` card).
`surface.hover` is the same value; interactive cards still use
`surface.cardHover`, because that is the token that means "hover on a card" and the
shadow is the better lift signal in light.

**A token that names a plane goes wrong when it becomes EQUAL to the plane it sits
on, and nothing gates that** — the validator measures text and marks, never a fill
against the fill beneath it. Three instances are on record: `surface.raisedHover`
equalling `surface.raised` in dark (menus had no hover at all), `surface.disabled`
equalling the card twice after the card moved, and `.jrk-input--filled` filling
`surface.default` on a topbar that had just moved onto `surface.default` — fixed to
`surface.subtle` in the same commit. **When you move a plane, grep for what fills
against it.**

**The dark page is not `#000000`, and that is deliberate.** iOS grouped dark is
true black; at 1920x1080 it halates against near-white text and reads as a void.
The page follows macOS instead. When the brand edge was removed this value was
deliberately left alone and the CARD was lifted (`#1c1c1e` → `#232326`) to widen
the step, so the halation decision stayed settled. Same reason `text.primary` in
dark is `#ebebf0`, not `#ffffff`. Both noted on their tokens. Lifting the card
cost every dark chart mark ~8% contrast — worst case 4.30:1, all still passing.
**When you move a surface, move what MEASURES it in the same commit.**
`$meta.surfaces` and `chart.chrome.surface` both stayed at the old `#1c1c1e`, so
`validate` spent that period reporting dark against a card that no longer
existed, and the second one is stroked as the ring around a dot — a gap that was
painting a dark outline. `validate` now gates both against `surface.default`.

**An interactive card's hover needs BOTH a shadow and a fill, because each works
in only one theme.** The shadow carries light and is invisible in dark (a black
shadow on `#141416`); `surface.cardHover` lifts 1.125:1 in dark and is a deliberate
no-op in light. Neither is redundant — which one does nothing depends on the theme.

**Adopt Apple values only where they pass.** Apple's palette is not
accessibility-clean — `systemGray` is 2.92:1 as body text, `systemIndigo` is
3.36:1 as dark link text, and `systemBlue` gives a white button label only
4.02:1. All three are rejected here. Measure before reaching for an Apple hex;
the deviations are noted on each token.

**The chart series palette is never cycled.** Eight slots, fixed order — the
order is the colorblind-safety mechanism, derived by search across both modes
jointly. A ninth series folds into "Other" or facets. `seriesColor(8)` throws on
purpose. Scatter/bubble/choropleth/small-multiples cap at three. **Known debt,
now accepted at its worst:** the derivation holds systemIndigo out "as the UI
accent", which has been stale since the accent left indigo. The accent is now
blue at hue 212° and slot 1 is systemBlue at 211° — the same hue, and slot 1 is
the default single-series color for every bar list, cell bar and sparkline. The
palette has NOT been re-derived; only lightness separates them (white on the
accent is 5.22:1, on slot 1 it is 4.02:1). So: never put a chart on an accent
wash, and never let a lone blue series sit beside a `.jrk-btn--cta` in the same
tile without a label between them. **The tinted `--primary` inherits a second,
milder version of the same collision**: its fill family (`accent.wash` /
`washHover` / `washActive`) lands on top of `--jrk-chart-tint-1` — `#cfe1fd`
against `#c7deff` in light, `#143a5e` against `#113a5e` in dark, i.e. the same
color. Accepted, because the two are never the identity channel for the same
thing and the button carries a label. It used to carry a hairline as well and
no longer does (see the borderless-pill rule below), so the label is now the
whole of the difference — which makes the rule it produces stricter, not looser:
a tinted button does not sit inside a chart tile among tint-filled marks.

**Color is never the only signal.** Status needs icon + label. Deltas state
direction in text. Charts have a table view.

**Hue only separates ADJACENT slots.** The order was searched to maximise the
worst adjacent pair, which pushes similar hues apart — so **every pair that
collapses under CVD is SAME-PARITY**, `(n, n+2)`, `(n, n+4)` or `(n, n+6)`, and
every odd distance is clear (worst adjacent ΔE 16.5, floor 10). Orange/yellow is
ΔE 0.8, i.e. the same color, and it sits at `(2, 4)`. `{orange, yellow, pink,
brown}` collapse PAIRWISE — all six pairs. This used to be written as "every
collapsing pair is `(n, n+4)`", which `validate` has always disproved in its own
output; the parity form is the measured one, and anything walking the slots in
order (org-chart rollup groups) takes its adjacent-pair safety from it. Each slot
therefore also carries a **dash** (`--jrk-chart-dash-N`, lines, opt-in via
`data-encoding="redundant"` because a dash otherwise means threshold) and a
**shape** (`seriesShape(i)`, mandatory on scatter). `validate` fails if a
collapsing pair ever shares both.

**`--jrk-chart-*` and `--jrk-chart-tint-*` are not interchangeable.** The
categorical set carries identity and is CVD-validated. Tints are pastel fills
for marks that are *already* labelled; the validator deliberately skips them, so
using one where color is the identity channel is a bug no gate will catch.
**Now measured, because a skipped set invites the assumption that it is merely
weaker rather than unsafe:** at validate's own dE 10 floor the tints' worst
ADJACENT pair is **4.5 light / 8.6 dark** against the marks' 22.3 / 16.5, and the
all-pairs safe cap is **2 slots** against 3. Adjacency does hold for the first
four slots (14.5 / 17.1) and breaks at the 4|5 pair, which is the only reason
`.jrk-org--group-fill` can exist at all — and re-ordering cannot fix it, the best
of all 40,320 permutations being dE 8.8 in light. A tint fill is legal on a
labelled object up to about four; past that it is decoration.
**The other half of why a tint is the only fill that can sit under text:** on the
saturated marks no ink but BLACK clears 4.5:1, in both themes, and `focus.ring`
measures **1.26:1** on slot 5 in light — so a solid-mark surface costs the
library's one focus ring. On the tints that ring clears everywhere (3.81:1 worst
light, 5.26:1 dark), `text.primary` and `text.secondary` clear, and `text.muted`
FAILS on all eight (3.70–4.10 light) — so anything muted must step up when it
lands on a tint.

**THE VIVID TILE TONES ARE TWO DIFFERENT KINDS OF THING, and the rules are nearly
opposite.** `gradient.{rose,violet,blue,teal}` are POSITIONAL — assign by slot,
never by meaning, because half the positional pairs collapse under CVD and colour
cannot carry identity. `gradient.{critical,warning,good}`, added 2026-08-20, are
SEMANTIC: the hue is supposed to mean what the label says, and a tone that does
*not* match the severity in the label is the bug. **They are not tones five, six
and seven.** Four rules, and the second and third are the ones that get forgotten:
**(1) ONE TONE PER ROW**, chosen by the row's worst severity — never mix the three,
and never mix them with a positional tone. That is what answers the CVD objection
rather than pretending it was passed: telling red from burnt orange under
deuteranopia is exactly what this palette cannot do, and a uniform row removes the
task instead of failing it. **(2) The severity must ALSO be in the label or the
value** — the tone is redundant encoding, same standing as `chart.tint`. **(3) A
row with nothing wrong in it takes NO vivid tone at all, not the good one.**
Green-for-fine on every dashboard is a heat blanket: if every row is lit, none of
them leads; `good` is for a row whose SUBJECT is an improvement, not the resting
state of a healthy row. **(4) Two of the three values will look wrong and are
not.** `warning.from` is `#b45400`, a burnt orange close to brown, because
`status.warning.mark` `#ff9500` gives white 2.20:1 and cannot be a vivid stop at
all; `good.from` is `#00813a`, a deep forest green, not `status.good.mark`
`#34c759` at 2.22:1. Both are their hue held down to where white ink survives. A
brighter orange means giving up white text, which means giving up `gradient.ink`,
which means it is not this component. `critical.from` is `status.critical.solid`
verbatim, so a critical row and a `.jrk-btn--danger` are the same red on purpose.

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

**The accent is a saturated blue, and every role takes the anchor.** `#0069d9`
(hue 212°) is the brand anchor and it measures everywhere it is used: 5.22:1 on
the white card, 5.04:1 on the `#fbfbfb` page, white label at 5.22:1. So
`accent.text`, `text.link`, `border.accent` and `focus.ring` are all the anchor
itself. That is the *point* of this value — the previous accent was a pastel
that could not be text or a signifier on a light surface, and each of those four
roles needed its own bespoke step. **The PAGE is still the binding surface**, and
it is what pins the anchor: a lighter blue that looks fine on the white card
fails there.

**It is not `systemBlue`.** `#007aff` gives a white label 4.02:1 and link text
3.88:1 on the page. `#0069d9` is the shallowest step on the hue that clears
4.5:1 in every light-mode role. Do not "correct" it back to the Apple hex.

**`accent.onSolid` is `#ffffff` in both modes, and is still not `text.inverse`.**
The rule is not "white" and not "dark ink" — this token has been white, then
`#052f3b` for the pastel era, then white again. It is **whatever measures against
`accent.solid`**, so re-measure it whenever the anchor moves. It stays distinct
from `text.inverse`, which is `#ffffff` light / `#000000` dark for the inverse
surface: the two now agree in light and disagree in dark. Do not collapse them,
and **do not borrow `accent.onSolid` as a generic "label on a filled control"** —
`.jrk-btn--danger-solid` did, so a red button's ink direction moved every time
the accent did. That is what `status.critical.solid` / `.onSolid` are for.

**The accent has two button volumes, and which one is the DEFAULT is the whole
decision.** `.jrk-btn--primary` is **tinted** — `accent.wash` fill,
`accent.washText` label, no border — and it is the everyday button. `.jrk-btn--cta` is the solid anchor with a white label, and there is **at
most one per view**, for the action that commits. `--primary` used to *be* the
solid one; the reason it moved is that a screen here shows a page-header action, an
export, a filter and a segmented control at once, and four saturated blue
rectangles tell the reader nothing about which one commits. Three details are
load-bearing, all of them recorded on the tokens: the label is `washText`, not
`accent.text` (the anchor is 4.49:1 on the wash — under by 0.01); the wash cannot
bound the control (1.16:1 on the white card, 1.06:1 on the dark one), so **this
button has no boundary at all in dark** and `shadow.sm` is the only one it has in
light; and `accent.washBorder` is kept far below `border.accent`, which means
*selected* on a segment or tab — if those two ever converge, a button and a chosen
control look alike.

**EVERY WASH-FILLED PILL IS BORDERLESS, directed 2026-08-19, and the four move
together.** `.jrk-btn--primary`, the `.jrk-btn-group` thumb, the selected
`.jrk-tabs--pills` tab and `.jrk-expander__tag` all dropped `accent.washBorder`;
`.jrk-nav-item[aria-current]` and `.jrk-sidebar__action[aria-current]` never had
one. The 1px stays reserved as `transparent` on all of them — **never `border: 0`**,
which also kills `border-style` and makes a later `border-color` paint nothing —
so an edge coming back reflows nothing. What this *costs* is written on each rule
and summarised in the two paragraphs below; read them before adding a fifth wash
pill, because the fill is 1.06:1 on the dark card and there is nothing behind it.
`accent.washBorder` has ONE consumer left, and it is not a pill:
`.jrk-org__card[aria-current]`, in two rules (the resting card and
`--link[aria-current]:hover`). **`.jrk-input--search` / `[type='search']` lost it
on 2026-08-20** — it was the last wash-filled *control* still drawing an edge, and
a single holdout reads as an oversight rather than as an exception. So the rule is
now simply: **no control draws a wash edge; one tile does.** If the org card ever
loses it too, delete the token rather than leave a colour nothing draws — and note
that three files still *mention* it in comments (`button.css`, `form.css`,
`shell.css`) as the one-line way to put an edge back, so grep for the
`border-color:` declaration rather than the token name.

**NO BUTTON DRAWS A BORDER ANY MORE. The white ones went on 2026-08-20 and they
state "raised" with `shadow.md` instead.** `.jrk-btn--secondary` and
`.jrk-btn--danger` dropped `border.default` and stepped up from `shadow.sm` to
`shadow.md` — the `--cta` / segmented-thumb rung, the one the shadow namespace
says has to read as LIFT. **The step up is not decoration, it is the whole
boundary:** `surface.raised.light` is `#ffffff`, i.e. `surface.default` verbatim,
so a white button on a card has a **1.00:1** fill step and on the page a 1.035:1
one, and `shadow.sm` was tuned to sit *under* a hairline. **The themes split the
useful way round for once** — light has no fill step and a working shadow, dark
has a real **1.125:1** step off the card and a shadow that renders nothing. One
mechanism each, neither redundant, the `.jrk-card--interactive:hover` shape again.
**That is also why the white pill survives un-bordering where `--primary` did
not:** the wash is 1.06:1 on the dark card with nothing behind it, so that
variant genuinely has no dark boundary and this one does. Two consequences:
`shadow.sm` is now referenced by `--primary` alone, so it is not dead but it is
close; and `--danger` **keeps its `status.critical.mark` hover edge on purpose** —
the instruction was about the resting state, and the wash alone is a hue rather
than a warning. The search field went the same morning, so **2026-08-20 finished
the un-bordering the 19th started**: across buttons, segments, tabs, nav rows, the
expander tag and the search box, not one control in the library states its
boundary with a border any more. In light that is `shadow.md` or `shadow.sm`; in
dark it is a fill step where one exists and nothing where it does not.

**A segmented control is an inset well with a RAISED TINTED THUMB, and the
current-page nav row is the same tinted pill.** `.jrk-btn-group`,
`.jrk-tabs--pills`, `.jrk-nav-item[aria-current]` and
`.jrk-sidebar__action[aria-current]` all say "this is the one" the same way now:
`accent.wash` + `accent.washText` + **semibold**, and none of the four draws a
border. On the two segmented controls the thumb adds `shadow.md` and floats in a
`surface.track` well whose unselected segments are bare labels — no fill, no
shadow, so there is one raised object in the control and it marks the choice. The two
segmented controls are the same widget in two markup contracts; a change to one
belongs in both. Segment height comes from the button's own size modifier (the
first track era pinned it at 22px, under the 24px `minTouch` floor).

**This design spends a measured signal, and you need to know that before you
touch it.** No channel on the thumb reaches 3:1, and since the hairline went there
are only three: the fill is **1.05:1** against the track in light and 1.20:1 in
dark, and the shadow is invisible in dark by construction — so **in dark the state
rides on hue and weight alone**, the hairline's 2.30:1 having been the one channel
that worked there. The nav pill is the same story — **1.04:1** against a hovered
row, 1.08:1 against an open one. Two revisions ago the segment carried
`border.accent` at 5.22:1/6.37:1 and the nav row a solid `accent.solid` pill at
5.22:1. All of it was traded, deliberately and on instruction, for the quieter
look.

So: **the `semibold` is structure, not styling.** It is the only channel that
survives greyscale, both dichromacies and both themes, and it is what keeps
"which one is selected" and "where am I" answerable at all. Do not let a tidy-up
drop it. Two more consequences worth carrying: a neutral or white thumb must never
come back, because `accent.wash`'s 1.05:1 on the track is the entire margin between
this design and the 1.00:1 white thumb this library already recorded as a failure;
and if a 3:1 state signal is ever wanted again, the fix is one line —
`border.accent` on the thumb rule. **The `midgard` skin takes exactly that line**
(as an inset ring, on all four selected controls at once), which makes it the
worked example rather than a hypothetical: the wash, the wash ink and the
semibold all stay, and the ring is an ADDITIONAL channel.

**Adopt Apple values only where they pass** — see above. The accent is not an
Apple color; the neutrals, status colors and chart palette still are.

**Dark values are selected, not flipped.** Every themed token has an explicit
`light` and `dark` entry chosen for that surface.

**EVERY CONTROL LABEL IS `text.sm` (13px), one step under body copy** — directed
2026-08-20, and it is a *default* change, not a new ladder. `.jrk-btn` already sat
there; `.jrk-input` / `.jrk-select` / `.jrk-textarea` (and `.jrk-select option`,
which must not resize when the picker opens), `.jrk-check__label`, `.jrk-tab` and
`.jrk-list__row` followed. **The cost is the same one the button already paid and
it is not a bug:** `--sm` also resolves to `text.sm`, so on buttons and fields the
default and the small size are no longer separated *by type size* — they are still
separated by height and padding, and the scale only ever had 1px there. `--lg` is
untouched everywhere. **Heights did not move**, so a 32px control now holds a 13px
label and `minTouch` is unaffected. What was deliberately LEFT at `md` is the
title-and-prose layer — `.jrk-section__title`, `.jrk-chart-card__title`,
`.jrk-alert__title`, `.jrk-modal__body`, `.jrk-page-header__desc`,
`.jrk-auth__subtitle`, `.jrk-org__name` — because `base.css` body is `md` and
dropping a title to `sm` makes it *smaller than the copy it heads*. **Controls
shrank; the type hierarchy did not.**

**Non-touch, 1920x1080.** Controls are **24/32/40** (md and lg both stepped up on
2026-08-13 for the airier look) and `minTouch` is 24px — the WCAG 2.2 AA floor
(2.5.8), which is why `sm` did not move. Height is still the real constraint, so
two callers were **pinned rather than allowed to follow**: `.jrk-nav-item` moved
from `control-lg` to `control-md` to hold 32px, because 40px is the height the
rail's own history records as tried and rejected; and the sheet takes `size.sheet.*`,
a separate ladder that did not move at all. **A dense report is still dense — it is
the chrome around it that grew.** Never go below 24px.

**EVERY TABLE FREEZES ITS COLUMN HEADERS AND ITS LEADING COLUMN, on both axes,
and it is STRUCTURAL rather than a modifier** (directed 2026-08-20). `--sticky-first`
and `--capped` are retained as empty rules and `<DataTable stickyFirst>` is a
deprecated no-op, because the option was being forgotten one table at a time — the
same history `.jrk-col-start` records for the same column. Three things this cost,
all of them deliberate: **(1) `.jrk-table-wrap` now caps its own port** at
`--jrk-table-height` (70vh), because `thead th` is `sticky; top: 0` and sticky
resolves against the nearest SCROLLING ancestor — an uncapped wrap never scrolls
vertically, the page body does, and the header scrolls away while the CSS says it
is pinned. It is a `max-height`, so short tables are untouched; `@media print`
removes it, because a capped port prints the visible rows and **silently drops the
rest**. **(2) The frozen divider is drawn at rest**, on every table including a
narrow one, because no "is scrolled sideways" selector ships everywhere and a rule
that appears when you touch a table reads as a glitch — a workbook draws it at rest
too, and this is `.jrk-sheet`'s line at `.jrk-sheet`'s weight. **(3) The fills are
stated per section** — header and body on the card plane, `tfoot` on
`surface.subtle` — because `background: inherit` resolves to the row's transparent
background and a see-through frozen cell shows the data sliding under it. The
sticky ladder is **2 lead column / 3 header / 4 corner / 5 footer**, and the sheet's
is **10 gutter+label / 20 block-head / 30 colbar / 40 toolbar**; move one rung
without reading the rest and one cell paints over another at a single scroll
position.

**In the sheet the thing that froze is `__block-head`, not the letter bar** — A…Y is
a coordinate system, the month names are the column headers — and it pins **inside
its own block**, so each metric's header rides down its own rows and is pushed out
by the next. That works because a sticky flow-level grid item is constrained by its
grid CONTAINER, not by its grid area (see the gotchas below). Its `top` is
`--jrk-sheet-frozen-top`, a **stated** sum of `--jrk-sheet-toolbar-h` (no default;
the consumer measures it) and `--jrk-sheet-colbar-h` (18px, derived on paper) — the
same bargain `--jrk-sheet-track-width` makes, with the same failure mode: restyle
the letter bar and the headers park in the wrong place.

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
- **`.jrk-dot` IS TWO DIFFERENT COMPONENTS.** `badge.css` styles an inline-block
  `<span>` status dot; `chart.css` styles an SVG `<circle>` line marker. A rule
  written for one hits the other, and the failure is not cosmetic: a `transform`
  on an SVG circle rotates about the SVG user-space origin, not about the dot, so
  it flings every marker off its own data point. `css/skins/midgard.css` qualifies
  with `:not(circle)` for this reason. Grep both files before styling the class.
- **A `position: sticky` GRID ITEM is constrained by its grid CONTAINER's content
  box, not by its grid area.** The grid-area reading is the one most people quote,
  and it would make a sticky row inside a grid impossible — its area is one row
  tall, so there would be no room to move. Flow-level items take the container's
  content box, which is what lets `.jrk-sheet__block-head` pin for exactly the
  height of its own block. Measured in Chrome; do not "fix" it back on the strength
  of the spec text.
- **A `position: sticky` BLOCK child of a scroll container is sized by the port,
  not by the scrolled content beside it.** Its containing block is the container's
  content box, so `bottom: 0` pins it vertically and lets it slide out of view
  sideways as a wide table is scrolled — `inset-inline-start: 0` is the other half,
  and `width: auto` then already resolves to the port. Bit the capped table's
  pinned footer, which took the row count off-screen with it. A sticky box also
  needs an explicit fill or the rows run straight through it, and its `z-index` has
  to clear the sticky first COLUMN, not just the rows.

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

## Skins — a SECOND AXIS, and the only one in this library

**TWO SKINS SHIP, `endfield` and `midgard`, and the difference between them is
the useful thing in this section.** Everything down to the end of `validate:skin`
below is INFRASTRUCTURE and applies to both. Everything after that is per-skin,
and the second skin's real value is that it *tested* the first one's rules: three
of Endfield's findings reproduced (so they are rules about warm high-chroma
accents, not about yellow) and three did not (so they were rules about a
chamfer). Both are marked where they stand.

**A SKIN IS NOT A THIRD THEME.** `tokens/skins/*.json` each carry their own
`light` and `dark` halves, so a skin is **orthogonal** to the theme and is
stamped separately: `data-skin="endfield"` **crossed with** `data-theme`, which
is four blocks rather than one. `data-theme="endfield"` matches nothing and
cannot be made to — that stamp has nowhere to put the second half of a skin's
palette. This is why `vars` in `build-tokens.mjs` is still `[name, light, dark]`
and must stay that way; a third value per token models an axis that does not
exist. **Four combinations to check, not three.**

**A skin is split down the middle by WHAT it declares, not by convenience.** The
colours are `tokens/skins/<stamp>.json` → generated `dist/jrk-skin-<stamp>.css`;
the geometry and type are `css/skins/<stamp>.css`, which holds **not one colour
value** — every fill in it is a `var()`. Neither file can do the other's job:
tokens.json and its skin files are the only source of truth for design values, so
a hex in the stylesheet is unreachable to the theme toggle *and* fails
`check:css`; geometry is component behaviour and has no home in a token file.
`validate:skin` fails on a hex in a skin stylesheet, so this is enforced rather
than remembered.

**A skin declares CSS VARIABLE NAMES, not a mirror of tokens.json's tree**, and
the build **asserts every one exists in the base layer** (`skinOnly` is the
exempt escape hatch). That assertion is the point: the tree-to-variable mapping
is namespace-specific — `color.text.onBanner` → `text-on-banner`,
`font.family.sans` → `font-sans`, `chart.chrome.surface` → `chart-surface` — so a
mirror needs a second, divergent copy of it, and a typo becomes a variable
nothing reads, which is invisible in a browser. `validate:skin` closes the other
end: a `skinOnly` token that no `css/skins/*.css` references is a **failure**, not
a warning. It caught a dead `notch-lg` on the first run.

**`npm run validate` does NOT see a skin — `npm run validate:skin` does**, and it
exists because `validate-colors.mjs` is 568 lines written against the base tree
and measures everything against `$meta.surfaces`, one hex per theme. **A skin's
page can be a gradient**, and that is the check nothing else in the toolchain can
perform: an ink is held to the page's **worst stop**, not to the panel. Endfield's
`text-muted` was re-stepped twice for exactly this — `#5d686d` cleared 5.28:1 on
the panel and failed at 4.07:1 on the page's dark end, i.e. it passed everywhere
a single-hex gate would have looked and failed on the bottom third of the screen.

**Two things a skin gets wrong that the base library cannot.** (1) **A saturated
yellow is very nearly the luminance of near-white**: Endfield's `accent-solid` is
1.18:1 on its own light panel, so the brand colour is the thing that VANISHES in
greyscale and in print while staying vivid on screen. It separates by chroma
alone, so it never carries a state on its own and its focus ring is **two-tone**.
(2) **An accent that cannot be text breaks the four-roles-one-anchor
arrangement**: the hue clears 4.5:1 in none of them in light, so `accent-text` is
`#6b5e00` (6.00:1) and `border-accent` is `#a08d00` (3.07:1) — a *dark gold*, not
the brand yellow — while dark takes the anchor for all four. **Read that as the
general rule:** the base library's one-anchor-everywhere is a property of *its*
accent, not of the token layout.

**BOTH OF THOSE ARE NOW CONFIRMED TWICE, which is what promotes them from
Endfield notes to library rules.** Midgard's aged gold `#d9ae43` is 1.94:1 on its
own light plate and clears 4.5:1 in none of its light roles, so it lands in the
same two places independently: a **two-tone** focus ring (a single-tone one is
the library's one indicator, invisible) and a stepped `accent-text` /
`border-accent` pair in light with dark taking the anchor. So the shape of the
rule is **warm + high chroma + light plate**, and the next skin with such an
accent should budget for both from the start rather than discovering them.

**`clip-path` clips the box-shadow.** That is not a bug and no property order
fixes it, so a chamfered tile cannot carry an ambient shadow: Endfield
neutralises `shadow.card` / `cardRaise` on exactly the notched selectors, and
`surface.cardHover` has to be a real step in **both** halves (1.14:1 / 1.30:1) —
the base library's shadow-in-light / fill-in-dark split is unavailable. Controls
are therefore squared rather than notched, because since 2026-08-20 a white
button's only boundary in light IS `shadow.md`.

**`radius.full` is deliberately not overridden**, because it is all that keeps a
dot a dot and a radio round. The squared-control list in `css/skins/endfield.css`
is the skin's contract: **anything new that opts into `radius.full` stays a pill
under the skin until it is added there.** `.jrk-btn--icon` keeps the circle on
purpose — it is the reference look's charcoal chip.

**`chart.chrome.surface` must track the skin's own `surface.default`** and is
gated. Endfield overrides **no chart slot**, and that is measured rather than
skipped: its light panel is darker than the base card, so every light mark loses
~8% contrast (slot 1 4.02 → 3.70) and **no slot crosses the 3:1 mark floor**, so
the CVD-derived order carries over intact. `validate:skin` re-checks that on
every build. Dark improves slightly.

### Hazard hues — a THIRD attribute, and what they taught

**`data-skin="endfield"` × `data-hazard="<hue>"` × `data-theme`.** Six hues —
yellow, orange, red, purple, blue, green — and **the default is the ABSENCE of
`data-hazard`, not a value of it**, so yellow keeps its hand-derived shipped
values and nothing that does not stamp the attribute can change. **Only the
accent namespace varies**; the steel neutrals, the status set, the geometry and
the type belong to the skin. That is what makes a hue a one-attribute swap.

**Derived by search, not picked: every role is the NEAREST LEGAL STEP to its
hue's vivid centre** — light roles darken, dark roles lighten, each stopping the
moment it clears its floor. The cross-check on the method is that run against
yellow it reproduces the hand-derived values to within one step (`#6b6000` vs
`#6b5e00`, `#9e8e00` vs `#a08d00`). **Three rules this library wrote as design
rules turned out to be YELLOW rules:**

1. **"The wedge cannot bound itself."** Yellow is 1.17:1 on the light panel and
   green 1.38:1 — but red is 4.27:1, blue 4.23:1 and purple 5.62:1, and those
   three **are** their own `border.accent` with no stepped value at all.
2. **"Black ink always."** Yellow, orange and green take black; red, purple and
   blue take white, and no step of them takes black.
3. **Five of six share one fill across both themes.** Only purple lifts in dark
   (`#8f24db` → `#9a3adf`) to clear 3:1 on the dark panel.

**The washes are MIXES TOWARD THE PANEL from a floor of 0.5, not steps on a
lightness ramp**, and that is the one place yellow actively misleads: what
separates a wash from a fill on a pale hue is **chroma**, and no contrast ratio
sees chroma, so a lightness walk returns the vivid stop itself and calls it a
wash. The floor is what forces the desaturation.

**The variants moved the topbar wedge onto `accent.wash`.** The bar is inked
near-black and black measures 3.92:1 on the blue, 3.88:1 on the red, 2.95:1 on
the purple — so a vivid wedge is illegible for half the palette, and keeping one
would need a guarantee that nothing is ever inked over the bar's last 6%: exactly
the bargain the brand ramp makes above. Declined. **Every wash carries near-black
at ≥11.6:1 by derivation**, so the wedge is safe for all six with no layout
condition, and `validate:skin` gates it per variant. If it ever fails, the wedge
needs a **paler step, not a narrower band.**

**Separation BETWEEN hazard hues is deliberately not a requirement**, and that is
a real distinction rather than a lowered bar: yellow/green collide at ΔE 8.8 and
purple/blue at 4.3, and it does not matter because exactly one hue is stamped at
a time. **A chart slot is positional and its neighbours are on screen; a hazard
hue is exclusive.** What IS gated is each hue against the skin's own **status**
colours, which are on screen with it — and an unacknowledged collision **fails**.

**`red` is the one variant with a restriction and it is not fixable by
re-stepping.** A hazard red and the status reds are the same hue by construction
(both are the deepest red where white survives), so under protanopia the accent
and the danger signal collapse — ΔE 3.2–6.3, acknowledged on the variant and
gated. With `data-hazard="red"`: status badges carry icon **and** label, and a
`--cta` does not share a tile with `--danger-solid`. **Orange is the nearest hue
that clears every status colour** (worst ΔE 17.0).

**Two gates exist because these two things fail silently.** An acknowledgement
for a collision that no longer measures is a **failure**, not stale prose left
alone — prose drifting from a number is this file's own worst habit. And the
gallery picker must offer exactly the declared variants: a hue in the token file
with no button is invisible, a button with no variant silently shows the default,
and neither breaks anything else.

**Endfield is an EXPLORATION that shipped as real infrastructure.** It is opt-in:
nothing imports it from `css/index.css`, no default changes, and a consumer that
never stamps `data-skin` never even fetches its typeface (`Inter Tight` is
requested from the skin stylesheet, not `css/fonts.css`). Gallery:
`preview/skin-endfield.html`.

### `midgard` — a Norse console HUD, and the second data point

**Square slate plates on a near-black page, a captioned header band in
inscriptional caps, an engraved bevel where the base library puts a shadow, and
aged gold `#d9ae43` used as the SELECTION signal rather than as decoration.**
Opt-in the same way (`Cinzel` is requested from `css/skins/midgard.css`, so a
consumer that never stamps `data-skin="midgard"` never fetches it). Gallery:
`preview/skin-midgard.html`. **No hazard variants, on purpose:** Endfield's accent
is a hazard *signal* and can be re-hued without touching what the design means;
this one is a *material*, and every light gold role is stepped away from the fill
rather than equal to it, so a hue swap would mean re-deriving all of them.

**THE DARK HALF IS THE FAITHFUL ONE AND THE LIGHT HALF IS A DESIGN DECISION —
that asymmetry is how you skin a dark-native look.** The reference is a dark
screen, so light is warm vellum (`#faf7ef` plates on a `#efe9dc` to `#ded6c4`
page) under the same gold. Inverting the dark half instead produces a cold grey
page under a yellow that cannot be read on it, which is the failure the stepped
light roles exist to avoid.

**A RAMP'S ENDPOINTS BOUND ITS INTERIOR ONLY IF THE RAMP IS MONOTONIC, and this
skin's dark page is not.** `#0b0f14` / `#0f151b` / `#070a0d` is lit across the
middle band, so the binding stop for every dark ink is the MIDDLE one, and
checking the ends reports the plate as 1.27:1 off the page when it is really
1.12:1. That is a third distinct way a gradient goes wrong, after the base
topbar's failing middle stop and the "worst stop, not the panel" rule above — and
the only one where the convexity argument the four positional tones rely on is
simply false. `validate:skin` walks every stop; anything measured by hand has to
as well.

**ELEVATION IS AN INSET BEVEL, WHICH IS THE THIRD ANSWER TO THE SAME PROBLEM.**
The page is `#0b0f14`, so a black drop shadow renders nothing in dark — the base
library answers that with a fill step and Endfield with a fill step forced by
`clip-path`, and this skin answers it with a 1px inset top highlight carried
INSIDE every elevation token. One mechanism, per-theme values: light gets the
bevel plus a real shadow, dark gets the bevel alone. **Two tokens may therefore
never be `none` here — `shadow.card` and `shadow.md`** — because
`css/skins/midgard.css` composes `var(--jrk-shadow-md)` into the selection ring,
and **a `box-shadow` list containing `none` is invalid CSS that drops the whole
declaration**, ring and lift together. It is stated on both tokens.

**Two more things pinned from BELOW as well as above, which is the pattern to
carry.** (1) The header band is `surface.tinted`, and it is pinned in both
directions: below 1.17:1 / 1.25:1 it reads as a smudge rather than a band, and one
step deeper in dark puts the muted caption it exists to hold under 4.5:1 (4.68
becomes 4.42). (2) `accent.wash` carries `text.muted` on vellum (5.90:1) and
**does not** on slate (4.12:1), and deepening it to fix that costs the fill its
step off the plate — so muted steps up to secondary on a dark wash. Neither is
gated; same shape as the base library's chart-tint finding.

**THE ACCENT AND THE WARM STATUS HALF ARE THE SAME COLOUR IN DARK, AND NO GATE
SEES IT.** `accent.solid` measures dE **1.9** against `status.warning.mark` under
protanopia, 3.3 against serious and 7.6 against critical, where the floor is 10.
It is not a bad pick: every gold from `#b8891f` to `#e6c15c` stays under 10
against every amber a warning could plausibly be, because an amber accent and an
amber warning separate only by lightness. Light is clear (22.7 / 33.5 / 22.3),
because the light status marks are deep browns and reds. **`validate:skin` runs
its CVD check on hazard VARIANTS only, and this skin declares none, so nothing
fails** — which is exactly why it is written here: with `data-skin="midgard"` in
dark, a status badge carries its icon AND its label, a delta states direction in
text, and a gold `--cta` does not share a tile with a warning chip whose only mark
is its colour.

**The chart palette is inherited whole and the collision moves somewhere better.**
No slot is overridden and none crosses the 3:1 mark floor on either plate. But the
gold is dE **1.3** from slot 4 and 3.7 from slot 2 in light — the accent IS slot 4
— while slot 1 stays blue at dE 54. Since slot 1 is the default single-series
colour for every sparkline, cell bar and bar list, **the ordinary one-series chart
is safer under this skin than in the base library**, and it is a multi-series
chart reaching slot 2 or 4 that needs a label between the mark and a gold control.

**Three of Endfield's rules did NOT reproduce, and they belong to the chamfer
rather than to skins.** `clip-path` clips the box-shadow — irrelevant here,
because this skin has no clip-path, so overlays keep their shadows and
`.jrk-btn--icon` is squared with everything else rather than surviving as a
circular chip. And a notch's scaling ladder (`notch-sm/md/lg`) has no analogue: a
corner is a corner. What DID reproduce is the `radius.full` contract — the
squared-control list in `css/skins/midgard.css` is this skin's version, and
anything new that opts into `radius.full` stays a pill until it is added there.

**Two colour decisions were declined here and the reasons generalise.** The bar
was NOT repainted to `surface.banner` even though the reference's chrome is a dark
band: `.jrk-topbar` is inked with `text.primary` by the consumer, which is
near-black in light, and the base `--brand` / `--vivid` variants exist precisely
because a dark bar needs its own ink namespace. A skin re-pointing the default
bar's FILL would blind every control in it. What it does instead is re-point the
bar's existing hairline COLOUR to `border.accent` — a colour change with no width
change, so nothing reflows. Same family as Endfield's wedge decision: **do not put
a fill under ink you do not own.**

## Adding a component

1. `css/components/<name>.css`, imported from `css/index.css`. Tokens only.
2. `react/src/<Name>.tsx` emitting the same class names, exported from
   `react/src/index.ts`. No Tailwind dependency.
3. `preview/components.html`, so it is visible in both themes.
4. `.design-sync/docs/<Name>.md` + `.design-sync/previews/<Name>.tsx`, so it
   reaches the Design System pane.
5. `npm test`, then look at the gallery.

**And check it under BOTH skins** — `preview/skin-endfield.html` and
`preview/skin-midgard.html`, which stamp `data-skin` and nothing else. A new
component picks a skin's colours up for free (they are the same variables) but its
GEOMETRY does not, and each skin has its own list to be added to: if it takes
`radius.full` it stays a pill under either skin until it is named in that skin's
squared-control list; under `endfield` a top-level tile takes no notch until it is
in the clip-path list; under `midgard` a tile with a `__header` gets no band and a
`__footer` no lozenge until it is named. See the skins section above.

## Conventions

- Classes are `jrk-block__element--modifier`.
- Custom properties are `--jrk-<category>-<name>`, generated from `tokens.json`
  (camelCase kebab-cased, `.` becomes `_`).
- Components reference semantic tokens (`--jrk-surface-default`), never ramp
  steps (`--jrk-neutral-100`), never raw hex.
- Transitions use `var(--jrk-transition)`; the reduced-motion guard in
  `base.css` zeroes it globally — do not hand-roll durations.

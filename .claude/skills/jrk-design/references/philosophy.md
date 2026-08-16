# Design philosophy

The doctrine behind every other file in this skill. `tokens.md`, `components.md`,
`charts.md` and `sheet.md` say *what* the rules are; this says *why*, and settles
what to do when two good principles disagree.

## The one idea

Ten sources inform this system: Jobs, Ive, Rams, Norman, Nielsen, Tufte, Wurman,
Alexander, Victor, Kelley. **They appear to contradict each other only because
they answer different questions.** Assign each a layer and the contradictions
resolve into a decision order:

| # | Layer | Question | Sources |
|---|---|---|---|
| 1 | **Scope** | Should this exist at all? | Jobs, Rams |
| 2 | **Structure** | Where does it live? What pattern is it an instance of? | Wurman, Alexander |
| 3 | **Behavior** | How is it operated, and how does a person recover? | Norman, Nielsen |
| 4 | **Rendering** | How densely and how quietly is it drawn? | Tufte, Ive |
| 5 | **Epistemics** | Can the reader interrogate it, or only read it? | Victor |

**The order is binding, and each layer may only spend the budget the layer above
granted it.** You cannot render your way out of a scope problem. You cannot add
exploration to something with no structure. A beautiful component answering a
question nobody asked has failed at layer 1 and layers 2-5 cannot save it.

This ordering *is* the philosophy. Everything below is detail.

Kelley/IDEO is deliberately absent from the table: it is a **process**, not a
design rule. It governs how the team arrives at a decision, not what the decision
is. Treating it as a sixth layer is how documents like this stop being
actionable — see "Process" at the end.

---

## Layer 1 — Scope (Jobs, Rams)

**Default answer to "should we add this" is no.** Ruthless focus is not a taste;
it is a budget. Every element added spends attention that the next element then
cannot have.

- **A new component must justify why an existing pattern does not cover it.**
  Ten components cover this library's surface. Eleven is a claim, not a
  convenience.
- **Rams: "as little design as possible" is not "as little product as
  possible."** Strip *decoration*, never *capability*. A removed affordance is a
  layer-3 regression dressed as layer-1 discipline.
- **`seriesColor(8)` throwing is the model for this whole layer.** The system
  refuses rather than degrades. A ninth series is a thinking error, and the
  library's job is to say so at the call site instead of silently cycling into an
  unreadable chart. **Prefer a hard failure to a soft compromise.**
- **Honesty is a scope rule, not an aesthetic one.** Rams' "honest" is why there
  are no dual-axis charts: two y-scales let the author choose the correlation by
  choosing the scales. The chart would look fine. It would lie. Scope rejected it
  before rendering ever got a say.

Already enforced: the fixed 8-slot palette, the `seriesColor` throw, the
dual-axis ban, the ten-component surface.

---

## Layer 2 — Structure (Wurman, Alexander)

**A screen is an instance of a pattern, never a one-off.** Alexander's point is
that coherence comes from patterns that reinforce each other; a page assembled
from novel parts is a page that has to be learned on its own.

- **One spine. You are always somewhere on it.** Breadcrumb answers "where am
  I", sidebar answers "where else can I go", tabs answer "what are the facets of
  this thing". Those are three different questions and each gets exactly one
  mechanism.
- **Cap parallel navigation at those three.** A "jump to section" pill row *plus*
  a sidebar *plus* tabs *plus* expandable cards *plus* a "3 more types"
  disclosure is five answers to one question, and it is the most common IA
  failure in this product. If a page needs a section index, it is too long — or
  the index should be **derived from the sections themselves**, so it cannot
  drift from them.
- **Wurman's real contribution is that structure is a choice with consequences.**
  Ranked-by-severity and grouped-by-property are different products. Pick one as
  the primary and make the other a view, never ship both as peers.
- **Name the organizing principle on screen.** "Top 6 properties · as of 29 Jul
  2026" tells the reader the set and the cut. An unlabelled list of six is a
  mystery.

Already enforced: `jrk-block__element--modifier`, one token layer, the
"one source per fact" table in CLAUDE.md, `Shell`'s breadcrumb/sidebar/tabs.

Not yet enforced: nothing caps parallel nav mechanisms, and section indexes are
hand-listed rather than derived. Both are review disciplines, not gates.

---

## Layer 3 — Behavior (Norman, Nielsen)

**This is the layer the aesthetic sources will try to take from. Do not let
them.** Norman's critique of post-skeuomorphic Apple UI is a critique of exactly
the restraint Ive is admired for: discoverability was spent on cleanliness.

**The resolution: restraint in decoration, generosity in signifiers.**

- **Never a bare icon button.** It carries a label, or a tooltip and an
  `aria-label`. `<Button iconOnly>` warns in development for this reason.
- **Never color as the only signal.** Status ships icon + label. Deltas state
  direction in words. This is Norman's redundant coding and it is also the
  accessibility floor — the same rule twice, which is why it is not negotiable.
- **Direction and interpretation are separate inputs.** Falling delinquency is
  good. A system that assumes down-is-bad has encoded a wrong mental model, and
  no amount of polish fixes a wrong model.
- **Match the domain's model, not the database's.** The reader thinks in
  properties, units, and months. Schema shape is not a mental model.
- **Every data surface declares four states**: loading, empty, error, partial.
  "Partial" is the one always forgotten and it is the one that matters most here
  — *"3 properties missing July close, totals exclude them"* is the difference
  between a number and a misleading number.
- **Forgiveness over confirmation.** Prefer undo to "are you sure". A
  confirmation dialog trains people to click through it.
- **Accelerators are additive, never structural.** Nielsen's expert efficiency
  means keyboard paths and saved views layered *over* the same spine a first-time
  user walks — not a second, denser product beside it. This is how "powerful for
  experts" and "simple for first-timers" stop being a contradiction: one
  structure, two speeds.

**On "requires almost no instruction":** the *interface* must need none. The
*domain* will always need some. Accrual vs cash basis, T12, CAGR, and cadence
targets are irreducibly technical, and a design that makes them feel simple by
hiding their meaning has lied to the reader. **Teach the domain in place** —
inline definitions, a "how this is calculated" affordance, a primer entry point.
Never simplify the number to avoid explaining it.

Already enforced: the `iconOnly` dev warning, mandatory status icon + label,
separate delta direction/interpretation, `Empty`/`Alert`/`Spinner`.

Not yet enforced: nothing requires a component to handle all four states, and
there is no in-place domain-teaching pattern. Both are buildable.

---

## Layer 4 — Rendering (Tufte, Ive)

This layer is the library's existing strength, and the two sources genuinely
agree here: both want ink removed until only meaning is left.

- **Ink must be data or structure. Never decoration** — *inside the budget the
  brief sets.* Hairline solid gridlines, no chart borders, 2px surface gaps instead
  of strokes between marks. **A tile spends one hairline on its own boundary**
  (`border.subtle`) plus, since 2026-08-13, a resting `shadow.card` in light.

  **This line has now been argued four ways and the argument is the lesson.** A 2px
  brand edge was defended here as *structure* while the light page was flat and
  nothing else bounded a tile. When the page went tinted, the fill step bounded the
  tile, so the same line became ink carrying nothing — decoration, banned by this
  layer's own rule — and deleting it was briefly "the cleanest possible answer".
  Then the page went flat again and a neutral hairline paid for the boundary. The
  page then tinted once more and the hairline was *kept anyway*, with a resting
  shadow added on top — and when the page flattened back to `#ffffff`, those two
  kept channels are exactly what made the flattening survivable. So in light it is
  now the hairline and the shadow carrying a tile, with the fill step contributing
  nothing: two channels where this layer's instinct says one, and a third that
  exists only in dark.

  **That fourth turn is the one that does not follow from layer 4, and pretending
  otherwise would be dishonest.** The shadow is not carrying a surface
  relationship the hairline was failing to carry; it was directed, because floating
  tiles are the look being asked for. What layer 4 legitimately still governs is
  everything downstream of that decision — `shadow.card` is the *faintest* shadow
  that reads as a float, `radius.dataEnd` refused the softening because a rounded
  bar tip eats the encoding, and the dark theme spends none of it because a black
  shadow on `#141416` renders nothing.

  The durable forms, both of which survived the turn: **ink is structural only
  relative to a surface relationship, so when a surface moves, every "this is
  structure" claim has to be re-argued rather than inherited** — and **restraint is
  not a fixed amount of ink.** On a flat page, spending none *is* the failure. When
  the brief asks for a look, layer 4's job is to make it cost as little as possible,
  not to refuse it — but say plainly which of the two is happening.
- **A state may spend ink that a resting element may not** — and once the resting
  element spends some too, what matters is the GAP. `.jrk-card--interactive:hover`
  used to be the only shadow on a dashboard tile, legal because at rest the tile was
  flat, so the ink appeared only while the reader was pointing at it: a layer-3
  signifier rather than layer-4 decoration. Rest is no longer flat, so the hover no
  longer reads by *existing* — it reads by being visibly larger than resting
  (`shadow.lg` over `shadow.card`). **A state signal that survives on contrast with
  the resting state has to be re-checked whenever the resting state moves.** The
  hover also had no cheaper alternative — with no border to brighten, and a fill wash that
  would *dissolve* a white card's boundary by pulling it toward the page, the
  shadow was the only channel that adds definition instead of removing it.
- **Density is a virtue, and height is the binding constraint.** 1920x1080,
  non-touch, 24/32/40 controls. Tufte's density argument and a 1080px viewport
  point the same way: earn every vertical pixel. The 2026-08-13 refresh spent some
  of that budget on purpose (md and lg both stepped up), which makes the *pins*
  the interesting part: `.jrk-nav-item` was held at 32px and `size.sheet.*` did not
  move at all, so the chrome grew and the dense report did not. **When a scale
  moves, decide per-caller whether it should follow.** **Resolve overflow by
  disclosure, not by scrolling** — a reader who must scroll to compare two
  numbers cannot compare them.
- **Ive's craftsmanship is measurable, not vibes.** Negative tracking that
  matches optical sizing. Icons sized in `em` so they inherit text weight. Status
  glyphs filled with the inner mark punched out so they read on any wash. Tight
  radii because macOS controls sit near 6px. Each of those is a specific decision
  with a specific reason, and that is what separates craft from styling.
- **Elegance never buys itself contrast.** The most common failure of
  Ive-inspired work is thin, light, low-contrast type. Here the gate wins:
  Apple's own `systemGray` is 2.92:1 as body text and is **rejected**;
  `systemIndigo` is 3.36:1 as dark link text and is **rejected**. Five such
  deviations are documented on their tokens. "Uncompromising" means uncompromising
  on the gate, not on the reference.
- **The theme is two palettes, not one palette inverted.** Every dark value is
  selected for its surface.

Already enforced: the whole token layer, `npm run validate`, `check:css`, the
mark specs in `charts.md`.

---

## Layer 5 — Epistemics (Victor)

**This is the system's largest genuine gap.** Today a reader can hover a chart,
read a tooltip, and toggle a table. That is a *presented* number with a
magnifying glass, not an interrogable one.

Victor's claim is that a reader who cannot manipulate a system cannot build a
model of it. For a finance product that lands as one rule:

> **A number that cannot show its inputs is not finished.**

`+7.0% vs budget · $102,800` is an assertion. The same figure that expands to
`$1,580,906 actual − $1,478,106 budget, T12, accrual basis, 37 properties` is an
argument the reader can check. Same pixels at rest; a mental model available on
demand.

Three patterns, in priority order:

1. **Derivation on demand.** Every computed figure can expand to its inputs,
   its window, and its basis. Highest value, lowest risk, and it serves Norman
   (mental model) and Tufte (density at rest) simultaneously.
2. **Linked selection.** Selecting a region, property or period in one view
   filters its siblings, so the reader can ask "and what does that do to the
   rest" without a round trip.
3. **Responsive parameters.** Scrub the window or the threshold and watch
   dependents move. Reserve this for where the *relationship* is the insight, not
   as a default control.

**Two hard constraints on all three**, and they are what keeps this from becoming
a toy:

- **Exploration must be deterministic and addressable.** Any explored state is a
  URL. Two people in a meeting must be able to reach the same screen, and an
  audit must be reproducible six months later. Free-form manipulation that cannot
  be cited is worse than a static report in this domain.
- **Exploration is never the only path to a fact.** It is an additive layer over
  a page that is already complete and already readable at rest. This is layer 5
  spending the budget layers 1-4 granted it.

Nothing here is built yet.

---

## Conflict register

Where the sources genuinely disagree, and the settled answer. These are the
decisions most likely to be re-litigated, so they are written down.

| Tension | Naive reading | Settled answer |
|---|---|---|
| Jobs "eliminate" vs Tufte "densify" | They fight | Different layers. Scope sets *how many questions*; rendering sets *how much per answer*. Few questions, richly answered. |
| Ive restraint vs Norman signifiers | They fight — and Norman published this critique of Apple | Restraint in decoration, generosity in signifiers. Never a bare icon button, never color alone. |
| "Uncompromising UX" vs Apple's palette | Adopt Apple verbatim | Measure first. Apple loses to the gate; five deviations are documented. |
| "No instruction needed" vs domain complexity | Simplify the data | Teach the domain in place. Never simplify the number to avoid explaining it. |
| "Reimagine from first principles" vs the shipped token layer | Rewrite the tokens | The palette **is** a first-principles derivation — an order found by search over CVD pairs in both modes jointly, not a taste. Reimagine the workflows; keep the substrate. |
| Victor exploration vs audit and shared meaning | Free-form manipulation | Deterministic, addressable, reproducible. Every explored state is a URL. |
| Density vs 1080px height | Scroll | Disclosure. A reader who scrolls to compare cannot compare. |
| "Expert power" vs "first-timer simplicity" | Two products, or one dumbed down | One spine, two speeds. Accelerators layer over structure; they never replace it. |
| Kelley process vs the other nine | Treat as a design rule | It is a process. It belongs in how the team works, not in the library. |
| "Dashed means reference value" vs colorblind series separation | Pick one — either dashes mean threshold or they mean series | Both, scoped. Solid is the default and the dash keeps meaning *reference*. Under an explicit `data-encoding="redundant"` the author trades that signifier for an identity channel, and the threshold still reads by colour and weight. The alternative was worse: hue alone leaves `(n, n+4)` pairs at ΔE 0.8, and a reader who cannot tell two series apart has lost more than a signifier. |
| Ive/Tufte restraint vs branding the tile | Put the brand on the enclosure | **Settled by removal, and the history is the lesson.** For one period every tile carried a 2px `#48a9df` edge, defended here as *structure* rather than decoration — legitimately, because the light page had been flattened to `#ffffff` and nothing else bounded a tile. That defence was conditional on a fact, and when the page went back to `#f2f2f7` the fact expired: the fill step bounds the tile, so the same line became ink that no longer carries structure, i.e. decoration, i.e. banned by this layer's own rule. The brand now lives on fills (`accent.solid`, wash, banner) where it states identity without bounding anything. Generalise: an argument that a piece of ink is structural is only as durable as the surface relationship it cites — when a surface moves, re-audit every rule that was justified by it. |
| A brand color the gate never measures | Treat it like any other token — the validator will catch it | It will not, and the border namespace is still unchecked. `border.card` was the standing example and it is gone, but the hole it exposed is not: `border.accent` is a tab underline, something does depend on seeing it, and no gate measures it — so its figures (`#0069d9`, 5.22:1 card and page while the page is flat white — 4.68:1 when it was tinted; `#64b5ff`, 6.37:1 dark) are recorded by hand on the token. **The segmented control is the live case, and it went the other way.** Its selection signal was a fill the validator measures, then `border.accent` at 5.22:1/6.37:1 which it does not, and now a tinted thumb in a well whose every channel is under 3:1 — fill 1.05:1 on the track, hairline 1.44:1, shadow invisible in dark. Two things generalise. Moving a signal onto a border moves it out of the gate's reach, so the number has to be written down in the same change. And a fill that is *present but unmeasurable* is the worst case of all: it looks like a channel and cannot be counted as one, so ask what a signal measures **against**, never whether one exists. What is holding that control up is the weight step, medium to semibold — the only channel that survives greyscale, dichromacy and both themes at once. When a rendering instruction spends a measured signal, find the channel that cannot be spent and make it explicit, in the code and in the note. It used to need a bespoke value just to reach 3:1, which is how easy it was to miss. The rule that survives the removal: decorative separation may sit under 1.4.11's 3:1; the moment a state, a selection, or a validity signal rides on a border, it needs a value that measures, and you must record the number yourself because nothing else will. |
| Two themes that bound their tiles differently | Pick the better mechanism and force both themes onto it | Settled, and it took three passes to earn. The failure shape was: light flattened to `#ffffff` and bounded by a heavy brand edge while dark kept Apple's fill hierarchy — two mechanisms, which the entry that used to sit here called *the most expensive decision in the file to forget*, because a change that read correctly in dark could be invisible in light. Then both themes were grouped-fill (1.12:1 / 1.17:1), then the light page went flat again, and on 2026-08-13 it went to a shallow `#f5f5f7` tint and back to flat `#ffffff` within the same day, then to a `#fbfbfb` whisper on 2026-08-16 — where it stands. Through all of it the resolution held: rather than reintroducing hairline-in-light / fill-in-dark, **`.jrk-card` draws `border.subtle` in BOTH themes** — 1.26:1 in light, 1.24:1 in dark on top of the 1.17:1 step — and it now rests on `shadow.card` as well, which IS light-only and is the one place this entry's rule is knowingly bent (a black shadow on `#141416` renders nothing, so the token is `none` there and the dark tile keeps exactly the two channels it always had). One mechanism, two values, plus one light-only channel that adds and never substitutes. That round trip re-earned a rule the register had only implied: a tint *permits* dropping the hairline, and taking that permission would have left the tile bounded by a 1.06:1 step where a 1.26:1 hairline had been, so **through a paired move, prefer the state that leaves the thing MORE bounded** — the direction of the permission is not the direction of the safe change. Declining it is also what made flattening back safe: every plane was already self-bounding, so the page could go to `#ffffff` and take the light fill step to 1.000:1 without removing anything a tile was leaning on, and could come back to `#fbfbfb` for 1.035:1 on the same reasoning. The standing cost is future-tense and survives both moves — **in light the fill step is decoration at any of these values, so a new top-level tile must bring its own edge.** That the page can be re-toned twice in three days without a single tile losing its boundary is the payoff of having declined the permission each time. Three rules earned: **undo a pair together** — the flat page and the heavy edge were each other's justification, and removing either alone leaves tiles unbounded; **prefer one mechanism across themes**, spending per-theme difference on the VALUES (`surface.cardHover` is a no-op in light and load-bearing in dark) rather than on the mechanism; and, from the flat-page decision, **when a per-theme mechanism split is the tempting fix, pay the redundant ink instead** — a hairline that is invisible in dark costs nothing and keeps the two themes on one rule. |
| A reference IA (Snowsight's rail) vs the rules already settled here | Copy the rail wholesale — it is the thing being asked for | Adopt the **structure**, re-decide the **rendering**. The structure is what the request is actually about and it is taken entire: verbs split from destinations above a hairline, named groups, and depth held in flyouts so the rail stays one screenful instead of scrolling — which is the density-by-disclosure rule arriving from the outside. Three details are then overruled, each by a rule that predates the reference. Snowsight paints "current page" and "menu open" the same quiet grey; here they stay two treatments, because they answer different questions and light has no fill hierarchy to make grey carry where-am-I. **What those two treatments are has since moved, and the distinction got thinner.** Current-page was a filled `accent.solid` pill with a white label, 5.22:1 against every neighbour; it is now the tinted button — `accent.wash` + `accent.washText` + semibold — which is 1.04:1 against a hovered row and 1.08:1 against an open one. Hue and weight separate them now, not lightness. Hue holds under both dichromacies and dies in greyscale, so semibold is what is actually keeping where-am-I answerable, and it is not optional ink. Snowsight ships no caret on a parent row, so you find the second level by hovering and hoping; the caret is added back — restraint in decoration, generosity in signifiers. And Snowsight opens on hover, which this does not: a panel that appears because the pointer crossed a row on its way somewhere else covers content nobody asked to have covered. The general form: a reference answers layer 2 well and does not get a vote on layers 3-4. |
| "Add a colorblind palette" | Ship a second palette behind a toggle | There is no second palette to ship. The default **is** the CVD-derived one, and no eight hues in sRGB clear the all-pairs floor under three dichromacies — so a swap cannot fix what breaks. The fix is a second *channel* (dash, shape), not a second palette, plus the cap of 3 for colour-only marks. A toggle would also fork the token source and require the reader to self-identify. |

---

## What can actually be gated

This library's thesis is that machine-checkable rules beat good intentions.
Honesty about the boundary matters, because doctrine that pretends to be
enforceable is worse than doctrine that admits it is not.

**Gated today:** raw hex, undefined tokens, brace balance (`check:css`);
contrast, CVD separation, the redundancy channels, lightness band, chroma floor,
ordinal floor (`validate`); the series cap (`seriesColor` throws); types
(`typecheck`).

CVD separation is vendored in `scripts/cvd.mjs` rather than reached through
`JRK_DATAVIZ`. It used to live only in the external skill, which meant a fresh
clone printed two warnings and exited 0 — `npm test` passed green without ever
checking the property the palette exists to have. **A gate that is off by
default is not a gate**, and an optional one reads as enforcement to everyone
who never sets the variable. Band, chroma and the normal-vision floor are still
external; they degrade to a stated gap rather than a silent pass.

**Gateable, not yet built:** every data component declaring all four states;
every computed figure carrying a derivation or an explicit opt-out; every chart
carrying a table view.

**Not gateable — review discipline only:** whether a component should exist at
all; whether the IA has one spine or five; whether a mental model is right;
whether an interaction helps someone think. **These are exactly the decisions
that matter most.** No gate substitutes for looking at the screen in both themes
and asking what question it answers.

---

## Process (Kelley)

Not a design layer — how decisions get made.

- **Observe before proposing.** The specific failures in this product were found
  by looking at real screens: a white gradient tile with white text in dark mode,
  five parallel navigation mechanisms on one page. Neither was in any spec.
- **Prototype in the gallery, not in a doc.** `npm run preview`, both themes, at
  the real width. `npm test` never checks layout, and every layout bug in this
  library's history was invisible to it and obvious in a screenshot.
- **Iterate against the gate, not against taste.** When a color fails, re-step
  it; do not lower the gate.
- **Challenge assumptions with evidence.** The dark page was `#000000` because
  iOS grouped style says so. On a 1920x1080 desktop it halated against near-white
  text. Measured, changed, documented on the token — and the documented rule that
  said otherwise was updated in the same change.

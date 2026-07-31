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

- **Ink must be data or structure. Never decoration.** Hairline solid gridlines,
  no chart borders, no drop shadows doing a hairline's job, 2px surface gaps
  instead of strokes between marks.
- **Density is a virtue, and height is the binding constraint.** 1920x1080,
  non-touch, 24/28/32 controls. Tufte's density argument and a 1080px viewport
  point the same way: earn every vertical pixel. **Resolve overflow by
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

# design-sync notes — @jrk/design

Repo-specific gotchas for syncing this library to claude.ai/design. Read this
before re-running the sync.

Target project: `JRK Analytics Design` (`projectId` is pinned in `config.json`).

## Why this repo needs a prep step

`@jrk/design` ships **TS source**, not a compiled dist — `exports["."]` points at
`react/src/index.ts`, and `dist/` holds only the generated token layer. The
converter needs three things this repo doesn't naturally produce, so
`cfg.buildCmd` runs **`node .design-sync/prepare.mjs`**, which does all of it:

1. **`dist/`** — the repo's own `npm run build` (token layer).
2. **`dist/types/` + a root `index.d.ts` shim.** The converter's component list
   AND the API contract both come from the `.d.ts` tree. `projectFor()` in
   `lib/dts.mjs` resolves the entry as `<pkgRoot>/index.d.ts` via
   `pkgJson.types`, which this package deliberately does not declare. Without
   the shim the tree parses but the entry never resolves and the build reports
   `[ZERO_MATCH] no component exports` while still exiting 0 — a silent
   near-miss, so check the `components:` count, not just the exit code.
3. **`.design-sync/.cache/jrk-flat.css`** — `css/index.css` is a pure `@import`
   manifest. Copied verbatim it lands as a 1 KB stub with unresolvable relative
   imports and **every component renders unstyled**. prepare.mjs flattens it with
   esbuild; `cfg.cssEntry` points at the flattened file.
4. **`guides/`** — copies of `.claude/skills/jrk-design/*.md`. The upload API
   **refuses any path under `.claude/`** (reserved), and `guidelines/` mirrors the
   package-relative source path, so the docs cannot be synced from their real
   home. Do not point `guidelinesGlob` back at `.claude/`.

All four outputs are gitignored and regenerated. Nothing in prepare.mjs mutates
the library's committed files.

## The declaration emit needs a repo-root `rootDir`

`.design-sync/tsconfig.dts.json` used `rootDir: ../react/src`. When `Icon` landed
it imported the generated `../../dist/icons`, tsc pulled that `.ts` into the
program as a source file, and the emit died with **TS6059** (`not under rootDir`)
— while the repo's own `npm run typecheck` stayed green, because it sets
`noEmit` and no `rootDir`. So the library looks healthy and only the sync breaks.

`rootDir` is now the repo root, which makes the emit structural:
`dist/types/react/src/*.d.ts` + `dist/types/dist/*.d.ts`. The `index.d.ts` shim
prepare.mjs writes therefore points at **`./dist/types/react/src/index`**, not
`./dist/types/index` — the two must be changed together.

prepare.mjs also `rmSync`s `dist/types/` before the emit. tsc only overwrites
what it emits, so the pre-change flat tree (`dist/types/Badge.d.ts`, …) survived
alongside the new nested one and left a second resolvable `index.d.ts`.

**Any future component importing from `dist/` is fine now**, but a component
importing from outside the repo root would fail the same way.

## Fresh-clone setup

`react` is an **optional peer dep and is not installed** by `npm ci` (the repo
typechecks against `@types/react` alone). The bundle and `_vendor/` need it:

```sh
npm ci
npm i --no-save react@^19 react-dom@^19     # --no-save keeps package.json clean
mkdir -p .ds-sync && cp -r <skill>/package-build.mjs <skill>/package-validate.mjs \
  <skill>/package-capture.mjs <skill>/resync.mjs <skill>/lib <skill>/storybook .ds-sync/
echo '{"name":"ds-sync-deps","private":true}' > .ds-sync/package.json
cd .ds-sync && npm i esbuild ts-morph @types/react playwright \
  @fontsource/inter @fontsource/jetbrains-mono && npx playwright install chromium
```

`@fontsource/*` lives in `.ds-sync/node_modules` on purpose — `cfg.extraFonts`
points there, so the fonts ship without adding deps to the library's
`package.json`. **If you skip that install, `extraFonts` silently resolves to
nothing and every design renders in a fallback face.**

Build (from repo root):

```sh
node .design-sync/prepare.mjs
node .ds-sync/package-build.mjs --config .design-sync/config.json \
  --node-modules ./node_modules --entry ./react/src/index.ts --out ./ds-bundle
node .ds-sync/package-validate.mjs ./ds-bundle
```

`--entry` is required: the DS package is not installed into its own
`node_modules`, so entry auto-resolution can't find it.

## Fonts

**The sans stack leads with Inter, and the bundle is now the honest case.**
`tokens.json` `font.family.sans` is `Inter, 'Inter var', -apple-system, …`. SF Pro
was dropped from it: Apple publishes no SF webfont and the outlines are theirs —
the same reason this library ships no SF Symbols — so an SF-first stack meant
Apple hardware and everything else rendered in different faces, and the tracking
tokens could only be right for one of them. `@fontsource/inter` via
`cfg.extraFonts` therefore ships the face the library is actually designed
against, not a fallback.

**`SF Mono` in the mono stack is still deliberate and still unshippable**, and it
is the only remaining reason for `cfg.runtimeFontPrefixes`. The prefix list is
`["SF Pro", "SF Mono"]`; `"SF Pro"` is now dead weight, kept only because it
costs nothing and removing it is one more thing to get wrong if the sans stack
ever changes again. Do not "fix" either entry by sourcing a lookalike — the
families resolve from the OS at runtime and the bundled webfonts are the real
fallback.

Tokens name `Inter` and `JetBrains Mono`; the repo itself ships **no
`@font-face`** — `css/fonts.css` reaches Google Fonts instead, see below. Both
faces are SIL OFL, so weights 400/500/600/700 (Inter) and 400/500 (mono) are
bundled from `@fontsource` via `cfg.extraFonts`. Only the weights the CSS
actually uses are wired — check `grep -r font-weight css/` before adding more.

**Two Inter delivery paths now exist, and the bundle gets both.** `css/index.css`
imports `css/fonts.css`, which is a remote `@import` of the Google Fonts variable
Inter; esbuild treats a URL import as external and hoists it to the top of
`.cache/jrk-flat.css` rather than inlining it. So the uploaded bundle carries
that `@import` *and* the `@fontsource` static faces. That is not a build error:
- The CDN import is blocked by the Design System pane's CSP, so the bundled
  `@fontsource` faces are what actually render there. Correct outcome.
- It does mean the pane renders **static** Inter with no `opsz` axis, while a
  consuming app gets the variable font. Display-size letterforms will be very
  slightly looser in the pane than in production. Not worth fixing by bundling
  the variable file — `extraFonts` wires static weight files.
- `font.feature.sans` (`'cv05' 1, 'ss03' 1`) applies in both paths; the
  `@fontsource` latin files carry the character variants.

**Two variable Inter TTFs sit in the project unreferenced** (found Jul 30 2026 in
`list_files`, not produced by any build):

```
fonts/Inter-VariableFont_opsz_wght.ttf
fonts/Inter-Italic-VariableFont_opsz_wght.ttf
```

Those filenames are exactly what a Google Fonts ZIP download produces, so they
were added by hand — plausibly to fix the missing-`opsz` limitation noted above.
**They are inert today**: the generated `fonts/fonts.css` `@font-face`s only the
four static `inter-latin-*` weights from `@fontsource`, and nothing references the
TTFs. The sync does **not** delete them (they are not in the anchor, so
`upload.deletePaths` never names them) — but every re-sync overwrites
`fonts/fonts.css`, so hand-editing that file to use them **will be reverted**.

To actually wire the variable font, do it through config so it survives:
1. Commit the `.ttf` (or better, a `woff2` conversion — a TTF is ~3x the bytes)
   inside the repo; `cfg.extraFonts` is bounded to the git root, so a path
   outside it is silently skipped.
2. Author a small `@font-face` CSS with `font-weight: 100 900` and the `opsz`
   axis, and add **that CSS file** to `cfg.extraFonts` — a bare font file listed
   in `extraFonts` is copied as-is and gets **no** `@font-face`, so it would stay
   inert exactly as these two are.
3. Decide whether the static weights stay as a fallback or come out; shipping
   both means the pane downloads both.

Until then, leave them — they cost project storage and nothing else.

## Grouping

There are no per-component docs in this repo, and `group` is otherwise derived
from the src path — which is `react/src` for every component, and both segments
are on the converter's generic-dir list, so **all 34 would land in one `general`
group**. `.design-sync/docs/<Name>.md` holds a frontmatter-only stub per
component (`category` + `keywords`) purely to set the group.

Groups in use: `Actions`, `Charts`, `Feedback`, `Forms`, `Metrics`, `Shell`,
`Status`, `Surfaces`, `Tables`, plus **`Foundations`** (Icon) and **`Layout`**
(List, ListRow), added Jul 2026.

Keep them frontmatter-only. A stub with a **body** replaces the synthesized
`.prompt.md` body, which would discard the `## Examples` section (the authored
preview JSX the design agent imitates) and `## Related`. Frontmatter-only keeps
both and still sets the group.

**`LineChart.md` is the one deliberate exception, and it now carries its own
`## Examples`.** Commit 829ebab gave it a body — the `encoding` / ΔE-0.8
rationale, which is far better than anything the synthesizer produces — and the
predicted cost landed exactly as written above: LineChart became the only
component whose `.prompt.md` had no `## Examples` and no `## Related`. Confirmed
in `lib/emit.mjs:412`: when `docBody` is set, `prompt = head + docBody`, and only
`## Props` is back-filled when the body lacks it. **`## Examples` is never
re-appended, so there is no config knob for this** — the section was hand-written
into the stub on 2026-07-31 and is now maintenance-coupled to
`previews/LineChart.tsx`. If you change that preview's composition, update the
stub's Examples too; nothing cross-checks them (see **Re-sync risks**).

## Library bugs found while making previews render

These are real defects in the library, found via the previews and **not fixed
here** — `css/` and `react/src/` were left untouched.

- **`.jrk-grid` is double-booked.** `css/base.css` declares it as the layout
  primitive; `css/components/chart.css:48` declares
  `.jrk-grid line, .jrk-grid path { stroke: var(--jrk-chart-grid); stroke-width: 1 }`
  for the SVG gridline group. Equal specificity (0-1-1) and chart.css loads
  later, so **any SVG inside a `.jrk-grid` layout container is overpainted
  gridline-gray at 1px**. Measured: a spark line computes `rgb(50,126,191)` 2px
  inside `.jrk-row` but `rgb(231,231,240)` 1px inside `.jrk-grid`. Delta arrows
  become pale hairlines; a `LineChart` in a `.jrk-grid` tile loses **every
  series line**. `preview/dashboard.html:142` does exactly this, so the repo's
  own canonical dashboard is affected. Renaming the layout class is NOT the fix —
  `Chart.tsx:245` itself emits `<g className="jrk-grid">`; scope the chart rule
  to `.jrk-chart .jrk-grid line/path` instead (zero JS change, every chart root
  already carries `.jrk-chart`).
  **Consequence for previews: never use `jrk-grid`/`jrk-grid-2|3|4` in a preview
  that contains an SVG.** `previews/Card.tsx` still uses it; those cells contain
  no SVG today and render fine, but they are one `Delta` away from the bug.
- **`BarList` renders invisible bars outside a `.jrk-chart` ancestor.**
  `.jrk-bars__fill { background: var(--series) }`, but `--series` is declared
  only on `.jrk-chart` (and the `.jrk-s1..8`/`.jrk-t1..8` helpers), and
  `BarList` emits neither. An unset custom property makes `background`
  invalid-at-computed-value → `transparent`: total silent loss of the marks, no
  console error. `<ChartCard><BarList/></ChartCard>` is also broken
  (`.jrk-chart-card__body` is not `.jrk-chart`). The hand-authored HTML always
  nests `.jrk-chart > .jrk-bars`, so the requirement is real but undocumented.
  Suggested fix: `.jrk-bars { --series: var(--jrk-chart-1) }`. All `BarList`
  preview cells wrap explicitly.
- **Every `.jrk-icon` is a block box, so a bare `<Icon/>` in flowing text takes
  its own line.** `css/base.css:41` includes `svg` in the media reset
  (`display: block; max-width: 100%`), and `css/components/icon.css` never sets
  `display` — so `.jrk-icon`'s `vertical-align: -0.14em` (icon.css:42), which
  exists precisely to seat the glyph on the text baseline, is **inert**. The
  file's own header comment claims icons "inherit font-size and sit on the text
  baseline"; half of that is not true as shipped. Measured in the `Icon`
  preview: `<Icon name="checkFill" /> Caption text, 12px` renders the glyph on a
  separate line above the label. The `em` sizing itself works correctly.
  It hides everywhere the DS composes icons itself — `.jrk-btn`,
  `.jrk-nav-item`, `.jrk-list__row`, `.jrk-badge` are all flex containers, so a
  block child still sits in the row — which is why it survived to here.
  Suggested fix: `.jrk-icon { display: inline-block }` (one line, no JS change),
  or scope the base reset to `svg:not(.jrk-icon)`, matching the
  `svg:not(.jrk-icon)` idiom the component CSS already uses for sizing.
  **Consequence for previews: pair an icon with its label inside `jrk-row`.**
  `previews/Icon.tsx` `ScalesWithText` does this, and `conventions.md` carries it
  as a live trap so the design agent does too.
- **`data-collapsed="false"` is unreachable from React.** `shell.css` collapses
  `.jrk-sidebar:not([data-collapsed='false'])` under 1024px, but `Shell.tsx`
  renders `data-collapsed={collapsed || undefined}` — never the string `"false"`.
  So below 1024px the rail narrows while labels stay laid out and clip mid-word.
  The `:not()` selector plainly expects the attribute to be emitted. The mobile
  drawer (`data-open`) is unreachable too: no `open` prop and no rest-spread on
  the `<nav>`.
- **`.jrk-sidebar__brand span` hides a span-wrapped logo mark** in the collapsed
  rail, not just the wordmark. The repo's own `gal-nav__mark` is a `span`, so it
  has the same bug. Scope the selector.
- **A disabled `Switch` keeps a full-contrast label.** `form.css` dims disabled
  labels via `.jrk-check input:disabled + .jrk-check__label`, scoped to
  `.jrk-check`; `Switch` renders `.jrk-switch > input + .jrk-check__label`, so
  the track dims but the label does not. A disabled `Checkbox` dims both.
- **`Alert` does not synthesize a tone icon** the way `Badge` does — `icon` is a
  plain optional node, so a tone-coloured alert without one is a bare tinted
  block. Consider defaulting it from `tone`.
- On the light surface, **`Alert` `critical` and `serious` fills are nearly the
  same pink-red**, separated only by a small shade delta. `Badge` escapes this
  because the tone icon disambiguates.
- ~~**Two `$comment` keys leak into generated CSS.**~~ **FIXED Jul 30 2026** in
  `scripts/build-tokens.mjs` — the ramp loop now applies the same `$meta` guard to
  the step key that it already applied to the hue key, so
  `--jrk-neutral-$comment` / `--jrk-indigo-$comment` are no longer emitted.
  `check:css` never caught it (its `declared()` regex does not match a `$` in the
  ident); what surfaced it was esbuild warning `Expected ":"` while flattening
  `jrk-flat.css`. Token count dropped 214 → 212 as a result — that is the fix,
  not a loss.
- `react/src/Stat.tsx` comments that a flat series renders as a "centered line";
  the maths (`y = h - pad - 0`) puts it on the baseline. Comment is wrong.

**Found 2026-08-07, in the sheets, after the segmented control became a well with
a raised thumb. Both are design-consistency findings rather than defects, and both
were left alone as out of scope — but they will be noticed by anyone browsing the
pane, so decide them deliberately rather than by drift:**

- **`.jrk-btn-group`'s action-toolbar form lost its affordance.** Unselected
  segments are now bare labels in a `surface.track` well with no fill and no
  border, which is right for a picker. But `ButtonGroup` is documented — in its own
  JSDoc and in its `ActionToolbar` preview export — as serving a *toolbar of
  related actions* too, and with no `aria-pressed` anywhere that export now reads
  as a segmented control with **nothing selected** rather than three buttons.
  Visible in `actions__ButtonGroup` (`Export CSV | Export XLSX | Schedule`).
  Options: give the toolbar form its own modifier, or document that a toolbar of
  actions is plain `.jrk-btn`s in a `jrk-row` and drop the export.
- **Selection is now answered two ways.** `.jrk-nav-item[aria-current]` and the
  segmented thumb are the tinted wash pill; `.jrk-list__row[aria-selected]` and
  `ListRow`'s selected variant are still a **solid** `accent.solid` bar
  (`list.css:154`). Both are visible on sheet 2 — a pale blue current nav row and a
  saturated blue selected list row, in adjacent cards. Whichever is right, one
  question should not have two answers.

## API traps that cost a preview iteration

- `Empty` takes `description`, **not** `text`.
- `Textarea` has **no `size`** prop (Select does); `rows` is its only size axis.
- `Checkbox`/`Switch` do **not** extend `FieldOwnProps` — no `help`/`error`/
  `required`. Passing `error` is a silent no-op forwarded to the DOM. `hint`
  exists on `Checkbox` only.
- `help` and `error` are mutually exclusive at render: `FieldShell` gates help
  with `{help && !error && …}`.
- `Input.className` lands on the `.jrk-field` **wrapper**, not the `<input>` — so
  `jrk-input--filled` is unreachable from React, while `jrk-topbar__search` works.
- `Badge` never renders an icon for `neutral` or `accent` (the guard excludes
  them), so "neutral badge with icon" is inexpressible.
- `Spinner` returns a **fragment**, has no `className`, and its `label` is
  sr-only — a visible caption must be a separately authored node.
- `Empty`'s `icon` class lands on a wrapper `<span>`, not the `<svg>` (unlike
  `preview/components.html`). Fill the viewBox and use `strokeWidth >= 2` or the
  glyph captures as a smudge.
- `NavGroup` is a section **heading, not a container** — the `NavItem`s it
  captions are its siblings in `.jrk-sidebar__nav`. The name misleads.
- `TabPanel`'s `id` must be byte-identical to its tab's `id` (`Tabs` emits
  `aria-controls="panel-<tab.id>"`). A prefixed panel id breaks the wiring with
  **zero visual symptom**.
- `LineChart.format` only feeds the tooltip; Y-axis ticks always go through the
  internal `compact()` (`1.5K`, no comma/currency) and cannot be overridden — put
  the unit in the `ChartCard` subtitle.
- `LineChart`'s `niceCeil` is coarse near a decade boundary (max 1,402 → axis
  2,000), which leaves an area chart sitting in the bottom half. Pick data that
  peaks just under a round number.
- `Legend.hidden` without `onToggle` has no visual effect (the 0.4 opacity comes
  from `[aria-pressed='false']`, which only exists on the button form). Legend
  slot assignment is **positional** — keep the full series array and mark entries
  `hidden`; never filter it, or a filter repaints the survivors.
- `Column.width` in `DataTable` is a `<th>` hint only under `table-layout: auto`;
  squeezed columns wrap mid-name.

## Preview harness facts

- Cells capture non-fullPage at **900x700** with 24px body padding (usable
  ~852x652); taller content is silently cut. Sheet rows are ordered
  **alphabetically by export name**, not source order.
- 900px is **below the 1024px sidebar breakpoint**, so shell previews need a
  preview-scoped width/`min-height` reset (the same override
  `preview/dashboard.html` already carries) or the rail collapses mid-capture.
- Shell/structural wrappers (`Main`, `Content`, `TabPanel`, `NavItem`,
  `NavGroup`) render as empty boxes bare. Compose them inside their real parent
  and bound the cell with `style={{height:N, display:'grid', overflow:'hidden'}}`
  — `display:flex` collapses `.jrk-main` to content width.
- `useState` works in previews (the shim maps `'react'` to `window.React`), but
  do not `import` from `'react'` in a preview — it would bundle a second React.
- Import components from `'@jrk/design'`; the story-imports policy shims that to
  `window.JrkDesign`, i.e. the real shipped bundle.

## Known render warns (expected — not new)

**Two outstanding.** The second was added 2026-08-09.

- `[GRID_OVERFLOW] NavMenu (Open) — escape (fixed/portal)` → **recorded, not
  fixed, and that was a decision.** It appeared for the first time on the
  2026-08-09 run *without NavMenu changing at all* — its `sourceKey` was
  unchanged and it sat in the `verified-by-upload` partition. What moved was
  `scriptsSha` (`0f1e261bfa23b5bf` → `e0316766f3bdd146`): the staged converter is
  a newer build and its grid-overflow check is stricter. `.jrk-nav-flyout` is
  `position: fixed`, so the panel resolves against the viewport rather than the
  grid cell. The prescribed remedy is
  `cfg.overrides.NavMenu = {"cardMode":"single","primaryStory":"…"}`, and it
  **costs three of the four stories** — single mode renders one export per card.
  The card renders acceptably solo (checked `_screenshots/shell__NavMenu.png`:
  all four cells present, flyout inside its cell), the failure is only claimed
  for the product's grid, which cannot be reproduced locally. So it was left
  alone rather than silently degrading a live card. **If someone confirms the
  card is actually broken in the DS pane, apply the override — it is one line.**

**One from Jul 30 2026:**

- `[FONT_REMOTE] "Inter var"` → expected and correct. `css/index.css` imports
  `css/fonts.css`, whose Google Fonts `@import` esbuild hoists into
  `jrk-flat.css` as an external URL import. Validate sees a remote font-host
  `@import` and says so. It is informational, non-blocking, and the **bundled
  `@fontsource` faces are what actually render** in the pane (its CSP blocks the
  CDN). See **Fonts**. Do not try to remove the `@import` to silence it — that
  would break Inter for every consuming app.

**Resolved by config on 2026-08-07 — should not return:**

- `[GRID_OVERFLOW] NavMenu (Open)` with kind `escape` ("stories position content
  outside their cells (fixed/portal) — no grid layout can present this"). The
  flyout is `position: fixed` with measured viewport coordinates, so in a grid
  cell it lands outside its own card. Fixed with
  `cfg.overrides.NavMenu = {"cardMode": "single", "primaryStory": "Open",
  "viewport": "900x700"}`. This warn was **already documented in the library's own
  skill reference** (`references/components.md` names "the `[GRID_OVERFLOW]`
  warning the design-sync validator raises on this component") but had never been
  recorded here, so it read as new. It is the same root cause as the standing
  fixed-over-portal note.
- **The `single` remedy is not a presentation-only edit, unlike `column`.**
  `preview-rebuild.mjs --components NavMenu` refused with `[CONFIG_STALE]`, because
  switching to `single` collapses four grade keys into one and only a full
  `package-build.mjs` re-stamps them. So: `column` can go through the targeted
  loop, `single` needs a full build. Budget a driver run for it.

Anything else is new; investigate, then fix or record it here.

Confirmed still the only warn on the 2026-07-31 re-sync: validate exited 0 with
`[FONT_REMOTE] "Inter var"` and nothing else. `[FONT_MISSING] "SF Mono"` and
`[GRID_OVERFLOW] ChartCard` both stayed suppressed by their config fixes, as
expected. Token count is now **220** in `jrk-tokens.css` (244 defined across the
whole shipped closure), up from 212 — the colorblind dash set in 829ebab, not a
regression.

## The flat-white light page was a half-finished revert — READ THIS BEFORE TRUSTING A SURFACE VALUE

**Found and fixed 2026-08-07, during the design-sync validation pass, not by any
gate.** For one period `surface.canvas.light` and `surface.subtle.light` were
`#ffffff`. They were the surviving half of a PAIR: commit 2b89411 ("Give tiles a
brand edge, then flatten the light page to white") introduced both a 2px brand
edge on every tile and a flat white page. The brand edge was later removed —
`border.card` and `size.cardEdge` are gone and `.jrk-card` is
`border: 1px solid transparent` — but **the page was never un-flattened with it.**

Consequence while it lasted: in light, page and card were both `#ffffff` and the
card's border was transparent, so **a plain `.jrk-card` had no boundary at all** —
no fill step, no edge. It shipped, and it was visible in the repo's own dashboard
preview as one flat white sheet.

Two things make this worth a section of its own:

- **Every doc had already been rewritten for the fixed state.** `card.css`'s
  header comment ("`#ffffff` on `#f2f2f7` in light (1.12:1)"), `CLAUDE.md`'s hard
  rule, and the `jrk-design` skill all described the tinted page. So reading the
  prose confirmed a state the tokens did not implement, and no amount of
  cross-reading the docs would have caught it.
- **The tell was inside the token itself.** `canvas`'s own `$lightNote` said "the
  page is tinted again, so the 1.12:1 step to the white card IS the tile boundary"
  while `light` said `#ffffff`. **When a note disagrees with its own value, suspect
  a half-finished revert** — the note is usually the newer of the two, because
  prose gets rewritten in the same breath as the decision and the value needs a
  separate edit.

`npm test` passed throughout, in both states, and it always will: the gate
measures ink against surfaces, and a page that is too light only ever *raises*
text contrast. **No gate anywhere checks that a surface still separates from its
neighbour.** That is the standing hole this cost, and the reason to re-derive the
1.12:1 / 1.17:1 steps by hand whenever a surface moves.

## conventions.md validation log

The base skill requires re-validating the header against every fresh build rather
than rewriting it. Result on **2026-07-31**: all 40 enumerated classes, all 41
enumerated tokens, `setTheme`, the `guidelines/guides/*.md` paths, and every prop
in the idiomatic example (`Card.title/subtitle/actions/raised`, `Delta.vs`
required, `Delta.upIsGood`, `Stat.delta: DeltaProps`, `Badge tone="serious"`,
`Button variant="secondary" size="sm"`) verified against the built artifacts.
**Zero stale names.** The four surface/text values in its light/dark table were
read, not grepped, and all four still match (`#f2f2f7`/`#141416`,
`#ffffff`/`#1c1c1e`, `#ffffff`/`#2c2c2e`, `text.primary` dark `#ebebf0`).

All three "live traps" were re-confirmed present in the build, i.e. still real
library bugs and still worth documenting: the `.jrk-grid` double-book
(`_ds_bundle.css` still carries the unscoped `.jrk-grid line, .jrk-grid path`),
`BarList`'s missing `--series` default (no `.jrk-bars { --series: … }` rule
exists), and `svg { display: block }` in the base reset with `.jrk-icon` setting
no `display`, which leaves its `vertical-align: -0.14em` inert.

Added this run: the **dash-channel** rule, so the agent is told hue alone fails
at `(n, n+4)` and how to opt into the redundant encoding. Deliberately **not**
added: `.jrk-content--document`, which is still uncommitted branch work — add it
once `design/inter-dark-mode-and-doctrine` merges (it has a real "never on a
dashboard" trap and belongs in the traps list).

**2026-08-07 — six false statements found and corrected. This is the run that
proves the header needs READING, not grepping.** The mechanical pass was clean
both times: 36 tokens and 59 classes all verify against the built closure (the
only "miss" is `jrk-block__element--modifier`, which is the naming *pattern*, not
a class), every component named exists under `components/`, `setTheme` is in the
bundle, and `cta` / `danger-solid` are both in the emitted `Button.d.ts`. What was
wrong was **values and mechanisms**, none of which any grep can see:

1. "systemIndigo accent" — the accent has been a blue at hue 212° (`#0069d9`)
   since the stepped-blue change. Corrected, with the reason both Apple blues are
   rejected.
2. light page `#f2f2f7` — was true when written, then false while the token said
   `#ffffff`, and true again now. See the half-revert section above.
3. dark card `#1c1c1e` → `#232326` (the card was lifted to widen the fill step).
4. "the dark card is only a 1.08:1 fill step off the page, so **in dark the
   hairline is what makes a card read as a card** — never remove a card's border
   in dark." Wrong twice over: the step is 1.17:1, and `.jrk-card`'s border is
   `transparent`. This one actively instructed the agent to do the opposite of
   what the library does, which is the worst failure mode for this file.
5. "`.jrk-card` ships a `--jrk-border-subtle` edge" — it ships
   `border: 1px solid transparent`; `--outlined` is what colours it in.
6. "marks are measured against `#ffffff` / `#1c1c1e`" — dark is `#232326`.

Added the same run, because they are what an agent gets wrong by default:
the **two button volumes** (`primary` is tinted, `cta` is the solid accent and
there is at most one per view), the **accent wash family** in the token list with
the reason `-wash-text` exists (the anchor is 4.49:1 on the wash), and the
**tinted selection pill** shared by the nav row and the segmented thumb, including
why its semibold is structural rather than styling.

**The lesson for the next run: items 3-6 all trace to ONE change** (the surface
rework), and the header was validated as clean in between. When a surface or a
component's default classes move, re-read every sentence in this file that
mentions a *number* or a *mechanism* — the name-greps will pass regardless.

Two warns appeared in the Jul 2026 sync and were **resolved by config**, so they
should not return. Do not re-diagnose them from scratch if they do:

- `[FONT_MISSING] "SF Mono"` → `cfg.runtimeFontPrefixes`. (The `"SF Pro Text"` /
  `"SF Pro Display"` pair that used to appear here is gone — those families were
  dropped from `font.family.sans` when the sans stack moved to Inter-first.)
  See **Fonts** above; this is deliberate, not a gap.
- `[GRID_OVERFLOW] ChartCard (WithActions)` → `cfg.overrides.ChartCard.cardMode
  = "column"`. That export puts a 30d/QTD/YTD ButtonGroup **and** the "Show
  table" toggle in the header, which is wider than a multi-column grid cell, so
  the product card cropped it. Column mode gives each export the full card
  width. `BarList`, `Tag` and `Card` were already column for the same reason —
  **any new export that puts controls beside a title will need it too.**

The four original pre-authoring warns (`[RENDER_THIN]` on ChartCard/Stat/Sidebar,
`[RENDER_BLANK]` on Sparkline) were floor-card artifacts and cleared once
previews were authored.

## CRLF silently invalidates preview verification — READ THIS FIRST

**Diagnosed Jul 30 2026. This one costs a full re-verify if it recurs.**

`core.autocrlf=true` is set on this machine and the repo has **no
`.gitattributes`**. `sourceKeyFor` in `lib/sync-hashes.mjs` hashes
`.design-sync/previews/<Name>.tsx` **raw bytes**, so a CRLF working copy produces
a different key than the LF copy the anchor was recorded from — and the component
re-verifies and re-grades for no semantic reason. The generated `.prompt.md`
inherits the CRLFs too, so its `sourceHash` moves and it re-uploads.

Symptom this run: `Icon`, `List` and `ListRow` came back `changed` with the note
`contract changed`, while their `.d.ts` and `.jsx` hashes were **identical** —
only `.prompt.md` moved. Those were exactly the three previews whose working copy
had CRLF (53 and 44 CR lines in the generated prompt.md; every other component: 0).
Converting the three files to LF flipped the verdict from `3 changed` to
**37 verified-by-upload, 0 changed** — proof the anchor was recorded from LF.

Diagnose in one command:

```sh
for f in .design-sync/previews/*.tsx; do grep -qU $'\r' "$f" && echo "CRLF: $f"; done
```

Fix: convert to LF (`perl -pi -e 's/\r\n/\n/g' <files>`) and re-run the driver
**before** grading anything — otherwise you hand subagents re-grade work that
does not exist.

**`.gitattributes` did not retroactively fix the blobs, and that was cleaned up
on 2026-07-31.** The file pins `eol=lf`, but eight tracked files under
`.design-sync/` predated it and had **CRLF baked into their git blobs**:
`NOTES.md`, `config.json`, `conventions.md`, `prepare.mjs`, `tsconfig.dts.json`
and the `docs/{Icon,List,ListRow}.md` stubs. `git status` warned "CRLF will be
replaced by LF the next time Git touches it" on each. They are all LF now
(`perl -pi -e 's/\r\n/\n/g'`), and the scan below should stay empty:

```sh
for f in $(git ls-files .design-sync); do grep -qU $'\r' "$f" && echo "CRLF: $f"; done
```

Two findings from doing it, because the cost was **not** where it looked:

- **A frontmatter-only docs stub is immune.** Normalizing
  `docs/{Icon,List,ListRow}.md` changed **no** output: only the parsed `category`
  and `keywords` values are consumed, never the stub's bytes, so all three stayed
  `unchanged` in the diff and needed no re-grade. The CRLF hazard is specific to
  files whose **content** reaches an artifact — `previews/*.tsx` (embedded into
  `## Examples`) and `conventions.md` (embedded verbatim into `README.md`).
- **`conventions.md` was the one that mattered, via `auxSha` — and this is the
  most likely explanation for the "differing byte never isolated" mystery
  recorded under Re-sync risks.** Normalizing it changed `README.md` and nothing
  else, moving `auxSha` (`2d2ad86b…` → `ec3890ee…`) with `bundleSha12`, `styleSha`
  and every `sourceKey` untouched — i.e. **exactly** the reported symptom
  (`upload: docs` alone, no rendering impact, no visible content diff). An
  invisible whitespace flip is precisely the kind of byte that a line-by-line
  README comparison would miss. If `upload: docs` ever recurs on a no-change run,
  check line endings **first**. Without it the fix is
temporary: `git status` reports the LF files as modified with **no content diff**
(`git diff -w --ignore-cr-at-eol` is empty) and warns "LF will be replaced by
CRLF the next time Git touches it" — i.e. the next checkout re-breaks it. If
`.gitattributes` is ever removed, this returns, and on a fresh Windows clone it
would hit **all 37** previews at once, not three.

## `seriesColor` / `seriesShape` are NOT in the uploaded bundle

`CLAUDE.md` names both (`seriesColor(8)` throws on purpose; `seriesShape(i)` is
"mandatory on scatter"), so it is natural to reach for them when writing
agent-facing docs. **Do not.** Grepping `_ds_bundle.js` for
`seriesColor|seriesShape|seriesDash` on 2026-07-31 returned nothing —
`window.JrkDesign` exposes 43 exports (37 components + `setTheme` and friends)
and neither helper is among them. They are internal to `Chart.tsx` and/or live
only in the `dataviz` skill, so a design agent given those names would write code
that does not resolve. The dash channel **is** reachable, but only through CSS:
`--jrk-chart-dash-1…8`, surfaced by `.jrk-s1…8` as `--series-dash` and consumed
under `.jrk-chart[data-encoding=redundant]`. That is what `conventions.md`
documents, and it is why it documents it that way.

## Re-sync risks — what can silently go stale

- **No gate anywhere checks that a surface still separates from its neighbour**,
  and that is how a flat white page shipped with unbounded light cards for a whole
  period. `validate` measures ink against a surface, so a page drifting *toward*
  its card only ever raises text contrast and the gate gets quieter as the bug gets
  worse. Whenever a `surface.*` value moves, re-derive the page-to-card step by
  hand (it should be ~1.12:1 light, ~1.17:1 dark) and look at a light-mode card.
  Full account in the half-revert section above.
- **A `$note` that disagrees with its own `light`/`dark` value is the signature of
  a half-finished revert**, because prose gets rewritten with the decision while the
  value needs a separate edit. Worth a scan whenever a surface question comes up:
  `canvas`'s note described the tinted page while its value said `#ffffff`.
- **The two segmented controls and the nav pill are now maintenance-coupled to the
  BUTTON.** The thumb and the current-page row both borrow `accent.wash` +
  `accent.washText` + semibold from `.jrk-btn--primary`. Re-tone the tinted button
  and you silently re-tone selection everywhere; the only thing keeping a chosen
  segment distinguishable from a plain tinted button is the hairline
  (`accent.washBorder` vs `border.accent`) and the well around it. `CLAUDE.md`
  carries the rule; this is the note for whoever changes the button next.
- **The light page was `#ffffff` and every tile was unbounded in light. FIXED
  2026-08-10** (`canvas.light` and `subtle.light` back to `#f2f2f7`). This entry
  used to say the defect was live and that `conventions.md` documented a state the
  rest of the repo called wrong; the instruction attached to it — "if someone fixes
  `canvas.light`, that table and the 'no boundary in light' paragraph must be
  re-read in the same change" — was followed, and both were rewritten for the
  restored 1.12:1 step. Kept rather than deleted because it is the worked example
  of the rule above it: the fix and the prose that describes it have to move
  together, and the header is the copy that reaches the design agent.
- **A converter upgrade can invent warns on components nobody touched.** Watch
  `scriptsSha` in the anchor versus the fresh `_ds_sync.json`: when it moves, new
  `[...]` lines on `unchanged` components are the check getting stricter, not a
  regression you caused. That is how `[GRID_OVERFLOW] NavMenu` appeared on
  2026-08-09. Diagnose from that first; do not go hunting in the component.
  **Follow-up:** on 2026-08-07 a later session re-diagnosed that same warn from
  scratch and resolved it with `cfg.overrides.NavMenu = {cardMode: single,
  primaryStory: Open, viewport: 900x700}`, which is a real improvement to the card
  and is now in the config — so the warn should not reappear. The cost of not
  reading this entry first was one wasted diagnosis, which is exactly what it
  exists to prevent.
- **A preview can be cropped horizontally with every flag green** — see the
  harness-width section. Read the sheet.

- **A re-sync can report `upload: docs` with nothing else changed.** Seen once
  (Jul 2026, the run immediately after the Icon/List/ListRow sync): every
  component `sourceKey`, `styleSha` and `bundleSha12` matched the anchor exactly,
  but `auxSha` differed, so `upload.any` was true for the docs surface alone.
  `auxSha` covers only `guidelines/` + `README.md` (see `auxShaFor` in
  `lib/sync-hashes.mjs`) — **it has no rendering or verification impact.**
  **Probable cause found 2026-07-31 — see the CRLF section: `conventions.md` is
  embedded verbatim into `README.md`, and its blob was CRLF while
  `.gitattributes` wanted LF, so a line-ending flip moved `auxSha` and nothing
  else. That matches this symptom exactly. Check line endings before re-opening
  this investigation.**
  Checked at the time: two consecutive builds produced byte-identical README and
  guidelines (so the build is deterministic), the README's generated body matched
  the uploaded one line for line, `guidelines/index.md` was byte-identical
  remotely, and the guide files matched their unchanged sources. The differing
  byte was never isolated. **If this recurs, don't spend time on it** — confirm
  `bundle`/`styling`/`components` are all false in the verdict, re-upload, and
  move on. Only investigate if `styleSha` or a `sourceKey` also moved.
- **`docs/LineChart.md`'s hand-written `## Examples` can drift from
  `previews/LineChart.tsx`.** Added 2026-07-31 to recover the section the doc
  body suppresses (see **Grouping**). It duplicates the ChartCard-wrap and
  single-series-area compositions by hand, so a change to the preview's props or
  a rename does **not** propagate, and no gate reads it. The mechanical checks
  all pass either way — this needs eyes. Same failure class as the
  `preview/*.html` vs `previews/*.tsx` split at the bottom of this list, now with
  a third copy of the same examples.
- **Styling churn never re-verifies components, which is right until the CSS
  change is a big one.** This run is the worked example: commit 829ebab added 77
  lines to `css/components/chart.css` plus the colorblind token set, and the
  diff still reported **36 verified-by-upload, 1 changed** — because the
  verification partition keys on `sourceKeys` (the authored `.tsx` + preview
  config), and `styleSha` moving does not invalidate a grade. That is the
  designed behaviour and you should not `--force` around it. What you **should**
  do after a large CSS or token change is Read the three
  `_screenshots/contact-sheet-N.png` sheets, which cover all 37 cards for the
  cost of three images. Done 2026-07-31: all clean.
- **`conventions.md` goes stale the moment a token value changes, and nothing
  gates it.** The Jul 30 2026 run found **two** false statements in the header the
  design agent is given: the dark page plane was still documented as `#000000`
  (it is `#141416`), and "Cards are borderless and separate by fill" — which was
  never true, since `.jrk-card` has always shipped a `--jrk-border-subtle`
  hairline and `Card.tsx` renders the bare class. A wrong value here is worse than
  no value: the agent trusts it and emits off-brand output that no gate catches.
  **When `tokens.json` surfaces or a component's default classes change,
  re-read `conventions.md` against the fresh build** — the token/class/name
  greps in the base skill's validation pass catch names that vanish, but NOT a
  name that still exists with a different value. Those need reading.
- **Always invoke the driver from the repo root, and never leave a shell cwd
  inside `ds-bundle/`.** `resync.mjs` resolves `--out ./ds-bundle` against the
  cwd, and `DesignSync(finalize_plan)`'s `localDir` does too — a shell parked in
  `ds-bundle/` produced `lstat 'ds-bundle\ds-bundle'` on finalize_plan and a
  `Cannot find module` on the driver. Worse, on 2026-07-31 one driver run failed
  with `build.ok: false` and a nonsense `"shape": "storybook"` in the verdict
  envelope purely because a prior shell still held `ds-bundle/` as its cwd while
  the build tried to delete and recreate it (Windows keeps the directory locked).
  Re-running from the root fixed it with no other change. **A `shape` of
  `storybook` in a failure verdict for this repo is that symptom, not a real
  detection flip** — `cfg.shape` is pinned to `package` and the log line
  `[DETECT] … → shape=package` proves it. Pass `localDir` as an absolute path if
  in doubt.
- **The toolchain can disappear from under a run.** Mid-run on Jul 30 2026,
  `node_modules/`, `.ds-sync/`, `ds-bundle/`, `guides/` and the `index.d.ts` shim
  all vanished between two commands — every gitignored path, while every
  untracked *source* file (`css/fonts.css`, a new skill reference) survived, so it
  was **not** `git clean -fdx`. Cause never identified. Recovery is just the
  fresh-clone block above and it is cheap (~10s): `npm ci`, `npm i --no-save
  react react-dom`, re-stage `.ds-sync/`, install its deps, re-run
  `prepare.mjs`. The playwright **browser** cache lives outside the repo
  (`%LOCALAPPDATA%/ms-playwright`) and survived, so no 200MB re-download — but
  check the pin still matches (`playwright-core/browsers.json`; 1.62.1 ↔ chromium
  build 1234 at the time of writing).
- **A new component that imports from outside `react/src/` can break the
  declaration emit** — see the `rootDir` section at the top. The failure is
  TS6059 from prepare.mjs while `npm test` stays green, so it looks like a
  design-sync bug rather than a repo one. `dist/` imports are covered now.
- **`.design-sync/tsconfig.dts.json` and the `index.d.ts` shim string in
  prepare.mjs are coupled.** Changing `rootDir` moves where `index.d.ts` is
  emitted; both must move together or the converter reports `[ZERO_MATCH]` while
  exiting 0.
- **The prep step is not part of the driver.** `resync.mjs` does not run
  `prepare.mjs` for you. Skip it after editing `tokens.json`, a component, or
  `css/`, and the sync ships a stale bundle, stale `.d.ts`, or stale flattened
  CSS while the repo looks correct. Always run prepare first.
- **`.ds-sync/node_modules` is gitignored** but `cfg.extraFonts` depends on it.
  A fresh clone that skips the `@fontsource` install produces a bundle with no
  fonts and **no error** — validate only warns `[FONT_MISSING]` when the CSS
  references a family it can't find, and here it would find nothing to warn
  about. Check `ds-bundle/fonts/` is non-empty after a build.
- **The `.d.ts` shim is generated at the repo root** (`/index.d.ts`, gitignored).
  If the library ever adds a real `types` field to `package.json`, delete the
  shim logic from prepare.mjs — the two will fight.
- **Grouping depends entirely on `.design-sync/docs/`.** Add a component without
  adding its stub and it silently lands in `general`.
- **SEVERAL BRANCHES SYNC INTO THIS ONE PROJECT, AND EACH UPLOAD REPLACES THE
  OTHERS' BUNDLE. This is the biggest hazard in this file.** `_ds_bundle.js`,
  `styles.css`, `README.md` and `_ds_sync.json` are single, project-wide files. A
  sync from any branch overwrites them with a build of **that branch's** component
  set, so every component the branch lacks keeps its `components/<group>/<Name>/`
  files and its card while losing its `window.JrkDesign.<Name>` export — the card
  then renders nothing, and the anchor no longer mentions it, so no later diff will
  ever repair or delete it.

  It has happened at least twice. On 2026-08-10 a sync from a branch 9 commits
  behind `main` replaced a 45-component bundle with a 43-component one and broke
  the `OrgChart` / `OrgNode` cards that `main` had just published (PR #9,
  commit 24d7d6f); it also replaced `main`'s corrected `conventions.md` in
  `README.md`. Restored the same day by re-running the sync from `main`.
  `AuthLayout` / `SsoButton` are the standing case: they come from
  `design/sso-login`, are not on `main`, and stay broken in the project until that
  branch syncs again or merges.

  Rules that follow, and they are cheap:
  1. **`git fetch` and confirm you are not behind `main` before syncing.** The
     driver cannot warn you — a stale branch is a perfectly valid build.
  2. **Prefer syncing from `main`**, or from a branch freshly merged with it.
     Feature-branch syncs are for previewing that branch's own components and
     should be re-synced from `main` afterwards.
  3. Compare the component count against `list_files`: fewer components in your
     build than directories under `components/` in the project means you are about
     to orphan the difference.
  4. **Never hand-add an orphan to a plan's `deletes`** to "tidy up" — it is
     another branch's work. Fix it by syncing from a tree that has it.

  Also in the project and correctly left alone: `templates/line-assignments/` and
  six `uploads/*.png`, which are authored in the pane, plus `_ds_manifest.json` /
  `_adherence.oxlintrc.json` / `.thumbnail`, which the app's self-check regenerates.
- **A competing sync mechanism exists in this repo.** `scripts/sync-manifest.mjs`
  + the `sync:check` npm script + a README section describe a *manual, one-way
  push of raw repo source* (`react/src/*.tsx`, `preview/*.html`, `package.json`)
  to a design project — a different shape from what design-sync uploads
  (compiled bundle + per-component cards + `_ds_sync.json`). They target
  different projects today, but the README documents the other workflow as *the*
  workflow. **Reconcile these before the next sync** or the two will fight over
  which project is canonical. There is also an older project literally named
  "Design System" holding a raw source dump.
- **Authored previews are not gated on placeholder content.** Two of the three
  previews added Jul 2026 shipped literal `t3_pct` / `value` in their trailing
  value column (`List.WithDetail`, `ListRow.Variants`). Every mechanical check
  passed — the cells render, are styled, are the right height — because no gate
  reads the *words*. Only reading the sheet catches it. **Read every new
  preview's sheet before grading it `good`.**
- Only Inter/mono **latin** subsets ship. A non-latin glyph falls back silently.
- The `preview/*.html` gallery and `.design-sync/previews/*.tsx` are now two
  parallel sets of examples. A component API change needs both updated; nothing
  cross-checks them.

## The light page is #ffffff and every tile is unbounded in light — READ THIS

**Found 2026-08-09 while validating `conventions.md` against the build. This is a
library defect, not a sync one, and it is currently shipping.**

`color.surface.canvas.light` is **`#ffffff`**, identical to
`color.surface.default.light`. The card-on-page fill step in light is therefore
**1.000:1**, and `.jrk-card` ships `border: 1px solid transparent`. So in light
mode a card has *no boundary of any kind* — not a fill step, not an edge. Dark is
healthy at 1.174:1 (`#232326` on `#141416`).

Git says exactly how it happened, and the doctrine predicted it:

- `2b89411` "Give tiles a brand edge, then flatten the light page to white" set
  `canvas.light` `#f2f2f7` → `#ffffff`. That was legitimate **as half of a pair**:
  the 2px `#48a9df` brand edge did the bounding.
- A later change removed the brand edge and made the card border transparent —
  and **never restored the page**. `philosophy.md`'s conflict register says
  "undo a pair together — the flat page and the heavy edge were each other's
  justification, and removing either alone leaves tiles unbounded." That is
  precisely what shipped.

Everything else in the repo already describes the *intended* state and disagrees
with the token: `CLAUDE.md` ("Light: `#f2f2f7` page, `#ffffff` cards (1.12:1)"),
`references/tokens.md`, and **the token's own `$lightNote`**, which reads "the
page is tinted again, so the 1.12:1 step to the white card IS the tile boundary."
The note and the value contradict each other in the same JSON object.

Nothing gates it: `validate` does not measure surface-to-surface fill steps, and
1.12:1 is a fill relationship WCAG has nothing to say about, so both the intended
and the broken value pass every check.

**The fix is one value** — `canvas.light` back to `#f2f2f7` — but it changes the
look of every light-mode screen in the consuming app, so it was NOT applied
inside a sync run. Left for a deliberate decision. If it is applied: re-run
`npm run validate` (light text roles are pinned against the PAGE, so
`accent.text`, `text.link` and friends must be re-measured), then re-sync, then
re-read `conventions.md` — the surface table and the "no boundary in light"
paragraph both become wrong in the good direction.

**Until then `conventions.md` documents the broken state on purpose**, because
the design agent acts on what it is told and a card it believes is bounded would
be built unbounded. It names `.jrk-card--outlined` as the remedy.

## Toolchain facts for a fresh clone on this machine (2026-08-09)

- **`npm i --no-save react react-dom` silently does nothing here.** `react` is an
  *optional* peerDependency, and npm (v11 / node 24) treats the spec as already
  satisfied — it prints "up to date, audited 4 packages" and installs neither
  package, even with `--force`. The fresh-clone block above still says to run it;
  it will not work. Install into a scratch dir and copy in:
  ```sh
  mkdir /tmp/rd && cd /tmp/rd && echo '{"name":"t","private":true}' > package.json
  npm i react@^19 react-dom@^19
  cp -r node_modules/react node_modules/react-dom node_modules/scheduler <repo>/node_modules/
  ```
  `package.json` / `package-lock.json` stay clean, which is the point of
  `--no-save` anyway. Verify with `ls node_modules/react` before building —
  without it the bundle and `_vendor/` are wrong and nothing says so loudly.
- **There is no playwright browser cache on this machine** (`%LOCALAPPDATA%/
  ms-playwright` is absent — the one NOTES recorded in Jul 2026 is gone). Do
  **not** spend the ~200MB `npx playwright install chromium`: both
  `package-validate.mjs` and `package-capture.mjs` honour **`DS_CHROMIUM_PATH`**,
  and the system Chrome works:
  ```sh
  export DS_CHROMIUM_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe"
  ```
  Verified against playwright-core 1.62.1 driving Chrome 151 — 45/45 previews
  rendered and every screenshot captured. Install the npm packages with
  `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` so the postinstall does not fetch anyway.
- npm's `allow-scripts` policy blocks esbuild's postinstall with a warning. It
  does not matter — `@esbuild/win32-x64` ships the binary as an optional dep and
  `esbuild.transform` works. Do not "fix" it by approving scripts.

## The preview harness crops WIDE cells too, not just tall ones

The harness note above says taller content is silently cut at 900x700. **Width
behaves the same way and it bit `OrgNode.Rollup` on 2026-08-09.** The org chart
scrolls horizontally by design (`.jrk-org-scroll`), so an oversized tree does not
overflow the page — it just sits in a scroll box that a *screenshot cannot
scroll*, and the sheet shows a tree sliced down the right edge. Nothing flags it:
the render check passes (root non-empty, not thin, not blank) and `[GRID_OVERFLOW]`
did not fire on that export.

Measured: five leaves = **1024px** inside an 860px scroll box. Trimmed to four
leaves = 852px and it fits. Arithmetic for the next person — each leaf costs
`--jrk-org-node` + 2x`--jrk-org-gutter` (176 + 16 = 192px), and **every nesting
level adds another 16px per node**, which is why 5x192 = 960 measured 1024.

Rule: **look at the sheet, do not trust the flags** — this is the same lesson as
the `t3_pct` placeholder finding, in a different dimension.

## conventions.md validation log — 2026-08-09

Re-validated against the fresh build per the base skill. Mechanical pass: 60
classes and 16 tokens enumerated, **all resolve** in `_ds_bundle.css` /
`styles.css`; all 14 named components exist as `components/<group>/<Name>/` dirs.
(`jrk-block__element--modifier` reports missing and always will — it is the
naming *pattern*, not a class.)

**Five statements were stale and were corrected** — all five predate the
`design/inter-dark-mode-and-doctrine` merge (`c6b3455`), which is the worked
example of this file's own warning that a *value* change is invisible to a name
grep:

1. "systemIndigo accent" → the accent is `#0069d9`, hue 212°, explicitly not an
   Apple colour.
2. Dark card `#1c1c1e` → `#232326` (it was lifted when the brand edge went).
3. "the dark card is only a 1.08:1 fill step" → 1.174:1.
4. "**Cards carry a fill AND a hairline** … `.jrk-card` ships a
   `--jrk-border-subtle` edge … never remove a card's border in dark" → flatly
   false against the build, which reads `border: 1px solid transparent`. Replaced
   with the edge-is-a-colour-change rule, the automatic nested-tile hairline, and
   the light-mode no-boundary warning above.
5. "every pair that collapses under simulated dichromacy is `(n, n+4)`" → wrong,
   and its own example disproved it (orange|yellow is slots 2 and 4). Corrected
   to **same-parity**; see the matching fix in `CLAUDE.md` and
   `scripts/validate-colors.mjs`.

**Added:** the two-button-volume rule (`primary` tinted vs `cta` solid, one per
view — new API surface the agent would otherwise misuse), `jrk-org`, and the
`jrk-content--document` trap that the Jul 31 log deferred until that branch
merged. It has merged, so it is in.

Header is 9,898 chars — well inside the ~31.9k inline-truncation limit.

## A `var()` inside a custom property resolves where it is DECLARED

**Cost one debugging cycle on 2026-08-09 and the failure is completely silent.**

The org rollup keyline carries a texture channel built from gradients that
reference the group colour:

```css
--jrk-org-tex-dash: repeating-linear-gradient(to bottom,
  var(--jrk-org-group) 0 6px, transparent 6px 10px);
```

Declaring those four on `.jrk-org` — the obvious home, next to the other
`--jrk-org-*` knobs — makes **every texture silently disappear**. Custom property
substitution is lazy in the sense that the *token stream* is stored unresolved,
but a `var()` inside that stream is resolved at computed-value time against the
element the property is **declared** on, not the element it is eventually used
on. `--jrk-org-group` does not exist on `.jrk-org`, so all four resolve to the
guaranteed-invalid value (the empty token stream), `--jrk-org-group-texture`
inherits that emptiness, and the `::before` falls through its fallback chain to
the plain colour. Result: eight identical solid keylines, no console error,
`check:css` clean, and it looks exactly like the feature was never wired up.

Diagnosed by reading `getComputedStyle(card, '::before').backgroundImage` and the
node's own `--jrk-org-group-texture`, which came back as an **empty string**
while `--jrk-org-group` on the same element was correct — the two are set by the
same rule block, which is what makes it confusing.

**Fix: declare them on `.jrk-org__node`**, the same element the rollup rules set
`--jrk-org-group` on. Non-rollup nodes have no group colour, so they stay invalid
there too — which is the correct default, since the fallback then lands on
`transparent`.

Generalises: **any `--jrk-*` value in this library that embeds `var()` must be
declared on an element where the referenced property already resolves.** If a
token-built value ever "does nothing", check that first.

## The rollup encoding — what is guaranteed, and the ceiling

Added 2026-08-09 after "verticals can have 15+". Numbers measured with
`scripts/cvd.mjs` at validate's own dE 10 floor, both themes.

- Texture is `ceil(slot / 2)` — slots 1-2 solid, 3-4 dashed, 5-6 dotted, 7-8
  double-rail. **Derived, not chosen:** every collapsing pair in the palette is
  same-parity, so pairing slots up puts each bucket's members an odd distance
  apart (odd distances never collapse) and separates all nine collapsing pairs
  by texture. Re-derive if the palette order changes.
- **First 8 groups: 0 unseparable pairs** (was 9 on hue alone).
- **Ceiling is 3 x textures.** Only three hues here are pairwise CVD-safe (blue,
  orange, mint = the declared all-pairs cap of 3), so four textures cap the
  theoretical maximum at 12. Getting 12 needs a non-canonical slot order, which
  the palette forbids re-deriving. Ships 8.
- **At 15 groups: 7 unseparable, all of them exact repeats** (groups 1&9, 2&10,
  …) — down from 37 on hue alone. Zero CVD collisions, zero adjacent collisions.
- **Why no lap shift.** Shifting texture on lap 2 kills the exact repeats and
  scores better (4 unseparable at 15 vs 7) — and was rejected. Its failures are
  CVD-only: they look correct to the author and land only on the ~8% who cannot
  see them. An exact repeat is visible to everyone and gets fixed. Do not
  "improve" the score by reintroducing it.
- **The rail is height-independent on purpose.** Three vertical rhythms plus one
  horizontal split; a fourth rhythm coarse enough to differ from `dash` fits one
  dash in the ~18px keyline of a single-line card and reads as solid. Verified
  against a one-line-card row in both themes. Any future texture must clear the
  same test.

## prepare.mjs is not part of the driver, and the way it bit me is worth reading

The "Re-sync risks" bullet already says this. Here is the concrete failure from
2026-08-09, because the symptom points at the wrong file.

Sequence: edited `css/components/org.css` (moved the texture custom properties
onto `.jrk-org__node`), ran `npm run check:css` — clean — then `npm test` — clean
— then the driver. The driver rebuilt the bundle, re-rendered 45/45 previews,
validated clean and produced a healthy verdict. **And the shipped keylines were
all solid**, i.e. the exact symptom of the bug I had just fixed.

Cause: `cfg.cssEntry` is `.design-sync/.cache/jrk-flat.css`, generated by
`prepare.mjs` from `css/index.css`. `resync.mjs` does not run it, and `npm test`
runs `build-tokens` + `build-guides`, **not** prepare. So the flattened file
still held the pre-fix CSS, and `_ds_bundle.css` was faithfully built from it.
Every gate passed because every gate was reading a consistent — and stale —
input.

What made it findable: **looking at the rendered card**, then diffing where the
declaration landed:

```sh
node -e "const s=require('fs').readFileSync('ds-bundle/_ds_bundle.css','utf8');
const i=s.indexOf('--jrk-org-tex-solid');console.log(s.slice(i-200,i+80))"
```

The bundle said `.jrk-org {` where the source said `.jrk-org__node {`. That
one-line check is the fastest way to prove a CSS edit did or did not reach the
bundle.

**Rule: after ANY edit under `css/`, run `node .design-sync/prepare.mjs` before
the driver.** A green validate proves nothing about freshness.

## Python text-mode writes produce CRLF and poison the anchor

**Caught 2026-08-10, one turn before it would have shipped.** The CRLF section
above says a CRLF `previews/*.tsx` invalidates a component's verified state. Here
is the mechanism that produced one, because it is not a checkout this time:

`io.open(path, 'w', encoding='utf-8')` in Python uses `newline=None`, which
translates every `\n` to `os.linesep` — `\r\n` on Windows. Patching
`.design-sync/previews/AuthLayout.tsx` with a Python script therefore rewrote the
whole file as CRLF while `git status` said nothing useful and `npm test` stayed
green. `sourceKeyFor` hashes those bytes, so the anchor was about to be recorded
from CRLF and **every future LF checkout would have re-verified and re-graded
that component for no semantic reason.**

Two details worth keeping:

- **The tell is `git checkout`/`git stash`, not the editor.** The warning
  `"in the working copy of '<file>', CRLF will be replaced by LF the next time
  Git touches it"` appeared during a `git stash push`. That line is the cheap
  signal; do not dismiss it.
- **It does not fire consistently.** `SsoButton.tsx` was patched by the same
  script in the same run and stayed LF. So a per-file scan is the only reliable
  check — a spot check of one file proves nothing.

Prescription, in order:

```sh
for f in $(git ls-files) $(git ls-files --others --exclude-standard); do
  grep -qU $'\r' "$f" 2>/dev/null && echo "CRLF: $f"
done
perl -pi -e 's/\r\n/\n/g' <the offenders>     # then re-run the driver
```

Expect the grade to CLEAR when you normalize — the sourceKey moves, which is the
system working. Re-read the sheet and re-write the same verdicts; the render is
byte-identical, only the line endings moved. Doing it in this order costs one
capture; doing it after upload costs a full re-verify on someone else's machine.

**Prefer `Write`/`Edit` over Python for anything under `.design-sync/`.** If a
script must do it, open with `newline=''`.

`.gitattributes`, `.gitignore` and `LICENSE` are CRLF in this repo and always
have been — no extension rule covers them and nothing hashes them. Leave them.

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

**`SF Pro` / `SF Mono` in the stack are deliberate and unshippable.**
`tokens.json` now leads both stacks with the Apple system families
(`-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', Inter, …`),
with its own `$comment` explaining why: Apple hardware gets the real face, and
Inter is the closest widely-available analogue for everyone else. Apple publishes
no SF webfont and the outlines are theirs — the same reason this library ships no
SF Symbols — so they can never go in `fonts/`.

That made validate print `[FONT_MISSING] "SF Pro Text", "SF Pro Display"`. The
resolution is **`cfg.runtimeFontPrefixes: ["SF Pro", "SF Mono"]`**, which is the
honest one: the families resolve from the OS at runtime, and the shipped Inter /
JetBrains Mono webfonts are the real fallback, not a substitute anyone chose
under duress. **This is not a substitution to re-litigate** — do not try to
"fix" it by sourcing an SF lookalike.

Tokens also name `Inter` and `JetBrains Mono`; the repo ships **no `@font-face`**.
Both are SIL OFL, so weights 400/500/600/700 (Inter) and 400/500 (mono) are
bundled from `@fontsource` via `cfg.extraFonts`. Only the weights the CSS
actually uses are wired — check `grep -r font-weight css/` before adding more.

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
- **Two `$comment` keys leak into generated CSS.** `scripts/build-tokens.mjs`
  emits `--jrk-neutral-$comment` and `--jrk-indigo-$comment` as malformed custom
  properties (unquoted values containing `:`), lines 26 and 36 of
  `dist/jrk-tokens.css`. Browsers drop them and `check:css` doesn't catch it
  (it only looks for raw hex). Harmless, but it's generated garbage.
- `react/src/Stat.tsx` comments that a flat series renders as a "centered line";
  the maths (`y = h - pad - 0`) puts it on the baseline. Comment is wrong.

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

**None outstanding — the final build prints `✓ bundle is complete` with no
warning count at all.** A warn of any kind is new; investigate, then fix or
record it here.

Two warns appeared in the Jul 2026 sync and were **resolved by config**, so they
should not return. Do not re-diagnose them from scratch if they do:

- `[FONT_MISSING] "SF Pro Text", "SF Pro Display"` → `cfg.runtimeFontPrefixes`.
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

## Re-sync risks — what can silently go stale

- **A re-sync can report `upload: docs` with nothing else changed.** Seen once
  (Jul 2026, the run immediately after the Icon/List/ListRow sync): every
  component `sourceKey`, `styleSha` and `bundleSha12` matched the anchor exactly,
  but `auxSha` differed, so `upload.any` was true for the docs surface alone.
  `auxSha` covers only `guidelines/` + `README.md` (see `auxShaFor` in
  `lib/sync-hashes.mjs`) — **it has no rendering or verification impact.**
  Checked at the time: two consecutive builds produced byte-identical README and
  guidelines (so the build is deterministic), the README's generated body matched
  the uploaded one line for line, `guidelines/index.md` was byte-identical
  remotely, and the guide files matched their unchanged sources. The differing
  byte was never isolated. **If this recurs, don't spend time on it** — confirm
  `bundle`/`styling`/`components` are all false in the verdict, re-upload, and
  move on. Only investigate if `styleSha` or a `sourceKey` also moved.
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

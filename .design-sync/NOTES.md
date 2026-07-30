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

**One outstanding**, added Jul 30 2026:

- `[FONT_REMOTE] "Inter var"` → expected and correct. `css/index.css` imports
  `css/fonts.css`, whose Google Fonts `@import` esbuild hoists into
  `jrk-flat.css` as an external URL import. Validate sees a remote font-host
  `@import` and says so. It is informational, non-blocking, and the **bundled
  `@fontsource` faces are what actually render** in the pane (its CSP blocks the
  CDN). See **Fonts**. Do not try to remove the `@import` to silence it — that
  would break Inter for every consuming app.

Anything else is new; investigate, then fix or record it here.

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

**The durable fix is `.gitattributes`, and this repo now has one** pinning
`eol=lf` for the text types whose bytes are load-bearing. Without it the fix is
temporary: `git status` reports the LF files as modified with **no content diff**
(`git diff -w --ignore-cr-at-eol` is empty) and warns "LF will be replaced by
CRLF the next time Git touches it" — i.e. the next checkout re-breaks it. If
`.gitattributes` is ever removed, this returns, and on a fresh Windows clone it
would hit **all 37** previews at once, not three.

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

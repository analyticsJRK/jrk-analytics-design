# Moving the portal onto the 2026-11-23 library

Written for: whoever syncs `@jrk/design` into `jrk-analytics-web-app` next.

The library now carries what the portal built for itself (branch
`design/portal-upstream`). **Nothing in the portal has been switched over yet.**
Sync first (`npm run sync:design` in the web app), then migrate file by file.
After the sync, run the two post-sync audits in the web app (undefined tokens; the
hand-written component import list in `apps/portal/app/globals.css` — this sync adds
`subnav`, `panel`, `mention`, `appearance`, `filter`, `tablekit`, `combobox`, `sankey`).

## Decisions still open (owner's call)

- **TableKit's name column starts at the left** (library rule). The portal centres it
  (directed 2026-10-08). Keep the app override or adopt the library rule.
- **Current rail row weight**: library keeps `semibold`; the portal uses `medium`.
- **Modal body ink**: library `text-secondary`; portal modals inherit `text-primary`, so
  they read greyer after the switch. Radius `2xl` (app `xl`); `lg` is 800px (app 860).
- **Flush tables**: the portal's white table header in non-flush cards (2026-08-21) was
  not adopted.
- **`<OrgNode tone="deep">` under vitrine light** is 1.025:1 against the panel.
- **Every `<Alert>` without an `icon` now draws its tone's glyph**; `icon={null}` opts out.

## Visible changes to expect on sync

- Vitrine status inks re-stepped (8 values); industry/midgard dark critical text;
  `danger-solid` hover in dark (was 2.82:1).
- Rail: `text-sm` + tight tracking rows, sidebar collapsed width token 72px (the app
  already overrides to 72px), `.jrk-sidebar` at overlay z-index, page-header actions wrap.
- LineChart ticks change (round 1/2/2.5/5 steps). Org cards centred; solid org variant
  is `chart.deep` under white ink (was black ink).
- Sortable centred headings gain a centring spacer — an app rule that start-aligns a
  heading the library centres will see its label move 16px (add `.jrk-col-start`).
- `svg text` is no longer stroked (the app's `portal.css` override can go).

## Tables, filters, combobox

### Deliberate differences from the app

- **Name column STARTS** (library rule) — the app centred it (`tablekit.css` 46-59, directed
  2026-10-08). Brief said keep the library rule.
- Funnel and row chevron are **24px** (`--jrk-min-touch`), app 20px; a filterable heading reserves
  32px at its end (app 28px); expandable `#` column is `3rem + 24px` (app 3.75rem).
- Slide is `--jrk-duration-base` (200ms) both ways, enter/exit easings; app 220/180ms. The JS reads
  the token off the table, so they cannot drift; reduced motion = 0ms.
- Selected row uses the library's `aria-selected` accent wash (app had a 10% color-mix).
- Funnel glyph is the library's `filter` icon (lines), not the app's filled funnel path.
- Active funnel kept the app's **solid accent** chip (loud on purpose; see filter.css comment).
- Export menu is the library `Menu` (top layer, disclosure semantics) — not `role="menu"`.
- An actions column (empty `label`) gets no sort button (the app drew one).
- `pct`/`in` format with `toLocaleString(locale)` — identical in en-US except a separator above
  1,000 ("1,234.5%" vs "1234.5%").
- A cleared filter is deleted from `view.filters` (app stored `''`).
- `.jrk-table__sort` arrow states now apply to icon arrows too (they were always painted, and faded
  on hover), and `aria-sort="none"` no longer counts as sorted.
- `tbody > tr[hidden] { display:none !important }` is scoped to `.jrk-table`.
### Left out, and why
- `urlState` / `useSearchParams` / `history.replaceState` → controlled `view` + `onViewChange(next,
  cause)`; the app keeps URL sync in a wrapper (`cause === 'search'` → debounce 300ms, as now).
  Mapping: `id.s` ↔ `view.sort` (present-but-empty = `null`), `id.q` ↔ `q`, `id.f.<col>` ↔
  `filters[col]` (already the same encoded strings), `id.closed` ↔ `closed`.
- `fetch('/api/export/table.xlsx')` → `onExport('xlsx', { filename, title, headers, rows, formats })`;
  the app posts that body (+ `align: 'center'`) itself. CSV is built in (port of `lib/csv.ts`
  quoting, BOM, Excel-safe text).
- `passNum` (the old filter-row rule) — used only by its own test.
- `showFilters` prop — already a no-op in the app.
- enhanceTable: React-fiber hydration sniffing (call it after hydration instead), and
  TableEnhancer's page scan + `plan()` heuristics (which tables to enhance) — those stay app-side.
  App selectors became options: `subLabel` (app: `.ms-sub, .ms-flagnote, .tk-sub`), `ownFilter`
  (app: `.ut-colfilter, [aria-haspopup]:not(.jrk-th__slot *)`), `decor`, `pinned`.
- Combobox: the JS-computed `--s2-ss-list` height — the panel now caps at `--jrk-menu-room` and the
  list flex-shrinks. New: it closes when its button scrolls out of view.
- useFitHeight: `.ms-main` lookup → `container` option (selector or element; default body). The
  defaults are FitTableWrap's (gutter 24, min 260). Returns `style` ready for the wrap.
### Per app file
- `components/table/filterCore.ts` → delete; `@jrk/design` (`tokens` is now `listItems`, `isActive`
  is `isFilterActive`, `BLANK` is `FILTER_BLANK`). `filterCore.test.ts` passes as-is on the import.
- `components/table/FilterButton.tsx` → `ColumnFilter` (same props + `locale`, `className`). Headings
  `tf-th` → `jrk-th--filter`; `tf-slot` → `jrk-th__slot`.
- `components/TableKit.tsx` → thin wrapper over `TableKit`: URL sync + xlsx `onExport`. Types
  `Col` → `TableKitColumn`, `ColGroup` → `TableKitGroup`, `ColType` → `TableKitColType`.
  Column classes: `tk-wrap` → `jrk-table__wrap`, `tk-sub` → `jrk-table__sub`, `tk-blank` →
  `jrk-table__blank`.
- `components/tableKitRules.ts` → `formatTableValue` (was `fmtValue`), `exportNumber`, `exportHeader`,
  `exportDate`, `shownText` from `@jrk/design`; delete `passNum` + its test block.
- `components/table/domTable.tsx` → `enhanceTable` + a portal adapter; TableFrame's `query` →
  `setQuery`, `onState` maps 1:1 (`matched`, `filtering`, plus `sort`).
- `components/table/TableEnhancer.tsx` → keep the scan/plan/hydration wait; hand each table to
  `enhanceTable`. `mk-sortable(--asc/--desc)` → `jrk-th--sortable`, `jrk-th--asc/--desc`.
- `components/snow2/SearchSelect.tsx` (30 importers) → `Combobox` (`SelectOption` → `ComboboxOption`;
  identical props). `snow2.css` 26-56 (`s2-ss*`) deletable.
- `components/TableSearch.tsx` → `TableSearch`, `SearchCount`, `useTableSearch` (default placeholder
  is now "Search…"; pass the app's "code, property or manager…" where wanted). `portal.css`
  1964-2022, 2039-2044 deletable; keep `.jrk-table tbody td.portal-search__empty` (app markup).
- `components/FitTableWrap.tsx` + `lib/useFitToViewport.ts` → `useFitHeight({ container: '.ms-main' })`.
- `app/tablekit.css` 9-194 → deletable once the above land (the `tbody > tr[hidden]` rule only if no
  non-`.jrk-table` table is still enhanced).
- `app/utility.css` 29-40 and `tablekit.css` 98-109 (`mk-sortable`) → `.jrk-th--sortable`.
- `app/modules.css` 6476-6490 (`.pinfo-th::before`), 2253-2257, 2271-2275 (roster `::before`
  spacers) → delete; see the `.jrk-col-center` note above for first columns.
- `app/mobile.css` 159-161 (field floor in a table) → now in table.css; deletable.
### App duplicates of library controls
- `sv-tabs`, `rn-tabs`, `ut-pills` → `.jrk-tabs--pills` / `<Tabs variant="pills">`.
- UBI `.seg` / `.segbtn` → `.jrk-btn-group` / `<ButtonGroup>`.
- `s2-chip` → `<Badge>` (TableKit's `shownText` already treats any `*-chip`/`badge`/`tag`/`pill`
  class as a chip, so exports are unchanged by the swap).

## Overlays, feedback, cards, badges, sheet

### Per app file

| App file | Import |
|---|---|
| `components/Modal.tsx` + `portal.css` `.portal-modal*` | `Modal` (`wide` → `size="lg"`); keep only app opt-out classes or use `align="start"` |
| `components/PendingIcon.tsx` `Spinner`, `ScreenSpinner` + `portal.css` 1134-1266 | `Spinner size="em"` (`now` → `delay={false}`), `ScreenSpinner`; nav wash comes from feedback.css |
| `lib/saving.ts` `beginSaving`, `useSaving` | `beginBusy`, `useBusy`; `SavingSpinner` → `BusySpinner` |
| `components/NavProgress.tsx` + `portal.css` 2486-2526 | `NavProgress` + `useNavProgress(\`${pathname}?${params}\`)` |
| `components/Callout.tsx` | `Alert` (title, role, default glyph); Callout's `<p>` text vs Alert's `<div>` |
| `components/ReportSection.tsx` + `pest.css` 445-555 | `Card id summary meta actions collapsible` |
| `app/mobile.css` 184-215 (card half) | nothing — in card.css |
| `portal.css` 1430-1457 flush-table block; `modules.css` worklist #8 | nothing — `:not(.jrk-card--flush)` |
| `components/SheetToolbar.tsx`; `.portal-sheet-foot` | `SheetToolbar`, `SheetFoot` |
| `components/panel/SidePanel.tsx` + `modules.css` 108-124, 169-260 | `DockedPanel`, `PanelHost` (keep `usePanel`, `CommentThread`) |
| `components/PageSkeleton.tsx` | `PageSkeleton` (`subnav` → `nav`) |
| `components/HotFlag.tsx` + `.hot-pill*` | `Badge tone="critical" onPress pressed busy title` |
| `.portal-avatar` | `Avatar` |
| `.ntf-n`, `.tsk-topbar__n` | `CountBadge overlay` / `CountBadge tone="inverse"` |
| `components/mentions/MentionBox.tsx` + `.mention-box/-list/-hl/-tag` | `MentionBox`, `MentionText`, `findMentions` (map people + groups to `{id,label,hint}`) |
| worklist #6 colbar, #7 modal margin, styling #6 badge mono | fixed here |

## Shell and navigation

### Deliberate divergences from the app

- **Current rail row stays `semibold`.** The app drops it to `medium` (portal.css 979-981). The
  library records semibold as the only where-am-I channel that survives greyscale; left for the
  lead to decide. The app can keep its one-line override meanwhile.
- **Pin's name is stable** ("Pin X") with `aria-pressed`; the app swapped the name to "Unpin X"
  as well, announcing the state twice.
- **SidebarToggle label is clipped, not `display:none`** — the app's `#collapse-btn span
  {display:none}` leaves an unnamed button in the collapsed rail. The chevron rotates to point the
  way the rail will move (the app used the same right chevron for both states).
- **BrandMark wordmark and user name are clipped, not removed, ≤720px** — the wordmark is the home
  link's only name.
- **Drawer button shows ≤720px** (where the library's drawer exists); the app shows it ≤900px and
  hides the user name ≤900px. The app can keep its 900px override.
- **Alert disc** gets `role="img"` (an `aria-label` on a bare span is not reliably announced), and
  **a closed group's tab carries its sections' alerts rolled up** — in the app an Action Center
  alert was invisible from the Property tab, defeating the 2026-09-16 direction.
- `SubNav` ALWAYS puts `actions` in the tab row and `sectionActions` in the section row (the
  app's `inRow` shape). The older side-column `.subnav-row` form is not ported.
- `subNavActive` also normalises a trailing slash and an absolute URL; otherwise the app's rule.
- `NavTypeahead` reads a strip nested in another strip once (outer wins).
### Left in the app
- Ctrl/Cmd-K palette wiring, rail search RESULTS (`NavSearchResults` — module/section matching is
  `@jrk/nav`'s `searchNav`), pins persistence (`lib/pins`), grants/`isPermitted`, the `@jrk/nav`
  model (`MODULE_SECTIONS`, `listedSections`, `railEntries`), coming-soon/lock decisions,
  theme/skin/appearance menus, `TableEnhancer`, `SavingSpinner`, `ScreenSpinner`.
- In `SubNav`'s caller: property scoping (`property(code)`), `carry` query merging, the
  "portfolio-wide — not filtered to X" hint text, which group needs a property, the SOP buttons
  (`useSops`) — all decisions about the app's nav model, passed in as `items`/`groups`/`hint`/
  `empty`/`sectionActions`.
- `PendingTab`/`PendingLink` (Next's `useLinkStatus` must be read inside the Link) — pass
  `linkAs={PendingLink}` and every SubNav tab gets it. For rail rows the app sets `pending` from
  its own hook, or keeps `PendingGlyph` as the `glyph`.
### Per app file
- `components/ModuleSubnav.tsx` → `SubNav`. Keep a thin adapter: map `MODULE_SECTIONS` to `items`
  (`href` with property/carry applied, `match` = the pre-carry href, `hint`, `alert` from
  `alerts`), build `groups` (`activeHref` = unscoped first section, `href` = `tabs[0]`-of-group
  fallback, `empty` = the property sentence, `controls` = `groupControls[g]`, `hint` = "pick a
  property first"), `defaultGroup` = the scope's group, `location={{ pathname, search }}`,
  `linkAs={PendingLink}`, `sectionActions` = SOP buttons. Delete `SectionAlert`, `tabFor`,
  `siblingClaims`, the `.jrk-subnav-*` / `.subnav-row*` rules in modules.css 3932-3963 and
  4179-4275, mobile.css 128-135, and the Vitrine strip rules in skins.css once the lead lands
  them (they key on the old classes).
- `components/Shell.tsx` → `Sidebar` (`as="aside"`, `peek`, `open={drawer}`, `search`),
  `SidebarToggle`, `NavItem` (`glyph`, `count`, `disabled`, `actions`, `sub`, `linkAs`),
  `NavDisclosure` for ModuleRow, `NavPinButton` (and `remove` for ModuleLink), `Topbar masthead`,
  `BrandMark`, `AppShell masthead`. Deletes portal.css 336-446 (masthead + brand), 682-707,
  747-767 (glyph/disabled; keep `ComingSoonRow` semantics via `disabled`), 769-905 (rows, pin,
  caret, sections), 940-942, 958-997 (except the `medium` choice), 1012-1132, 1296-1344 (chip /
  avatar ink, `.portal-drawer-btn`), and `#collapse-btn`.
- `components/SectionIndex.tsx` → `<SectionNav preset="cards" />` in the existing layout markup;
  `SECTION_HEADINGS` goes.
- `components/NavTypeahead.tsx` + `lib/navTypeahead.ts` → `NavTypeahead` (pass
  `skipText=".jrk-subnav-alert, .jrk-subnav__alert, [aria-hidden='true']"` while old strips
  remain) and the `typeahead*` helpers for its test file.
- `app/mobile.css` 184-215 page-header block → delete (now in shell.css); the card-header half
  of that block stays (card.css is not mine).

## Appearance, skins, buttons
- `lib/theme.ts`: delete `SKIN_FONT`, `VARIANT_AXIS`, `THEME_SCRIPT` → `themeScript({ storagePrefix:
  'jrk-portal' })` (same keys: `jrk-portal-theme|skin|<attr>`, link id `jrk-skin-font`).
- Replace `AppearanceMenu/ThemeToggle/SkinToggle/VariantPicker` with the library's (controlled:
  `value` + `onChange` → `applyAppearance(next, { storagePrefix: 'jrk-portal' })`, or uncontrolled with
  `storagePrefix="jrk-portal"`). Delete `.portal-appearance__*`, `.portal-huepick*` (portal.css 551-680).
- Vitrine: stamp `data-scene="clear"` on `<html>` (static attribute is enough), set
  `--jrk-vitrine-photo: url('/vitrine-scene-light.jpg'); --jrk-vitrine-photo-dark: url('/vitrine-scene-dark.jpg')`
  on `:root`; delete portal.css 2335-2486 and skins.css 27-52, 125-127, 221-236, the `.jrk-page-header`/
  `.jrk-tabs` halves of 277-314. Keep the app-class lists.
- Buttons: `.jrk-btn--good-solid` (pest.css 1478-1495) and forms.css 1262-1271 → `variant="good-solid"` /
  `"warning-solid"`; modules.css 4225-4238 and mobile.css 100-115 → delete. `BackToOverview` →
  `<Button variant="ghost" size="sm" href={href} linkAs={Link}>`.
- Expect visible changes: vitrine status inks, industry/midgard dark critical text, danger-solid hover.

## Org chart and charts

### Per app file

- `portfolio/OrgCanvas.tsx` → `OrgCanvas` (rename `--orgzoom`→`--jrk-org-zoom`; class names `.orgcanvas*`→`.jrk-org-canvas*`). Keep `.orgcanvas .jrk-org { --jrk-org-drop… }` app-side if the tight grid is still wanted.
- `portfolio/OrgChart.tsx` → `<OrgNode draggable dropTarget dropOver onDrop… tone passThrough data-*>`, `<OrgNode column><OrgGroup>` for `StateStack`, `<OrgChart groupSolid palette="generated" dragging>`; the hand-written `<li>`/`Card` and `groupStyle()` can go. Delete `.orgstack/.orgstate*`, `.orgtone--*`, `.orgpass*`, `.orgsolid--deep`, `.orgdrag/.orgdrop*` from `modules.css`.
- `portfolio/orgPalette.ts` → `generatedGroupColor/generatedGroupStyle/groupTexture`.
- `portfolio/orgTree.ts assignGroups` → library `assignGroups` (pure; adapt callers) or keep.
- `portfolio/orgExport.ts` → `chartToPng`, `printElement`, `measurePrint`, `printableBox`, `scalesFor`, `sheetCount`, `PAGE_SIZES`, `download`, `exportName(parts, ext, { prefix: 'Org chart' })`; keep the rail/role/Excel parts app-side and feed print CSS via `extraCss`.
- `portfolio/Rollups.tsx` → `<BarList items={{label,value:properties,secondary:units}} limit={12} blankLabel={blank_label} moreLabel={(n)=>…}>` (bars take slot 1, not the neutral mark).
- `portfolio/PortfolioInsightsView.tsx` SharePanel bar → `<StackBar>`.
- `charts/Sparkline.tsx`, `marketing/Submodule.tsx Spark`, `pest/landing/Panels.tsx Spark` → `<Sparkline values size="cell" tone label labels endDot baseline gaps>`.
- `habitability/TrendBars.tsx`, `utility/UbiMonthChart.tsx` (use `slot:'neutral'` for "Other losses"), `snow2/OverviewHistory.tsx SpendChart`, `OverviewSnowfall.tsx PeriodChart` → `<ColumnChart>` in a `<ChartCard table={<SeriesTable/>}>`; `snow2/bits.tsx useTip/niceMax/roundTop` → `useChartTip`, `niceStep`/`axisTicks`, `columnPath`; the two `useWidth`s → `useContainerWidth`.
- `marketing/SeriesLine.tsx`, `components/TrendChart.tsx`, `snow2/HedgeParts.tsx WinChart` → `<LineChart>` (`style`, `slot`, `tips`, `endLabels`, `fromZero`, `trend`, `band`).
- `charts/Sankey.tsx`, `ubi/CheatSankey.tsx`, `marketing/FunnelSankey.tsx` → `<Sankey>`.
- `marketing/FunnelDiagram.tsx` → `<Funnel compact minWidth stages={…unfed}>` only if the trapezoid look is dropped; otherwise it stays app-side.
- `components/MastheadBand.tsx` → `<StatRow vivid>`.
- `snow2/PropertyCompare.tsx:38` cycles `SERIES` — not portable as is; fold the tail or facet.

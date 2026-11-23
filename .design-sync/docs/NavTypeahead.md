---
category: Shell
keywords: [typeahead, type to select, keyboard navigation, jump to module, find as you type, explorer, shortcuts]
---

Type a rail row, tab or section name to jump to it — File Explorer's type-to-select.
Mount it once inside the shell; it renders nothing.

```tsx
<AppShell>
  <Sidebar>…</Sidebar>
  <Main>
    <Content>{children}</Content>
    <NavTypeahead />
  </Main>
</AppShell>
```

## What it does

- Typing moves focus to the first item whose name starts with the text. The same
  letter again moves to the next one; a pause of a second starts over.
- A later word also matches ("comps" finds "Market Comps"), but only after every name
  that starts with the text has been tried.
- With nothing focused the deepest row on the page is searched first — the section
  row, then the tabs, then the rail. With something focused, its own row leads.
- **Enter opens the item and moves focus one level down** on the new page: from the
  rail to the module's tabs, from a tab to its sections, or back to the same row when
  there is nothing below.
- Focus is the highlight — the library's focus ring, announced by a screen reader,
  and Enter works with no extra code.

## Notes

- **Levels are read off the page**, not declared: the rail plus every link-bearing
  `.jrk-tabs` / `.jrk-btn-group` in `main`. `data-typeahead` opts anything else in.
  A button-only segmented control is not a level — it switches a view.
- Letters are left alone in fields, selects and widgets that own their keys (listbox,
  menu, grid, tree, combobox, dialogs), and when a component has already handled the
  key.
- Every selector is a prop; `NAV_TYPEAHEAD_DEFAULTS` has the defaults. The matching
  rules are exported pure: `typeaheadMatch`, `typeaheadOrder`,
  `normalizeTypeaheadLabel`, `isTypeaheadRepeat`.

---
category: Actions
keywords: [menu label, section caption, group heading, menu grouping]
---

A section caption inside a `Menu` panel — what the rows under it apply to.

```tsx
<Menu label="Actions">
  <MenuLabel>This property</MenuLabel>
  <MenuItem onSelect={exportOne}>Export CSV</MenuItem>
  <MenuSeparator />
  <MenuLabel>All 37 properties</MenuLabel>
  <MenuItem onSelect={exportAll}>Export portfolio CSV</MenuItem>
</Menu>
```

## It is not a heading

It renders a `<p>` on `.jrk-menu__label`, deliberately — it labels a group of
controls rather than starting a document section. Marking it `<h4>` would inject
a phantom level into the page outline for a caption inside a transient panel, and
a screen reader's heading list would fill with menu internals.

## Notes

- Uppercase, `text-2xs`, `tracking-caps`, `text.muted` — the same caption
  treatment as `.jrk-sidebar__group-label`, so a grouping reads the same wherever
  it appears.
- **Name the scope, not the category.** "This property" and "All 37 properties"
  tell the reader which rows do what; "Options" and "More" tell them nothing and
  are a sign the grouping is not earning its line.
- Pair with `MenuSeparator` for the visual break. This one supplies the words;
  the separator supplies the rule.

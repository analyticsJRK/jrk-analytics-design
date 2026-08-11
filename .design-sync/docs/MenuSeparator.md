---
category: Actions
keywords: [menu separator, divider, rule, grouping, presentational]
---

A hairline that groups rows inside a `Menu` panel — most often the rule above a
destructive row, so it cannot be hit on the way to a benign one.

```tsx
<Menu label="Actions">
  <MenuItem onSelect={exportCsv}>Export CSV</MenuItem>
  <MenuItem onSelect={schedule}>Schedule report</MenuItem>
  <MenuSeparator />
  <MenuItem danger onSelect={remove}>Remove from portfolio</MenuItem>
</Menu>
```

## Notes

- Renders `<hr class="jrk-menu__separator">`. It takes no props, because a
  separator that needs configuring is a heading — use `MenuLabel` for that.
- **Presentational, so it is never announced.** A native `<hr>` carries an
  implicit `separator` role, which is right here: it marks a visual grouping, not
  a semantic boundary a reader needs read aloud.
- Full-bleed inside the panel, unlike `.jrk-list__row`'s inset separator. The
  panel is a menu surface with its own padding, and an inset rule inside a
  ~200px panel reads as a mistake rather than a refinement.
- **One per grouping.** Two adjacent separators, or one at the top or bottom of
  the panel, means the grouping is doing no work.
- Distance is not a confirmation. A separator makes a destructive row harder to
  hit by accident; it does not make the action safe. Forgiveness over
  confirmation — prefer undo to a rule and a dialog.

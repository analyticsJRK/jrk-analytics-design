---
category: Shell
keywords: [nav menu separator, divider, rule, grouping, presentational]
---

A hairline that groups items inside a `NavMenu` panel — the rule between a
section's own views and the things that merely live near them.

```tsx
<NavMenu label="GL quality" icon={<LedgerIcon />}>
  <NavMenuItem href="/gl/unbalanced">Unbalanced accounts</NavMenuItem>
  <NavMenuItem href="/gl/missing">Missing closes</NavMenuItem>
  <NavMenuSeparator />
  <NavMenuItem href="/gl/audit">Audit log</NavMenuItem>
</NavMenu>
```

## Notes

- Renders `<hr class="jrk-menu__separator">`. It takes no props, because a
  separator that needs configuring is a heading — use `.jrk-menu__label` for
  that.
- **Presentational, so it is never announced.** A native `<hr>` carries an
  implicit `separator` role, which is correct here: it marks a visual grouping,
  not a semantic boundary a reader needs read aloud.
- Full-bleed inside the panel, unlike `.jrk-list__row`'s inset separator. The
  panel is a menu surface with its own padding, not a grouped list, and an inset
  rule inside a 232px panel reads as a mistake rather than as a refinement.
- One per grouping. Two adjacent separators, or one at the top or bottom of the
  panel, means the grouping is doing no work.

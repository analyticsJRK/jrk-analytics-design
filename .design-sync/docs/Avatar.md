---
category: Status
keywords: [avatar, initials, user, person, account chip, assignee]
---

A person's initials in a circle — the account chip, an assignee in a row.

```tsx
<Avatar initials="DR" />
<Avatar initials="DR" size="lg" label="Dana Ruiz" />
<Avatar initials="MS" solid />   {/* on a vivid bar */}
```

## Notes

- **A mark, not a control** — it stays round under every skin.
- **Decorative unless `label` is given.** Beside the person's name it is
  `aria-hidden`; on its own it is an image named by `label`.
- `solid` is for a vivid topbar, where the wash draws no circle and the initials
  read as stray text.
- `inline-grid` with `flex: none`, so it never pushes the name beside it onto a
  second line.

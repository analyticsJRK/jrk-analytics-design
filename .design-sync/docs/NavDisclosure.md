---
category: Shell
keywords: [nav disclosure, sidebar sections, inline second level, accordion nav, caret, expand sections, module row]
---

A rail row that navigates, with a separate caret that shows its sections inline
beneath it.

```tsx
<NavDisclosure
  href="/pest"
  label="Pest Control"
  glyph="🐛"
  active={inPest}
  linkAs={Link}
  actions={<NavPinButton label="Pest Control" pinned={pinned} onToggle={togglePin} />}
>
  <NavItem sub href="/pest" icon={<Icon name="chevronRight" />} active>Overview</NavItem>
  <NavItem sub href="/pest/property" icon={<Icon name="chevronRight" />}>Property</NavItem>
</NavDisclosure>
```

## Why not `NavMenu`

`NavMenu` makes the whole row one `<button>` that opens a flyout, so a module with
sections cannot be clicked to reach its own landing page, middle-clicked or
bookmarked. Here the row is a link and the caret is a second control. An inline list
is in flow, so nothing needs placing, nothing is clipped, and nothing is covered.

## Notes

- **Uncontrolled, it opens while `active`** and stays as the reader leaves it once
  they touch the caret. Pass `open` + `onToggle` to control it.
- The sections are **unmounted** while closed, so they are not in the tab order.
- The caret is always visible and rotates on open — the list appears below.
- In the collapsed rail the caret goes and an open list stays, as its icons: hiding
  it would move every row below.
- The caret is named "Show sections in {name}"; pass `name` when `label` is not text.

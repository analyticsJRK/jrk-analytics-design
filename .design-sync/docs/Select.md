---
category: Forms
keywords: [dropdown, picker, select, options, listbox, base-select]
---

A real `<select>`. It is not a custom listbox, and that is deliberate — type-ahead,
arrow/Home/End keys, Escape, screen-reader semantics and the mobile picker all come
free and are difficult to rebuild correctly.

```tsx
<Select label="Property" defaultValue="harbor">
  <option value="all">All properties</option>
  <option value="harbor">Harbor Point</option>
  <option value="west" disabled>Westgate (no data)</option>
</Select>
```

## The open list

The closed control has always been styled. The **open list** used to be drawn by
the browser instead — a full-bleed highlight in the OS's own blue, in a square
white box, in both themes. `appearance: base-select` hands that popup back to CSS,
and the library now styles it to match the grouped list: rounded container,
hairline, 32px rows, separators inset past the leading text edge.

**Both selection and hover are quiet, and neither is an accent fill.** Selection
is accent *text* plus semibold — the same answer `.jrk-nav-flyout` gives for the
current item in a menu surface. Hover is the soft neutral wash `.jrk-menu__item`
uses.

An earlier pass gave this a checkmark column and an accent-filled hover row, which
put a saturated blue block in a resting list and made the popup the loudest thing
on a form. A list you are picking *from* should not shout: the closed control
already tells you what is chosen, so the open list only has to confirm which row
it was.

The hover token is `--jrk-surface-raised-hover`, not `--jrk-surface-hover`. A
popup is a raised surface, and `surface.hover` is identical to `surface.raised`
in dark mode — the obvious token is a silent no-op in one theme.

**Support:** Chromium only for now. Everywhere else the native popup renders
exactly as it did before, because the whole rule set sits behind
`@supports (appearance: base-select)`. Nothing in it can break a browser that does
not implement it. The consuming apps are managed-desktop Chrome/Edge, which is why
this counts as a fix here rather than a progressive enhancement.

## Notes

- Sizes: `--sm` `--lg`. Height is the constraint on a 1920x1080 desktop; never go
  below 24px.
- `--filled` for topbars and other white chrome, where a white field would
  disappear into its surroundings.
- Inside `.jrk-list__row--control` the field drops its chrome entirely and the row
  becomes the field. The border returns on focus.
- `aria-invalid="true"` colors the border with the critical mark.

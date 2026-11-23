---
category: Shell
keywords: [pin, unpin, favourite, pinned modules, sidebar row action, toggle button]
---

The pin on a rail row.

```tsx
<NavItem href="/marketing" glyph="📣"
  actions={<NavPinButton label="Marketing" pinned={pins.has('marketing')} onToggle={toggle} />}>
  Marketing
</NavItem>

{/* in the pinned list itself */}
<NavItem href="/marketing" glyph="📣"
  actions={<NavPinButton remove label="Marketing" onToggle={unpin} />}>
  Marketing
</NavItem>
```

## Notes

- **Hidden until the row is hovered or the pin is focused**, by opacity and width —
  never `display: none`, which would make it unreachable by keyboard. Its width goes
  too, so the label gets the space back.
- **A pinned row keeps it lit**, so "is this already up top" can be read without
  hovering.
- The name is "Pin {label}" in both states and `aria-pressed` carries the state.
- `remove` is the cross on a row already in the pinned list; it turns red on hover.
- Storing the pins is the app's job.

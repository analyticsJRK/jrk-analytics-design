---
category: Actions
keywords: [menu, dropdown, disclosure, popover, overflow, actions, aria expanded, anchored panel]
---

A button that opens a panel beside itself — the overflow menu in a card header,
the row-actions control in a table, a filter popover.

```tsx
<Menu label="Actions" align="end">
  <MenuLabel>This property</MenuLabel>
  <MenuItem icon={<ExportIcon />} onSelect={exportCsv}>Export CSV</MenuItem>
  <MenuItem onSelect={schedule}>Schedule report</MenuItem>
  <MenuSeparator />
  <MenuItem danger onSelect={remove}>Remove from portfolio</MenuItem>
</Menu>
```

## Why this exists when `NavMenu` already does

They are not the same widget. `NavMenu` is the sidebar rail's **second level** —
`position: fixed`, measured against `.jrk-sidebar`, and useless anywhere else.
`.jrk-menu` in `feedback.css` is only a **surface**: a fill, a border, a shadow,
and no position at all.

So every consumer that wanted a dropdown in a card header rewrote the same forty
lines — a trigger with `aria-expanded`, an absolutely-positioned `.jrk-menu`, an
outside-press listener, an Escape handler, and a guess at which edge to anchor
to. Written twice that is two chances to get the dismissal contract subtly
different; written on eight screens it is not a component library.

`Menu` supplies the placement and the dismissal. The surface is unchanged.

## It is a disclosure, not `role="menu"`

The same call `NavMenu` documents at length. `role="menu"` promises a roving
tabindex, type-ahead and a full arrow-key contract — and a claimed menu that
ignores arrow keys is **worse** for a screen-reader user than the labelled group
of buttons they already know how to Tab through.

What ships instead: `aria-haspopup` + `aria-expanded` on the trigger, a labelled
`role="group"` for the panel, Tab to walk it, Escape to dismiss.

## Notes

- **`align` defaults to `end`.** A control in a header's action row sits at the
  right edge, where a start-anchored panel opens off the viewport. Use `start`
  for a trigger on the left of its container.
- **Dismissal is on `pointerdown`, not `click`** — a press that starts outside
  should dismiss on the press, not wait for the release. A menu that closes only
  after a full click feels stuck to the cursor.
- **Escape returns focus to the trigger; an outside press does not.** The reader
  has already chosen where to put their attention in the second case, and
  yanking focus back would overrule them.
- **The panel is free-form.** `MenuItem` is for an actionable row, but a filter
  menu of checkboxes or a block of prose is equally valid — the contract is the
  surface and the dismissal, not the contents.
- `trailingIcon` is part of the trigger, so "what is this set to" does not
  require opening the thing that answers it.
- **The panel floats above the page, so a card cannot clip it.** `.jrk-card` is
  `overflow: clip`, and the old absolutely-positioned panel was cut off at the
  bottom of any short card. The panel is now a `popover="manual"` element in
  the browser's top layer, placed from the trigger's position on screen. It
  keeps its place in the DOM, so Tab order, the outside-press check and
  inherited text colour are unchanged.
- **It opens below the trigger, or above when there is more room there**, and
  stays 8px inside the viewport. It follows the trigger on scroll and closes
  when the trigger scrolls out of view, including out of a table's own scroll
  area.
- A long panel scrolls at `min(70vh, 560px)`, or at the room left on its side
  of the trigger if that is less, rather than running off the page.
- The trigger defaults to `secondary` / `sm`. It is not a `cta` — a menu opens
  something, it does not commit anything, and there is at most one `cta` per view.

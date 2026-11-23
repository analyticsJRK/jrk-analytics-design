---
category: Forms
keywords: [combobox, searchable select, select, dropdown, picker, autocomplete, listbox, typeahead, property picker]
---

A drop-down with a search box, for a list too long to scan: a property picker
(ninety on the roster), vendors, people.

```tsx
<label htmlFor="property">Property</label>
<Combobox
  id="property"
  value={code}
  onChange={setCode}
  emptyLabel="All properties"
  options={properties.map((p) => ({ value: p.code, label: p.name, hint: p.code }))}
/>
```

## Why not a native `<select>`

The browser draws a native select's open list the full width of the control and
cannot add a search to it; its type-ahead is invisible and matches only from the
start of a label, so "Lasalle" cannot find "1250 Lasalle". Use `Select` for a short
list (under a dozen) and this for anything longer.

## Behaviour

- A button that shows the choice; open, a search field (`role="combobox"`) over a
  `role="listbox"`.
- **Typing a character on the closed button opens it with that character already
  searched.** Arrow keys, Home/End, Enter to pick, Escape to close (without also
  closing a dialog around it), Tab to leave.
- Opens on the current choice, scrolled into view.
- Search matches the label, the `hint` and the value.
- `emptyLabel` offers a blank choice first ("None", "Not set"); without it the blank
  cannot be chosen. It is never a search result.
- `stayOpen` keeps the list open after a pick, for adding several in a row — the
  caller drops picked values from `options`.

## Notes

- The panel floats in the top layer, so a card, a scrolling strip or a table cell
  does not clip it; it opens upward when there is more room above and closes when
  its button scrolls out of view.
- The trigger is a `.jrk-input` and the panel a `.jrk-menu`, so field and overlay
  geometry follow every skin with no rule of their own.
- Give it a visible `<label htmlFor>` (pass `id`) or a `label` prop.

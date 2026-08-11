---
category: Actions
keywords: [menu item, dropdown item, command, action row, danger, keep open]
---

One actionable row inside a `Menu` panel. It renders a `<button>` on
`.jrk-menu__item` — the same surface `NavMenuItem` uses for a link, so the app's
menus and the nav's second level are visually one thing.

```tsx
<MenuItem icon={<ExportIcon />} onSelect={exportCsv}>Export CSV</MenuItem>
<MenuItem danger onSelect={remove}>Remove from portfolio</MenuItem>
```

## It dismisses the panel for you

`onSelect` runs, then the menu closes and focus returns to the trigger. Neither
half is optional politeness: a menu that stays open after a command reads as not
having listened, and a reader whose focus is dropped is left at the top of the
document with nothing saying what they just dismissed.

The close handler arrives by context, so nothing has to be threaded down. A
`MenuItem` rendered outside a `Menu` is inert rather than a crash.

## `keepOpen` is the exception, and it is narrow

Turn it on for a row that toggles part of a set the reader is **still
adjusting** — a column-visibility list, a multi-select filter — where dismissing
after each change makes the control unusable. Everywhere else, leaving it off is
the right answer.

## Notes

- `danger` paints `status.critical.text`, and the icon follows via
  `currentColor`. It is for the destructive row, not for emphasis.
- **Colour is not the only signal on a danger row** — the label has to say what
  it destroys. "Remove from portfolio" works; "Remove" does not.
- `disabled` greys the row and blocks the press. Prefer omitting an item that can
  never apply here; disable one that is temporarily unavailable.
- The row is a command. Something that navigates belongs in a `NavMenu`, or is a
  plain link — not a button that calls `router.push`.

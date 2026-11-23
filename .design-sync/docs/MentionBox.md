---
category: Forms
keywords: [mention, at mention, tag people, autocomplete, textarea, notes, comment box, @]
---

A textarea that tags people with `@`. Picking writes `@Full Name ` into the text;
`onChange` reports who is tagged alongside the value.

```tsx
<MentionBox
  value={text}
  onChange={(next, mentions) => { setText(next); setTagged(mentions); }}
  people={[{ id: 'druiz@example.com', label: 'Dana Ruiz', hint: 'druiz@example.com' }]}
  rows={3}
/>
// or look people up as the reader types
<MentionBox value={text} onChange={…} search={(q) => fetchPeople(q)} />
```

## Notes

- **The text keeps the plain `@Full Name`**, so it reads the same in every screen
  and export. The ids travel separately, in `onChange`.
- **`mentions` is who is in the text NOW** — picked, typed out in full, or already
  in a note being edited. Deleting a tag drops its id. A name two people share
  counts only when one of them was picked from the list.
- **A tag is highlighted while it is typed**: a see-through copy of the text sits
  over the textarea with each tag marked, copying its font, padding and scroll.
- **The list is a popover in the top layer**, so a scrolling dialog body or a
  frosted modal cannot clip it. It opens upward when there is more room above.
- Keys while open: ↑ ↓ move, Enter or Tab pick, Escape closes the list — and stops
  there, so the dialog or panel around the box stays open.
- `findMentions(text, people, picked?)` is the same rule without the box.

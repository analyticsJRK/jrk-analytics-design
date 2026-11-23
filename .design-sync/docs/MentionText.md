---
category: Forms
keywords: [mention text, tag, posted note, render mentions, comment text]
---

Posted text with each `@Label` of a known person drawn as a tag
(`.jrk-mention-tag`).

```tsx
<MentionText text={note.body} people={people} />
```

## Notes

- The same matching rule as `MentionBox`'s highlight: the longest label wins and a
  tag must end at a word boundary, so `@Max McCoy` is not read as `@Max`.
- Only known labels are drawn; anything else after an `@` is plain text.

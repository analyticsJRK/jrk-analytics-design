---
category: Layout
keywords: [steps, how it works, method, methodology, numbered list, ordered list, process, explainer, provenance, walkthrough]
---

Three or four short steps in place of a paragraph of method — how the number on
the page was arrived at.

```tsx
<Steps
  items={[
    { title: 'Pulls each property from Portfolio Info',
      detail: 'How snow is handled today — vendor, in-house, city or none.' },
    { title: 'Loads 30+ years of local snowfall',
      detail: 'Nearest station, completed winters only.' },
    { title: 'Prices both contract types' },
    { title: 'Recommends the cheaper one' },
  ]}
/>
```

## The numeral is a CSS counter

Not authored text. A hand-written "1." is a second source of truth for the order
of a list whose order is already in the DOM, and it goes wrong the first time a
step is inserted — the same drift `SectionNav` refuses an `items` prop to avoid.

That is also why this component takes `items` rather than children: a caller
assembling their own `<li>` elements is free to omit the marker span and get an
unnumbered list that still passes every gate.

The cost is that the numeral is generated content, so the `<ol>` carries
`role="list"` — `list-style: none` strips list semantics in Safari/VoiceOver, and
the ordinal is the entire point of a step. The ordinal reaches a screen reader
through the list, not through the glyph.

## There is no chip behind the numeral

One was drawn before this. A filled circle wants a token, and the honest
candidate — `surface.track`, the one recess that works in both themes — is
**1.18:1 on the light page and 1.04:1 on the dark one**. The chip would have
looked correct in every screenshot taken on a card and not existed on the page.

Without it the numeral itself is the mark at 8.92:1 / 10.57:1, identical on both
planes, and the component has no radius at all — so there is nothing for either
skin to square, and it needs no entry in their contract lists.

## Notes

- **`detail` is secondary ink, not muted.** This departs from the
  `List` / `Card` caption convention on purpose: a caption sits under something
  you have already read, and this is the content. A page whose entire
  explanation is muted is the page this component was written to fix.
- **The connector hairline is decorative** — 1.21:1 light / 1.46:1 dark, which
  1.4.11 permits under 3:1 because it carries no state and no target. It is
  suppressed on the last step: a line trailing off says there is another one
  below, and there is not.
- **Three or four steps.** A method that takes seven to state is one the reader
  will not follow, and the fix is at layer 1 rather than here.
- `detail` is optional — a three-word step needs none.
- Wrap it in an `Expander` if the page wants it closed by default. There is no
  modifier for that here.

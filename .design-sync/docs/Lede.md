---
category: Layout
keywords: [lede, finding, headline, summary line, takeaway, key finding, page summary, basis, provenance, so what]
---

One sentence at the top of a page saying what the data says **this time**.

```tsx
<Lede basis="2026–2027 season · priced on completed winters only.">
  Per-push is cheaper for <strong>14 of 21</strong> properties this season.
</Lede>
```

## Why this is not `PageHeader`'s description

`description` says what the **page** is, and it reads identically every visit —
which is why it is muted, 68ch, and correctly ignored by anyone who has been
here before. A lede is a **claim about the current data**.

The test: if you cannot write a sentence that would read differently next week,
you do not have a lede. You have a description, and it is already built.

Both together is usually one too many. A finding under a description reads as an
afterthought, and the description is the half a returning reader can infer.

## It renders nothing when there is nothing to say

`<Lede>` with empty children returns `null`. This is the only component in the
library that does that, and it is deliberate: the alternative is a caller writing
"Review the table below" to fill the slot, which is furniture at the largest type
size on the screen and costs the page its only landing zone.

"No properties need attention" is a finding. "Review the table below" is not.

## Notes

- **`text-xl` regular** — h3's size at body's weight. Not a heading: it is a
  sentence, and it must not compete with the page title two lines above it.
  `text.primary` at 20.29:1 on the page, 21.00:1 on the card.
- **Emphasise the figure with `<strong>`, never a colour.** Weight survives
  greyscale, both dichromacies and both themes; `accent.solid` is 3.52:1 on the
  dark page and is not a text colour there at all.
- **52ch**, against the description's 68ch. A lede that wraps three times is a
  description wearing the wrong class — the width is a soft enforcement of the
  one-sentence rule.
- **`basis` is the scope condition**, not a citation: *priced on completed
  winters only*, *excludes properties acquired mid-season*. Same role and same
  name as `.jrk-spotlight__basis`.
- **At most one per page.** Two findings is a stat row.
- Draws no surface, so it sits on the page plane or inside a card unchanged.

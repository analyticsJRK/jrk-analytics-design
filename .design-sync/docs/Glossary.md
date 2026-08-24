---
category: Layout
keywords: [glossary, definition list, terms, key, legend, jargon, definitions, dl, term and definition, explainer]
---

Term plus a one-line gloss, for the two or three words a page is built on.

```tsx
<Glossary
  items={[
    { term: <Badge tone="accent">Per push</Badge>,
      def: 'You pay each time the plow comes out. Cheaper in light winters — you carry the weather risk.' },
    { term: <Badge tone="good">Seasonal</Badge>,
      def: 'One fixed price for the season. Predictable, but you overpay in mild winters.' },
  ]}
/>
```

## The term slot takes a `Badge`

That is the intended form when the same term appears as a badge in the table
below: the glossary shows the reader the exact object they will meet rather than
a paraphrase of it. The `dt` sets no size in that case — the badge brings its
own.

## Why not two tinted cards

Because a definition never changes, and two permanent tiles spend the top of
every page on something read once. The glossary is the same content at a
sixth of the height.

If the terms are more than three, or the glosses need a paragraph each, the
answer is `SpotlightGuide` — it teaches a term **at** the figure that depends on
it, on demand, which is better than any always-open explainer. A glossary is for
the handful of terms the reader needs *before* the first figure means anything.

## Notes

- **The gloss is secondary ink, not muted.** Same departure `Steps` makes and
  for the same reason: this is the content, not a caption.
- **The term column is `max-content`**, so the longest term sets it. Right up to
  about 20 characters and wrong past it — one long term starves every gloss
  beside it. `termWidth` fixes the column; `stacked` drops to one.
- **Two-column is the default because it lets a reader skip what they know.**
  A stacked list makes them read all of it to find the one term they do not.
  Use `stacked` for a genuinely narrow column, not for a long list.
- Emits `dt`/`dd` as flat siblings of one grid, which is what aligns every gloss
  on one edge. That is why it takes `items` rather than children.
- Draws no surface — it sits on the page plane or inside a card unchanged.
- Not to be confused with `Legend`, which labels chart series by swatch.

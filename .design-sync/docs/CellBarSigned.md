---
category: Tables
keywords: [signed bar, diverging, variance, positive negative, centre axis, delta]
---

Signed magnitude inside a table cell, drawn as **length from a centre axis** —
negative grows left, positive grows right.

```tsx
<CellBarSigned value={-47000} max={100000} format={fmtK} />
```

## Pick this or CellHeat by the job

| | Use when | Channel |
|---|---|---|
| **CellBarSigned** | one column, compared down its length | length — precise |
| **CellHeat** | a grid scanned to find where the problem is | colour — coarse |

Length is the more precise channel, so prefer this whenever the comparison runs
down a single column. A whole grid of bars is unreadable; that is what `CellHeat`
is for.

## Notes

- **`max` is the largest absolute value across the set**, not per row. Pass the
  same `max` to every cell in the column or two different numbers get the same
  bar length.
- The track draws a **1px centre axis**. It is not decoration — without a visible
  zero, a short negative and a short positive are the same bar in two colours.
- Both halves are absolutely positioned off the 50% mark, so a row holding only a
  negative value still lines its axis up with every other row.
- Colours are the diverging poles, `chart.diverging.negative` / `.positive` —
  red ↔ blue, never red ↔ green. Red beside green is the textbook protan collapse
  and on a signed table the arm *is* the meaning.
- The number stays visible beside the bar. Colour and direction are both second
  channels; the sign in the text is the first.

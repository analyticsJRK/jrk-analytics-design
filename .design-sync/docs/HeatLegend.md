---
category: Tables
keywords: [heat legend, diverging scale, magnitude legend, range, heatmap key]
---

The magnitude key for a `cellHeatProps` grid — eight swatches with the range
printed at both ends.

```tsx
<HeatLegend max={10} format={(n) => `${n > 0 ? '+' : ''}${n.toFixed(1)}`} />
```

## It is not optional

A chart with two or more series always carries a legend because colour alone
cannot name identity. A tinted grid carries this one for the same reason in the
magnitude direction: without the range printed, a reader can see that one cell is
redder than another but has no idea whether the scale spans ±2 or ±200.

## Notes

- **`max` must be the same value passed to the cells.** The legend is a promise
  about the scale; a different `max` here makes it a false one.
- Eight swatches, four per arm, no gap in the middle. The midpoint takes no fill
  in the table (a zero cell is unshaded), so there is no grey chip to show.
- Swatches are `aria-hidden`; the two numbers carry the meaning for a screen
  reader.
- Reads left to right most-negative → most-positive, matching the way the arms
  are laid out in a row of cells.

---
category: Feedback
keywords: [page skeleton, loading state, skeleton screen, shimmer, placeholder, suspense fallback, loading page]
---

The loading state for a whole screen: the REAL title, a shimmer in the shape of
what will land, one status line, and the centred ring.

```tsx
<PageSkeleton title="Pest Control" nav={<SectionStrip />} tiles={4} rows={12} cols={7} />
<PageSkeleton cards={3} announce="Loading the property…" />
```

## Notes

- **The title is rendered for real.** A route's name is not data; showing it on
  the first frame tells the reader which page opened. Omit it where the heading
  comes from the payload — a title that swaps strings is worse than one that
  arrives once.
- **`nav` is real chrome**, so a reader who opened the wrong section can leave
  before it loads.
- **Geometry, not decoration.** `tiles`, `rows`/`cols` and `cards` make the
  skeleton occupy roughly the space its screen will, so nothing jumps when it
  lands. Right order of magnitude, not exact.
- Widths vary deterministically — `Math.random()` would hydrate as a mismatch.
- **One status line, everything else `aria-hidden`**, and the region is
  `aria-busy`. `spinner={false}` drops the ring.

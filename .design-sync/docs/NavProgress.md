---
category: Feedback
keywords: [navigation progress, progress bar, top bar, route change, loading bar, useNavProgress]
---

Two pixels across the top of the viewport while a navigation is in flight.

```tsx
const key = `${pathname}?${searchParams.toString()}`;
const busy = useNavProgress(key);
return <NavProgress busy={busy} />;
```

## Notes

- **It covers the navigation a route loading state cannot**: a same-route change
  of search params, where nothing suspends and the old page sits there complete and
  wrong.
- **`useNavProgress(locationKey, maxMs = 6000)`** arms on a same-origin link click
  in the CAPTURE phase and disarms when `locationKey` changes. It skips middle and
  modified clicks, `target`, `download`, other origins and links to the current
  address. Pass a STRING key — an object's identity changes every render.
- **It disarms on a timeout too**: a cancelled navigation changes nothing the hook
  can see.
- **No progress is knowable**, so it eases to 90% and waits. A bar that reaches the
  end and hangs is a worse lie. Under reduced motion it appears without growing.
- `aria-hidden` — the page's own loading state is what announces.

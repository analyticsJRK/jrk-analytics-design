---
category: Layout
keywords: [panel host, reserve width, docked panel layout, side panel layout]
---

The page a `DockedPanel` docks beside. While `open`, it gives up the rail's width.

```tsx
<PanelHost open={open}>…the page…</PanelHost>
```

## Notes

- **Padding, not a grid track.** Padding cannot push the page wider than the
  viewport, so no horizontal scroll appears.
- Reads `--jrk-panel-width` (380px). Below 1100px the panel overlays and the host
  stops reserving.

---
category: Layout
keywords: [docked panel, side panel, drawer, rail, inspector, guide, notes, tabs, aside]
---

A rail on the trailing edge that docks BESIDE the content — a guide, a notes
thread — so it can be read while looking at the numbers.

```tsx
<PanelHost open={open}>…the page…</PanelHost>
<DockedPanel
  open={open}
  label="Snow Tracker panel"
  tabs={[
    { id: 'guide', label: 'Guide', content: <Guide /> },
    { id: 'notes', label: 'Notes', count: 4, content: <Thread /> },
  ]}
  tab={tab}
  onTabChange={setTab}
  onClose={() => setOpen(false)}
  footer="Snow Tracker · snow2"
/>
```

## Notes

- **It docks; it overlays only below 1100px.** A drawer over the table makes the
  reader memorise a row and then dismiss the thing explaining it.
- **A rail, not a card.** Fixed under the topbar (`--jrk-panel-top`, default the
  topbar height) so the tab strip and close button never scroll away. Only the
  leading edge is drawn.
- **`PanelHost` reserves the width as padding**, which cannot push the page wider
  than the viewport the way a grid track can. `--jrk-panel-width` is 380px.
- **Every pane stays mounted**; switching tabs does not discard a half-typed note.
- **Tabs are the segmented control** (`.jrk-tabs--pills`) with arrow-key movement.
  One tab renders a heading instead of a one-tab tablist.
- **Escape closes it**, bound on the document — but not when a dialog or an open
  autocomplete list has already handled the key.

---
category: Feedback
keywords: [screen spinner, loading overlay, saving, busy, wait, full screen spinner, top layer, popover]
---

One ring in the middle of the viewport, over a faint wash, above everything.

```tsx
{saving && <ScreenSpinner label="Approving and locking…" />}
{navigating && <ScreenSpinner delay />}
```

## Notes

- **It paints in the top layer** (`popover="manual"`), so no ancestor with a
  transform, filter or opacity can trap it behind a chart — the failure
  `position: fixed` alone has. No portal and no `react-dom`.
- **It marks a wait; it does not block.** `pointer-events: none`, so a reader who
  clicked the wrong tab can click another mid-wait.
- **`label` names the wait and makes it a live region.** A write needs words — it
  is the difference between a wait somebody sits through and one they press the
  button again during. A navigation does not.
- **`delay` holds the whole layer back 140ms**, for a navigation that may commit
  in a frame. Leave it off for a write: that wait is never short.
- Render it only while waiting; unmounting takes it down. For writes, mount one
  `BusySpinner` near the root instead of a spinner per screen.

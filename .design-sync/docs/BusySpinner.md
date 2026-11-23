---
category: Feedback
keywords: [busy spinner, saving, write in flight, beginBusy, useBusy, trackBusy, global spinner]
---

The screen spinner, shown while any write reported through `beginBusy()` is open.
Mount it once, near the root.

```tsx
// app root
<BusySpinner />

// anywhere a write happens
const end = beginBusy('Saving…');
try { await save(); } finally { end(); }

// or
await trackBusy(save(), 'Approving…');
```

## Notes

- **A count, not a flag.** Two overlapping writes keep it up until the second
  ends. The label shown is the newest open write that named one.
- **It must outlive the screens that start writes.** A dialog that closes as it
  saves would take a spinner it owned with it; the store does not care who started
  the write.
- **No router coupling.** To hold the wait until the refreshed data is ON SCREEN,
  open a `beginBusy()` when the refresh starts and close it when the new render
  commits — a React transition's `isPending` is the usual signal.
- `useBusy()` returns `{ busy, label, count }` for anything else that wants to know.

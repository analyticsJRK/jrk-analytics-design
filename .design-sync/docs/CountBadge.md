---
category: Status
keywords: [count badge, notification count, unread, tally, bell, number chip]
---

The number on a bell or a Tasks button.

```tsx
<Button variant="ghost" iconOnly aria-label="Notifications, 3 unread">
  <Icon name="bell" />
  <CountBadge count={3} overlay />
</Button>
<Button variant="cta">Tasks <CountBadge count={12} tone="inverse" /></Button>
```

## Notes

- **Renders nothing at zero.** An empty chip says "nothing" louder than no chip.
- **`max` caps it** (`99+`). The exact figure belongs on the screen it opens.
- **`overlay` hangs it off the control's top-right corner.** A `.jrk-btn` holding
  one is positioned for it; anything else wraps in `.jrk-count-anchor`. It takes no
  pointer events, so the corner of the button stays the button.
- `critical` for something waiting on the reader, `accent` for a plain tally,
  `inverse` inside a solid accent button.
- The control's own name says what is counted — put the number in its
  `aria-label` too, or pass `label` ("unread").

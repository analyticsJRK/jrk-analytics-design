---
category: Shell
keywords: [collapse, expand, sidebar toggle, rail toggle, footer button]
---

The rail's collapse control, for its footer.

```tsx
<Sidebar collapsed={collapsed} peek
  footer={<SidebarToggle collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />}>
  …
</Sidebar>
```

## Notes

- Its chevron sits on the rows' icon column in both states, and points the way the
  rail will move.
- In the collapsed rail the label is **clipped, not removed** — `display: none` there
  leaves an unnamed button.
- With `peek`, a rail opened by hover still reads "Expand": pressing it keeps the rail
  open.

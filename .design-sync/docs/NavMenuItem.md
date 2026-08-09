---
category: Shell
keywords: [nav menu item, submenu link, second level, aria current, destination]
---

One destination inside a `NavMenu` panel. It renders an `<a>` on
`.jrk-menu__item`, so the second nav level and the app's other menus are
literally the same surface — the panel adds placement, never appearance.

```tsx
<NavMenu label="Performance" icon={<ReportIcon />}>
  <NavMenuItem href="/perf/revenue">Revenue &amp; occupancy</NavMenuItem>
  <NavMenuItem href="/perf/noi" active>NOI trend</NavMenuItem>
</NavMenu>
```

## The current sub-page gets text and weight, not a pill

`active` sets `aria-current="page"`, and inside a flyout that paints as accent
text plus semibold — **not** a second accent pill. The parent row already carries
the pill, and a second one inside the panel is two answers to one question.

The semibold is not decoration. It is the second channel that keeps this off
colour-as-the-only-signal, which the library treats as a hard rule.

## Notes

- It is a link, not a command. The panel is a labelled group of links and never
  `role="menu"` — that role declares application-mode semantics, obliges a roving
  tabindex and type-ahead, and makes a screen reader announce a set of
  destinations as if they were commands. Tab walks these; Escape dismisses.
- `href` is required. There is no button variant on purpose — a row that performs
  an action rather than navigating belongs in the topbar or as a `SidebarAction`.

---
category: Shell
keywords: [subnav, section strip, module sections, sub navigation, second level tabs, grouped tabs, segmented links, aria current, alert, route tabs]
---

A module's screens under its page header — one row of tabs, or two levels when the
sections name groups.

```tsx
<SubNav
  label="Pest sections"
  location={{ pathname, search }}
  linkAs={Link}
  groups={[
    { id: 'Overview' },
    { id: 'Property', activeHref: '/pest/property', empty: 'Open a property to see these.' },
    { id: 'Admin' },
  ]}
  items={[
    { id: 'portfolio', group: 'Overview', label: 'Portfolio', href: '/pest' },
    { id: 'action', group: 'Overview', label: 'Action Center', href: '/pest?view=report',
      alert: { count: 4, label: 'live infestations' } },
    { id: 'overview', group: 'Property', label: 'Property Overview', href: '/pest/property?property=SRT' },
    { id: 'units', group: 'Property', label: 'Unit Table', href: '/pest/property?property=SRT&view=unit-table' },
    { id: 'live', group: 'Admin', label: 'Live status', href: '/pest/admin' },
  ]}
  actions={<Button size="sm" variant="secondary">Guide</Button>}
/>
```

## Two levels that do not look alike

Groups are an underline `.jrk-tabs` row; the open group's sections are a
`.jrk-btn-group`. An underline tab and a pill toggle are different-looking controls,
which is what tells a reader that one picks the area and the other the view within
it. Only the open group's sections are drawn. A group with a single section draws no
segmented row — one segment is a label pretending to be a choice.

## Links, not a tablist

Both rows are `<nav>`s of links with `aria-current="page"`. `role="tab"` promises a
panel in this document; these change the URL. Borrowing the look is fine, borrowing
the semantics is not.

## Which one is current

Pass `location` and each item is matched with `subNavActive` (exported, pure):

- **The most specific match wins.** `/pest` and `/pest?view=report` share a path; on
  `?view=report` only the second lights. An item whose params are a subset of a
  sibling's loses to the sibling when both are satisfied.
- **Params the URL carries and the item does not name are ignored** — module state is
  not identity. If an item's `href` carries such state (a `?draft=`), give it `match`.
- A tie lights both: two items that name one address are both true.
- `active` on an item overrides the computed answer.

The open group is the one holding a current item, else `defaultGroup`, else the first.

## Group tabs

A group tab links to its first section, because a group is not an address. While its
group is open it goes to `activeHref` if set — pressing the tab you are on must do
something, and "up to the group's index" is what a breadcrumb would do. A group with
no items at this scope still draws its tab (give it an `href`) and, when open, shows
its `empty` sentence where the pills would be. A strip that changes shape under the
reader makes them wonder where a tab went.

## Alerts

`alert: { count, label }` puts a red "!" disc on a section. The count is in its
title and accessible name, not on the disc — six pills with a two-digit badge each
wrap the row. Zero renders nothing. **A closed group's tab carries its sections'
alerts rolled into one**, or an alert in another group would be invisible.

## Notes

- `actions` sit at the end of the tab row and are module-wide; `sectionActions` at
  the end of the section row. Both are outside every `<nav>`.
- `groups[].controls` render under the section row while that group is open — for a
  control that belongs to one area of the module.
- `linkAs` takes a framework link; pass one that carries a pending marker and every
  tab gets it.
- No outer margin: the page's own gap spaces it.

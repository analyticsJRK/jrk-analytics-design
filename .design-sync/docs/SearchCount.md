---
category: Tables
keywords: [count, results count, showing x of y, search count, filter count, row count]
---

The count beside a search box: **"43 properties"**, or **"7 of 43 properties"**
while a search narrows the table. The only thing on screen that says a filter is
at work — the rows themselves just get fewer.

```tsx
<SearchCount shown={matched.length} total={rows.length} noun="contracts" singular="contract" />
```

## Notes

- The noun agrees with the **total** in both shapes. "1 of 43 property" is what
  agreeing with the shown count produces on the commonest case.
- `singular` is only needed where dropping the "s" is wrong — "properties" is not
  "propertie".
- Announced politely to screen readers as it changes.

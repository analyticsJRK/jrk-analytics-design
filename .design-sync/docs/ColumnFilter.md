---
category: Tables
keywords: [filter, column filter, funnel, excel filter, checklist, min max, date range, contains, table heading, popover]
---

The Excel-style filter for one table column: a funnel at the trailing edge of the
heading opens the filter that fits the column. `TableKit` puts one on every column;
use this directly in a table you render yourself.

```tsx
<th scope="col" className="jrk-th--filter">
  Status
  <ColumnFilter
    label="Status"
    kind="values"
    value={filters.status}
    onChange={(next) => setFilters({ ...filters, status: next })}
    options={() => valueOptions(allStatuses, statusesPassingOtherFilters)}
  />
</th>
```

## The five kinds

| kind | panel | for |
|---|---|---|
| `values` | checklist of the values present, with counts, search over 8 | a category: property, status, type |
| `tags` | the same checklist, one entry per list item | a column of lists ("Mold, Water damage") |
| `number` | min and max | money, counts, percentages |
| `date` | from and to, bounded by the column's dates | dates |
| `text` | contains | names, ids — a column where nearly every value differs |

`inferKind(values)` picks one from the column's cells. The rules live in
`filterCore` (`passes`, `readCell`, `valueOptions`, `encodeFilter`), with no
DOM, so they can be tested and shared.

## Notes

- **Every value ticked is stored as no filter at all** (`onChange(undefined)`), so
  "unfiltered" has one representation and the funnel only fills when it narrows.
- **Counts are against the OTHER filters.** "Northeast 12" means 12 rows would
  show if Northeast were the only region ticked — the number a reader needs to
  decide.
- **Select all acts on what the search shows**: search "Har", Select all, and
  only the matches are ticked.
- **A blank never passes a number range**, as in Excel.
- **Filtered is the solid accent chip** — deliberately the loudest thing in the
  header row, because a table narrowed without saying so is how a reader
  concludes a property is missing.
- The panel is a `.jrk-menu` in the browser's top layer: no card or table scroll
  area clips it, Tab reaches it from the funnel, and every skin's overlay geometry
  applies. It sits inside the heading, so it resets the heading's centred, bold,
  coloured type.
- Give the heading `.jrk-th--filter` so its label keeps clear of the 24px funnel.

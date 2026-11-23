---
category: Tables
keywords: [table, data table, list, sort, filter, column filter, search, export, csv, excel, row numbers, totals, frozen column, expand row, child rows, column groups, toolbar]
---

The full working list: rows of data and a column list in, and every behaviour a
reader expects out — sort, search, a filter per column, a count, totals that follow
the filter, CSV and Excel export, rows that open. Use `DataTable` for a short,
fixed table; use this for a list somebody works through.

```tsx
<TableKit
  id="contracts"
  title="Snow contracts"
  rows={contracts}
  rowKey={(r) => r.code}
  initialSort={{ key: 'cost', dir: -1 }}
  columns={[
    { key: 'name', label: 'Property', sub: (r) => r.code },
    { key: 'region', label: 'Region', type: 'cat' },
    { key: 'units', label: 'Units', type: 'int', total: 'sum' },
    { key: 'cost', label: 'Contract', type: 'money', total: 'sum' },
    { key: 'renews', label: 'Renews', type: 'date' },
  ]}
  onExport={(kind, data) => postToXlsxService(data)}
/>
```

## What every table gets

- **Row numbers** — a `#` column numbered over the rows on screen, so it renumbers
  after a sort or a filter. Frozen at the edge, with the first column (the row's
  NAME) frozen beside it.
- **Three-state sort** on every heading: ascending, descending, cleared. Figures and
  dates sort as values, and **blanks go last in both directions**.
- **A funnel on every heading** (`ColumnFilter`): a checklist of the values present
  with counts, min/max for a figure, a date range, or "contains" for a column where
  nearly every value differs. The kind is read from the column `type`, or inferred
  from the values. `filterKind` overrides it.
- **"Showing 12 of 35"** and a **Clear filters** button while anything narrows it.
- **"No rows match these filters"** — never confused with a table that has no rows
  (`empty`).
- **Totals** on `total: 'sum'` columns, over the rows on screen. A column with no
  figure totals to a blank, never `$0`.
- **Export**: CSV is built in. Excel is `onExport('xlsx', data)` — the headers, the
  rows exactly as on screen (filters, sort, row numbers), and a format per column for
  the workbook. Figures go out as rounded numbers, dates as `YYYY-MM-DD`, and a column
  with a custom `render` exports the text it SHOWS ("Per Push"), not the code behind
  the chip.

## Formatting

`money` is whole dollars with negatives in parentheses — **($1,200)**, never
-$1,200. `pct` is a fraction (`0.114` prints `11.4%`). `date` is a calendar date
(`2026-10-28`), printed `Oct 28, 2026` and never shifted a day by a time zone.
`locale` changes the number and date formatting; money stays dollars.

## Keeping the view in the address

The view — sort, search, filters, collapsed groups — is plain data
(`TableKitView`). Uncontrolled, the table holds it. Pass `view` and
`onViewChange` to keep it in the URL so a filtered table can be sent to someone;
filters arrive already serialised as strings (`encodeFilter`), and `cause` says
whether the change was typing (debounce it) or a click (write it at once).

## Rows that open

`onToggle` + `openKeys` + `rowKey` put a chevron in the `#` cell. An open row draws
`childRows` (cells in the table's OWN columns, so a building's units sit under
Units) and then `detail` (one full-width row). Both slide open and shut over
`--jrk-duration-base`; under reduced motion they appear and go at once.

## Column groups

`groups` + `column.group` add a header row of collapsible groups. A collapsed group
keeps one `summary` column, so its headline figure and the toggle that brings the
rest back stay on screen. The name column is never in a group.

## Notes

- Columns are functions, so the table renders on the client.
- The name column **starts**, as every library table's leading column does; every
  other column centres.
- `height` (or `useFitHeight`) retunes the scroll port through
  `--jrk-table-height`, so a long table still prints in full.

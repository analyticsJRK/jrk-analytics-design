---
category: Tables
keywords: [search, table search, filter rows, search box, find, quick filter, use table search]
---

One search box and one matching rule for a table you render yourself. `TableKit`
has its own; this is for every other table.

```tsx
const { q, setQ, matched } = useTableSearch(rows, (r) => [r.code, r.name, r.manager]);

<TableSearch value={q} onChange={setQ} label="Search properties" />
<SearchCount shown={matched.length} total={rows.length} />
{/* render `matched` */}
```

## The rule, once

- Case-insensitive substring, the needle trimmed.
- An empty search returns the rows **unchanged, by identity**, so a memo downstream
  does not re-render every row on a keystroke.
- **Each field is tested separately.** Joining fields first lets a search match
  across a boundary — "CRE OH" hitting a row where a code ended one field and a
  state began the next.
- A missing field contributes nothing, never the word "null".

The caller decides only WHICH fields are searchable.

## Notes

- `label` is required and should name the table ("Search contracts"): two boxes on
  one screen both announced as "Search" cannot be told apart.
- It is a `type="search"` field in a `.jrk-input-group`, so it takes the library's
  tinted search look and focus ring with nothing of its own.

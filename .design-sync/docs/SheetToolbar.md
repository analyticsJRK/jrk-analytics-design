---
category: Tables
keywords: [sheet toolbar, spreadsheet toolbar, frozen header, sticky toolbar, resize observer, workbook]
---

The sheet's top toolbar, which measures itself and writes
`--jrk-sheet-toolbar-h` onto the sheet.

```tsx
<div className="jrk-sheet" role="grid" aria-label="AM Report — Summit at Red Rocks">
  <SheetToolbar>
    <strong>AM Report</strong>
    <Select>…</Select>
  </SheetToolbar>
  <div className="jrk-sheet__colbar" aria-hidden="true">…</div>
  …
  <SheetFoot>Accrual basis · as of September 30, 2026</SheetFoot>
</div>
```

## Notes

- **The letter bar and every metric header pin UNDER the toolbar**, and CSS cannot
  ask how tall the toolbar is. Unset, the letter bar hides behind it and every
  frozen metric header parks out of sight inside it.
- **Measured with a ResizeObserver, not stated** — a toolbar holding a property
  picker wraps at narrow widths.
- **It writes on the closest `.jrk-sheet`**, because that is where
  `--jrk-sheet-frozen-top` is composed. Render it inside the sheet.
- `offsetHeight`, not the fractional box: a fractional px lets a hairline of the
  scrolling row show through.

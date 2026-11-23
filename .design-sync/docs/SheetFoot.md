---
category: Tables
keywords: [sheet foot, sheet footer, closing note, spreadsheet footer, static toolbar]
---

The toolbar's strip at the END of a `.jrk-sheet` — a closing note or a second set
of controls.

```tsx
<SheetFoot>
  <span className="jrk-caption">Accrual basis · as of September 30, 2026</span>
</SheetFoot>
```

## Notes

- **Static, ruled on its top edge.** `.jrk-sheet__toolbar` is sticky at `top: 0`,
  so a closing note carrying that class floats over the FIRST data row instead of
  following the last.
- **Never measured.** Its height must not overwrite the top toolbar's in
  `--jrk-sheet-toolbar-h`, which is why it is not a second `SheetToolbar`.

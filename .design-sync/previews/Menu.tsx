import { Menu, MenuItem, MenuLabel, MenuSeparator, Card, Checkbox } from '@jrk/design';

const Dots = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <circle cx="10" cy="4" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="10" cy="16" r="1.5" />
  </svg>
);

const Chevron = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 8l4 4 4-4" />
  </svg>
);

const ExportIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 3v9M6.5 8.5L10 12l3.5-3.5M4 15h12" />
  </svg>
);

/* THE PRIMARY CARD. A menu is a disclosure, so every static capture of one is
   otherwise a picture of a closed button — and the panel is the whole
   component. `defaultOpen` is an initial value for exactly this; in an app it
   is usually the wrong prop. */
export const Open = () => (
  <div style={{ maxWidth: 520, minHeight: 300 }}>
    <Card
      title="Harbor Point"
      subtitle="Southeast · 248 units"
      actions={
        <Menu label="Actions" trailingIcon={<Chevron />} defaultOpen>
          <MenuLabel>This property</MenuLabel>
          <MenuItem icon={<ExportIcon />} onSelect={() => {}}>Export CSV</MenuItem>
          <MenuItem onSelect={() => {}}>Schedule report</MenuItem>
          <MenuSeparator />
          <MenuItem danger onSelect={() => {}}>Remove from portfolio</MenuItem>
        </Menu>
      }
    >
      Occupancy 93.8% · NOI +7.0% vs budget
    </Card>
  </div>
);

/* The overflow menu in a card header — the case this component was extracted
   for. `align="end"` is the default because the trigger sits at the right edge
   of an action row, where a start-anchored panel opens off the viewport. */
export const Default = () => (
  <div style={{ maxWidth: 520 }}>
    <Card
      title="Harbor Point"
      subtitle="Southeast · 248 units"
      actions={
        <Menu label="Actions" trailingIcon={<Chevron />}>
          <MenuLabel>This property</MenuLabel>
          <MenuItem icon={<ExportIcon />} onSelect={() => {}}>Export CSV</MenuItem>
          <MenuItem onSelect={() => {}}>Schedule report</MenuItem>
          <MenuSeparator />
          <MenuItem danger onSelect={() => {}}>Remove from portfolio</MenuItem>
        </Menu>
      }
    >
      Occupancy 93.8% · NOI +7.0% vs budget
    </Card>
  </div>
);

/* Icon-only trigger. `label` still names both the button and the panel, so the
   two cannot drift — and a bare icon button is never unlabelled here. */
export const IconTrigger = () => (
  <div className="jrk-row" style={{ justifyContent: 'flex-end', maxWidth: 520 }}>
    <Menu label="Row actions" variant="ghost" leadingIcon={<Dots />}>
      <MenuItem onSelect={() => {}}>View ledger</MenuItem>
      <MenuItem onSelect={() => {}}>Open rent roll</MenuItem>
      <MenuSeparator />
      <MenuItem danger onSelect={() => {}}>Exclude from rollup</MenuItem>
    </Menu>
  </div>
);

/* `align="start"` for a trigger on the left of its container — the mirror of the
   default, and the only time it is right. */
export const AlignStart = () => (
  <div className="jrk-row" style={{ maxWidth: 520 }}>
    <Menu label="Add" align="start">
      <MenuItem onSelect={() => {}}>Property</MenuItem>
      <MenuItem onSelect={() => {}}>Portfolio</MenuItem>
      <MenuItem onSelect={() => {}}>Saved view</MenuItem>
    </Menu>
  </div>
);

/* The panel is free-form — the contract is the surface and the dismissal, not
   the contents. A filter menu is checkboxes, and every row sets `keepOpen`
   because the reader is still adjusting the set. */
export const FreeFormPanel = () => (
  <div className="jrk-row" style={{ justifyContent: 'flex-end', maxWidth: 520 }}>
    <Menu label="Columns" width="240px" trailingIcon={<Chevron />}>
      <MenuLabel>Show columns</MenuLabel>
      <div style={{ display: 'grid', gap: 'var(--jrk-space-2)', padding: 'var(--jrk-space-2)' }}>
        <Checkbox defaultChecked label="Occupancy" />
        <Checkbox defaultChecked label="NOI vs budget" />
        <Checkbox label="Delinquency 30+" />
        <Checkbox label="T12 revenue" />
      </div>
    </Menu>
  </div>
);

/* A long panel scrolls at min(70vh, 560px) rather than running off the bottom of
   the page. The trigger cannot move, so the panel is what has to give. */
export const LongList = () => (
  <div className="jrk-row" style={{ justifyContent: 'flex-end', maxWidth: 520 }}>
    <Menu label="Jump to property" width="260px" trailingIcon={<Chevron />}>
      {[
        'Bellevue Commons', 'Cedar Grove', 'Harbor Point', 'Lakeshore Flats',
        'Maple Court', 'Northgate Villas', 'Parkside Commons', 'Riverbend Flats',
        'Stonebridge', 'Sutter Yards', 'Vista Ridge', 'Westgate',
      ].map((p) => (
        <MenuItem key={p} onSelect={() => {}}>{p}</MenuItem>
      ))}
    </Menu>
  </div>
);

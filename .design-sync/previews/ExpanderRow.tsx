import { useState } from 'react';
import { Expander, ExpanderRow, DataTable } from '@jrk/design';

type Row = { property: string; code: string; below: string; pct: number };

const cadence: Row[] = [
  { property: 'Independence Green Apts', code: 'ING', below: '947 of 982', pct: 96 },
  { property: 'Residences at Arlington Heights', code: 'TNG', below: '747 of 838', pct: 89 },
  { property: 'Boulders at Puget Sound', code: 'WST', below: '705 of 714', pct: 99 },
];

const columns = [
  {
    key: 'property',
    header: 'Property',
    sortValue: (r: Row) => r.property,
    cell: (r: Row) => (
      <>
        {r.property} <span className="jrk-text-muted">{r.code}</span>
      </>
    ),
  },
  { key: 'below', header: 'Units below', numeric: true, sortValue: (r: Row) => r.below },
  { key: 'pct', header: '% of units', numeric: true, sortValue: (r: Row) => r.pct, cell: (r: Row) => `${r.pct}%` },
];

const table = <DataTable columns={columns} rows={cadence} rowKey={(r) => r.code} />;

/* Lays expanders side by side and gives an OPEN one the full row width. That
   widening is the component's whole job, and it is easiest to see by imagining
   the alternative: three tiles in a fixed row with one open puts the table in a
   ~410px column, where "947 of 982" wraps to three lines and every row grows to
   four lines tall. The table is not badly styled there — it is correctly styled
   at a width no table can use. */
export const Default = () => (
  <ExpanderRow>
    <Expander
      icon="chartBar"
      tag="operational"
      title="93 properties below cadence target"
      description="Units with fewer than 2 visits in the trailing year."
      defaultOpen
    >
      {table}
    </Expander>
    <Expander
      icon="clock"
      tag="operational"
      title="80 properties with recurring infestations"
      description="Same pest, same unit, 2+ work orders."
    >
      {table}
    </Expander>
    <Expander
      icon="doc"
      tag="financial"
      title="38 properties over pest budget"
      description="Year-to-date pest opex above the live budget."
    >
      {table}
    </Expander>
  </ExpanderRow>
);

/* All closed, which is the row's resting shape: three equal summary tiles that
   read as one band. Nothing here needs the row's widening behaviour, and that is
   the point of showing it — the layout has to be legible before anything opens,
   because this is what a reader lands on. */
export const Collapsed = () => (
  <ExpanderRow>
    <Expander icon="chartBar" tag="operational" title="93 properties below cadence target">
      {table}
    </Expander>
    <Expander icon="clock" tag="operational" title="80 properties with recurring infestations">
      {table}
    </Expander>
    <Expander icon="doc" tag="financial" title="38 properties over pest budget">
      {table}
    </Expander>
  </ExpanderRow>
);

/* One at a time, by lifting the state out. The row does not enforce this — it
   lays out whatever it is given — so an author who wants a single open panel
   holds the id and passes `open` / `onOpenChange`, which is also what makes the
   panel's width predictable: two open tiles split the row and both tables are
   back in a column too narrow to read. */
export const OneAtATime = () => {
  const [open, setOpen] = useState<string | null>('cadence');
  return (
    <ExpanderRow>
      <Expander
        icon="chartBar"
        tag="operational"
        title="93 properties below cadence target"
        open={open === 'cadence'}
        onOpenChange={(v) => setOpen(v ? 'cadence' : null)}
      >
        {table}
      </Expander>
      <Expander
        icon="clock"
        tag="operational"
        title="80 properties with recurring infestations"
        open={open === 'pests'}
        onOpenChange={(v) => setOpen(v ? 'pests' : null)}
      >
        {table}
      </Expander>
    </ExpanderRow>
  );
};

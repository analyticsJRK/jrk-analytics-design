import { useState } from 'react';
import { Expander, ExpanderRow, DataTable } from '@jrk/design';

type Row = {
  property: string;
  code: string;
  below: string;
  pct: number;
  vs: string;
};

const cadence: Row[] = [
  { property: 'Independence Green Apts', code: 'ING', below: '947 of 982', pct: 96, vs: '+1 pt' },
  { property: 'Residences at Arlington Heights', code: 'TNG', below: '747 of 838', pct: 89, vs: '−8 pt' },
  { property: 'Boulders at Puget Sound', code: 'WST', below: '705 of 714', pct: 99, vs: '+2 pt' },
  { property: 'Park Place Northville', code: 'PPN', below: '691 of 736', pct: 94, vs: '−3 pt' },
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
  {
    key: 'pct',
    header: '% of units',
    numeric: true,
    sortValue: (r: Row) => r.pct,
    cell: (r: Row) => `${r.pct}%`,
  },
  { key: 'vs', header: 'vs portfolio', numeric: true, sortValue: (r: Row) => r.vs },
];

const table = <DataTable columns={columns} rows={cadence} rowKey={(r) => r.code} />;

/* A summary tile that opens to reveal a table. The tone treats the SUMMARY; the
   panel is always the card plane, because every token a table uses — the row
   hairlines, the muted caption, the accent header labels, every chart mark in a
   cell bar — was measured against surface.default. */
export const Default = () => (
  <Expander
    icon="chartBar"
    tag="operational"
    title="93 properties below cadence target"
    description="Units with fewer than 2 visits in the trailing year — schedule rotation."
    footer="+89 more — the full list is in the detailed sections below."
    defaultOpen
  >
    {table}
  </Expander>
);

/* Three tones. `plain` is the everyday one; `pastel` is a soft wash for a row
   that wants separating without shouting; `vivid` is the saturated gradient and
   there is at most one per view, leading the page.

   ASSIGN A HUE BY POSITION IN THE ROW, never by what the card is about. Half
   these pairs collapse under simulated CVD, which is unavoidable at the depth
   white ink needs — identity is carried by the tag and the title, both mandatory
   and both in the tile. */
export const Tones = () => (
  <div className="jrk-stack">
    <Expander
      icon="chartBar"
      tag="operational"
      title="93 properties below cadence target"
      description="Units with fewer than 2 visits in the trailing year."
    >
      {table}
    </Expander>
    <Expander
      tone="pastel"
      hue="teal"
      icon="clock"
      tag="operational"
      title="80 properties with recurring infestations"
      description="Same pest, same unit, 2+ work orders — needs a treatment strategy."
    >
      {table}
    </Expander>
    <Expander
      tone="vivid"
      hue="violet"
      icon="doc"
      tag="financial"
      title="38 properties over pest budget"
      description="Year-to-date pest opex above the live budget."
    >
      {table}
    </Expander>
  </div>
);

/* <ExpanderRow> is the component's real work. Three tiles side by side puts a
   table in a ~410px column, where "947 of 982 units" wraps to three lines and
   every row grows four lines tall — the table is not badly styled there, it is
   correctly styled at a width no table can use. So an open card takes the whole
   row and the row collapses to a stack while anything is open. */
export const Row = () => (
  <ExpanderRow>
    <Expander
      icon="chartBar"
      tag="operational"
      title="93 properties below cadence target"
      description="Units with fewer than 2 visits in the trailing year."
      footer="+89 more — the full list is in the detailed sections below."
      defaultOpen
    >
      {table}
    </Expander>
    <Expander
      tone="pastel"
      hue="teal"
      icon="clock"
      tag="operational"
      title="80 properties with recurring infestations"
      description="Same pest, same unit, 2+ work orders."
    >
      {table}
    </Expander>
    <Expander
      tone="pastel"
      hue="rose"
      icon="doc"
      tag="financial"
      title="38 properties over pest budget"
      description="Year-to-date pest opex above the live budget."
    >
      {table}
    </Expander>
  </ExpanderRow>
);

/* Controlled, which is how an action centre opens one card at a time. */
export const OneAtATime = () => {
  const [open, setOpen] = useState<string | null>('cadence');
  return (
    <ExpanderRow>
      <Expander
        icon="chartBar"
        tag="operational"
        title="93 properties below cadence target"
        description="Units with fewer than 2 visits in the trailing year."
        open={open === 'cadence'}
        onOpenChange={(v) => setOpen(v ? 'cadence' : null)}
      >
        {table}
      </Expander>
      <Expander
        icon="clock"
        tag="operational"
        title="80 properties with recurring infestations"
        description="Same pest, same unit, 2+ work orders."
        open={open === 'pests'}
        onOpenChange={(v) => setOpen(v ? 'pests' : null)}
      >
        {table}
      </Expander>
    </ExpanderRow>
  );
};

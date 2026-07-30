import { Card, Button, Badge, Status, Stat, DataTable, Select } from '@jrk/design';

type Row = {
  property: string;
  units: number;
  occupancy: number;
  noi: number;
};

const rows: Row[] = [
  { property: 'Parkside Commons', units: 312, occupancy: 96.4, noi: 1284000 },
  { property: 'Vista Ridge', units: 248, occupancy: 94.1, noi: 962400 },
  { property: 'Harbor Point', units: 186, occupancy: 89.8, noi: 704900 },
  { property: 'Cedar Hollow', units: 154, occupancy: 91.6, noi: 588200 },
];

const money = (n: number) => `$${Math.round(n / 1000).toLocaleString('en-US')}k`;

const columns = [
  { key: 'property', header: 'Property', sortValue: (r: Row) => r.property },
  { key: 'units', header: 'Units', numeric: true, sortValue: (r: Row) => r.units },
  {
    key: 'occupancy',
    header: 'Occupancy',
    numeric: true,
    sortValue: (r: Row) => r.occupancy,
    cell: (r: Row) => `${r.occupancy.toFixed(1)}%`,
  },
  {
    key: 'noi',
    header: 'NOI',
    numeric: true,
    sortValue: (r: Row) => r.noi,
    cell: (r: Row) => money(r.noi),
  },
];

/* Title + subtitle + body. Cards are borderless — they separate from the page by
   fill, not by a hairline. */
export const Default = () => (
  <div style={{ maxWidth: 460 }}>
    <Card
      title="Portfolio summary"
      subtitle="47 properties · 8,412 units · as of July 28, 2026"
    >
      <p>
        Collections are at 98.1% of $4,284k billed this cycle. Delinquency sits
        at 2.4%, down 0.6 points from June, with three accounts pending
        escalation at Harbor Point.
      </p>
    </Card>
  </div>
);

/* `actions` is the right-hand header slot — a time-range control or a menu.
   `footer` carries the way out of the card. */
export const WithActionsAndFooter = () => (
  <div style={{ maxWidth: 520 }}>
    <Card
      title="Delinquency by property"
      subtitle="Quarter to date, accrual basis"
      actions={
        <Select size="sm" aria-label="Period" defaultValue="Quarter to date">
          <option>Last 30 days</option>
          <option>Quarter to date</option>
          <option>Year to date</option>
        </Select>
      }
      footer={
        <div className="jrk-row-between">
          <span className="jrk-caption">4 of 47 properties shown</span>
          <Button variant="link" size="sm">View full report</Button>
        </div>
      }
    >
      <div className="jrk-stack">
        <div className="jrk-row-between">
          <span>Riverbend Flats</span>
          <Badge tone="critical" size="sm">7.8%</Badge>
        </div>
        <div className="jrk-row-between">
          <span>Harbor Point</span>
          <Badge tone="serious" size="sm">4.1%</Badge>
        </div>
        <div className="jrk-row-between">
          <span>Cedar Hollow</span>
          <Badge tone="warning" size="sm">3.4%</Badge>
        </div>
        <div className="jrk-row-between">
          <span>Parkside Commons</span>
          <Badge tone="good" size="sm">1.2%</Badge>
        </div>
      </div>
    </Card>
  </div>
);

/* Elevation is opt-in: a dashboard of many tiles reads calmer flat, so `raised`
   is for the one card that has been lifted out of the grid. */
export const Raised = () => (
  <div className="jrk-grid jrk-grid-2">
    <Card title="Flat (default)" subtitle="The dashboard-grid case">
      <Stat label="Portfolio occupancy" value="94.2" unit="%" delta={{ value: 0.8, vs: 'vs last month' }} />
    </Card>
    <Card raised title="Raised" subtitle="Lifted out of the grid">
      <Stat label="Net operating income" value="$4,820k" delta={{ value: 3.1, vs: 'vs last quarter' }} />
    </Card>
  </div>
);

/* `flush` removes body padding so a table meets the card edges — the header and
   footer keep their own inset. */
export const Flush = () => (
  <div style={{ maxWidth: 640 }}>
    <Card
      flush
      title="Top properties by NOI"
      subtitle="Trailing twelve months"
      actions={<Button variant="ghost" size="sm">Export</Button>}
      footer={<span className="jrk-caption">4 of 47 properties · sorted by NOI</span>}
    >
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.property} zebra />
    </Card>
  </div>
);

/* The shape a real dashboard row uses: three flat tiles, one per surface. */
export const DashboardGrid = () => (
  <div className="jrk-grid jrk-grid-3">
    <Card title="Collections" subtitle="July cycle">
      <Stat label="Collected" value="98.1" unit="%" delta={{ value: 1.9, vs: 'vs 90d avg' }} />
    </Card>
    <Card title="Lease audits" subtitle="Open queue">
      <Stat label="Awaiting review" value="37" footnote={<span className="jrk-caption">12 with the property manager</span>} />
    </Card>
    <Card title="Data feeds" subtitle="Last 24 hours">
      <div className="jrk-stack">
        <Status tone="good" pulse>Rent roll loading</Status>
        <Status tone="good">General ledger</Status>
        <Status tone="critical">Lease audits stalled</Status>
      </div>
    </Card>
  </div>
);

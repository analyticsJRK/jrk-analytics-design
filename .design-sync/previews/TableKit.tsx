import { useState } from 'react';
import { TableKit, Badge } from '@jrk/design';
import type { TableKitColumn } from '@jrk/design';

type Property = {
  code: string;
  name: string;
  region: string;
  units: number;
  occupancy: number;
  delinquent: number;
  renews: string;
  findings: string;
};

/* Twelve properties, enough for every filter kind to have something to do: a region
   checklist, min/max on the figures, a date range on renewals, and a list column the
   filter reads as tags. One delinquency balance is a credit, so the money column shows
   the accounting form. */
const PROPERTIES: Property[] = [
  { code: 'HBP', name: 'Harbor Point', region: 'Southeast', units: 412, occupancy: 0.912, delinquent: 48210, renews: '2027-01-31', findings: 'Mold, Water damage' },
  { code: 'BLC', name: 'Bellevue Commons', region: 'Northwest', units: 248, occupancy: 0.964, delinquent: 12940, renews: '2026-12-15', findings: '' },
  { code: 'RVF', name: 'Riverside Flats', region: 'Southeast', units: 156, occupancy: 0.84, delinquent: 61470, renews: '2027-03-01', findings: 'Mildew' },
  { code: 'TEM', name: 'Terra Mar', region: 'West', units: 310, occupancy: 0.951, delinquent: -1840, renews: '2026-11-30', findings: 'Water damage' },
  { code: 'CKN', name: 'Chase Knolls', region: 'West', units: 401, occupancy: 0.937, delinquent: 22105, renews: '2027-06-30', findings: 'Mold' },
  { code: 'MAN', name: 'Manchester Lakes', region: 'Mid-Atlantic', units: 260, occupancy: 0.902, delinquent: 30880, renews: '2027-02-28', findings: 'Mold, Mildew' },
  { code: 'CPC', name: 'Cypress Cove', region: 'Southeast', units: 198, occupancy: 0.973, delinquent: 4410, renews: '2026-12-31', findings: '' },
  { code: 'SFV', name: 'Sun Valley', region: 'West', units: 358, occupancy: 0.889, delinquent: 39920, renews: '2027-04-15', findings: 'Water damage, Mildew' },
  { code: 'WIN', name: 'Windsor Park', region: 'Mid-Atlantic', units: 288, occupancy: 0.948, delinquent: 15060, renews: '2027-05-31', findings: '' },
  { code: 'LBC', name: 'Lake Bluff Commons', region: 'Midwest', units: 222, occupancy: 0.921, delinquent: 18730, renews: '2027-01-15', findings: 'Mold' },
  { code: 'CBA', name: 'Cambridge Arms', region: 'Northeast', units: 174, occupancy: 0.958, delinquent: 9200, renews: '2026-12-01', findings: '' },
  { code: '7PA', name: '77 Park Avenue', region: 'Northeast', units: 96, occupancy: 0.979, delinquent: 2650, renews: '2027-07-31', findings: 'Mildew' },
];

const COLUMNS: TableKitColumn<Property>[] = [
  { key: 'name', label: 'Property', sub: (r) => r.code },
  { key: 'region', label: 'Region', type: 'cat' },
  { key: 'units', label: 'Units', type: 'int', total: 'sum' },
  { key: 'occupancy', label: 'Occupancy', type: 'pct' },
  { key: 'delinquent', label: 'Delinquent', type: 'money', total: 'sum' },
  { key: 'renews', label: 'Contract renews', type: 'date' },
  { key: 'findings', label: 'Open findings' },
];

/* THE PRIMARY CARD. Every heading sorts and carries a funnel; the totals follow
   whatever the filters leave on screen. Sorted by delinquency, largest first. */
export const Default = () => (
  <div className="jrk-card" style={{ padding: 'var(--jrk-space-4)', maxWidth: 1100 }}>
    <TableKit
      id="properties"
      title="Delinquency by property"
      subtitle="November 2026"
      rows={PROPERTIES}
      columns={COLUMNS}
      rowKey={(r) => r.code}
      initialSort={{ key: 'delinquent', dir: -1 }}
    />
  </div>
);

/* Rows that open: a chevron in the # cell, the buildings as child rows in the table's
   own columns, then a full-width note. Both slide open and shut. */
export const RowsThatOpen = () => {
  const [open, setOpen] = useState<Set<string>>(new Set(['HBP']));
  const toggle = (r: Property) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(r.code)) n.delete(r.code);
      else n.add(r.code);
      return n;
    });
  return (
    <div className="jrk-card" style={{ padding: 'var(--jrk-space-4)', maxWidth: 1100 }}>
      <TableKit
        id="buildings"
        title="Units by building"
        rows={PROPERTIES.slice(0, 6)}
        columns={COLUMNS.slice(0, 5)}
        rowKey={(r) => r.code}
        openKeys={open}
        onToggle={toggle}
        childRows={(r) => [
          { key: `${r.code}-1`, cells: { name: 'Building 1', units: Math.ceil(r.units / 2) } },
          { key: `${r.code}-2`, cells: { name: 'Building 2', units: Math.floor(r.units / 2) } },
        ]}
        detail={(r) => (r.findings ? <span>Open findings: {r.findings}. Vendor visit booked for Dec 2.</span> : null)}
      />
    </div>
  );
};

/* Collapsible column groups, the shape of a pricing worksheet. A collapsed group keeps
   its summary column and says how many it is holding back. */
export const ColumnGroups = () => (
  <div className="jrk-card" style={{ padding: 'var(--jrk-space-4)', maxWidth: 1100 }}>
    <TableKit
      id="grouped"
      title="Occupancy and collections"
      rows={PROPERTIES}
      rowKey={(r) => r.code}
      groups={[
        { key: 'occ', label: 'Occupancy', summary: 'occupancy' },
        { key: 'money', label: 'Collections', summary: 'delinquent', closed: true },
      ]}
      columns={[
        { key: 'name', label: 'Property' },
        { key: 'units', label: 'Units', type: 'int', group: 'occ' },
        { key: 'occupancy', label: 'Occupancy', type: 'pct', group: 'occ' },
        { key: 'delinquent', label: 'Delinquent', type: 'money', group: 'money' },
        { key: 'renews', label: 'Contract renews', type: 'date', group: 'money' },
        {
          key: 'status',
          label: 'Status',
          get: (r) => (r.delinquent > 40000 ? 'Escalated' : 'Current'),
          render: (v: string) => <Badge tone={v === 'Escalated' ? 'critical' : 'good'}>{v}</Badge>,
        },
      ]}
    />
  </div>
);

/* No rows at all reads differently from no rows matching. */
export const Empty = () => (
  <div className="jrk-card" style={{ padding: 'var(--jrk-space-4)', maxWidth: 800 }}>
    <TableKit
      id="empty"
      title="Open work orders"
      rows={[] as Property[]}
      columns={COLUMNS.slice(0, 4)}
      empty="No open work orders at any property."
    />
  </div>
);

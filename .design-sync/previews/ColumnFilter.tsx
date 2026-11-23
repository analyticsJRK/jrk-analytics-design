import { useState } from 'react';
import { ColumnFilter, passes, readCell, valueOptions } from '@jrk/design';
import type { FilterState } from '@jrk/design';

type WorkOrder = { id: string; property: string; status: string; age: number };

const ORDERS: WorkOrder[] = [
  { id: 'WO-48211', property: 'Harbor Point', status: 'Open', age: 3 },
  { id: 'WO-48190', property: 'Harbor Point', status: 'Awaiting parts', age: 11 },
  { id: 'WO-48177', property: 'Riverside Flats', status: 'Open', age: 16 },
  { id: 'WO-48162', property: 'Terra Mar', status: 'Scheduled', age: 2 },
  { id: 'WO-48140', property: 'Chase Knolls', status: 'Open', age: 24 },
  { id: 'WO-48133', property: 'Bellevue Commons', status: 'Awaiting parts', age: 7 },
];

/* A hand-built table with a funnel on two headings. The heading carries
   `.jrk-th--filter` so its label keeps clear of the funnel; the rules come from
   filterCore, so this table filters exactly the way a TableKit does. Counts in the
   status checklist are taken against the age filter, and the reverse. */
export const InAHeading = () => {
  const [status, setStatus] = useState<FilterState | undefined>({ kind: 'values', selected: ['Open', 'Awaiting parts'] });
  const [age, setAge] = useState<FilterState | undefined>(undefined);
  const byAge = (o: WorkOrder) => !age || passes(age, readCell(String(o.age)));
  const byStatus = (o: WorkOrder) => !status || passes(status, readCell(o.status));
  const rows = ORDERS.filter((o) => byAge(o) && byStatus(o));
  return (
    <div style={{ maxWidth: 640, minHeight: 360 }}>
      <div className="jrk-table-wrap">
        <table className="jrk-table">
          <caption className="jrk-sr-only">Open work orders</caption>
          <thead>
            <tr>
              <th scope="col">Work order</th>
              <th scope="col">Property</th>
              <th scope="col" className="jrk-th--filter">
                Status
                <ColumnFilter
                  label="Status"
                  kind="values"
                  value={status}
                  onChange={setStatus}
                  options={() => valueOptions(ORDERS.map((o) => o.status), ORDERS.filter(byAge).map((o) => o.status))}
                />
              </th>
              <th scope="col" className="jrk-num jrk-th--filter">
                Age (days)
                <ColumnFilter label="Age (days)" kind="number" value={age} onChange={setAge} />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.property}</td>
                <td>{o.status}</td>
                <td className="jrk-num">{o.age}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

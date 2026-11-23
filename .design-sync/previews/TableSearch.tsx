import { TableSearch, SearchCount, useTableSearch } from '@jrk/design';

type Contract = { code: string; name: string; manager: string; vendor: string; cost: number };

const CONTRACTS: Contract[] = [
  { code: 'HBP', name: 'Harbor Point', manager: 'Dana Ortiz', vendor: 'Coastal Pest', cost: 14820 },
  { code: 'BLC', name: 'Bellevue Commons', manager: 'Sam Reyes', vendor: 'Evergreen Snow', cost: 9300 },
  { code: 'RVF', name: 'Riverside Flats', manager: 'Dana Ortiz', vendor: 'Coastal Pest', cost: 6110 },
  { code: 'TEM', name: 'Terra Mar', manager: 'Lee Park', vendor: 'Pacific Waste', cost: 22840 },
  { code: 'CKN', name: 'Chase Knolls', manager: 'Lee Park', vendor: 'Pacific Waste', cost: 18200 },
  { code: 'MAN', name: 'Manchester Lakes', manager: 'Sam Reyes', vendor: 'Evergreen Snow', cost: 11475 },
];

/* The box, its count, and a table rendered from `matched`. The caller names the
   searchable fields; the rule (trimmed, case-insensitive, each field on its own) is
   the library's. */
export const Default = () => {
  const { q, setQ, matched } = useTableSearch(CONTRACTS, (c) => [c.code, c.name, c.manager, c.vendor]);
  return (
    <div className="jrk-card" style={{ padding: 'var(--jrk-space-4)', maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--jrk-space-3)', marginBottom: 'var(--jrk-space-3)' }}>
        <TableSearch value={q} onChange={setQ} label="Search contracts" placeholder="code, property or vendor…" />
        <SearchCount shown={matched.length} total={CONTRACTS.length} noun="contracts" singular="contract" />
      </div>
      <div className="jrk-table-wrap">
        <table className="jrk-table">
          <caption className="jrk-sr-only">Vendor contracts</caption>
          <thead>
            <tr>
              <th scope="col">Property</th>
              <th scope="col">Manager</th>
              <th scope="col">Vendor</th>
              <th scope="col" className="jrk-num">Annual cost</th>
            </tr>
          </thead>
          <tbody>
            {matched.map((c) => (
              <tr key={c.code}>
                <td>{c.name}</td>
                <td>{c.manager}</td>
                <td>{c.vendor}</td>
                <td className="jrk-num">${c.cost.toLocaleString('en-US')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

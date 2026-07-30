import { Select } from '@jrk/design';

/* The canonical select: label + control + help, wired by the Field shell.
   A Select always needs <option> children. */
export const Default = () => (
  <div className="jrk-stack" style={{ maxWidth: 320 }}>
    <Select label="Property" defaultValue="Parkside Commons" help="Scopes every figure on this page.">
      <option>All properties</option>
      <option>Parkside Commons</option>
      <option>Vista Ridge</option>
      <option>Harbor Point</option>
      <option>Riverside Flats</option>
    </Select>
  </div>
);

export const Sizes = () => (
  <div className="jrk-stack" style={{ maxWidth: 320 }}>
    <Select label="Small" size="sm" defaultValue="Last 30 days">
      <option>Last 30 days</option>
      <option>Quarter to date</option>
      <option>Trailing 12 months</option>
    </Select>
    <Select label="Medium" size="md" defaultValue="Southeast">
      <option>All regions</option>
      <option>Southeast</option>
      <option>Mountain West</option>
    </Select>
    <Select label="Large" size="lg" defaultValue="Accrual">
      <option>Accrual</option>
      <option>Cash</option>
    </Select>
  </div>
);

/* Required renders the asterisk on the label; `error` sets aria-invalid, wires
   aria-describedby to the message, and renders the icon beside it. */
export const RequiredAndError = () => (
  <div className="jrk-stack" style={{ maxWidth: 320 }}>
    <Select label="Reason code" required defaultValue="" error="Pick a reason code before posting.">
      <option value="">Select a reason code…</option>
      <option>Concession — renewal</option>
      <option>Write-off — skip / eviction</option>
      <option>Bad debt recovery</option>
    </Select>
    <Select label="Approver" required defaultValue="Regional manager">
      <option>Regional manager</option>
      <option>Asset manager</option>
      <option>Controller</option>
    </Select>
  </div>
);

export const Disabled = () => (
  <div className="jrk-stack" style={{ maxWidth: 320 }}>
    <Select label="Fiscal period" defaultValue="2026-06 (closed)" disabled help="Locked once the period is closed.">
      <option>2026-06 (closed)</option>
    </Select>
    <Select label="Ledger" defaultValue="Operating">
      <option>Operating</option>
      <option>Capital</option>
    </Select>
  </div>
);

/* Filters sit in ONE row above the charts they govern. In a filter bar the
   selects are small and labelled by aria-label, since the row is self-evident. */
export const FilterBar = () => (
  <div className="jrk-filter-bar">
    <Select size="sm" aria-label="Period" defaultValue="Quarter to date">
      <option>Last 30 days</option>
      <option>Quarter to date</option>
      <option>Trailing 12 months</option>
    </Select>
    <Select size="sm" aria-label="Region" defaultValue="Southeast">
      <option>All regions</option>
      <option>Southeast</option>
      <option>Mountain West</option>
    </Select>
    <Select size="sm" aria-label="Metric" defaultValue="Delinquency %">
      <option>Occupancy %</option>
      <option>Delinquency %</option>
      <option>NOI per unit</option>
    </Select>
  </div>
);

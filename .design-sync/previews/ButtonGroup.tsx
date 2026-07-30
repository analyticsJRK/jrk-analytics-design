import { Button, ButtonGroup } from '@jrk/design';

const ChartIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 13.5V9M6.5 13.5V4.5M10.5 13.5v-6M14 13.5V2.5" />
  </svg>
);

const TableIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.5" y="3" width="11" height="10" rx="1.5" />
    <path d="M2.5 6.5h11M6.5 6.5v6.5" />
  </svg>
);

/* A segmented control: several Buttons in one group, the active one marked with
   aria-pressed, and `label` so it announces as a single control. */
export const Default = () => (
  <ButtonGroup label="Granularity">
    <Button variant="secondary" aria-pressed="true">Day</Button>
    <Button variant="secondary" aria-pressed="false">Week</Button>
    <Button variant="secondary" aria-pressed="false">Month</Button>
  </ButtonGroup>
);

export const Sizes = () => (
  <div className="jrk-stack" style={{ alignItems: 'flex-start' }}>
    <ButtonGroup label="Basis (small)">
      <Button variant="secondary" size="sm" aria-pressed="true">Accrual</Button>
      <Button variant="secondary" size="sm" aria-pressed="false">Cash</Button>
    </ButtonGroup>
    <ButtonGroup label="Basis (medium)">
      <Button variant="secondary" aria-pressed="true">Accrual</Button>
      <Button variant="secondary" aria-pressed="false">Cash</Button>
    </ButtonGroup>
    <ButtonGroup label="Basis (large)">
      <Button variant="secondary" size="lg" aria-pressed="true">Accrual</Button>
      <Button variant="secondary" size="lg" aria-pressed="false">Cash</Button>
    </ButtonGroup>
  </div>
);

/* Icon-only segments still need an aria-label each — the icon is all the
   content the button has. */
export const ViewToggle = () => (
  <div className="jrk-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
    <ButtonGroup label="View mode">
      <Button variant="secondary" size="sm" iconOnly aria-label="Chart view" aria-pressed="true"><ChartIcon /></Button>
      <Button variant="secondary" size="sm" iconOnly aria-label="Table view" aria-pressed="false"><TableIcon /></Button>
    </ButtonGroup>
    <ButtonGroup label="Occupancy window">
      <Button variant="secondary" size="sm" aria-pressed="false">30d</Button>
      <Button variant="secondary" size="sm" aria-pressed="true">90d</Button>
      <Button variant="secondary" size="sm" aria-pressed="false">YTD</Button>
      <Button variant="secondary" size="sm" aria-pressed="false">T12</Button>
    </ButtonGroup>
  </div>
);

/* No aria-pressed: a toolbar of related actions rather than a set of toggles,
   so the group is unlabeled and nothing reads as selected. */
export const ActionToolbar = () => (
  <ButtonGroup>
    <Button variant="secondary">Export CSV</Button>
    <Button variant="secondary">Export XLSX</Button>
    <Button variant="secondary">Schedule</Button>
  </ButtonGroup>
);

/* A segment can be unavailable while the rest of the control stays usable —
   Forecast has no published model for this portfolio yet. */
export const WithDisabledSegment = () => (
  <ButtonGroup label="Lease audit scope">
    <Button variant="secondary" aria-pressed="true">Delinquency</Button>
    <Button variant="secondary" aria-pressed="false">Renewals</Button>
    <Button variant="secondary" aria-pressed="false" disabled>Forecast</Button>
  </ButtonGroup>
);

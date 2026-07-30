import { Spinner, Card, Status } from '@jrk/design';

/* All three sizes, each paired with visible text — a spinner alone announces
   nothing, and `label` is sr-only, so the visible copy is doing the work here.
   `.jrk-loading` stacks the ring over its caption and centers the pair. */
export const Sizes = () => (
  <div className="jrk-grid jrk-grid-3" style={{ maxWidth: 620, alignItems: 'end' }}>
    <div className="jrk-loading" aria-busy="true" style={{ padding: 'var(--jrk-space-4) 0' }}>
      <span className="jrk-overline">sm</span>
      <Spinner size="sm" label="Refreshing occupancy tile" />
      <span>Refreshing tile</span>
    </div>
    <div className="jrk-loading" aria-busy="true" style={{ padding: 'var(--jrk-space-4) 0' }}>
      <span className="jrk-overline">md</span>
      <Spinner size="md" label="Loading portfolio data" />
      <span>Loading portfolio data…</span>
    </div>
    <div className="jrk-loading" aria-busy="true" style={{ padding: 'var(--jrk-space-4) 0' }}>
      <span className="jrk-overline">lg</span>
      <Spinner size="lg" label="Rebuilding NOI forecast" />
      <span>Rebuilding forecast…</span>
    </div>
  </div>
);

/* Inline beside the row it belongs to — the small ring reads as "this one value
   is still resolving", not "the whole page is loading". */
export const Inline = () => (
  <div className="jrk-stack" style={{ maxWidth: 420 }}>
    <div className="jrk-row-between">
      <span>Parkside Commons</span>
      <span className="jrk-row" style={{ alignItems: 'center' }}>
        <Spinner size="sm" label="Calculating net operating income" />
        <span className="jrk-caption">Calculating NOI…</span>
      </span>
    </div>
    <div className="jrk-divider" />
    <div className="jrk-row-between">
      <span>Vista Ridge</span>
      <span className="jrk-tabular">$962k</span>
    </div>
    <div className="jrk-divider" />
    <div className="jrk-row-between">
      <span>Harbor Point</span>
      <span className="jrk-tabular">$705k</span>
    </div>
    <div className="jrk-divider" />
    <div className="jrk-row-between">
      <span>Cedar Hollow</span>
      <span className="jrk-row" style={{ alignItems: 'center' }}>
        <Spinner size="sm" label="Calculating net operating income" />
        <span className="jrk-caption">Calculating NOI…</span>
      </span>
    </div>
  </div>
);

/* The card keeps its title and geometry while the body loads, so the layout does
   not jump when the data lands. `aria-busy` goes on the region being replaced. */
export const InCard = () => (
  <div className="jrk-grid jrk-grid-2">
    <Card title="Delinquency by property" subtitle="Quarter to date, accrual basis">
      <div className="jrk-loading" aria-busy="true">
        <Spinner size="lg" label="Loading delinquency by property" />
        <span>Loading 47 properties…</span>
      </div>
    </Card>
    <Card title="Data feeds" subtitle="Last 24 hours">
      <div className="jrk-stack">
        <Status tone="good">General ledger loaded 6:02 AM ET</Status>
        <div className="jrk-row" style={{ alignItems: 'center' }}>
          <Spinner size="sm" label="Rent roll sync running" />
          <span>Rent roll — 14 of 47 properties</span>
        </div>
        <Status tone="neutral">Forecast model runs Sundays</Status>
      </div>
    </Card>
  </div>
);

import { Badge } from '@jrk/design';

/* The tone axis. `good | warning | serious | critical` auto-render their icon —
   a status badge always carries icon AND label. `neutral` and `accent` are
   deliberately icon-free: they label, they do not judge. */
export const Tones = () => (
  <div className="jrk-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
    <Badge tone="good">Current</Badge>
    <Badge tone="warning">Partial payment</Badge>
    <Badge tone="serious">30+ days past due</Badge>
    <Badge tone="critical">Sent to collections</Badge>
    <Badge tone="neutral">Draft</Badge>
    <Badge tone="accent">Beta</Badge>
  </div>
);

/* Outline is the quieter fill — for a badge inside a dense table cell where a
   solid chip on every row would over-saturate the column. */
export const Outline = () => (
  <div className="jrk-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
    <Badge tone="good" variant="outline">Audit passed</Badge>
    <Badge tone="warning" variant="outline">Needs review</Badge>
    <Badge tone="serious" variant="outline">Variance &gt; 5%</Badge>
    <Badge tone="critical" variant="outline">Rejected</Badge>
    <Badge tone="neutral" variant="outline">Unassigned</Badge>
    <Badge tone="accent" variant="outline">Forecast</Badge>
  </div>
);

export const Sizes = () => (
  <div className="jrk-stack">
    <div className="jrk-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
      <Badge tone="good" size="md">Occupancy on target</Badge>
      <Badge tone="warning" size="md">Renewal window closing</Badge>
      <Badge tone="critical" size="md">Feed stalled</Badge>
    </div>
    <div className="jrk-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
      <Badge tone="good" size="sm">On target</Badge>
      <Badge tone="warning" size="sm">Closing</Badge>
      <Badge tone="critical" size="sm">Stalled</Badge>
    </div>
  </div>
);

/* `icon={false}` is for a count chip, where the tone is decoration rather than
   meaning. Never turn it off where the tone carries the message. */
export const CountChips = () => (
  <div className="jrk-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
    <Badge tone="neutral">312 units</Badge>
    <Badge tone="accent">14 open lease audits</Badge>
    <Badge tone="warning" icon={false}>7 in queue</Badge>
    <Badge tone="good" icon={false} size="sm">98.1% collected</Badge>
  </div>
);

/* How the badge is actually consumed: one per row, carrying the delinquency
   verdict for a property. */
export const InContext = () => (
  <div className="jrk-stack" style={{ maxWidth: 420 }}>
    <div className="jrk-row-between">
      <span>Parkside Commons</span>
      <Badge tone="good" size="sm">Current</Badge>
    </div>
    <div className="jrk-divider" />
    <div className="jrk-row-between">
      <span>Vista Ridge</span>
      <Badge tone="warning" size="sm">Partial</Badge>
    </div>
    <div className="jrk-divider" />
    <div className="jrk-row-between">
      <span>Harbor Point</span>
      <Badge tone="serious" size="sm">30+ days</Badge>
    </div>
    <div className="jrk-divider" />
    <div className="jrk-row-between">
      <span>Riverbend Flats</span>
      <Badge tone="critical" size="sm">Escalated</Badge>
    </div>
  </div>
);

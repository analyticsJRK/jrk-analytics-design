import { Status } from '@jrk/design';

/* Dot + text label. The dot never appears alone — a bare color is unreadable to
   a screen reader and to a colorblind reader both. */
export const Tones = () => (
  <div className="jrk-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
    <Status tone="good">Sync healthy</Status>
    <Status tone="warning">Sync delayed</Status>
    <Status tone="serious">Partial load</Status>
    <Status tone="critical">Feed stalled</Status>
    <Status tone="neutral">Not scheduled</Status>
  </div>
);

/* `pulse` is reserved for a genuinely live indicator — a running job, an open
   connection. A pulsing dot on a settled value reads as an error. */
export const Live = () => (
  <div className="jrk-stack" style={{ maxWidth: 360 }}>
    <Status tone="good" pulse>
      Snowflake sync running — 14 of 47 properties
    </Status>
    <Status tone="warning" pulse>
      Retrying Yardi export (attempt 3 of 5)
    </Status>
    <Status tone="critical" pulse>
      Delinquency job failing — retrying every 60s
    </Status>
  </div>
);

/* A vertical feed list is where Status earns its keep: the label carries the
   meaning, the dot only speeds up the scan. */
export const FeedList = () => (
  <div className="jrk-stack" style={{ maxWidth: 440 }}>
    <div className="jrk-row-between">
      <Status tone="good">General ledger</Status>
      <span className="jrk-caption">Loaded 6:02 AM ET</span>
    </div>
    <div className="jrk-divider" />
    <div className="jrk-row-between">
      <Status tone="good" pulse>Rent roll</Status>
      <span className="jrk-caption">Loading now</span>
    </div>
    <div className="jrk-divider" />
    <div className="jrk-row-between">
      <Status tone="warning">Work orders</Status>
      <span className="jrk-caption">Loaded 11:41 PM ET</span>
    </div>
    <div className="jrk-divider" />
    <div className="jrk-row-between">
      <Status tone="critical">Lease audits</Status>
      <span className="jrk-caption">Last success 14h ago</span>
    </div>
    <div className="jrk-divider" />
    <div className="jrk-row-between">
      <Status tone="neutral">Forecast model</Status>
      <span className="jrk-caption">Runs Sundays</span>
    </div>
  </div>
);

/* Inline inside running text — the label is a real word in the sentence, not a
   legend key. */
export const Inline = () => (
  <div className="jrk-stack" style={{ maxWidth: 480 }}>
    <p>
      Harbor Point is <Status tone="warning">under review</Status> until the
      property manager confirms the 12 disputed charges.
    </p>
    <p>
      Portfolio collections are <Status tone="good">on pace</Status> at 98.1% of
      $4,284k billed this cycle.
    </p>
  </div>
);

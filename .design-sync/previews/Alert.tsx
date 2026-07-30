import { Alert, Button } from '@jrk/design';

const CriticalIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
    <circle cx="10" cy="10" r="8" />
    <path d="M10 6v5M10 13.5h.01" />
  </svg>
);

const InfoIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
    <circle cx="10" cy="10" r="8" />
    <path d="M10 9v5M10 6.5h.01" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="10" cy="10" r="8" />
    <path d="M6.5 10.5l2.5 2.5 4.5-5" />
  </svg>
);

/* The tone axis. `critical` takes role="alert" and interrupts; every other tone
   is announced politely via role="status". */
export const Tones = () => (
  <div className="jrk-stack" style={{ maxWidth: 620 }}>
    <Alert tone="critical" title="Snowflake sync failed">
      Last successful load was 14 hours ago. Portfolio figures below may be stale.
    </Alert>
    <Alert tone="serious" title="6 properties missing a rent roll">
      Parkside Commons, Vista Ridge and 4 others have no rent roll for July. NOI
      is understated until they land.
    </Alert>
    <Alert tone="warning" title="Delinquency above threshold">
      Riverbend Flats is at 7.8% — the portfolio covenant caps it at 5.0%.
    </Alert>
    <Alert tone="good" title="Lease audit batch closed">
      All 37 audits for Q2 were reconciled with no variance over $250.
    </Alert>
    <Alert tone="accent" title="Accrual basis">
      Switch to cash basis in the filter bar to match the GL export.
    </Alert>
    <Alert tone="neutral" title="Scheduled maintenance">
      Reporting is read-only Sunday 2:00–4:00 AM ET while the warehouse rebuilds.
    </Alert>
  </div>
);

/* The icon slot is opt-in — pass the tone's glyph so the message does not rely
   on fill color alone. */
export const WithIcon = () => (
  <div className="jrk-stack" style={{ maxWidth: 620 }}>
    <Alert tone="critical" title="Delinquency feed stalled" icon={<CriticalIcon />}>
      The collections queue has not refreshed since 4:12 AM ET. 12 accounts may
      be missing from this view.
    </Alert>
    <Alert tone="accent" title="Forecast is a model output" icon={<InfoIcon />}>
      Projected NOI of $4,820k assumes current occupancy holds through Q4.
    </Alert>
    <Alert tone="good" title="Export delivered" icon={<CheckIcon />}>
      Portfolio summary for 47 properties was emailed to 6 recipients.
    </Alert>
  </div>
);

/* An alert can carry the action that resolves it. */
export const WithAction = () => (
  <div style={{ maxWidth: 620 }}>
    <Alert tone="warning" title="3 accounts ready to escalate" icon={<CriticalIcon />}>
      <p>
        Harbor Point units 214, 308 and 411 are past 60 days with a combined
        balance of $18,940.
      </p>
      <div className="jrk-row" style={{ marginTop: 'var(--jrk-space-3)' }}>
        <Button variant="secondary" size="sm">Review accounts</Button>
        <Button variant="ghost" size="sm">Snooze 7 days</Button>
      </div>
    </Alert>
  </div>
);

/* Title-only — a one-line banner where the heading is the whole message. */
export const TitleOnly = () => (
  <div className="jrk-stack" style={{ maxWidth: 620 }}>
    <Alert tone="good" title="All 47 properties reported on time." icon={<CheckIcon />} />
    <Alert tone="warning" title="2 properties still pending a July close." />
    <Alert tone="neutral" title="Figures as of July 28, 2026 at 6:02 AM ET." />
  </div>
);

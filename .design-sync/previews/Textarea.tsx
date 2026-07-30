import { Textarea } from '@jrk/design';

/* Label + control + help, wired by the same Field shell the Input uses. */
export const Default = () => (
  <div className="jrk-stack" style={{ maxWidth: 380 }}>
    <Textarea
      label="Audit note"
      rows={4}
      placeholder="What did the lease file show?"
      help="Visible to the regional manager on the audit summary."
    />
  </div>
);

export const WithValue = () => (
  <div className="jrk-stack" style={{ maxWidth: 380 }}>
    <Textarea
      label="Variance explanation"
      rows={4}
      defaultValue={
        'Parkside Commons NOI came in $42,180 under budget. Turn costs ran high on 14 units after the June move-out wave; make-ready spend was $61,400 against a $34,000 plan.'
      }
      help="Attached to the June close package."
    />
  </div>
);

/* Required renders the asterisk; `error` sets aria-invalid and renders the
   message with an icon, so the red border is never the only signal. */
export const RequiredAndError = () => (
  <div className="jrk-stack" style={{ maxWidth: 470 }}>
    <Textarea
      label="Write-off justification"
      required
      rows={3}
      defaultValue="Skip."
      error="Justifications under 40 characters are rejected by the controller."
    />
  </div>
);

export const Disabled = () => (
  <div className="jrk-stack" style={{ maxWidth: 380 }}>
    <Textarea
      label="Prior period note"
      rows={3}
      defaultValue={'Approved by A. Whitfield on 2026-05-04. Reason code: Concession — renewal.'}
      disabled
      help="Locked once the period is closed."
    />
  </div>
);

/* `rows` is the only real size axis — a short comment box versus a long
   narrative field. */
export const Rows = () => (
  <div className="jrk-stack" style={{ maxWidth: 380 }}>
    <Textarea label="Short comment" rows={2} placeholder="One or two lines" />
    <Textarea label="Renewal narrative" rows={6} placeholder="Full write-up for the asset review" />
  </div>
);

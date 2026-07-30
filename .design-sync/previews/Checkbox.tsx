import { Checkbox } from '@jrk/design';

/* Checkbox is for choices that only take effect on Save — here the options are
   staged, then applied when the report is re-run. */
export const Default = () => (
  <div className="jrk-stack" style={{ maxWidth: 340 }}>
    <Checkbox label="Include vacant units" defaultChecked />
    <Checkbox label="Exclude corporate leases" />
    <Checkbox label="Show units in eviction" />
  </div>
);

/* `hint` renders a second line under the label — use it for the consequence of
   the choice, not a restatement of it. */
export const WithHints = () => (
  <div className="jrk-stack" style={{ maxWidth: 340 }}>
    <Checkbox label="Roll up to portfolio" hint="Hides the per-property rows" defaultChecked />
    <Checkbox label="Net of concessions" hint="Subtracts $184,200 of June credits" />
    <Checkbox label="Prorate partial months" hint="Splits rent by days occupied" />
  </div>
);

export const States = () => (
  <div className="jrk-stack" style={{ maxWidth: 340 }}>
    <Checkbox label="Checked" defaultChecked />
    <Checkbox label="Unchecked" />
    <Checkbox label="Disabled and checked" defaultChecked disabled hint="Required by the audit template" />
    <Checkbox label="Disabled" disabled hint="Needs the delinquency feed" />
  </div>
);

/* A realistic staged form: a column of options plus the Save that applies them. */
export const ExportOptions = () => (
  <div className="jrk-stack" style={{ maxWidth: 340 }}>
    <span className="jrk-overline">Columns to export</span>
    <Checkbox label="Occupancy %" defaultChecked />
    <Checkbox label="Delinquency %" defaultChecked />
    <Checkbox label="NOI per unit" hint="Accrual basis only" />
    <Checkbox label="Trailing 12-month revenue" />
    <Checkbox label="Concession detail" hint="Adds 4 columns per property" />
  </div>
);

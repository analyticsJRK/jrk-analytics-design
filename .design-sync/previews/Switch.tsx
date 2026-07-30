import { Switch } from '@jrk/design';

/* A Switch is for settings that take effect immediately — no Save press. If the
   change needs a Save, use a Checkbox instead. */
export const Default = () => (
  <div className="jrk-stack" style={{ maxWidth: 340 }}>
    <Switch label="Auto-refresh every 5 minutes" defaultChecked />
    <Switch label="Highlight properties below 90% occupancy" />
  </div>
);

export const States = () => (
  <div className="jrk-stack" style={{ maxWidth: 340 }}>
    <Switch label="On" defaultChecked />
    <Switch label="Off" />
    <Switch label="On and locked by policy" defaultChecked disabled />
    <Switch label="Off — delinquency feed unavailable" disabled />
  </div>
);

/* A settings panel: each toggle applies the moment it is flipped. */
export const DashboardSettings = () => (
  <div className="jrk-stack" style={{ maxWidth: 340 }}>
    <span className="jrk-overline">Dashboard preferences</span>
    <Switch label="Auto-refresh every 5 minutes" defaultChecked />
    <Switch label="Show delinquency alerts in the topbar" defaultChecked />
    <Switch label="Compact table rows" />
    <Switch label="Email the weekly portfolio digest" defaultChecked />
    <Switch label="Round currency to whole dollars" />
  </div>
);

/* Chart-scoped toggles — each one redraws the chart the instant it flips, which
   is exactly the case a switch is for. */
export const ChartToggles = () => (
  <div className="jrk-stack" style={{ maxWidth: 380 }}>
    <Switch label="Compare to prior year" defaultChecked />
    <Switch label="Include Vista Ridge lease-up units" defaultChecked />
    <Switch label="Annualize NOI from the trailing 3 months" />
  </div>
);

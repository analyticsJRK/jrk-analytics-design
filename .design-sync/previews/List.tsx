import { List, ListRow, Switch, Badge } from '@jrk/design';

/* The inset grouped list — what iOS Settings and macOS System Settings are
   built from, and the shape that most makes an interface read as Apple.
   Separators inset from the leading text edge; a full-bleed rule is the
   giveaway that a list was built as a generic table. */
export const KeyValue = () => (
  <List header="Report" footer="Applies to every metric in this report.">
    <ListRow label="Property" value="All properties" />
    <ListRow label="Period" value="Quarter to date" />
    <ListRow label="Basis" value="Accrual" />
    <ListRow label="Last updated" value="23 Feb 2026" />
  </List>
);

/* A row that navigates shows a chevron. Apple never puts a button here — the
   chevron IS the affordance, and the whole row is the target. */
export const Navigating = () => (
  <List header="Portfolio">
    <ListRow href="#" label="Properties" value="47" />
    <ListRow href="#" label="Units" value="8,412" />
    <ListRow href="#" label="Delinquent accounts" value={<Badge tone="critical" size="sm">12</Badge>} />
    <ListRow href="#" label="Open lease audits" value="14" />
  </List>
);

/* A second line under the label, for a row whose meaning is not obvious from
   its name alone. */
export const WithDetail = () => (
  <List header="Thresholds" comfortable>
    <ListRow label="AM NOI" detail="Green above budget, amber within 10%" value="Budget" />
    <ListRow label="Occupancy" detail="Green at 95%, amber at 90%" value="95.0%" />
    <ListRow label="Delinquency" detail="Inverted — down is the good outcome" value="2.5%" />
  </List>
);

/* Control rows. Inside a grouped list the field has no chrome of its own — the
   row is the field, and the border only returns on focus. */
export const Controls = () => (
  <List header="Preferences" footer="Changes apply immediately.">
    <ListRow label="Auto-refresh" control={<Switch label="" defaultChecked />} />
    <ListRow label="Roll up to portfolio" control={<Switch label="" />} />
    <ListRow label="Include vacant units" control={<Switch label="" defaultChecked />} />
  </List>
);

/* Selection fills the whole row with the accent, as Apple does — not a soft
   tint behind the label. */
export const Selection = () => (
  <List header="Fund">
    <ListRow label="EK23" value="47 properties" />
    <ListRow label="EK24" value="18 properties" selected />
    <ListRow label="EK25" value="6 properties" />
  </List>
);

import { List, ListRow, Switch, Badge } from '@jrk/design';

/* One row of an inset grouped list. Always inside <List> — the container owns
   the rounding, the fill and the inset separators. */
export const Variants = () => (
  <List header="Row variants">
    <ListRow label="Plain" value="a trailing value" />
    <ListRow label="With detail" detail="a second line for a row that needs explaining" value="94.2%" />
    <ListRow label="Navigating" value="47" href="#" />
    <ListRow label="Rich value" value={<Badge tone="critical" size="sm">12</Badge>} />
    <ListRow label="Control" control={<Switch label="" defaultChecked />} />
    <ListRow label="Selected" value="accent fill" selected />
  </List>
);

/* `href` (or `onClick`) renders the chevron and makes the whole row the target.
   Apple never puts a button in a list row — the chevron IS the affordance. */
export const Navigating = () => (
  <List header="Drill down" footer="The whole row is the hit target, not just the label.">
    <ListRow href="#" label="Riverside Flats" detail="Southeast · 156 units" value="9.2%" />
    <ListRow href="#" label="Harbor Point" detail="Southeast · 412 units" value="7.4%" />
    <ListRow href="#" label="Cedar Grove" detail="Midwest · 204 units" value="5.1%" />
  </List>
);

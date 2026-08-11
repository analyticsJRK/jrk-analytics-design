import { Menu, MenuItem, MenuLabel, MenuSeparator } from '@jrk/design';

/* The common case: a rule above the destructive row, so it is not hit on the way
   to a benign one. Distance is not a confirmation — it makes the row harder to
   reach by accident, it does not make the action safe. */
export const Default = () => (
  <div className="jrk-row" style={{ justifyContent: 'flex-end', maxWidth: 460, minHeight: 260 }}>
    <Menu label="Actions" defaultOpen>
      <MenuItem onSelect={() => {}}>Export CSV</MenuItem>
      <MenuItem onSelect={() => {}}>Schedule report</MenuItem>
      <MenuSeparator />
      <MenuItem danger onSelect={() => {}}>Remove from portfolio</MenuItem>
    </Menu>
  </div>
);

/* Paired with MenuLabel: the separator supplies the rule, the label supplies the
   words. One separator per grouping — two adjacent ones, or one at the top or
   bottom of the panel, means the grouping is doing no work. */
export const BetweenGroups = () => (
  <div className="jrk-row" style={{ justifyContent: 'flex-end', maxWidth: 460, minHeight: 260 }}>
    <Menu label="Export" width="240px" defaultOpen>
      <MenuLabel>This property</MenuLabel>
      <MenuItem onSelect={() => {}}>Harbor Point CSV</MenuItem>
      <MenuSeparator />
      <MenuLabel>All 37 properties</MenuLabel>
      <MenuItem onSelect={() => {}}>Portfolio CSV</MenuItem>
    </Menu>
  </div>
);

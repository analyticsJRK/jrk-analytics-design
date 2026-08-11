import { Menu, MenuItem, MenuLabel, MenuSeparator } from '@jrk/design';

/* Name the SCOPE, not the category. "This property" and "All 37 properties" tell
   the reader which rows do what; "Options" and "More" tell them nothing. */
export const Default = () => (
  <div className="jrk-row" style={{ justifyContent: 'flex-end', maxWidth: 460, minHeight: 260 }}>
    <Menu label="Export" width="240px" defaultOpen>
      <MenuLabel>This property</MenuLabel>
      <MenuItem onSelect={() => {}}>Harbor Point CSV</MenuItem>
      <MenuItem onSelect={() => {}}>Harbor Point rent roll</MenuItem>
      <MenuSeparator />
      <MenuLabel>All 37 properties</MenuLabel>
      <MenuItem onSelect={() => {}}>Portfolio CSV</MenuItem>
      <MenuItem onSelect={() => {}}>Portfolio summary PDF</MenuItem>
    </Menu>
  </div>
);

/* A single caption over the whole panel, where every row shares one scope and
   the reader still needs to know what that scope is. */
export const SingleGroup = () => (
  <div className="jrk-row" style={{ justifyContent: 'flex-end', maxWidth: 460, minHeight: 260 }}>
    <Menu label="Basis" defaultOpen>
      <MenuLabel>Accounting basis</MenuLabel>
      <MenuItem onSelect={() => {}}>Accrual</MenuItem>
      <MenuItem onSelect={() => {}}>Cash</MenuItem>
    </Menu>
  </div>
);

import type { ReactNode } from 'react';
import { NavMenuItem, NavMenuSeparator } from '@jrk/design';

/* Same harness as NavMenuItem's preview, and for the same reason:
   .jrk-nav-flyout is `position: fixed`, so in a preview cell with no rail to
   measure it would pin itself to the top-left of the capture. `position: static`
   returns it to flow; the class stays because the panel's own rules are scoped
   to it. */
const panelCss = `
.pv-panel {
  position: static;
  width: 232px;
  max-height: none;
}
.pv-row { display: flex; gap: var(--jrk-space-6); flex-wrap: wrap; align-items: flex-start; }
`;

const Panel = ({ children }: { children: ReactNode }) => (
  <>
    <style dangerouslySetInnerHTML={{ __html: panelCss }} />
    <div className="jrk-menu jrk-nav-flyout pv-panel">{children}</div>
  </>
);

/* The rule between a section's own views and the things that merely live near
   them. It takes no props — a separator that needs configuring is a heading, and
   .jrk-menu__label is what that is for. */
export const Default = () => (
  <Panel>
    <NavMenuItem href="#/gl/unbalanced">Unbalanced accounts</NavMenuItem>
    <NavMenuItem href="#/gl/missing">Missing closes</NavMenuItem>
    <NavMenuItem href="#/gl/mapping">Mapping exceptions</NavMenuItem>
    <NavMenuSeparator />
    <NavMenuItem href="#/gl/audit">Audit log</NavMenuItem>
  </Panel>
);

/* Full-bleed, unlike .jrk-list__row's inset separator — and the two cards below
   are here to make that contrast deliberate rather than accidental. The grouped
   list insets its rule past the leading text edge because a full-bleed rule there
   is the giveaway that a list was built as a generic table. A menu panel is a
   different surface: 232px wide with its own padding, where an inset rule reads
   as a misalignment rather than as a refinement. Same library, opposite answers,
   because the question is not the same one. */
export const AgainstTheGroupedList = () => (
  <>
    <style dangerouslySetInnerHTML={{ __html: panelCss }} />
    <div className="pv-row">
      <div className="jrk-menu jrk-nav-flyout pv-panel">
        <NavMenuItem href="#/a">Delinquency</NavMenuItem>
        <NavMenuSeparator />
        <NavMenuItem href="#/b">Aging buckets</NavMenuItem>
      </div>
      <div className="jrk-list" style={{ width: 232 }}>
        <ul className="jrk-list__group">
          <li className="jrk-list__row">
            <span className="jrk-list__label">Period</span>
            <span className="jrk-list__value">Quarter to date</span>
          </li>
          <li className="jrk-list__row">
            <span className="jrk-list__label">Basis</span>
            <span className="jrk-list__value">Accrual</span>
          </li>
        </ul>
      </div>
    </div>
  </>
);

/* What NOT to do. Two adjacent separators, and one at the head of the panel:
   both mean the grouping is doing no work, and the panel ends up striped rather
   than sectioned. Included because this is the failure mode that actually shows
   up once a menu grows past about six rows. */
export const Overused = () => (
  <Panel>
    <NavMenuSeparator />
    <NavMenuItem href="#/a">Revenue</NavMenuItem>
    <NavMenuSeparator />
    <NavMenuSeparator />
    <NavMenuItem href="#/b">Expense</NavMenuItem>
    <NavMenuSeparator />
    <NavMenuItem href="#/c">NOI</NavMenuItem>
  </Panel>
);

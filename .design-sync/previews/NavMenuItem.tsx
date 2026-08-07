import type { ReactNode } from 'react';
import { NavMenuItem, NavMenuSeparator } from '@jrk/design';

/* NavMenuItem only ever exists inside a NavMenu panel, so these cards render the
   panel surface directly rather than rebuilding the whole shell — NavMenu's own
   preview covers the placement story, and repeating it here would document the
   rail a second time instead of documenting the row.
 *
 * One harness override, and it is load-bearing rather than cosmetic:
 * .jrk-nav-flyout is `position: fixed` (it has to be — .jrk-sidebar__nav is a
 * scroll container on both axes and would clip an in-flow panel at the rail's
 * edge). Fixed coordinates are viewport coordinates, so dropped into a preview
 * cell with no rail to measure, the panel would pin itself to the top-left of the
 * capture. `position: static` puts it back in flow. The class is kept rather than
 * dropped because the aria-current rule below is scoped to it — style the item
 * without .jrk-nav-flyout as an ancestor and the current-page treatment silently
 * does not appear, which would make this preview a lie. */
const panelCss = `
.pv-panel {
  position: static;
  width: 232px;
  max-height: none;
}
.pv-row { display: flex; gap: var(--jrk-space-6); flex-wrap: wrap; align-items: flex-start; }
.pv-cap {
  margin: 0 0 var(--jrk-space-2);
  font-size: var(--jrk-text-2xs);
  font-weight: var(--jrk-weight-semibold);
  letter-spacing: var(--jrk-tracking-caps);
  text-transform: uppercase;
  color: var(--jrk-text-muted);
}
`;

const Panel = ({ children }: { children: ReactNode }) => (
  <>
    <style dangerouslySetInnerHTML={{ __html: panelCss }} />
    <div className="jrk-menu jrk-nav-flyout pv-panel">{children}</div>
  </>
);

/* Resting rows. They are links to places, which is why the panel is a labelled
   group of links and never role="menu" — that role declares application-mode
   semantics, obliges a roving tabindex and type-ahead, and makes a screen reader
   announce a set of destinations as if they were commands. Tab walks these. */
export const Default = () => (
  <Panel>
    <NavMenuItem href="#/perf/revenue">Revenue &amp; occupancy</NavMenuItem>
    <NavMenuItem href="#/perf/expense">Expense variance</NavMenuItem>
    <NavMenuItem href="#/perf/noi">NOI trend</NavMenuItem>
    <NavMenuItem href="#/perf/budget">Budget vs actual</NavMenuItem>
  </Panel>
);

/* `active` — aria-current="page". Accent text plus SEMIBOLD, deliberately not a
   second accent pill: the parent row in the rail already carries the pill, and a
   second one inside the panel is two answers to one question. The weight is the
   part that matters most here, because it is the second channel that keeps the
   current page off colour-as-the-only-signal. */
export const Current = () => (
  <Panel>
    <NavMenuItem href="#/perf/revenue">Revenue &amp; occupancy</NavMenuItem>
    <NavMenuItem href="#/perf/expense">Expense variance</NavMenuItem>
    <NavMenuItem href="#/perf/noi" active>
      NOI trend
    </NavMenuItem>
    <NavMenuItem href="#/perf/budget">Budget vs actual</NavMenuItem>
  </Panel>
);

/* In context: a section's own views, then the things that merely live near them.
   Long labels wrap rather than truncate — the panel is 232px and a destination
   the reader cannot finish reading is worse than one that takes two lines. */
export const Grouped = () => (
  <Panel>
    <NavMenuItem href="#/gl/unbalanced" active>
      Unbalanced accounts
    </NavMenuItem>
    <NavMenuItem href="#/gl/missing">Missing closes</NavMenuItem>
    <NavMenuItem href="#/gl/mapping">Mapping exceptions</NavMenuItem>
    <NavMenuSeparator />
    <NavMenuItem href="#/gl/audit">Audit log</NavMenuItem>
    <NavMenuItem href="#/gl/saved">Saved views</NavMenuItem>
  </Panel>
);

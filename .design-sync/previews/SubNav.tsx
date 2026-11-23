import type { ReactNode } from 'react';
import { SubNav, PageHeader, Button, Card } from '@jrk/design';
import type { NavLinkProps, SubNavItem } from '@jrk/design';

/* Real paths, so `location` drives every cell through the same matcher an app uses.
   `linkAs` swaps in an anchor that does not navigate the preview away — which is also
   the worked example of the prop: an app passes its framework's Link here. */
const DemoLink = (props: NavLinkProps) => <a {...props} onClick={(e) => e.preventDefault()} />;

const frameCss = `
.pv-frame {
  display: flex;
  flex-direction: column;
  gap: var(--jrk-space-4);
  padding: var(--jrk-space-5);
  background: var(--jrk-surface-canvas);
  border: 1px solid var(--jrk-border-default);
  border-radius: var(--jrk-radius-2xl);
}
`;

const Frame = ({ children }: { children: ReactNode }) => (
  <>
    <style dangerouslySetInnerHTML={{ __html: frameCss }} />
    <div className="pv-frame">{children}</div>
  </>
);

const pest: SubNavItem[] = [
  { id: 'portfolio', group: 'Overview', label: 'Portfolio', href: '/pest' },
  {
    id: 'action',
    group: 'Overview',
    label: 'Action Center',
    href: '/pest?view=report',
    alert: { count: 4, label: 'live infestations' },
  },
  { id: 'financials', group: 'Overview', label: 'Financials', href: '/pest/financials' },
  { id: 'reviews', group: 'Overview', label: 'Reviews', href: '/pest/reviews' },
  { id: 'calendar', group: 'Overview', label: 'Calendar', href: '/pest/calendar' },
  { id: 'live', group: 'Admin', label: 'Live status', href: '/pest/admin' },
  { id: 'settings', group: 'Admin', label: 'Score settings', href: '/pest/settings' },
];

const srt: SubNavItem[] = [
  { id: 'overview', group: 'Property', label: 'Property Overview', href: '/pest/property?property=SRT' },
  { id: 'units', group: 'Property', label: 'Unit Table', href: '/pest/property?property=SRT&view=unit-table' },
  { id: 'route', group: 'Property', label: 'Weekly route', href: '/pest/property?property=SRT&view=route' },
  { id: 'history', group: 'Property', label: 'Visit history', href: '/pest/property?property=SRT&view=history' },
];

const groups = [
  { id: 'Overview' },
  {
    id: 'Property',
    href: '/pest/property',
    activeHref: '/pest/property',
    empty: 'These are one property’s screens — open a property to see them.',
  },
  { id: 'Admin' },
];

/* Two levels. `/pest?view=report` is the address: Portfolio shares the path, and the
   more specific Action Center wins. Module controls on the tab row, a section control
   on the section row. */
export const Grouped = () => (
  <Frame>
    <PageHeader title="Pest Control" description="Coverage, cost and open reports across the portfolio." />
    <SubNav
      label="Pest sections"
      items={pest}
      groups={groups}
      location="/pest?view=report"
      linkAs={DemoLink}
      actions={
        <Button size="sm" variant="secondary">
          Guide
        </Button>
      }
      sectionActions={
        <Button size="sm" variant="ghost">
          Pest SOP
        </Button>
      }
    />
    <Card title="Live infestations" subtitle="4 units with an open report in the last 30 days" />
  </Frame>
);

/* One property in scope. Overview is closed, so its Action Center alert rides on the
   Overview tab — otherwise it would be invisible from here. `?property=SRT&view=unit-table`
   beats `?property=SRT` on the same path. */
export const PropertyScope = () => (
  <Frame>
    <PageHeader title="Sunset Ridge Townhomes" description="SRT · 184 units" />
    <SubNav
      label="Pest sections"
      items={[...pest, ...srt]}
      groups={groups}
      location="/pest/property?property=SRT&view=unit-table"
      linkAs={DemoLink}
    />
  </Frame>
);

/* The Property tab opened from the portfolio: the group exists at every scope, and
   where its pills would be it says what it needs. */
export const EmptyGroup = () => (
  <Frame>
    <SubNav
      label="Pest sections"
      items={pest}
      groups={groups}
      location="/pest/property"
      defaultGroup="Property"
      linkAs={DemoLink}
    />
  </Frame>
);

/* No groups: one underline row, with a module control standing on its rule. */
export const OneLevel = () => (
  <Frame>
    <SubNav
      label="Phone & Internet sections"
      location="/telecom/assignments"
      linkAs={DemoLink}
      items={[
        { id: 'scorecard', label: 'Scorecard', href: '/telecom' },
        { id: 'assign', label: 'Assignments', href: '/telecom/assignments' },
        { id: 'scope', label: 'Scope', href: '/telecom/scope', hint: 'Portfolio-wide' },
        { id: 'vendors', label: 'Vendors', href: '/telecom/vendors' },
      ]}
      actions={
        <Button size="sm" variant="secondary">
          Export
        </Button>
      }
    />
  </Frame>
);

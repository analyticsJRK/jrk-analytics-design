import type { ReactNode } from 'react';
import {
  AppShell,
  Sidebar,
  NavGroup,
  NavItem,
  Main,
  Topbar,
  Content,
  PageHeader,
  Card,
  Badge,
  Button,
  Status,
} from '@jrk/design';

/* The rail only reads truthfully in its grid: .jrk-app supplies the `auto 1fr`
   columns and .jrk-main is what the rail's border sits against. Rendered on its
   own it is a 232px strip floating on white.

   Two harness overrides, both of which the repo's own gallery page already
   carries (preview/dashboard.html): the shell is viewport-height by design, and
   the capture viewport is under the 1024px sidebar breakpoint where
   css/components/shell.css collapses any rail not explicitly
   data-collapsed="false" — an attribute <Sidebar> never emits. */
const frameCss = `
.pv-frame {
  width: 100%;
  max-width: 860px;
  height: 520px;
  overflow: hidden;
  border: 1px solid var(--jrk-border-default);
  border-radius: var(--jrk-radius-2xl);
  background: var(--jrk-surface-canvas);
}
.pv-frame .jrk-app { min-height: 0; height: 100%; }
.pv-frame .jrk-sidebar { height: 100%; position: static; }
.pv-frame .jrk-sidebar:not([data-collapsed='true']) { width: var(--jrk-sidebar-expanded); }
.pv-frame .jrk-topbar { position: static; }
.pv-frame .jrk-content { overflow: hidden; }
`;

const Frame = ({ children }: { children: ReactNode }) => (
  <>
    <style dangerouslySetInnerHTML={{ __html: frameCss }} />
    <div className="pv-frame">{children}</div>
  </>
);

/* The mark is a div, not a span, on purpose: shell.css hides EVERY span inside
   .jrk-sidebar__brand in the collapsed rail, so a span-wrapped logo disappears
   and leaves an empty 56px block. A div keeps the mark and drops the wordmark. */
const Brand = () => (
  <>
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        width: 24,
        height: 24,
        flexShrink: 0,
        fontSize: 11,
        fontWeight: 'var(--jrk-weight-bold)',
        color: 'var(--jrk-text-inverse)',
        background: 'var(--jrk-accent-solid)',
        borderRadius: 'var(--jrk-radius-md)',
      }}
      aria-hidden="true"
    >
      J
    </div>
    <span>JRK Analytics</span>
  </>
);

const ico = { viewBox: '0 0 20 20', 'aria-hidden': true as const, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const HomeIcon = () => (
  <svg {...ico}>
    <path d="M3 17V8l7-5 7 5v9" />
    <path d="M8 17v-5h4v5" />
  </svg>
);
const ReportIcon = () => (
  <svg {...ico}>
    <path d="M3 16V9M8 16V4M13 16v-5M18 16V7" />
  </svg>
);
const AdjustIcon = () => (
  <svg {...ico}>
    <path d="M3 6.5h14M3 13.5h14" />
    <circle cx="7.5" cy="6.5" r="2.2" />
    <circle cx="12.5" cy="13.5" r="2.2" />
  </svg>
);
const ChargesIcon = () => (
  <svg {...ico}>
    <rect x="4" y="2.5" width="12" height="15" rx="1.5" />
    <path d="M7.5 7h5M7.5 10.5h5M7.5 14h3" />
  </svg>
);
const LeaseIcon = () => (
  <svg {...ico}>
    <path d="M5 2.5h7.5L16 6v11.5H5z" />
    <path d="M7.5 11.5l2 2 3.5-4.5" />
  </svg>
);
const LedgerIcon = () => (
  <svg {...ico}>
    <rect x="3" y="3.5" width="14" height="13" rx="1.5" />
    <path d="M3 8h14M8.5 8v8.5" />
  </svg>
);
const ShieldIcon = () => (
  <svg {...ico}>
    <path d="M10 2.5l6.5 2.5v4.5c0 4.2-3.2 6.8-6.5 8-3.3-1.2-6.5-3.8-6.5-8V5z" />
    <path d="M7.5 10l2 2 3-3.5" />
  </svg>
);
const BoltIcon = () => (
  <svg {...ico}>
    <path d="M11.5 2.5L4.5 11H9l-.5 6.5L15.5 9H11z" />
  </svg>
);
const CogIcon = () => (
  <svg {...ico}>
    <circle cx="10" cy="10" r="3" />
    <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1L4.7 4.7" />
  </svg>
);
const QueueIcon = () => (
  <svg {...ico}>
    <path d="M3 11l2.5-7.5h9L17 11v6H3z" />
    <path d="M3 11h4l1 2h4l1-2h4" />
  </svg>
);

/* Brand + grouped nav + a pinned footer, the active section washed accent.
   `footer` is the slot that stays put while `children` scroll. */
export const Default = () => (
  <Frame>
    <AppShell>
      <Sidebar
        brand={<Brand />}
        footer={
          <NavItem href="#/admin/property-config" icon={<CogIcon />}>
            Property Config
          </NavItem>
        }
      >
        <NavItem href="#/home" icon={<HomeIcon />}>
          Home
        </NavItem>
        <NavGroup>Portfolio</NavGroup>
        <NavItem href="#/portfolio/am-report" icon={<ReportIcon />} active>
          AM Report
        </NavItem>
        <NavItem href="#/portfolio/adjustments" icon={<AdjustIcon />}>
          Adjustments
        </NavItem>
        <NavItem href="#/portfolio/charges" icon={<ChargesIcon />}>
          Charges
        </NavItem>
        <NavGroup>Audits</NavGroup>
        <NavItem href="#/audits/lease" icon={<LeaseIcon />}>
          Lease Audit
        </NavItem>
        <NavItem href="#/audits/gl" icon={<LedgerIcon />} badge={<Badge tone="critical" size="sm" icon={false}>12</Badge>}>
          GL Audit
        </NavItem>
        <NavItem href="#/audits/gl-quality" icon={<ShieldIcon />}>
          GL Quality
        </NavItem>
      </Sidebar>
      <Main>
        <Topbar>
          <span style={{ fontWeight: 'var(--jrk-weight-semibold)' }}>AM Report</span>
          <span className="jrk-spacer" />
          <Status tone="good" pulse>
            Synced 4m ago
          </Status>
        </Topbar>
        <Content>
          <PageHeader title="AM Report" description="Asset-management roll-up for the July close." />
          <Card title="Regions" subtitle="Rail on the left is the subject of this cell">
            Southeast · Midwest · Mountain West
          </Card>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);

/* `collapsed` stamps data-collapsed="true": 232px rail becomes a 64px icon
   rail, labels and badges go visually hidden but stay in the a11y tree, and the
   group headings fade to opacity 0 while holding their space as separators. */
export const Collapsed = () => (
  <Frame>
    <AppShell>
      <Sidebar
        collapsed
        brand={<Brand />}
        footer={
          <NavItem href="#/admin/property-config" icon={<CogIcon />}>
            Property Config
          </NavItem>
        }
      >
        <NavItem href="#/home" icon={<HomeIcon />}>
          Home
        </NavItem>
        <NavGroup>Portfolio</NavGroup>
        <NavItem href="#/portfolio/am-report" icon={<ReportIcon />} active>
          AM Report
        </NavItem>
        <NavItem href="#/portfolio/adjustments" icon={<AdjustIcon />}>
          Adjustments
        </NavItem>
        <NavItem href="#/portfolio/charges" icon={<ChargesIcon />}>
          Charges
        </NavItem>
        <NavGroup>Audits</NavGroup>
        <NavItem href="#/audits/lease" icon={<LeaseIcon />}>
          Lease Audit
        </NavItem>
        <NavItem href="#/audits/gl" icon={<LedgerIcon />} badge={<Badge tone="critical" size="sm" icon={false}>12</Badge>}>
          GL Audit
        </NavItem>
        <NavItem href="#/audits/gl-quality" icon={<ShieldIcon />}>
          GL Quality
        </NavItem>
      </Sidebar>
      <Main>
        <Topbar>
          <span style={{ fontWeight: 'var(--jrk-weight-semibold)' }}>AM Report</span>
          <span className="jrk-spacer" />
          <Button variant="secondary" size="sm">
            Expand nav
          </Button>
        </Topbar>
        <Content>
          <PageHeader title="AM Report" description="The rail gives ~170px back to the content well." />
          <Card title="Regions" subtitle="Same nav, icon-rail width">
            Southeast · Midwest · Mountain West
          </Card>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);

/* The smallest legitimate rail: brand plus one flat run of destinations, no
   group headings and no footer slot — what a single-section tool ships. */
export const Flat = () => (
  <Frame>
    <AppShell>
      <Sidebar brand={<Brand />}>
        <NavItem href="#/forms/my-queue" icon={<QueueIcon />} active>
          My Queue
        </NavItem>
        <NavItem href="#/forms/my-submissions" icon={<LeaseIcon />}>
          My Submissions
        </NavItem>
        <NavItem href="#/forms/all-submissions" icon={<LedgerIcon />}>
          All Submissions
        </NavItem>
        <NavItem href="#/forms/activity" icon={<BoltIcon />}>
          Activity
        </NavItem>
      </Sidebar>
      <Main>
        <Topbar>
          <span style={{ fontWeight: 'var(--jrk-weight-semibold)' }}>Forms</span>
          <span className="jrk-spacer" />
          <Status tone="warning">6 past SLA</Status>
          <Button variant="primary" size="sm">
            New submission
          </Button>
        </Topbar>
        <Content>
          <PageHeader title="My Queue" description="No group headings — four peers, nothing to divide." />
          <Card title="Oldest open" subtitle="Assigned to you">
            Riverside Flats · concession waiver · 9 days
          </Card>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);

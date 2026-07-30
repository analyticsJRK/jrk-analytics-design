import type { ReactNode } from 'react';
import { AppShell, Sidebar, NavGroup, NavItem, Main, Topbar, Content, PageHeader, Card, Badge, Status } from '@jrk/design';

/* A NavItem is an anchor styled entirely by its place in .jrk-sidebar__nav — the
   row height, the 2px stacking gap, the accent wash on aria-current, the
   badge's margin-inline-start:auto and the collapsed-rail centering are all
   descendant rules of .jrk-sidebar. On its own it is an unstyled link, so every
   cell puts the items in a real rail inside the real shell grid.

   Harness overrides (both already in the repo's own preview/dashboard.html): the
   shell is viewport-height by design, and the capture viewport is under the
   1024px sidebar breakpoint where shell.css collapses any rail not explicitly
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
const QueueIcon = () => (
  <svg {...ico}>
    <path d="M3 11l2.5-7.5h9L17 11v6H3z" />
    <path d="M3 11h4l1 2h4l1-2h4" />
  </svg>
);
const UploadIcon = () => (
  <svg {...ico}>
    <path d="M5 2.5h10v15H5z" />
    <path d="M10 13.5V7M7.5 9.5L10 7l2.5 2.5" />
  </svg>
);
const LayersIcon = () => (
  <svg {...ico}>
    <path d="M10 2.5l7 4-7 4-7-4z" />
    <path d="M3 10.5l7 4 7-4" />
  </svg>
);
const PulseIcon = () => (
  <svg {...ico}>
    <path d="M2.5 10h3l2-5.5 3 11 2.5-5.5h4.5" />
  </svg>
);

/* Icon + label, all four at rest: 36px rows, 2px apart, muted secondary text
   with the icon inheriting currentColor. Nothing is current here. */
export const Default = () => (
  <Frame>
    <AppShell>
      <Sidebar brand={<Brand />}>
        <NavGroup>Forms</NavGroup>
        <NavItem href="#/forms/my-queue" icon={<QueueIcon />}>
          My Queue
        </NavItem>
        <NavItem href="#/forms/my-submissions" icon={<UploadIcon />}>
          My Submissions
        </NavItem>
        <NavItem href="#/forms/all-submissions" icon={<LayersIcon />}>
          All Submissions
        </NavItem>
        <NavItem href="#/forms/activity" icon={<PulseIcon />}>
          Activity
        </NavItem>
      </Sidebar>
      <Main>
        <Topbar>
          <span style={{ fontWeight: 'var(--jrk-weight-semibold)' }}>Forms</span>
          <span className="jrk-spacer" />
          <Status tone="good" pulse>
            Synced 4m ago
          </Status>
        </Topbar>
        <Content>
          <PageHeader title="Items at rest" description="No item is current — every row is the resting treatment." />
          <Card title="Resting row" subtitle="Compare against the Active cell">
            Secondary text, transparent background, icon at 20px inheriting the row's colour.
          </Card>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);

/* `active` is the only way to mark the current page, and it drives BOTH the
   accent wash and aria-current="page" from one prop — the visual and the
   announced state cannot drift apart. GL Audit is the current page here. */
export const Active = () => (
  <Frame>
    <AppShell>
      <Sidebar brand={<Brand />}>
        <NavItem href="#/home" icon={<HomeIcon />}>
          Home
        </NavItem>
        <NavGroup>Audits</NavGroup>
        <NavItem href="#/audits/lease" icon={<LeaseIcon />}>
          Lease Audit
        </NavItem>
        <NavItem href="#/audits/gl" icon={<LedgerIcon />} active>
          GL Audit
        </NavItem>
        <NavItem href="#/audits/gl-quality" icon={<ShieldIcon />}>
          GL Quality
        </NavItem>
        <NavItem href="#/audits/utility" icon={<BoltIcon />}>
          Utility Audit
        </NavItem>
      </Sidebar>
      <Main>
        <Topbar>
          <span style={{ fontWeight: 'var(--jrk-weight-semibold)' }}>GL Audit</span>
          <span className="jrk-spacer" />
          <Status tone="serious">3 accounts unbalanced</Status>
        </Topbar>
        <Content>
          <PageHeader
            breadcrumbs={[{ label: 'Audits', href: '#/audits' }, { label: 'GL Audit' }]}
            title="GL Audit"
            description="The washed row in the rail is aria-current=&quot;page&quot; — one prop sets both."
          />
          <Card title="One prop, two contracts" subtitle="active → accent wash + aria-current">
            The styling selector is .jrk-nav-item[aria-current='page'], so the wash cannot appear on a row that a screen
            reader would not announce as current.
          </Card>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);

/* `badge` pins to the trailing edge (margin-inline-start:auto) and takes a full
   Badge, so the count carries its own tone: critical for a breach, serious for a
   failure, neutral-accent for an ordinary backlog. */
export const WithBadges = () => (
  <Frame>
    <AppShell>
      <Sidebar brand={<Brand />}>
        <NavGroup>Forms</NavGroup>
        <NavItem
          href="#/forms/my-queue"
          icon={<QueueIcon />}
          active
          badge={
            <Badge tone="critical" size="sm" icon={false}>
              12
            </Badge>
          }
        >
          My Queue
        </NavItem>
        <NavItem
          href="#/forms/all-submissions"
          icon={<LayersIcon />}
          badge={
            <Badge tone="accent" size="sm" icon={false}>
              148
            </Badge>
          }
        >
          All Submissions
        </NavItem>
        <NavGroup>Automation</NavGroup>
        <NavItem
          href="#/automation/runs"
          icon={<PulseIcon />}
          badge={
            <Badge tone="serious" size="sm" icon={false}>
              3
            </Badge>
          }
        >
          Runs
        </NavItem>
        <NavItem href="#/automation/schedules" icon={<ReportIcon />}>
          Schedules
        </NavItem>
      </Sidebar>
      <Main>
        <Topbar>
          <span style={{ fontWeight: 'var(--jrk-weight-semibold)' }}>My Queue</span>
          <span className="jrk-spacer" />
          <Status tone="warning">6 past SLA</Status>
        </Topbar>
        <Content>
          <PageHeader title="Counts on the rail" description="12 breaches, 148 open submissions, 3 failed runs." />
          <Card title="Trailing-edge counts" subtitle="Badge tone carries the severity">
            The badge slot is right-aligned regardless of label length, and it composes with the active row's wash.
          </Card>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);

/* In the collapsed rail the item centres its icon and the label plus badge go
   visually hidden — they stay in the accessibility tree, so the nav still reads
   correctly even though only the glyphs are painted. */
export const CollapsedRail = () => (
  <Frame>
    <AppShell>
      <Sidebar collapsed brand={<Brand />}>
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
        <NavItem
          href="#/portfolio/charges"
          icon={<ChargesIcon />}
          badge={
            <Badge tone="critical" size="sm" icon={false}>
              12
            </Badge>
          }
        >
          Charges
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
          <PageHeader
            title="Items in the icon rail"
            description="Same four items as the expanded cells — glyphs only, labels sr-only."
          />
          <Card title="Active still reads" subtitle="AM Report keeps its accent wash">
            The wash fills the centred 64px row, so the current page is still obvious with no label painted.
          </Card>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);

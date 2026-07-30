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
  StatRow,
  Stat,
  Card,
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Input,
  Status,
} from '@jrk/design';

/* The shell is full-viewport by design (.jrk-app is min-height:100vh, the rail
   is height:100vh/sticky). The repo's own gallery page pins those down so the
   shell can sit inside a bounded frame — preview/dashboard.html does exactly
   this — so the preview frame carries the same overrides. The rail width is
   pinned too: the capture viewport is under the 1024px sidebar breakpoint,
   where css/components/shell.css collapses any rail that is not explicitly
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
const ico16 = { viewBox: '0 0 16 16', 'aria-hidden': true as const, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

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
const SearchIcon = () => (
  <svg {...ico16}>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5L14 14" />
  </svg>
);
const BellIcon = () => (
  <svg {...ico16}>
    <path d="M8 1.5a4.5 4.5 0 00-4.5 4.5v3l-1.5 2.5h12l-1.5-2.5V6A4.5 4.5 0 008 1.5zM6.25 13.5a1.75 1.75 0 003.5 0" />
  </svg>
);
const MenuIcon = () => (
  <svg {...ico16}>
    <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />
  </svg>
);

/* The whole portal frame: rail, topbar, content — the composition
   preview/dashboard.html hand-authors, rebuilt out of the components. */
export const Default = () => (
  <Frame>
    <AppShell>
      <Sidebar
        brand={<Brand />}
        footer={
          <NavItem href="#/admin/api-keys" icon={<LedgerIcon />}>
            API Keys
          </NavItem>
        }
      >
        <NavItem href="#/home" icon={<HomeIcon />} active>
          Home
        </NavItem>
        <NavGroup>Portfolio</NavGroup>
        <NavItem href="#/portfolio/am-report" icon={<ReportIcon />}>
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
      </Sidebar>
      <Main>
        <Topbar>
          <Input
            size="sm"
            className="jrk-topbar__search"
            aria-label="Search"
            placeholder="Search properties, units, tenants"
            leadingIcon={<SearchIcon />}
          />
          {/* No jrk-spacer here: the search is already flex:1, and a second
              flex:1 child would split the free space and squeeze it. */}
          <Status tone="good" pulse>
            Synced 4m ago
          </Status>
          <Button variant="ghost" size="sm" iconOnly aria-label="Notifications">
            <BellIcon />
          </Button>
          <Button variant="secondary" size="sm">
            Export
          </Button>
        </Topbar>
        <Content>
          <PageHeader
            breadcrumbs={[{ label: 'Portfolio', href: '#/portfolio' }, { label: 'Overview' }]}
            title="Portfolio overview"
            description="47 properties · 8,412 units · accrual basis"
            actions={
              <ButtonGroup label="Period">
                <Button variant="secondary" size="sm" aria-pressed={false}>
                  30d
                </Button>
                <Button variant="secondary" size="sm" aria-pressed>
                  QTD
                </Button>
                <Button variant="secondary" size="sm" aria-pressed={false}>
                  YTD
                </Button>
              </ButtonGroup>
            }
          />
          <StatRow className="jrk-stat-row--split">
            <Stat label="Collected rent" value="$4.21" unit="M" delta={{ value: 3.1, vs: 'vs last quarter' }} />
            <Stat label="Occupancy" value="93.8" unit="%" delta={{ value: -0.6, vs: 'vs last quarter' }} />
            <Stat
              label="Delinquency rate"
              value="4.7"
              unit="%"
              delta={{ value: -1.2, upIsGood: false, vs: 'vs last quarter' }}
            />
          </StatRow>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);

/* Narrow-viewport shell: the rail is the icon-only collapsed variant and the
   topbar picks up the drawer toggle, so the main region gains ~170px. */
export const CollapsedRail = () => (
  <Frame>
    <AppShell>
      <Sidebar
        collapsed
        brand={<Brand />}
        footer={
          <NavItem href="#/admin/users" icon={<ShieldIcon />}>
            Users
          </NavItem>
        }
      >
        <NavItem href="#/home" icon={<HomeIcon />}>
          Home
        </NavItem>
        <NavGroup>Portfolio</NavGroup>
        <NavItem href="#/portfolio/am-report" icon={<ReportIcon />}>
          AM Report
        </NavItem>
        <NavItem href="#/portfolio/charges" icon={<ChargesIcon />}>
          Charges
        </NavItem>
        <NavGroup>Forms</NavGroup>
        <NavItem href="#/forms/my-queue" icon={<QueueIcon />} active>
          My Queue
        </NavItem>
        <NavItem href="#/forms/activity" icon={<BoltIcon />}>
          Activity
        </NavItem>
      </Sidebar>
      <Main>
        <Topbar>
          <Button variant="ghost" size="sm" iconOnly aria-label="Expand navigation">
            <MenuIcon />
          </Button>
          <span style={{ fontWeight: 'var(--jrk-weight-semibold)' }}>My Queue</span>
          <span className="jrk-spacer" />
          <Status tone="warning">6 past SLA</Status>
          <Button variant="primary" size="sm">
            New submission
          </Button>
        </Topbar>
        <Content>
          <PageHeader
            title="My Queue"
            description="Submissions assigned to you, oldest first."
            actions={
              <Button variant="secondary" size="sm">
                Filters
              </Button>
            }
          />
          <StatRow>
            <Stat label="Assigned" value="24" delta={{ value: -8.0, upIsGood: false, vs: 'vs last week' }} />
            <Stat label="Past SLA" value="6" footnote={<span className="jrk-caption">oldest 9 days</span>} />
            <Stat label="Cleared today" value="11" delta={{ value: 22.0, vs: 'vs 30d avg' }} />
          </StatRow>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);

/* Same frame carrying a working page: the audits section active, a banner in
   the content well, and a flush card — the chrome stays on the white plane
   while the content surfaces read as the raised things. */
export const AuditWorkspace = () => (
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
        <NavItem href="#/audits/gl-quality" icon={<ShieldIcon />} badge={<Badge tone="warning" size="sm" icon={false}>3</Badge>}>
          GL Quality
        </NavItem>
        <NavItem href="#/audits/utility" icon={<BoltIcon />}>
          Utility Audit
        </NavItem>
      </Sidebar>
      <Main>
        <Topbar>
          <span style={{ fontWeight: 'var(--jrk-weight-semibold)' }}>GL Audit</span>
          <Badge tone="accent" size="sm" icon={false}>
            July 2026
          </Badge>
          <span className="jrk-spacer" />
          <Status tone="serious">3 accounts unbalanced</Status>
          <Button variant="primary" size="sm">
            Run audit
          </Button>
        </Topbar>
        <Content>
          <PageHeader
            breadcrumbs={[{ label: 'Audits', href: '#/audits' }, { label: 'GL Audit' }]}
            title="GL Audit — July close"
            description="Trial balance reconciled against the operating ledger."
          />
          <Alert tone="warning" title="3 properties missing July close">
            Riverside Flats, Cedar Grove, and Old Mill Yard have not posted. Portfolio totals exclude them.
          </Alert>
          <Card title="Variance by account" subtitle="Accounts over the $2,500 review threshold">
            <div className="jrk-stack" style={{ gap: 'var(--jrk-space-2)' }}>
              <div className="jrk-row-between">
                <span>6120 · Turnover maintenance</span>
                <span className="jrk-tabular">$18,420</span>
              </div>
              <div className="jrk-row-between">
                <span>5210 · Concessions</span>
                <span className="jrk-tabular">$9,115</span>
              </div>
              <div className="jrk-row-between">
                <span>6340 · Utility recovery</span>
                <span className="jrk-tabular">$4,806</span>
              </div>
            </div>
          </Card>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);

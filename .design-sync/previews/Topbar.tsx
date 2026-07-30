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
  ButtonGroup,
  Input,
  Select,
  Status,
  StatRow,
  Stat,
} from '@jrk/design';

/* The topbar is the first child of .jrk-main, and that is what gives it its
   width, its bottom hairline against the content well and the seam it shares
   with the rail's 56px brand block. Rendered alone it is a 56px strip of canvas
   on canvas with nothing to divide, so every cell here keeps the real shell.

   Harness overrides (both already in the repo's own preview/dashboard.html): the
   shell is viewport-height by design, and the capture viewport is under the
   1024px sidebar breakpoint where shell.css collapses any rail not explicitly
   data-collapsed="false" — an attribute <Sidebar> never emits. */
const frameCss = `
.pv-frame {
  width: 100%;
  max-width: 860px;
  height: 460px;
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
const ChargesIcon = () => (
  <svg {...ico}>
    <rect x="4" y="2.5" width="12" height="15" rx="1.5" />
    <path d="M7.5 7h5M7.5 10.5h5M7.5 14h3" />
  </svg>
);
const LedgerIcon = () => (
  <svg {...ico}>
    <rect x="3" y="3.5" width="14" height="13" rx="1.5" />
    <path d="M3 8h14M8.5 8v8.5" />
  </svg>
);
const CogIcon = () => (
  <svg {...ico}>
    <circle cx="10" cy="10" r="3" />
    <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1L4.7 4.7" />
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
const DownloadIcon = () => (
  <svg {...ico16}>
    <path d="M8 2v8M5 7l3 3 3-3M2.5 13.5h11" />
  </svg>
);

const PortfolioNav = ({ active }: { active: 'am-report' | 'charges' | 'gl' }) => (
  <>
    <NavItem href="#/home" icon={<HomeIcon />}>
      Home
    </NavItem>
    <NavGroup>Portfolio</NavGroup>
    <NavItem href="#/portfolio/am-report" icon={<ReportIcon />} active={active === 'am-report'}>
      AM Report
    </NavItem>
    <NavItem href="#/portfolio/charges" icon={<ChargesIcon />} active={active === 'charges'}>
      Charges
    </NavItem>
    <NavGroup>Audits</NavGroup>
    <NavItem href="#/audits/gl" icon={<LedgerIcon />} active={active === 'gl'}>
      GL Audit
    </NavItem>
  </>
);

/* The portal's shipped bar: a flex-1 search that stops at 420px, then sync
   state, a quiet icon button and one secondary action pushed to the trailing
   edge by the search's own growth — no jrk-spacer, because a second flex:1
   child would split the free space and squeeze the field. */
export const Default = () => (
  <Frame>
    <AppShell>
      <Sidebar brand={<Brand />}>
        <PortfolioNav active="am-report" />
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
          <Status tone="good" pulse>
            Synced 4m ago
          </Status>
          <Button variant="ghost" size="sm" iconOnly aria-label="Notifications">
            <BellIcon />
          </Button>
          <Button variant="secondary" size="sm" leadingIcon={<DownloadIcon />}>
            Export
          </Button>
        </Topbar>
        <Content>
          <PageHeader title="AM Report" description="Asset-management roll-up · July 2026 close." />
          <StatRow className="jrk-stat-row--split">
            <Stat label="Collected rent" value="$4.21" unit="M" delta={{ value: 3.1, vs: 'vs last quarter' }} />
            <Stat label="Occupancy" value="93.8" unit="%" delta={{ value: -0.6, vs: 'vs last quarter' }} />
          </StatRow>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);

/* Filter bar variant: the controls that scope the page live in the topbar so
   they stay put while the content well scrolls. Period toggle, basis select,
   then the run action past the spacer. */
export const FilterBar = () => (
  <Frame>
    <AppShell>
      <Sidebar brand={<Brand />}>
        <PortfolioNav active="charges" />
      </Sidebar>
      <Main>
        <Topbar>
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
          <Select size="sm" aria-label="Accounting basis" defaultValue="accrual">
            <option value="accrual">Accrual basis</option>
            <option value="cash">Cash basis</option>
          </Select>
          <span className="jrk-spacer" />
          <Badge tone="accent" size="sm" icon={false}>
            47 properties
          </Badge>
          <Button variant="primary" size="sm">
            Run report
          </Button>
        </Topbar>
        <Content>
          <PageHeader title="Charges" description="Recurring and one-off charges posted this quarter." />
          <Card title="Charge codes" subtitle="Scoped by the topbar controls">
            RENT · PETRENT · UTILREC · CONCESS · LATEFEE
          </Card>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);

/* Narrow-rail variant: the topbar takes the drawer toggle and the page title,
   so the bar carries the location the collapsed rail can no longer spell out.
   The bar's own layout is unchanged — only its content moved. */
export const WithNavToggle = () => (
  <Frame>
    <AppShell>
      <Sidebar collapsed brand={<Brand />} footer={<NavItem href="#/admin/property-config" icon={<CogIcon />}>Property Config</NavItem>}>
        <PortfolioNav active="gl" />
      </Sidebar>
      <Main>
        <Topbar>
          <Button variant="ghost" size="sm" iconOnly aria-label="Expand navigation">
            <MenuIcon />
          </Button>
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
            </div>
          </Card>
        </Content>
      </Main>
    </AppShell>
  </Frame>
);

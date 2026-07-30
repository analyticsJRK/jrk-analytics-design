import { useState } from 'react';
import {
  AppShell,
  Sidebar,
  NavGroup,
  NavItem,
  Main,
  Topbar,
  Content,
  PageHeader,
  Tabs,
  TabPanel,
  StatRow,
  Stat,
  Card,
  DataTable,
  Badge,
  Status,
  Input,
  Button,
} from '@jrk/design';

/* `Main` is the right-hand column of the shell: a flex column holding the
   topbar and the content region, with min-width: 0 so a wide table scrolls
   inside it instead of stretching the shell grid. Rendered bare it is an empty
   box, so every cell here composes it with the children it actually holds. */

/* The shell is sized for a full browser window (min-height: 100vh, a 100vh
   sticky sidebar). These rules let it sit inside a gallery frame at a fixed
   height — the same treatment preview/dashboard.html uses.

   The width reset restores the desktop rail: shell.css narrows the sidebar to
   the collapsed width under `@media (max-width: 1024px)`, and this frame is
   captured in a 900px-wide window, which is a gallery artefact rather than the
   desktop context these cells are about. */
const FrameCss = () => (
  <style>{`
    .pv-frame { border: 1px solid var(--jrk-border-default); border-radius: var(--jrk-radius-2xl);
                overflow: hidden; background: var(--jrk-surface-canvas); width: 100%; }
    .pv-frame .jrk-app { min-height: 0; height: 100%; }
    .pv-frame .jrk-sidebar { height: auto; position: static; width: var(--jrk-sidebar-expanded); }
    .pv-frame .jrk-topbar { position: static; }
  `}</style>
);

const BrandMark = () => (
  <span
    aria-hidden="true"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 26,
      height: 26,
      borderRadius: 'var(--jrk-radius-md)',
      background: 'var(--jrk-accent-solid, #3d4ea8)',
      color: '#fff',
      font: '600 13px/1 var(--jrk-font-sans, system-ui)',
      flexShrink: 0,
    }}
  >
    J
  </span>
);

const SearchIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" strokeLinecap="round">
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5L14 14" />
  </svg>
);

const IconReport = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 16V9M8 16V4M13 16v-5M18 16V7" />
  </svg>
);
const IconLedger = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h12v12H4z" />
    <path d="M7 8h6M7 12h4" />
  </svg>
);
const IconQueue = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="7" />
    <path d="M10 6v4l2.5 2.5" />
  </svg>
);
const IconProperty = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17V8l7-5 7 5v9" />
    <path d="M8 17v-5h4v5" />
  </svg>
);

const PortalNav = ({ current }: { current: string }) => (
  <Sidebar brand={<><BrandMark /><span>JRK Analytics</span></>} footer={<NavItem href="#" icon={<IconProperty />}>Property Config</NavItem>}>
    <NavItem href="#" icon={<IconReport />} active={current === 'am'}>AM Report</NavItem>
    <NavItem href="#" icon={<IconLedger />} active={current === 'gl'}>GL Audit</NavItem>
    <NavItem href="#" icon={<IconQueue />} active={current === 'queue'} badge={<Badge tone="critical" size="sm" icon={false}>14</Badge>}>
      My Queue
    </NavItem>
    <NavGroup>Submissions</NavGroup>
    <NavItem href="#" icon={<IconLedger />}>All Submissions</NavItem>
    <NavItem href="#" icon={<IconQueue />}>Jobs</NavItem>
  </Sidebar>
);

const PortalTopbar = () => (
  <Topbar>
    <Input
      size="sm"
      className="jrk-topbar__search"
      leadingIcon={<SearchIcon />}
      placeholder="Search properties, units, residents"
      aria-label="Search"
    />
    <span className="jrk-spacer" />
    <Status tone="good" pulse>Synced 4m ago</Status>
    <Button variant="secondary" size="sm">Export</Button>
  </Topbar>
);

type Row = { property: string; units: number; occupancy: number; delinquency: number };

const rows: Row[] = [
  { property: 'Summit at Red Rocks', units: 316, occupancy: 94.6, delinquency: 3.1 },
  { property: 'Parkside Commons', units: 312, occupancy: 96.4, delinquency: 1.2 },
  { property: 'Harbor Point', units: 186, occupancy: 89.8, delinquency: 4.7 },
  { property: 'Cedar Hollow', units: 154, occupancy: 91.6, delinquency: 3.4 },
];

const columns = [
  {
    key: 'property',
    header: 'Property',
    /* nowrap raises the column's min-content width so a two-word property name
       does not wrap once the table is squeezed beside the sidebar. */
    cell: (r: Row) => <span style={{ whiteSpace: 'nowrap' }}>{r.property}</span>,
    sortValue: (r: Row) => r.property,
  },
  { key: 'units', header: 'Units', numeric: true, sortValue: (r: Row) => r.units },
  {
    key: 'occupancy',
    header: 'Occupancy',
    numeric: true,
    cell: (r: Row) => `${r.occupancy.toFixed(1)}%`,
    sortValue: (r: Row) => r.occupancy,
  },
  {
    key: 'delinquency',
    header: 'Delinquency',
    numeric: true,
    cell: (r: Row) => `${r.delinquency.toFixed(1)}%`,
    sortValue: (r: Row) => r.delinquency,
  },
];

/* Main on its own: the topbar keeps its height, the content region takes the
   rest of the column. This is the whole of what the wrapper contributes. */
export const Default = () => (
  <>
    <FrameCss />
    <div className="pv-frame" style={{ maxWidth: 860, height: 500, display: 'grid' }}>
      <Main>
        <PortalTopbar />
        <Content>
          <PageHeader
            title="AM Report"
            description="Summit at Red Rocks — 316 units, accrual basis, through June 2026."
            actions={<Button variant="primary" size="sm">Submit for review</Button>}
          />
          <StatRow className="jrk-stat-row--split">
            <Stat label="Collected rent" value="$1,284" unit="k" delta={{ value: 2.4, vs: 'vs last month' }} />
            <Stat label="Occupancy" value="94.6" unit="%" delta={{ value: -0.4, vs: 'vs last month' }} />
            <Stat label="Delinquency" value="3.1" unit="%" delta={{ value: -0.7, upIsGood: false, vs: 'vs last month' }} />
          </StatRow>
          <Card title="Close status" subtitle="Posted 07/03 · 9 accounts over the $250 variance threshold">
            <p>
              All ledgers posted on 07/03. Nine expense accounts remain over the
              variance threshold and are waiting on asset-manager sign-off.
            </p>
          </Card>
        </Content>
      </Main>
    </div>
  </>
);

/* The full documented nesting: .jrk-app > .jrk-sidebar + .jrk-main, with
   .jrk-main > .jrk-topbar + .jrk-content. */
export const InAppShell = () => {
  const [tab, setTab] = useState('variances');
  return (
    <>
      <FrameCss />
      <div className="pv-frame" style={{ height: 560 }}>
        <AppShell>
          <PortalNav current="am" />
          <Main>
            <PortalTopbar />
            <Content>
              <PageHeader
                breadcrumbs={[{ label: 'Portfolio', href: '#' }, { label: 'AM Report' }]}
                title="AM Report"
                description="Summit at Red Rocks — 316 units, accrual basis, through June 2026."
              />
              <Tabs
                label="Report sections"
                value={tab}
                onChange={setTab}
                tabs={[
                  { id: 'overview', label: 'Overview' },
                  { id: 'variances', label: 'Variances', count: 9 },
                  { id: 'charges', label: 'Charges', count: 132 },
                  { id: 'history', label: 'History' },
                ]}
              />
              <TabPanel id="overview" active={tab === 'overview'}>
                <Card title="Overview">Period KPIs for the selected property.</Card>
              </TabPanel>
              <TabPanel id="variances" active={tab === 'variances'}>
                <DataTable
                  columns={columns}
                  rows={rows}
                  rowKey={(r) => r.property}
                  caption="Portfolio detail, June 2026"
                  density="compact"
                  zebra
                  footer={<span className="jrk-caption">4 of 47 properties</span>}
                />
              </TabPanel>
              <TabPanel id="charges" active={tab === 'charges'}>
                <Card title="Charges">Charge detail for the selected period.</Card>
              </TabPanel>
              <TabPanel id="history" active={tab === 'history'}>
                <Card title="History">Prior submissions and approvals.</Card>
              </TabPanel>
            </Content>
          </Main>
        </AppShell>
      </div>
    </>
  );
};

/* min-width: 0 on .jrk-main is load-bearing: the wide table scrolls inside its
   own wrapper and the sidebar keeps its track, rather than the shell grid
   growing to the table's intrinsic width. */
export const WideContentScrolls = () => (
  <>
    <FrameCss />
    <div className="pv-frame" style={{ height: 560 }}>
      <AppShell>
        <PortalNav current="gl" />
        <Main>
          <PortalTopbar />
          <Content>
            <PageHeader
              title="GL Audit"
              description="Monthly posted activity by account — the widest table in the portal."
              actions={<Button variant="ghost" size="sm">Export CSV</Button>}
            />
            <DataTable
              columns={[
                {
                  key: 'account',
                  header: 'Account',
                  cell: (r: Wide) => <span style={{ whiteSpace: 'nowrap' }}>{r.account}</span>,
                  sortValue: (r: Wide) => r.account,
                },
                ...['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((m, i) => ({
                  key: m,
                  header: m,
                  numeric: true,
                  cell: (r: Wide) => `$${r.months[i].toLocaleString('en-US')}`,
                })),
              ]}
              rows={wideRows}
              rowKey={(r) => r.account}
              caption="Posted activity by account and month, 2026"
              density="compact"
              stickyFirst
              zebra
              footer={
                <span className="jrk-caption">
                  Scroll sideways for May through August — the account column stays frozen
                </span>
              }
            />
          </Content>
        </Main>
      </AppShell>
    </div>
  </>
);

type Wide = { account: string; months: number[] };

const wideRows: Wide[] = [
  { account: '4100 · Gross rent', months: [412800, 415200, 418600, 421400, 424100, 426900, 429300, 431800] },
  { account: '4200 · Other income', months: [18400, 19100, 17800, 20300, 21200, 19700, 20900, 22100] },
  { account: '5120 · Turnover', months: [61000, 58400, 72100, 84200, 79600, 68300, 71400, 66800] },
  { account: '5410 · Utilities', months: [124800, 121300, 118700, 116200, 119400, 128600, 134100, 137500] },
];

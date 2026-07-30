import { useState } from 'react';
import {
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
  Alert,
  Status,
  Input,
  Button,
} from '@jrk/design';

/* `Content` is a wrapper — it renders <main class="jrk-content"> around
   .jrk-content__inner, which is the centred max-width column every page body
   sits in. It is only truthful with a real page inside it, so every cell here
   fills it with one. */

const SearchIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" strokeLinecap="round">
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5L14 14" />
  </svg>
);

/* `Alert` does not synthesise a tone icon the way `Badge` does — pass one. */
const WarnIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2.5L18.5 17h-17L10 2.5zM10 8v4M10 14.5h.01" />
  </svg>
);

/* The frame stands in for the shell column the content region normally fills,
   so the padding and the centred inner column are both visible. */
const frame = {
  width: '100%',
  maxWidth: 860,
  border: '1px solid var(--jrk-border-default)',
  borderRadius: 'var(--jrk-radius-2xl)',
  overflow: 'hidden',
  background: 'var(--jrk-surface-canvas)',
} as const;

type Row = { property: string; units: number; occupancy: number; delinquency: number };

const rows: Row[] = [
  { property: 'Summit at Red Rocks', units: 316, occupancy: 94.6, delinquency: 3.1 },
  { property: 'Parkside Commons', units: 312, occupancy: 96.4, delinquency: 1.2 },
  { property: 'Harbor Point', units: 186, occupancy: 89.8, delinquency: 4.7 },
  { property: 'Cedar Hollow', units: 154, occupancy: 91.6, delinquency: 3.4 },
];

const columns = [
  { key: 'property', header: 'Property', sortValue: (r: Row) => r.property },
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

/* A page body: header, KPI band, one card. The inner column caps at
   --jrk-container-xl and centres, so wide viewports do not stretch the text. */
export const Default = () => (
  <div style={frame}>
    <Content>
      <PageHeader
        title="AM Report"
        description="Summit at Red Rocks — 316 units, accrual basis, through June 2026."
        actions={<Button variant="primary" size="sm">Export</Button>}
      />
      <StatRow className="jrk-stat-row--split">
        <Stat label="Collected rent" value="$1,284" unit="k" delta={{ value: 2.4, vs: 'vs last month' }} />
        <Stat label="Occupancy" value="94.6" unit="%" delta={{ value: -0.4, vs: 'vs last month' }} />
        <Stat label="Delinquency" value="3.1" unit="%" delta={{ value: -0.7, upIsGood: false, vs: 'vs last month' }} />
      </StatRow>
      <Card title="Close status" subtitle="Posted 07/03 · 9 accounts over the $250 variance threshold">
        <div className="jrk-stack">
          <Status tone="good">General ledger posted</Status>
          <Status tone="warning">Nine expense variances awaiting sign-off</Status>
        </div>
      </Card>
    </Content>
  </div>
);

/* The inner column is a flex stack with a fixed gap, so a header, a tablist and
   a panel space themselves without any per-page margins. */
export const TabbedPage = () => {
  const [tab, setTab] = useState('gl-properties');
  return (
    <div style={frame}>
      <Content>
        <PageHeader
          breadcrumbs={[{ label: 'Data quality', href: '#' }, { label: 'GL Quality' }]}
          title="GL Quality"
          description="Posting completeness and variance checks across the 47 managed properties."
        />
        <Tabs
          label="GL Quality sections"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'gl-summary', label: 'Summary' },
            { id: 'gl-properties', label: 'By Property', count: 47 },
            { id: 'gl-exceptions', label: 'Exceptions', count: 14 },
          ]}
        />
        <TabPanel id="gl-summary" active={tab === 'gl-summary'}>
          <Card title="Summary">Portfolio-level completeness for the June close.</Card>
        </TabPanel>
        <TabPanel id="gl-properties" active={tab === 'gl-properties'}>
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.property}
            caption="Occupancy and delinquency by property, June 2026"
            zebra
            footer={<span className="jrk-caption">4 of 47 properties</span>}
          />
        </TabPanel>
        <TabPanel id="gl-exceptions" active={tab === 'gl-exceptions'}>
          <Card title="Exceptions">14 accounts failed a completeness check.</Card>
        </TabPanel>
      </Content>
    </div>
  );
};

/* The documented nesting: .jrk-main > .jrk-topbar + .jrk-content. Content takes
   the remaining height (flex: 1) under the sticky topbar. */
export const InsideMain = () => (
  <div style={{ ...frame, height: 520, display: 'grid' }}>
    <Main>
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
      <Content>
        <PageHeader
          title="My Queue"
          description="14 submissions assigned to you, oldest first."
          actions={<Button variant="primary" size="sm">Claim next</Button>}
        />
        <Alert tone="warning" icon={<WarnIcon />} title="3 submissions past SLA">
          Riverside Flats, Cedar Grove and Old Mill Yard have been open more than
          five business days.
        </Alert>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.property}
          caption="Submissions assigned to the current reviewer"
          density="compact"
          zebra
        />
      </Content>
    </Main>
  </div>
);

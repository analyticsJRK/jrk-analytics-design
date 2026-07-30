import { useState } from 'react';
import { Tabs, TabPanel, StatRow, Stat, Card, DataTable, Alert, Badge, Button } from '@jrk/design';

type Variance = {
  account: string;
  actual: number;
  budget: number;
  variance: number;
  owner: string;
};

const variances: Variance[] = [
  { account: '5120 · Turnover', actual: 84200, budget: 61000, variance: 23200, owner: 'M. McCoy' },
  { account: '5340 · Landscaping', actual: 41900, budget: 29500, variance: 12400, owner: 'A. Evans' },
  { account: '5210 · Make-ready', actual: 38400, budget: 31100, variance: 7300, owner: 'M. McCoy' },
  { account: '5410 · Utilities', actual: 128600, budget: 124800, variance: 3800, owner: 'P. Raymond' },
];

const money = (n: number) => `$${n.toLocaleString('en-US')}`;

/* `Alert` does not synthesise a tone icon the way `Badge` does — pass one, or
   the alert renders as a bare tinted block. */
const WarnIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2.5L18.5 17h-17L10 2.5zM10 8v4M10 14.5h.01" />
  </svg>
);

const varianceColumns = [
  { key: 'account', header: 'Account', sortValue: (r: Variance) => r.account },
  { key: 'actual', header: 'Actual', numeric: true, cell: (r: Variance) => money(r.actual), sortValue: (r: Variance) => r.actual },
  { key: 'budget', header: 'Budget', numeric: true, cell: (r: Variance) => money(r.budget), sortValue: (r: Variance) => r.budget },
  { key: 'variance', header: 'Variance', numeric: true, cell: (r: Variance) => `+${money(r.variance)}`, sortValue: (r: Variance) => r.variance },
  { key: 'owner', header: 'Owner', sortValue: (r: Variance) => r.owner },
];

type Lease = { unit: string; tenant: string; rent: number; audited: string };

const leases: Lease[] = [
  { unit: '212', tenant: 'Whitaker, J.', rent: 1845, audited: 'Clean' },
  { unit: '318', tenant: 'Okafor, D.', rent: 2140, audited: 'Rent mismatch' },
  { unit: '104', tenant: 'Alvarez, R.', rent: 1620, audited: 'Clean' },
  { unit: '407', tenant: 'Nguyen, T.', rent: 2380, audited: 'Missing addendum' },
];

const leaseColumns = [
  { key: 'unit', header: 'Unit', numeric: true, sortValue: (r: Lease) => r.unit },
  { key: 'tenant', header: 'Resident', sortValue: (r: Lease) => r.tenant },
  { key: 'rent', header: 'Contract rent', numeric: true, cell: (r: Lease) => money(r.rent), sortValue: (r: Lease) => r.rent },
  {
    key: 'audited',
    header: 'Audit result',
    cell: (r: Lease) =>
      r.audited === 'Clean' ? (
        <Badge tone="good" size="sm">Clean</Badge>
      ) : (
        <Badge tone="warning" size="sm">{r.audited}</Badge>
      ),
  },
];

/* A panel per tab, all mounted, only the selected one visible — `hidden` keeps
   the inactive panels out of the accessibility tree without unmounting them. */
export const Default = () => {
  const [tab, setTab] = useState('overview');
  return (
    <div className="jrk-stack" style={{ width: '100%', maxWidth: 820 }}>
      <Tabs
        label="AM Report sections"
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
        <div className="jrk-stack">
          <StatRow className="jrk-stat-row--split">
            <Stat label="Collected rent" value="$1,284" unit="k" delta={{ value: 2.4, vs: 'vs last month' }} />
            <Stat label="Occupancy" value="94.6" unit="%" delta={{ value: -0.4, vs: 'vs last month' }} />
            <Stat label="Delinquency" value="3.1" unit="%" delta={{ value: -0.7, upIsGood: false, vs: 'vs last month' }} />
          </StatRow>
          <Card title="Close status" subtitle="Summit at Red Rocks · June 2026">
            <p>
              All ledgers posted on 07/03. Nine expense accounts remain over the
              $250 variance threshold and are shown on the Variances tab.
            </p>
          </Card>
        </div>
      </TabPanel>
      <TabPanel id="variances" active={tab === 'variances'}>
        <DataTable columns={varianceColumns} rows={variances} rowKey={(r) => r.account} zebra />
      </TabPanel>
      <TabPanel id="charges" active={tab === 'charges'}>
        <Card title="Charges">Charge detail for the selected period.</Card>
      </TabPanel>
      <TabPanel id="history" active={tab === 'history'}>
        <Card title="History">Prior submissions and approvals.</Card>
      </TabPanel>
    </div>
  );
};

/* The same tab set with a different selection — the panel body is a table, and
   the tab's `aria-controls` points at exactly this panel's id. */
export const VariancesActive = () => {
  const [tab, setTab] = useState('var-variances');
  return (
    <div className="jrk-stack" style={{ width: '100%', maxWidth: 820 }}>
      <Tabs
        label="AM Report sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'var-overview', label: 'Overview' },
          { id: 'var-variances', label: 'Variances', count: 9 },
          { id: 'var-charges', label: 'Charges', count: 132 },
          { id: 'var-history', label: 'History' },
        ]}
      />
      <TabPanel id="var-overview" active={tab === 'var-overview'}>
        <Card title="Overview">Portfolio KPIs for the selected period.</Card>
      </TabPanel>
      <TabPanel id="var-variances" active={tab === 'var-variances'}>
        <div className="jrk-stack">
          <Alert tone="warning" icon={<WarnIcon />} title="9 accounts over threshold">
            Turnover and landscaping account for $35,600 of the $46,700 total
            unfavourable variance. Four items are shown; open the account to
            drill into invoices.
          </Alert>
          <DataTable
            columns={varianceColumns}
            rows={variances}
            rowKey={(r) => r.account}
            caption="Unfavourable expense variances over $250, June 2026"
            density="compact"
            footer={
              <div className="jrk-row-between">
                <span className="jrk-caption">4 of 9 accounts</span>
                <Button variant="link" size="sm">View all variances</Button>
              </div>
            }
          />
        </div>
      </TabPanel>
      <TabPanel id="var-charges" active={tab === 'var-charges'}>
        <Card title="Charges">Charge detail for the selected period.</Card>
      </TabPanel>
      <TabPanel id="var-history" active={tab === 'var-history'}>
        <Card title="History">Prior submissions and approvals.</Card>
      </TabPanel>
    </div>
  );
};

/* Pills drive panels the same way — the variant changes the chrome, not the
   `role="tablist"` / `role="tabpanel"` wiring. */
export const WithPillTabs = () => {
  const [grain, setGrain] = useState('lease');
  return (
    <div className="jrk-stack" style={{ width: '100%', maxWidth: 820, alignItems: 'flex-start' }}>
      <Tabs
        variant="pills"
        label="Lease Audit grouping"
        value={grain}
        onChange={setGrain}
        tabs={[
          { id: 'summary', label: 'Summary' },
          { id: 'property', label: 'By Property' },
          { id: 'lease', label: 'By Lease' },
        ]}
      />
      <div style={{ width: '100%' }}>
        <TabPanel id="summary" active={grain === 'summary'}>
          <Card title="Summary">41 of 316 leases sampled.</Card>
        </TabPanel>
        <TabPanel id="property" active={grain === 'property'}>
          <Card title="By Property">Exception counts rolled up per property.</Card>
        </TabPanel>
        <TabPanel id="lease" active={grain === 'lease'}>
          <DataTable
            columns={leaseColumns}
            rows={leases}
            rowKey={(r) => r.unit}
            caption="Lease audit sample, Summit at Red Rocks"
            zebra
            footer={<span className="jrk-caption">4 of 41 sampled leases · 2 exceptions</span>}
          />
        </TabPanel>
      </div>
    </div>
  );
};

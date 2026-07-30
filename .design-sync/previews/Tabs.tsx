import { useState } from 'react';
import { Tabs, PageHeader, Button } from '@jrk/design';

/* Page sections. `label` names the tablist for assistive tech, `value` is the
   selected id — the component owns arrow-key movement, the app owns the state. */
export const Default = () => {
  const [tab, setTab] = useState('overview');
  return (
    <div style={{ width: '100%', maxWidth: 760 }}>
      <Tabs
        label="Report sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'variances', label: 'Variances' },
          { id: 'charges', label: 'Charges' },
          { id: 'history', label: 'History' },
        ]}
      />
    </div>
  );
};

/* `count` renders the `__count` chip — a queue depth belongs on the tab that
   leads to it. `disabled` is for a section this property has no data for; the
   arrow keys skip over it. */
export const WithCounts = () => {
  const [tab, setTab] = useState('queue');
  return (
    <div style={{ width: '100%', maxWidth: 760 }}>
      <Tabs
        label="Submission queues"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'queue', label: 'My Queue', count: 14 },
          { id: 'all', label: 'All Submissions', count: 268 },
          { id: 'jobs', label: 'Jobs', count: 3 },
          { id: 'runs', label: 'Runs' },
          { id: 'forecast', label: 'Forecast', disabled: true },
        ]}
      />
    </div>
  );
};

/* `variant="pills"` is for switching how one dataset is cut, not for moving
   between pages. It sits inline and does not span the column. */
export const Pills = () => {
  const [grain, setGrain] = useState('property');
  const [mode, setMode] = useState('chart');
  return (
    <div className="jrk-stack" style={{ width: '100%', maxWidth: 760, alignItems: 'flex-start' }}>
      <Tabs
        variant="pills"
        label="Grouping"
        value={grain}
        onChange={setGrain}
        tabs={[
          { id: 'summary', label: 'Summary' },
          { id: 'property', label: 'By Property' },
          { id: 'lease', label: 'By Lease' },
        ]}
      />
      <Tabs
        variant="pills"
        label="View mode"
        value={mode}
        onChange={setMode}
        tabs={[
          { id: 'chart', label: 'Chart' },
          { id: 'table', label: 'Table' },
        ]}
      />
    </div>
  );
};

/* Where the tablist actually lives: directly under the page header, above the
   panel it governs. Underline for sections, pills for the view cut inside them. */
export const UnderPageHeader = () => {
  const [tab, setTab] = useState('variances');
  const [mode, setMode] = useState('table');
  return (
    <div className="jrk-stack" style={{ width: '100%', maxWidth: 820 }}>
      <PageHeader
        title="AM Report"
        description="Summit at Red Rocks — 316 units, accrual basis, through June 2026."
        actions={<Button variant="primary" size="sm">Export</Button>}
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
      <div className="jrk-row-between">
        <span className="jrk-caption">9 line items over the $250 variance threshold</span>
        <Tabs
          variant="pills"
          label="View mode"
          value={mode}
          onChange={setMode}
          tabs={[
            { id: 'chart', label: 'Chart' },
            { id: 'table', label: 'Table' },
          ]}
        />
      </div>
    </div>
  );
};

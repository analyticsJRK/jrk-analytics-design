import { Tag, Button, Select } from '@jrk/design';

const noop = () => {};

/* A Tag is a removable filter chip: pass `onRemove` and the remove affordance
   renders with an accessible label naming the filter it drops. */
export const Removable = () => (
  <div className="jrk-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
    <Tag onRemove={noop} removeLabel="Remove filter Region: Southeast">
      Region: Southeast
    </Tag>
    <Tag onRemove={noop} removeLabel="Remove filter Occupancy above 90%">
      Occupancy &gt; 90%
    </Tag>
    <Tag onRemove={noop} removeLabel="Remove filter Delinquency under 5%">
      Delinquency &lt; 5%
    </Tag>
    <Tag onRemove={noop} removeLabel="Remove filter Accrual basis">
      Accrual basis
    </Tag>
  </div>
);

/* Without `onRemove` the chip is a read-only label — a property attribute, not
   a filter the reader can drop. */
export const ReadOnly = () => (
  <div className="jrk-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
    <Tag>Garden style</Tag>
    <Tag>Class B</Tag>
    <Tag>Southeast</Tag>
    <Tag>312 units</Tag>
    <Tag>Built 1998</Tag>
  </div>
);

/* Filters sit in ONE row above the charts they govern — never scattered between
   them, never inside a chart card. */
export const FilterBar = () => (
  <div className="jrk-filter-bar" style={{ maxWidth: 800, flexWrap: 'nowrap' }}>
    <Select size="sm" aria-label="Period" defaultValue="Quarter to date">
      <option>Last 30 days</option>
      <option>Quarter to date</option>
      <option>Year to date</option>
    </Select>
    <Select size="sm" aria-label="Region" defaultValue="Southeast">
      <option>All regions</option>
      <option>Southeast</option>
      <option>Mid-Atlantic</option>
    </Select>
    <Tag onRemove={noop} removeLabel="Remove filter Occupancy above 90%">
      Occupancy &gt; 90%
    </Tag>
    <Tag onRemove={noop} removeLabel="Remove filter Excludes vacant units">
      Excludes vacant units
    </Tag>
    <span className="jrk-spacer" />
    <Button variant="ghost" size="sm">Reset</Button>
  </div>
);

/* An applied-filter summary above a table: the count names what was narrowed,
   each chip drops one criterion. */
export const AppliedFilters = () => (
  <div className="jrk-stack" style={{ maxWidth: 720 }}>
    <div className="jrk-row-between">
      <span className="jrk-overline">Applied filters</span>
      <span className="jrk-caption">18 of 47 properties</span>
    </div>
    <div className="jrk-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
      <Tag onRemove={noop} removeLabel="Remove filter Region: Southeast">
        Region: Southeast
      </Tag>
      <Tag onRemove={noop} removeLabel="Remove filter NOI above $500k">
        NOI &gt; $500k
      </Tag>
      <Tag onRemove={noop} removeLabel="Remove filter Open lease audits">
        Has open lease audit
      </Tag>
      <Tag onRemove={noop} removeLabel="Remove filter Renewals due in 60 days">
        Renewals due in 60 days
      </Tag>
      <Button variant="link" size="sm">Clear all</Button>
    </div>
  </div>
);

import { Empty, Card, Button } from '@jrk/design';

const TableIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="6" width="34" height="28" rx="3" />
    <path d="M3 15h34M3 24.5h34M14.5 15v19" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true">
    <circle cx="17" cy="17" r="12" />
    <path d="M25.5 25.5L35 35" />
  </svg>
);

/* Say what WOULD appear here. An empty surface with no explanation reads as a
   bug, so the description names the missing data and the filter hiding it. */
export const Default = () => (
  <div style={{ maxWidth: 480 }}>
    <Empty
      title="No delinquencies in this period"
      description="Nothing is past due across the 18 properties matching your filters. Widen the date range or clear the occupancy filter to see more accounts."
    />
  </div>
);

/* `action` carries the thing that produces the missing data — the reader should
   never have to guess how to fill the surface. */
export const WithAction = () => (
  <div style={{ maxWidth: 480 }}>
    <Empty
      icon={<SearchIcon />}
      title="No properties match these filters"
      description="18 of 47 properties were excluded by Region: Southeast and NOI > $500k. Clearing the region filter brings back 29 properties."
      action={
        <div className="jrk-row">
          <Button variant="secondary" size="sm">Clear filters</Button>
          <Button variant="ghost" size="sm">Edit view</Button>
        </div>
      }
    />
  </div>
);

/* `inline` is the compact form — for an empty panel inside a page that already
   has its own heading, where a full-height empty state would waste the fold. */
export const Inline = () => (
  <div className="jrk-stack" style={{ maxWidth: 480 }}>
    <Empty
      inline
      title="No open work orders"
      description="Parkside Commons has nothing in the maintenance queue today."
    />
    <div className="jrk-divider" />
    <Empty
      inline
      title="No renewals due in 60 days"
      description="The next lease expiration at Vista Ridge is October 14, 2026."
      action={<Button variant="link" size="sm">See all expirations</Button>}
    />
  </div>
);

/* Where it actually lives: inside the card body of the data surface that has no
   rows, so the card's own title still says what the surface is for. */
export const InCard = () => (
  <div className="jrk-grid jrk-grid-2">
    <Card title="Delinquency by property" subtitle="Quarter to date">
      <Empty
        icon={<TableIcon />}
        title="No accounts past due"
        description="Every account in the Southeast region is current. This table lists balances over 30 days when they appear."
        action={<Button variant="secondary" size="sm">Widen to all regions</Button>}
      />
    </Card>
    <Card title="Saved views" subtitle="Shared with your team">
      <Empty
        icon={<TableIcon />}
        title="No saved views yet"
        description="Save the filters you use every Monday and they will appear here for the whole portfolio team."
        action={<Button variant="primary" size="sm">Save current view</Button>}
      />
    </Card>
  </div>
);

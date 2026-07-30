import { PageHeader, Button, ButtonGroup, Badge } from '@jrk/design';

/* Title + one-sentence description. The description is capped at 68ch by the
   stylesheet, so it stays readable at any container width. */
export const Default = () => (
  <PageHeader
    title="AM Report"
    description="Asset-management summary for Summit at Red Rocks — 316 units, accrual basis, through June 2026."
  />
);

/* `actions` is the right-hand slot. A period toggle plus the one primary verb
   for the page is the shape every JRK portal page uses. */
export const WithActions = () => (
  <PageHeader
    title="Adjustments"
    description="Manual journal adjustments awaiting approval before the July close is locked."
    actions={
      <>
        <ButtonGroup label="Period">
          <Button variant="secondary" size="sm" aria-pressed={false}>MTD</Button>
          <Button variant="secondary" size="sm" aria-pressed>QTD</Button>
          <Button variant="secondary" size="sm" aria-pressed={false}>YTD</Button>
        </ButtonGroup>
        <Button variant="primary" size="sm">New adjustment</Button>
      </>
    }
  />
);

/* `breadcrumbs` renders above the header in its own labelled nav. The last
   entry is always the current page and never a link, whether or not an href
   was supplied. */
export const WithBreadcrumbs = () => (
  <PageHeader
    breadcrumbs={[
      { label: 'Portfolio', href: '#' },
      { label: 'CO - Denver', href: '#' },
      { label: 'Lease Audit' },
    ]}
    title="Lease Audit"
    description="41 leases sampled from 316. Variances over $250 are escalated to the asset manager."
    actions={
      <>
        <Button variant="ghost" size="sm">Export CSV</Button>
        <Button variant="primary" size="sm">Start audit</Button>
      </>
    }
  />
);

/* The title slot takes a node, so a run state can sit beside the page name
   rather than being demoted into the description. */
export const TitleWithStatus = () => (
  <PageHeader
    breadcrumbs={[{ label: 'Data quality', href: '#' }, { label: 'GL Audit' }]}
    title={
      <span className="jrk-row" style={{ alignItems: 'center' }}>
        GL Audit
        <Badge tone="warning">14 exceptions</Badge>
      </span>
    }
    description="Last run completed 04:12 today across 47 properties and $1,284k of posted activity."
    actions={<Button variant="secondary" size="sm">Re-run audit</Button>}
  />
);

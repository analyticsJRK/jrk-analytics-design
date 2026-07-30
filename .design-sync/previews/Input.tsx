import { Input } from '@jrk/design';

const Search = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5L14 14" />
  </svg>
);

/* The canonical field: label + control + help text, wired by the Field shell. */
export const Default = () => (
  <div className="jrk-stack" style={{ maxWidth: 320 }}>
    <Input label="Property code" placeholder="e.g. PKS-014" help="Six-character Entrata code." />
  </div>
);

/* An error is never signalled by the red border alone — `error` sets
   aria-invalid, wires aria-describedby, and renders an icon with the message. */
export const WithError = () => (
  <div className="jrk-stack" style={{ maxWidth: 320 }}>
    <Input label="Property code" defaultValue="PKS-14" error="No property matches that code." />
    <Input label="Effective date" required defaultValue="" error="Required to post an adjustment." />
  </div>
);

export const Sizes = () => (
  <div className="jrk-stack" style={{ maxWidth: 320 }}>
    <Input label="Small" size="sm" placeholder="Compact row filter" />
    <Input label="Medium" size="md" placeholder="Default" />
    <Input label="Large" size="lg" placeholder="Prominent search" />
  </div>
);

/* `numeric` right-aligns on tabular figures so digits stack in a column. */
export const NumericAndIcon = () => (
  <div className="jrk-stack" style={{ maxWidth: 320 }}>
    <Input label="Adjustment amount" numeric defaultValue="1,284.50" help="Posts against the current period." />
    <Input label="Search leases" leadingIcon={<Search />} placeholder="Tenant or unit" />
  </div>
);

export const RequiredAndDisabled = () => (
  <div className="jrk-stack" style={{ maxWidth: 320 }}>
    <Input label="Reason code" required placeholder="Select a reason" />
    <Input label="Posted by" defaultValue="npayumo@jrk.com" disabled help="Set from your session." />
  </div>
);

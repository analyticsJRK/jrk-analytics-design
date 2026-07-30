import { Button } from '@jrk/design';

const Plus = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M8 3.5v9M3.5 8h9" />
  </svg>
);

const Download = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 2.5v8M4.5 7.5L8 11l3.5-3.5M3 13.5h10" />
  </svg>
);

/* The variant axis — the prop that most changes appearance. `--danger` is
   reserved for actions that lose data, never as an accent. */
export const Variants = () => (
  <div className="jrk-row" style={{ flexWrap: 'wrap' }}>
    <Button variant="primary">Run audit</Button>
    <Button variant="secondary">Export</Button>
    <Button variant="ghost">Cancel</Button>
    <Button variant="danger">Delete batch</Button>
    <Button variant="danger-quiet">Discard</Button>
    <Button variant="link">View details</Button>
  </div>
);

export const Sizes = () => (
  <div className="jrk-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
    <Button variant="primary" size="sm">Small</Button>
    <Button variant="primary" size="md">Medium</Button>
    <Button variant="primary" size="lg">Large</Button>
  </div>
);

export const WithIcons = () => (
  <div className="jrk-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
    <Button variant="primary" leadingIcon={<Plus />}>New form</Button>
    <Button variant="secondary" trailingIcon={<Download />}>Download CSV</Button>
    <Button variant="ghost" iconOnly aria-label="Add property"><Plus /></Button>
  </div>
);

/* Loading holds width steady so the button does not resize mid-action;
   disabled is the other statically-renderable state. */
export const States = () => (
  <div className="jrk-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
    <Button variant="primary" loading>Posting</Button>
    <Button variant="secondary" loading>Refreshing</Button>
    <Button variant="primary" disabled>Unavailable</Button>
    <Button variant="secondary" disabled>Locked</Button>
  </div>
);

export const FullWidth = () => (
  <div style={{ maxWidth: 320 }}>
    <Button variant="primary" block>Submit adjustment</Button>
  </div>
);

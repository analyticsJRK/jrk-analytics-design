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

/* The variant axis — the prop that most changes appearance. `danger` is
   reserved for actions that lose data, never as an accent. */
export const Variants = () => (
  <div className="jrk-row" style={{ flexWrap: 'wrap' }}>
    <Button variant="cta">Run audit</Button>
    <Button variant="primary">New view</Button>
    <Button variant="secondary">Export</Button>
    <Button variant="ghost">Cancel</Button>
    <Button variant="danger">Delete batch</Button>
    <Button variant="danger-solid">Delete permanently</Button>
    <Button variant="danger-quiet">Discard</Button>
    <Button variant="link">View details</Button>
  </div>
);

/* `primary` is TINTED and `cta` is the solid accent, which is the whole
   hierarchy: primary is the everyday button and appears as often as it needs to,
   cta appears at most once per view. Reach for cta when the button commits
   something — posts a close, runs a report, saves. If two of them are on screen
   the reader has to choose which one is the action, which is the job the solid
   fill was supposed to do for them. */
export const Emphasis = () => (
  <div className="jrk-stack" style={{ alignItems: 'flex-start' }}>
    <div className="jrk-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
      <Button variant="cta">Post close</Button>
      <Button variant="primary">New view</Button>
      <Button variant="secondary">Export</Button>
      <Button variant="ghost">Cancel</Button>
      <span className="jrk-caption">one cta, and it is the thing that commits</span>
    </div>
    <div className="jrk-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
      <Button variant="cta">Post close</Button>
      <Button variant="cta">Run report</Button>
      <Button variant="cta">Export</Button>
      <span className="jrk-caption">three, and none of them means anything</span>
    </div>
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
    <Button variant="cta" loading>Posting</Button>
    <Button variant="primary" loading>Saving</Button>
    <Button variant="secondary" loading>Refreshing</Button>
    <Button variant="danger" loading>Deleting</Button>
    <Button variant="primary" disabled>Unavailable</Button>
    <Button variant="secondary" disabled>Locked</Button>
  </div>
);

export const FullWidth = () => (
  <div style={{ maxWidth: 320 }}>
    <Button variant="primary" block>Submit adjustment</Button>
  </div>
);

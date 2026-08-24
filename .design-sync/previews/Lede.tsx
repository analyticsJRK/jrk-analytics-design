import type { CSSProperties } from 'react';
import { Lede, PageHeader, Button, Stat, StatRow } from '@jrk/design';

/* The finding, and the grounds it rests on. The figure is <strong> rather than
   coloured — weight is the one emphasis channel that survives greyscale, both
   dichromacies and both themes. */
export const Default = () => (
  <Lede basis="2026–2027 season · priced on completed winters only.">
    Per-push is cheaper for <strong>14 of 21</strong> properties this season.
  </Lede>
);

/* Where it actually goes: under the page header, above the numbers. The header
   says what the page IS; the lede says what it SAYS today. */
export const InAPageHeader = () => (
  <div className="jrk-stack" style={{ '--jrk-stack-gap': '12px' } as CSSProperties}>
    <PageHeader
      title="Snow Tracker"
      description="Per-push vs seasonal contracts, 21 properties."
      actions={<Button variant="cta" size="sm">Review renewals</Button>}
    />
    <Lede basis="15 expired, 12 with no end date on file.">
      Per-push is cheaper for <strong>14 of 21</strong> properties this season, and{' '}
      <strong>27 contracts</strong> need attention before you can act on it.
    </Lede>
    <StatRow>
      <Stat label="Properties" value="21" />
      <Stat label="Favor per-push" value="14" footnote="of 21 properties" />
      <Stat label="Need attention" value="27" footnote="15 expired, 12 undated" />
      <Stat label="Season" value="2026–27" />
    </StatRow>
  </div>
);

/* A quiet season is still a finding, and it is the one a reader most wants
   stated rather than inferred from an empty table. */
export const NothingWrong = () => (
  <Lede basis="Checked against every contract with an end date on file.">
    Every contract is current — <strong>none</strong> expire before the season starts.
  </Lede>
);

/* Empty children render NOTHING — no element, no reserved space. The alternative
   is a caller writing "Review the table below" to fill the slot, which is
   furniture at the largest type size on the page. Both of these are null. */
export const Empty = () => (
  <div className="jrk-stack">
    <Lede>{null}</Lede>
    <Lede basis="A basis with no claim attached is a caption that lost its subject." />
    <p className="jrk-caption">Both ledes above rendered null — this caption is the only element here.</p>
  </div>
);

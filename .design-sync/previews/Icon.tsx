import { Icon, Badge, Button } from '@jrk/design';

/* SF Symbols are not shipped — Apple publishes no webfont and the outlines are
   theirs. These are original glyphs drawn to SF's BEHAVIOUR, which is what
   actually reads as Apple. Paths live in tokens/icons.json and are generated
   into dist/icons.{ts,js}, so React and the plain-JS previews share one source. */

/* The defining property, and the one nobody implements: icons are sized in
   `em`, so a glyph is the size of the text beside it. The same <Icon> renders
   at three sizes here purely because the surrounding font-size differs — a
   fixed 16px icon is wrong next to 12px caption text AND next to a heading.

   Pair the icon with its label in a flex row (`jrk-row`), which is how every
   control in this library composes one. The base reset makes every `svg` a
   block box, so an <Icon> dropped bare into flowing text takes its own line
   instead of sitting on the baseline. */
export const ScalesWithText = () => (
  <div className="jrk-stack">
    <span className="jrk-row" style={{ fontSize: 'var(--jrk-text-xs)' }}>
      <Icon name="checkFill" /> Caption text, 12px
    </span>
    <span className="jrk-row" style={{ fontSize: 'var(--jrk-text-md)' }}>
      <Icon name="checkFill" /> Body text, 14px
    </span>
    <span className="jrk-row" style={{ fontSize: 'var(--jrk-text-2xl)', fontWeight: 600 }}>
      <Icon name="checkFill" /> Heading, 20px
    </span>
  </div>
);

/* Weight pairs to the text weight, as SF's nine weights do. */
export const Weights = () => (
  <div className="jrk-row" style={{ alignItems: 'center', gap: 'var(--jrk-space-4)' }}>
    <Icon name="check" weight="light" size="lg" />
    <Icon name="check" weight="medium" size="lg" />
    <Icon name="check" weight="semibold" size="lg" />
    <Icon name="check" weight="bold" size="lg" />
    <span className="jrk-caption">light · medium · semibold · bold</span>
  </div>
);

/* Filled status glyphs. The inner mark is punched out with fill-rule evenodd,
   so the badge wash behind shows through and the glyph never needs to know its
   background colour. <Badge> renders these automatically. */
export const StatusGlyphs = () => (
  <div className="jrk-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
    <Badge tone="good">Reconciled</Badge>
    <Badge tone="warning">Needs review</Badge>
    <Badge tone="serious">30+ days</Badge>
    <Badge tone="critical">Escalated</Badge>
  </div>
);

export const InControls = () => (
  <div className="jrk-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
    <Button variant="primary" leadingIcon={<Icon name="plus" />}>New view</Button>
    <Button variant="secondary" leadingIcon={<Icon name="download" />}>Export CSV</Button>
    <Button variant="secondary" iconOnly aria-label="Filter"><Icon name="filter" /></Button>
    <Button variant="secondary" iconOnly aria-label="Search"><Icon name="search" /></Button>
  </div>
);

/* The full set. For anything beyond it use Phosphor (MIT) with
   className="jrk-icon" — it inherits the same sizing, weight and baseline
   contract, so it will not look bolted on. */
export const TheSet = () => (
  <div className="jrk-row" style={{ flexWrap: 'wrap', gap: 'var(--jrk-space-4)', fontSize: 20 }}>
    {['check', 'chevronRight', 'chevronDown', 'chevronUpDown', 'arrowUp', 'arrowDown',
      'close', 'plus', 'minus', 'search', 'filter', 'ellipsis', 'grid', 'chartBar',
      'clock', 'house', 'calendar', 'doc', 'gear', 'bell', 'download', 'sheet',
      'trash', 'inbox', 'pin'].map((n) => (
        <span key={n} title={n}><Icon name={n} /></span>
      ))}
  </div>
);

import { Glossary, Badge, Card } from '@jrk/design';

/* The intended form: the term IS the badge the reader will meet in the table
   below, so the glossary shows them the object rather than a paraphrase. */
export const Default = () => (
  <Glossary
    items={[
      {
        term: <Badge tone="accent">Per push</Badge>,
        def: 'You pay each time the plow comes out, roughly a rate per inch. Cheaper in light winters, expensive in heavy ones — you carry the weather risk.',
      },
      {
        term: <Badge tone="good">Seasonal</Badge>,
        def: 'One fixed price for the whole season, plus a small overage past a cap. Predictable, but you overpay in mild winters — the vendor carries the risk.',
      },
    ]}
  />
);

/* Plain terms. Semibold primary against a secondary gloss — the gloss is the
   content here, which is why it is not muted. */
export const PlainTerms = () => (
  <Glossary
    items={[
      {
        term: 'Completed winter',
        def: 'A season with snowfall recorded through 31 March. Partial seasons are excluded from pricing.',
      },
      {
        term: 'Overage cap',
        def: 'The snowfall total past which a seasonal contract starts billing per push again.',
      },
      {
        term: 'Preference',
        def: 'The contract type the asset manager has asked for, which may not be the cheaper one.',
      },
    ]}
  />
);

/* One column, gloss under term — for a genuinely narrow column, not for a long
   list. The two-column form is the default because it lets a reader skip the
   terms they already know; stacked makes them read all of it. */
export const Stacked = () => (
  <Card title="Definitions">
    <Glossary
      stacked
      items={[
        { term: 'Completed winter', def: 'Snowfall recorded through 31 March.' },
        { term: 'Overage cap', def: 'Where a seasonal contract starts billing per push again.' },
      ]}
    />
  </Card>
);

/* `termWidth` fixes the column instead of letting the longest term set it. Use
   it when one long term would otherwise starve every gloss beside it. */
export const FixedTermColumn = () => (
  <Glossary
    termWidth="14rem"
    items={[
      { term: 'Per push', def: 'Billed per plow visit.' },
      { term: 'Seasonal with overage cap', def: 'Flat price, then per-push past the cap.' },
      { term: 'City-maintained', def: 'The municipality clears it; JRK pays nothing.' },
    ]}
  />
);

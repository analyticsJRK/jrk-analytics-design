import { Steps, Card, Expander } from '@jrk/design';

const method = [
  {
    title: 'Pulls each property from Portfolio Info',
    detail: 'How snow is handled today — vendor, in-house, city or none.',
  },
  {
    title: 'Loads 30+ years of local snowfall',
    detail: 'Nearest station, completed winters only.',
  },
  {
    title: 'Prices both contract types',
    detail: 'Per-push at the vendor rate, seasonal at the quoted flat price plus overage.',
  },
  { title: 'Recommends the cheaper one' },
];

/* Four steps in place of a four-line paragraph. The numeral is a CSS counter,
   so inserting a step renumbers the list and nothing can drift. */
export const Default = () => <Steps items={method} />;

/* `detail` is optional. A list of bare titles is the right form when the reader
   needs the shape of the method rather than its terms. */
export const TitlesOnly = () => (
  <Steps
    items={[
      { title: 'Read the contract' },
      { title: 'Price both options' },
      { title: 'Recommend one' },
    ]}
  />
);

/* Draws no surface, so it lands unchanged inside a card. Both planes are worth
   checking on any explainer — the numeral measures 10.94:1 on the card and
   10.57:1 on the page in light, and there is no fill to disappear in dark. */
export const InACard = () => (
  <Card title="How this works" subtitle="Same numbers the recommendation column uses.">
    <Steps items={method} />
  </Card>
);

/* There is no `collapsed` modifier — an expander already is one. Composition
   rather than an option, which is also how the page gets to decide whether the
   method is worth the vertical space today. */
export const Collapsed = () => (
  <Expander
    icon="doc"
    tag="method"
    title="How the recommendation is calculated"
    description="Four steps, from the contract on file to the cheaper option."
  >
    <Steps items={method} />
  </Expander>
);

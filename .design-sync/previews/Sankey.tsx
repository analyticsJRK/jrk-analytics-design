import { ChartCard, Sankey } from '@jrk/design';

/* Two columns: carriers into services. The SERVICE is the category, so it takes
   a slot (pinned, so a filter cannot repaint it) and the ribbons inherit it from
   their target. Carriers are neutral — sixteen of them are far past the
   eight-slot ceiling, so the labels carry their identity, with value and share. */
export const Default = () => (
  <div style={{ maxWidth: 760 }}>
    <ChartCard title="Lines by carrier and service" subtitle="Billed lines · Oct 2026">
      <Sankey
        label="Telecom lines from carrier to service, October 2026"
        nodes={[
          { id: 'att', label: 'AT&T', column: 0 },
          { id: 'cmc', label: 'Comcast Business', column: 0 },
          { id: 'spx', label: 'Spectrum', column: 0 },
          { id: 'oth', label: 'Other (12 carriers)', column: 0, muted: true },
          { id: 'ph', label: 'Phone', column: 1, slot: 1 },
          { id: 'in', label: 'Internet', column: 1, slot: 2 },
          { id: 'tv', label: 'Cable', column: 1, slot: 3 },
        ]}
        links={[
          { source: 'att', target: 'ph', value: 140, slot: 1 },
          { source: 'att', target: 'in', value: 60, slot: 2 },
          { source: 'cmc', target: 'in', value: 120, slot: 2 },
          { source: 'cmc', target: 'tv', value: 40, slot: 3 },
          { source: 'spx', target: 'in', value: 70, slot: 2 },
          { source: 'spx', target: 'tv', value: 55, slot: 3 },
          { source: 'oth', target: 'ph', value: 30, slot: 1 },
          { source: 'oth', target: 'in', value: 20, slot: 2 },
        ]}
        legend={[
          { label: 'Phone', slot: 1 },
          { label: 'Internet', slot: 2 },
          { label: 'Cable', slot: 3 },
        ]}
      />
    </ChartCard>
  </div>
);

/* A chain with drop-offs: each stage in its own column, what stopped falling
   away as a muted node. Every node is neutral — stages are a sequence, not
   categories — so the shape and the labels carry the reading. */
export const ChainWithDrops = () => (
  <div style={{ maxWidth: 760 }}>
    <ChartCard title="Leasing flow" subtitle="Leads created Q3 2026">
      <Sankey
        label="Leasing funnel as a flow"
        share={false}
        nodes={[
          { id: 'leads', label: 'Leads', column: 0 },
          { id: 'tours', label: 'Toured', column: 1 },
          { id: 'notour', label: 'No tour', column: 1, muted: true },
          { id: 'apps', label: 'Applied', column: 2 },
          { id: 'noapp', label: 'No application', column: 2, muted: true },
          { id: 'lease', label: 'Leased', column: 3 },
          { id: 'nolease', label: 'Not approved', column: 3, muted: true },
        ]}
        links={[
          { source: 'leads', target: 'tours', value: 4100 },
          { source: 'leads', target: 'notour', value: 5700 },
          { source: 'tours', target: 'apps', value: 1102 },
          { source: 'tours', target: 'noapp', value: 2998 },
          { source: 'apps', target: 'lease', value: 640 },
          { source: 'apps', target: 'nolease', value: 462 },
        ]}
      />
    </ChartCard>
  </div>
);

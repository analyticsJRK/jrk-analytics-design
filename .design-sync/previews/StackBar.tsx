import { ChartCard, StackBar } from '@jrk/design';

/* Part-to-whole, few parts: a stacked bar, never a donut — length along one
   axis is read more accurately than angle. Eight segments at most, so the tail
   folds into "Other". The legend is the stack's table: label, value, share. */
export const Default = () => (
  <div style={{ maxWidth: 560 }}>
    <ChartCard title="Units by asset manager" subtitle="Top 4 of 9 · 28,411 units">
      <StackBar
        label="Units by asset manager"
        segments={[
          { label: 'Matt Sussman', value: 9120 },
          { label: 'Max McCoy', value: 6120 },
          { label: 'Lisa Baeck', value: 5480 },
          { label: 'Tyler Stromsborg', value: 3310 },
          { label: 'Other (5)', value: 4381 },
        ]}
      />
    </ChartCard>
  </div>
);

/* Two stacks that must agree take the SAME order — the order is the slot, so
   slot 3 is the same person on both. A zero segment stays in place (hidden),
   which keeps every later segment on its own colour. */
const ORDER = ['Matt Sussman', 'Max McCoy', 'Lisa Baeck', 'Other'];
export const TwoMeasuresOneOrder = () => (
  <div style={{ display: 'grid', gap: 'var(--jrk-space-4)', maxWidth: 560 }}>
    <ChartCard title="Properties" subtitle="96 properties">
      <StackBar label="Properties by asset manager" segments={ORDER.map((l, i) => ({ label: l, value: [37, 22, 0, 37][i] }))} />
    </ChartCard>
    <ChartCard title="Units" subtitle="28,411 units">
      <StackBar label="Units by asset manager" segments={ORDER.map((l, i) => ({ label: l, value: [9120, 6120, 5480, 7691][i] }))} />
    </ChartCard>
  </div>
);

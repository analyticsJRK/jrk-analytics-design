import { ChartCard, Funnel } from '@jrk/design';

/* Leasing funnel, Q2 2026. Ordinal, not categorical: swapping "Applications"
   and "Approved" would change what the chart says, which is the test charts.md
   gives for the form. So the stages take chart.sequential by POSITION and there
   is no way to hand one a colour — the ramp is the sequence. */
const LEASING = [
  { label: 'Inquiries', value: 12940 },
  { label: 'Tours scheduled', value: 5180 },
  { label: 'Tours completed', value: 3610, note: '1,570 no-showed' },
  { label: 'Applications', value: 1240 },
  { label: 'Approved', value: 1010, note: '230 declined' },
  { label: 'Leases signed', value: 892, note: '118 lapsed' },
];

/* Two channels the reader would otherwise have to compute: renewals is the
   short funnel, and its steps are close enough together that the ramp does most
   of the work. */
const RENEWALS = [
  { label: 'Leases expiring', value: 1840 },
  { label: 'Offers sent', value: 1712 },
  { label: 'Offers accepted', value: 1104 },
  { label: 'Renewals signed', value: 1061 },
];

const LeasingTable = () => (
  <div className="jrk-table-wrap">
    <table className="jrk-table jrk-table--compact">
      <caption className="jrk-sr-only">Leasing funnel, inquiry to signed lease, Q2 2026</caption>
      <thead>
        <tr>
          <th scope="col">Stage</th>
          <th scope="col" className="jrk-num">
            Count
          </th>
          <th scope="col" className="jrk-num">
            Of entry
          </th>
          <th scope="col" className="jrk-num">
            Step
          </th>
        </tr>
      </thead>
      <tbody>
        {LEASING.map((s, i) => (
          <tr key={s.label}>
            <td>{s.label}</td>
            <td className="jrk-num">{s.value.toLocaleString()}</td>
            <td className="jrk-num">{((s.value / LEASING[0].value) * 100).toFixed(1)}%</td>
            <td className="jrk-num">
              {i === 0 ? '—' : `${((s.value / LEASING[i - 1].value) * 100).toFixed(1)}%`}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* The bands are centred, so the taper reads off their ends — but the value is
   still LENGTH, and every stage prints its count and its share of entry. Two
   centred bars share no datum, which is the cost this form pays and the reason
   the numbers are not optional. */
export const Default = () => (
  <div style={{ maxWidth: 620 }}>
    <ChartCard
      title="Leasing funnel"
      subtitle="Inquiry to signed lease · Q2 2026 · 8 assets"
      table={<LeasingTable />}
    >
      <Funnel stages={LEASING} />
    </ChartCard>
  </div>
);

/* `alertBelow` tones the step rate where a stage is losing more than the
   threshold. It is redundant encoding, not the encoding: the rate and the word
   "continue" are printed either way, so a reader who cannot see the tone loses
   nothing. The BAND is never re-hued for it — the ramp is the one thing here
   that has to stay monotone. */
export const FlaggedStep = () => (
  <div style={{ maxWidth: 620 }}>
    <ChartCard title="Leasing funnel" subtitle="Q2 2026 · steps under 40% flagged">
      <Funnel stages={LEASING} alertBelow={0.4} />
    </ChartCard>
  </div>
);

/* A shallow funnel. Four stages take the first four steps of the ramp, so the
   fills stay in the lighter half — which is correct: the ramp position means
   "how far along", and a four-stage funnel does not go as far. */
export const ShortFunnel = () => (
  <div style={{ maxWidth: 620 }}>
    <ChartCard title="Renewal funnel" subtitle="Expiring leases · Q2 2026">
      <Funnel stages={RENEWALS} />
    </ChartCard>
  </div>
);

/* Two funnels read against each other take the SAME explicit `max`. Left alone
   each scales to its own entry stage and both first bands run full width, which
   would say 12,940 inquiries equals 1,840 expiries. */
export const ComparableMax = () => (
  <div style={{ display: 'grid', gap: 'var(--jrk-space-4)', maxWidth: 620 }}>
    <ChartCard title="New leases" subtitle="Q2 2026 · scaled 0–13,000">
      <Funnel stages={LEASING} max={13000} />
    </ChartCard>
    <ChartCard title="Renewals" subtitle="Q2 2026 · scaled 0–13,000">
      <Funnel stages={RENEWALS} max={13000} />
    </ChartCard>
  </div>
);

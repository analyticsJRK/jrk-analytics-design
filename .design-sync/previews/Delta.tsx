import type { ReactNode } from 'react';
import { Delta, Stat } from '@jrk/design';

/* Local layout helpers — not exported, so they are not stories of their own.
   A delta is an inline span; it belongs beside the metric it describes. */
const Panel = ({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) => (
  <div className="jrk-card" style={{ maxWidth: 420 }}>
    <div className="jrk-card__header">
      <div>
        <h3 className="jrk-card__title">{title}</h3>
        <p className="jrk-card__subtitle">{subtitle}</p>
      </div>
    </div>
    <div className="jrk-card__body">
      <div className="jrk-stack" style={{ gap: 12 }}>{children}</div>
    </div>
  </div>
);

const MetricRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="jrk-row-between">
    <span className="jrk-body-sm jrk-text-secondary">{label}</span>
    {children}
  </div>
);

/* With the default `upIsGood`, the sign picks the tone: up is good, down is bad.
   `vs` names the comparison window — it is required, because a percentage with
   no window means nothing. */
export const Default = () => (
  <Panel title="Portfolio movement" subtitle="Quarter close · 4,186 units">
    <MetricRow label="Net operating income">
      <Delta value={3.1} vs="vs last quarter" />
    </MetricRow>
    <MetricRow label="Portfolio occupancy">
      <Delta value={-0.6} vs="vs last quarter" />
    </MetricRow>
    <MetricRow label="Collections">
      <Delta value={1.9} vs="vs 90d avg" />
    </MetricRow>
  </Panel>
);

/* The whole point of the component: `good`/`bad` are interpretation, not
   direction. The same +0.6% is green on collections and red on delinquency,
   and a falling turnover rate is a win. */
export const UpIsGood = () => (
  <Panel title="Interpretation, not direction" subtitle="Same sign, opposite meaning">
    <MetricRow label="Collections — up is good">
      <Delta value={0.6} vs="vs last month" />
    </MetricRow>
    <MetricRow label="Delinquency — up is bad">
      <Delta value={0.6} upIsGood={false} vs="vs last month" />
    </MetricRow>
    <MetricRow label="Unit turnover — down is good">
      <Delta value={-2.4} upIsGood={false} vs="vs last year" />
    </MetricRow>
  </Panel>
);

/* Zero drops the arrow entirely and goes muted — a flat month is neither a win
   nor a loss, and painting it green or red would be a lie. */
export const Flat = () => (
  <Panel title="No movement" subtitle="Held within rounding this period">
    <MetricRow label="Renewal rate">
      <Delta value={0} vs="vs last quarter" />
    </MetricRow>
    <MetricRow label="Avg. rent">
      <Delta value={0} vs="vs last month" />
    </MetricRow>
    <MetricRow label="Delinquency">
      <Delta value={0} upIsGood={false} vs="vs last month" />
    </MetricRow>
  </Panel>
);

/* `format` covers the units a percent sign would misstate — occupancy moves in
   percentage points, collections move in dollars, turns move in days. */
export const CustomFormat = () => (
  <Panel title="Units that are not percent" subtitle="Points, dollars, and days">
    <MetricRow label="Occupancy">
      <Delta
        value={-0.6}
        vs="vs last quarter"
        format={(n) => `${n > 0 ? '+' : '−'}${Math.abs(n).toFixed(1)}pt`}
      />
    </MetricRow>
    <MetricRow label="Collected rent">
      <Delta
        value={128400}
        vs="vs last quarter"
        format={(n) => `${n > 0 ? '+' : '−'}$${Math.abs(Math.round(n / 1000)).toLocaleString('en-US')}k`}
      />
    </MetricRow>
    <MetricRow label="Days to turn">
      <Delta
        value={-2.3}
        upIsGood={false}
        vs="vs 90d avg"
        format={(n) => `${n > 0 ? '+' : '−'}${Math.abs(n).toFixed(1)}d`}
      />
    </MetricRow>
  </Panel>
);

/* Where a delta normally lives: the meta line under a KPI's headline number.
   Laid out with jrk-row, not jrk-grid — the chart layer's gridline rule
   (`.jrk-grid path`) repaints the arrow glyph inside a .jrk-grid container. */
export const InStatMeta = () => (
  <div className="jrk-row" style={{ flexWrap: 'wrap', alignItems: 'stretch' }}>
    <div style={{ flex: '1 1 200px' }}>
      <Stat label="Collected rent" value="$4.21" unit="M" delta={{ value: 3.1, vs: 'vs last quarter' }} />
    </div>
    <div style={{ flex: '1 1 200px' }}>
      <Stat label="Occupancy" value="93.8" unit="%" delta={{ value: -0.6, vs: 'vs last quarter' }} />
    </div>
    <div style={{ flex: '1 1 200px' }}>
      <Stat
        label="Delinquency rate"
        value="4.7"
        unit="%"
        delta={{ value: -1.2, upIsGood: false, vs: 'vs last quarter' }}
      />
    </div>
  </div>
);

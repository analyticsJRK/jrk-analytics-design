import { Stat } from '@jrk/design';

/* A single headline number belongs in a tile, never a one-bar chart. */
export const Default = () => (
  <div style={{ maxWidth: 260 }}>
    <Stat label="Portfolio occupancy" value="94.2" unit="%" />
  </div>
);

/* `vs` is required on a delta — a percentage with no comparison window means
   nothing. Tone comes from interpretation, not the sign. */
export const WithDelta = () => (
  <div className="jrk-row" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
    <div style={{ minWidth: 220 }}>
      <Stat
        label="Net operating income"
        value="$4.82M"
        delta={{ value: 3.1, vs: 'vs last quarter' }}
      />
    </div>
    <div style={{ minWidth: 220 }}>
      <Stat
        label="Delinquency"
        value="2.4"
        unit="%"
        delta={{ value: 0.6, upIsGood: false, vs: 'vs last month' }}
      />
    </div>
  </div>
);

/* The sparkline is shape only — decorative by contract, because the number
   beside it is the accessible value. */
export const WithSparkline = () => (
  <div style={{ maxWidth: 340 }}>
    <Stat
      label="Collections"
      value="98.1"
      unit="%"
      spark={[91, 92.4, 93.1, 92.8, 94.6, 95.2, 96.1, 95.8, 97.2, 97.6, 98.1]}
      delta={{ value: 1.9, vs: 'vs 90d avg' }}
    />
  </div>
);

export const WithFootnote = () => (
  <div style={{ maxWidth: 260 }}>
    <Stat
      label="Open lease audits"
      value="37"
      footnote={<span className="jrk-caption">12 awaiting property manager</span>}
    />
  </div>
);

/* A KPI band — the shape a dashboard header actually uses. */
export const Band = () => (
  <div className="jrk-grid jrk-grid-3">
    <Stat label="Occupancy" value="94.2" unit="%" delta={{ value: 0.8, vs: 'vs last month' }} />
    <Stat label="Avg. rent" value="$1,842" delta={{ value: 2.2, vs: 'vs last year' }} />
    <Stat label="Turnover" value="18.6" unit="%" delta={{ value: 1.1, upIsGood: false, vs: 'vs last year' }} />
  </div>
);

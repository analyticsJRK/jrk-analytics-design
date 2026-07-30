import { StatRow, Stat } from '@jrk/design';

/* Tiles that share one rounded container and are divided by hairlines — the
   band reads as a single object across the top of a dashboard. */
export const Default = () => (
  <StatRow>
    <Stat label="Collected rent" value="$4.21" unit="M" delta={{ value: 3.1, vs: 'vs last quarter' }} />
    <Stat label="Occupancy" value="93.8" unit="%" delta={{ value: -0.6, vs: 'vs last quarter' }} />
    <Stat
      label="Delinquency rate"
      value="4.7"
      unit="%"
      delta={{ value: -1.2, upIsGood: false, vs: 'vs last quarter' }}
    />
  </StatRow>
);

/* Discrete rounded tiles with a gap, each keeping its own tinted fill — the
   KPI band the portfolio dashboard actually ships. */
export const Split = () => (
  <StatRow className="jrk-stat-row--split">
    <Stat label="Collected rent" value="$4.21" unit="M" delta={{ value: 3.1, vs: 'vs last quarter' }} />
    <Stat label="Occupancy" value="93.8" unit="%" delta={{ value: -0.6, vs: 'vs last quarter' }} />
    <Stat
      label="Delinquency rate"
      value="4.7"
      unit="%"
      delta={{ value: -1.2, upIsGood: false, vs: 'vs last quarter' }}
    />
    <Stat label="Avg days to turn" value="18.4" delta={{ value: -2.3, upIsGood: false, vs: 'vs 90d avg' }} />
  </StatRow>
);

/* Periwinkle band — one tinted surface behind the whole joined row. */
export const Tinted = () => (
  <StatRow className="jrk-stat-row--tinted">
    <Stat label="Units under management" value="4,186" delta={{ value: 1.4, vs: 'vs last year' }} />
    <Stat label="Avg. rent" value="$1,842" delta={{ value: 2.2, vs: 'vs last year' }} />
    <Stat label="Renewal rate" value="61.4" unit="%" delta={{ value: 0, vs: 'vs last quarter' }} />
  </StatRow>
);

/* A band can mix plain tiles with a sparkline tile — the spark carries shape
   for the one metric whose trajectory matters. */
export const WithSparkTile = () => (
  <StatRow>
    <Stat label="Collections" value="98.1" unit="%" delta={{ value: 1.9, vs: 'vs 90d avg' }} />
    <Stat
      label="Avg days to turn"
      value="18.4"
      spark={[26, 25.1, 24.4, 23.8, 22.1, 21.6, 20.9, 20.2, 19.4, 18.9, 18.4]}
    />
    <Stat
      label="Work orders open"
      value="142"
      footnote={<span className="jrk-caption">31 past SLA</span>}
    />
  </StatRow>
);

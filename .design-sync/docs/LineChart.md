---
category: Charts
keywords: [line chart, time series, trend, area, multi series, colorblind, dash, encoding]
---

# LineChart

Line chart with the crosshair and tooltip hover layer, which ships by default —
an SVG chart *is* interactive, and values the eye cannot read off the axis have
to be reachable somehow.

## Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `series` | `{ name, values }[]` | — | Max 8. Slots assign in order and never cycle. |
| `labels` | `string[]` | — | One per x position. |
| `format` | `(n: number) => string` | `toLocaleString` | Tooltip and table values. |
| `height` | `number` | `220` | |
| `area` | `boolean` | `false` | ~10% wash. Single series only — stacked washes become unreadable past one. |
| `encoding` | `'hue' \| 'redundant'` | `redundant` at 2+ series, `hue` at 1 | Adds the per-slot dash. |
| `className` | `string` | — | |

## The `encoding` prop

Hue is only an identity channel for **adjacent** slots. The eight-slot order was
searched to maximise the worst adjacent pair, and the arithmetic consequence is
that similar hues get pushed four apart — so every pair that collapses under
simulated dichromacy is `(n, n+4)`. Slot 2 orange against slot 4 yellow measures
**ΔE 0.8** under deuteranopia, against a floor of 10. That is not "close", it is
the same colour, and a line chart compares non-adjacent series constantly.

`encoding="redundant"` adds each slot's dash pattern, so the series stay
separable when their hues do not.

It defaults on at 2+ series and off at 1, rather than always-on, because a
dashed stroke otherwise means `.jrk-threshold` — a reference value, not data.
With one series there is nothing to confuse it with, and a lone dashed line
would read as a threshold. Pass `encoding="hue"` to force it off.

```tsx
<LineChart series={regions} labels={months} />              {/* dashed at 2+ */}
<LineChart series={[total]} labels={months} area />         {/* solid */}
<LineChart series={regions} labels={months} encoding="hue" />
```

## Examples

A chart is almost always composed inside a `ChartCard`, which supplies the
title, the subtitle that carries the unit, and the "Show table" affordance —
`LineChart` itself renders only the plot.

```tsx
const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan',
                'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

const properties = [
  { name: 'Parkside Commons', values: [1420, 1465, 1390, 1510, 1580, 1620, 1595, 1660, 1710, 1690, 1745, 1802] },
  { name: 'Vista Ridge',      values: [980, 1010, 995, 1040, 1075, 1030, 1088, 1120, 1095, 1160, 1185, 1210] },
  { name: 'Harbor Point',     values: [640, 620, 705, 688, 730, 762, 744, 790, 815, 802, 848, 872] },
];

<ChartCard
  title="Collected rent by property"
  subtitle="Monthly, $ thousands · Aug 2025 – Jul 2026"
>
  <LineChart series={properties} labels={months} format={(n) => `$${n.toLocaleString()}K`} />
</ChartCard>
```

The Y axis always formats through an internal compact scale (`1.5K`), and
`format` reaches only the tooltip — so the unit belongs in the subtitle, as
above. Single series takes the area wash and stays solid:

```tsx
<ChartCard title="Work orders closed" subtitle="Monthly count · Aug 2025 – Jul 2026">
  <LineChart series={[closed]} labels={months} area />
</ChartCard>
```

Pick data that peaks just under a round number — the axis ceiling is coarse near
a decade boundary, and a series topping out at 1,402 gets a 2,000 axis, leaving
the area sitting in the bottom half of the plot.

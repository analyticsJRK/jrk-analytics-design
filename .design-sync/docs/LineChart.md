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

---
category: Shell
keywords: [hue, accent, hazard, tint, inlay, swatch, color picker, radiogroup, appearance]
---

The active layer's hue as a strip of swatches.

```tsx
const axis = VARIANT_AXES[skin];
{axis && (
  <HueSwatches
    axis={axis}
    value={hues[axis.attr]}
    onChange={(h) => applyVariant(skin, { [axis.attr]: h }, { storagePrefix: 'jrk' })}
  />
)}
```

A radiogroup: arrow keys walk it, a roving tabindex keeps it one Tab stop, focus
follows selection.

**The fills are sampled, not stamped.** Every generated hue block is anchored at
`:root`, so a swatch carrying its own attribute would match none of them and
paint the current hue six times. Each hue is stamped on the root for one
synchronous read and put back, and re-sampled when the theme or skin changes.
Pass the ACTIVE layer's axis; another layer's samples wrong.

A restricted hue renders its note under the strip while chosen (`showRestriction`).
Under Industry the fill is chamfered on a pseudo-element, so the selection
outline is never clipped.

---
category: Shell
keywords: [appearance, theme, dark mode, skin, hue, accent, hazard, tint, inlay, settings menu, topbar]
---

Theme, skin and the active layer's hue in one topbar disclosure, built on `Menu`.

```tsx
// Uncontrolled: reads storage on mount, stamps <html>, persists every change.
<AppearanceMenu storagePrefix="jrk-portal" />

// Controlled: you own the state and apply it.
<AppearanceMenu
  value={state}
  onChange={(next) => { setState(next); applyAppearance(next, { storagePrefix: 'jrk-portal' }); }}
/>
```

Put `themeScript({ storagePrefix })` in an inline `<script>` at the top of `<head>`
with the same prefix, or a stored preference that disagrees with the OS flashes
on every hard navigation. React cannot do that job: every hook runs after the
first paint.

## Three axes that cross

- **Theme** — Light / Dark / System. System removes `data-theme`, so the page
  keeps following the OS.
- **Skin** — Standard / Industry / Midgard / Vitrine. A skin carries its own light
  and dark halves, so it is a second control, not more segments on the first.
- **Hue** — the layer's own attribute (`data-accent`, `data-hazard`, `data-inlay`,
  `data-tint`) and its own heading. Values, labels, the skin typefaces and any
  restriction come from `SKIN_LAYERS`, which the build generates from the token
  files. A hue added there reaches this menu on the next build.

Every default is the **absence** of its attribute. Picking it removes the stamp.

## Storage

One key per attribute — `<prefix>-theme`, `<prefix>-skin`, `<prefix>-hazard`… —
so a reader's Industry hue survives a week on Vitrine. Values are validated
against their own axis on read.

## Restrictions

Industry's red and Vitrine's amber collide with their skin's status colours under
colour-blindness, and Midgard's default gold does in dark. The swatch cannot show
that, so the menu renders the note while the hue is chosen. Leave it on.

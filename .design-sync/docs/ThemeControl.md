---
category: Shell
keywords: [theme, dark mode, light mode, system, segmented control, appearance]
---

Light / Dark / System as the toolbar segmented control.

```tsx
<ThemeControl value={pref} onChange={(next) => { setPref(next); applyTheme(next, { storagePrefix: 'jrk' }); }} />
```

Three named segments because the setting is three-valued. A sun-or-moon toggle
cannot express System, and a reader who wants to follow their machine has no way
back once they have clicked it.

`applyTheme('system')` removes `data-theme` rather than stamping a resolved value,
which is what keeps the token CSS's `prefers-color-scheme` branch live. The value
is the stored PREFERENCE, not the resolved theme.

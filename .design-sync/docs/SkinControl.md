---
category: Shell
keywords: [skin, theme, industry, midgard, vitrine, appearance, segmented control]
---

Standard / Industry / Midgard / Vitrine as the toolbar segmented control.

```tsx
<SkinControl value={skin} onChange={(next) => { setSkin(next); applySkin(next); applyVariant(next, hues); }} />
```

A separate control from the theme because the two cross: each skin has its own
light and dark halves. `applySkin` stamps `data-skin` (Standard removes it) and
injects the skin's typeface from `SKIN_LAYERS[skin].font` into one `<link>` by
id, so a reader who never picks a skin never fetches one. Call `applyVariant`
after it: the previous skin's hue attribute is still on `<html>`.

`skins` narrows the list; labels come from the token files.

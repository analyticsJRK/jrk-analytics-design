---
category: Shell
keywords: [brand, logo, wordmark, product mark, masthead, home link]
---

The product mark and wordmark, for a topbar or the rail's brand row.

```tsx
<AppShell masthead={
  <Topbar vivid tone="brand" masthead>
    <BrandMark href="/" linkAs={Link} mark="J" name="JRK Analytics" />
    <span className="jrk-spacer" />
    …
  </Topbar>
}>
  …
</AppShell>
```

## Notes

- **The mark is the bar's ink inverted** — the ink as its fill, the bar's leading
  colour as its glyph — so it measures what the wordmark beside it measures, on any
  ramp and under any skin. A brand-blue square would be a second brand colour fighting
  the bar, and vanishes on the dark ramp's black edge.
- Under a skin with a flat masthead it follows `--jrk-masthead-*`; with none it
  follows `gradient.topbar.*`.
- **Below 720px the wordmark is clipped, not removed** — it is the link's name. The
  mark stays, so the corner is never empty.
- Give it an `href`. A wordmark that does not go home breaks a convention for nothing.
- The mark is a `div`, so it survives the collapsed rail, which hides every `span` in
  the brand row.

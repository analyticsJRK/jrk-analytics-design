# preview/assets

Gallery-only binaries. **Nothing here ships.**

The portal's `scripts/sync-design.mjs` mirrors whole directories — `dist/`,
`css/`, `react/src/`, `tokens/`, plus `package.json` and `LICENSE`. `preview/` is
not one of them, which is the only reason an image may live here at all. Do not
move these under `css/`: the vitrine skin's own note in `css/skins/vitrine.css`
explains why a photograph in a mirrored directory is copied into the app on every
sync forever, referenced or not.

## Expected files

`skin-vitrine.html`'s frosted-scene section reads two photographs:

| file | used when | wants |
|---|---|---|
| `vitrine-scene-light.jpg` | `data-theme="light"` | a bright, high-detail landscape |
| `vitrine-scene-dark.jpg`  | `data-theme="dark"`  | a dark, high-detail landscape |

**Both are optional.** Each is declared as the first layer of a two-layer
`background-image` with a token-built ramp underneath, so a missing file falls
through to the ramp and the section still demonstrates the glass — it just
demonstrates it over a gradient, which is exactly the weaker case the section
exists to improve on. Drop the files in and reload; nothing else changes.

Any aspect ratio works (`background-size: cover`). Keep them modest — a gallery
page is not a place to load 8MB.

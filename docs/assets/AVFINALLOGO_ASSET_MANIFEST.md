# AVFINALLOGO Asset Manifest

## Source and master

| Path | Purpose | Size |
| --- | --- | ---: |
| `source-assets/models/AVFINALLOGO.glb` | Workspace source copy | 73,260,236 bytes |
| `source-assets/models/originals/AVFINALLOGO_original.glb` | Immutable archive copy | 73,260,236 bytes |
| `source-assets/models/blender/AVFINALLOGO_master.blend` | Editable high-resolution master with source maps | 96,832,057 bytes |

## Production GLBs

| Path | Triangles | Vertices after re-import | Materials | Draw calls | Size |
| --- | ---: | ---: | ---: | ---: | ---: |
| `public/assets/models/av-logo-desktop.glb` | 31,998 | 28,939 | 2 | 4 | 238,248 bytes |
| `public/assets/models/av-logo-tablet.glb` | 17,998 | 16,783 | 2 | 4 | 151,416 bytes |
| `public/assets/models/av-logo-mobile.glb` | 8,999 | 9,024 | 2 | 4 | 91,712 bytes |
| `public/assets/models/av-logo-low.glb` | 3,999 | 4,669 | 2 | 4 | 53,676 bytes |

All production GLBs contain seven named nodes, two mesh objects, a source-detail face material, graphite rear/sidewall material, no animations, and Draco compression. Two source-authored 4K maps are resized per tier (1024/768/512/256 px), transcoded to embedded WebP, and tinted lime/pearl at runtime. The production body is 15.5% of width while the raised trim, recessed panel, and face relief remain at their original physical scale.

## Storyboards

- Desktop: 10 WebP states at 2400 × 1600 in `docs/creative/av-logo-storyboard/desktop/`.
- Mobile: 10 WebP states at 1080 × 1350 in `docs/creative/av-logo-storyboard/mobile/`.
- Total storyboard payload: 2,249,128 bytes.

## Public fallback images

Nine WebP assets are in `public/assets/images/av-logo-fallbacks/`:

- `hero-desktop.webp`
- `hero-mobile.webp`
- `activated-logo.webp`
- `av-separated.webp`
- `layer-expanded.webp`
- `portfolio-frame.webp`
- `data-state.webp`
- `background-mark.webp`
- `final-reassembled.webp`

Total fallback payload: 1,521,916 bytes.

## Research evidence

- `DESIGN.md`
- `docs/assets/ITHACA_HERO_REFERENCE.md`
- `.firecrawl/ithaca-hero-browser.png`
- `.firecrawl/ithaca-mobile-hero-browser.png`
- `.firecrawl/ithaca-mobile-transition-browser.png`
- Public Ithaca scene/model/CSS evidence saved under `.firecrawl/`.

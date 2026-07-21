# Hero Component Map

| Component | Purpose |
| --- | --- |
| `AscendHero` | Owns quality selection, WebGL fallback, pointer surface, visibility, and shared runtime refs. |
| `AscendHeroCanvas` | Creates the single R3F Canvas and renderer policy. |
| `AscendHeroScene` | Composes camera, lights, starfield, rock field, orb, and logo. |
| `AscendLogoPointerRig` | Separates scroll, pointer, and idle transforms around the optimized GLB. |
| `AscendParticleOrb` / `AscendOuterHalo` | Render the primary Fibonacci shell, brighter secondary rim, and sparse pearl-lime signal nodes. |
| `AscendStarfield` | Composes three depth layers of deterministic stars. |
| `AscendBackgroundParticles` | Dense, cool-white 3D dust volume adapted from the supplied particle component without creating a second renderer. |
| `AscendRockField` | Renders the sparse, faceted 3D asteroid belt as three instanced geometry families. |
| `AscendPointerLighting` | Moves a restrained key light with the cursor. |
| `AscendHeroWordmark` | Accessible, outlined Ethnocentric-based chrome wordmark rendered from the standalone SVG export. |
| `AscendSceneHandoff` | Empty, aria-hidden timeline receiver for the later scene state. |

The Canvas is mounted once. Scene evolution is uniform- and transform-driven rather than route- or component-swapping.

# Hero Architecture

## Repository boundary

- Root: `/Users/tommy/Documents/2026 Portfolio Site`
- Branch: `main` (unborn; no commits yet)
- Route: `/` only
- Development URL: `http://localhost:3005`
- Canvas lifetime: one persistent React Three Fiber Canvas across the hero narrative and final field state

## Runtime hierarchy

```text
AscendHero
├── HeroInteractionSurface
│   ├── AscendHeroCanvas
│   │   └── AscendHeroScene
│   │       ├── DeepStarfield
│   │       ├── BackgroundParticleVolume
│   │       ├── MidStarfield
│   │       ├── NearStarfield
│   │       ├── AscendRockField
│   │       ├── BackgroundAtmosphere
│   │       ├── ParticleTransitionRig
│   │       │   ├── AscendParticleOrb
│   │       │   ├── AscendOuterHalo
│   │       │   └── AscendAtmosphere
│   │       ├── LogoScrollRig
│   │       │   └── LogoPointerRig
│   │       │       └── LogoIdleRig
│   │       │           └── AscendLogo
│   │       └── AscendPointerLighting
│   └── AscendHeroWordmark
└── AscendSceneHandoff
```

## Ownership boundaries

| Layer | Sole responsibility | Input |
| --- | --- | --- |
| `HeroScrollRig` / scene narrative rig | Camera pullback, dominant scene scale/position, orb expansion/morph/dissolve, interaction fade | Normalized `scrollProgress` ref from ScrollTrigger |
| `LogoScrollRig` | Major logo narrative scale, position, rotation | Scroll only |
| `LogoPointerRig` | Restrained yaw/pitch and X/Y translation | Damped shared pointer only |
| `LogoIdleRig` | Small float and rotational breathing | Elapsed time only |
| `AscendPointerLighting` | Lagged studio-light position and strength | Damped shared pointer and interaction fade |
| Particle shaders | Breathing, waves, rim, field morph, seeded dissolve | `uTime` plus `uScrollProgress` |
| Background particle field | Static fullscreen 3D point volume with camera-like pointer perspective | Pointer, quality tier, reduced motion |
| Star shaders | Looping depth movement and deterministic twinkle | `uTime`, pointer parallax, scroll interaction fade |
| `AscendRockField` | Large faceted asteroid orbit, local spin, depth placement, and subtle parallax | Elapsed time, pointer, quality tier, reduced motion |
| Empty DOM receiver | Preserves the scene handoff attachment point without rendering visible copy | GSAP timeline driven by the same ScrollTrigger |

No two systems write the same transform. R3F provides the only frame loop. ScrollTrigger writes normalized story progress but never advances shader time.

## Data flow

```text
Pointer events ──> shared refs ──> damped pointer ──┬─> logo rig
                                                   ├─> light rig
                                                   └─> star uniforms

Normal document scroll ──> Lenis ──> ScrollTrigger ──> scrollProgress ref
                                                        ├─> scene uniforms
                                                        ├─> camera/rig transforms
                                                        └─> empty handoff receivers

R3F useFrame ──> elapsed time ──> uTime on the independently animated procedural systems
```

## Canvas and DOM layering

- The Canvas is fixed inside the pinned visual stage and marked decorative.
- The complete hero wrapper is the pointer surface.
- The only visible DOM copy is the outlined `ASCEND VANTA` SVG wordmark integrated along the lower edge of the WebGL composition.
- The scene-two receiver remains empty and aria-hidden while retaining a stable GSAP attachment point.
- Stars and primary particles are never remounted at the scene boundary.

## Fallback strategy

- WebGL unavailable or explicitly disabled: optimized WebP hero image with an empty decorative alt, preserving the no-copy composition.
- Reduced motion: live but greatly reduced scene when WebGL is available; short scale/opacity handoff; static fallback remains available.
- Loading: the dark stage renders immediately while the client scene loads.

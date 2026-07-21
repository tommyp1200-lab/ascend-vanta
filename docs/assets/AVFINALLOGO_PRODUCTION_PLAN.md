# AVFINALLOGO Production Plan

## Direction

The later Ithaca hero study changes the implementation strategy without changing the Ascend identity. Ithaca's public hero logo is only 2,720 triangles; its visual impact comes from runtime point fields, shaders, bloom, pointer response, and normalized scroll state. Ascend follows that performance model while retaining two logo meshes so the A and V can separate and reassemble.

No robot, character anatomy, machinery, spherical core, or Ithaca logo geometry is used.

## Production hierarchy

```text
AV_Logo_Root
├── A_Root
│   └── A_Primary
├── V_Root
│   └── V_Primary
├── AV_ParticleField_Anchor
└── AV_Portfolio_Frame_Anchor
```

- `A_Primary` and `V_Primary` are the only renderable meshes.
- The A/V split follows the actual empty gap in the supplied monogram.
- `AV_ParticleField_Anchor` and `AV_Portfolio_Frame_Anchor` are runtime-only empties.
- A and V keep independent bounds-centered pivots for restrained separation.
- All public exports contain seven nodes, two meshes, three materials, and four expected draw calls.
- Physical depth is normalized to 15.5% of logo width, closely matching the Ithaca hero mark's approximately 15.7% depth ratio.

## Materials

The editable master contains:

- `MAT_AV_Graphite`
- `MAT_AV_BlackChrome`
- `MAT_AV_BrushedMetal`
- `MAT_AV_AscendLime`
- `MAT_AV_PearlWhite`
- `MAT_AV_WireframeReference`

Public GLBs export only the used `MAT_AV_AscendLime`, `MAT_AV_PearlWhite`, and `MAT_AV_Graphite` materials. The camera-facing A uses the supplied final brand lime `#CFFF04`; the camera-facing V uses a clean near-white; their rear planes and sidewalls use graphite to make the enlarged extrusion legible. This removes both 4096² source textures while preserving the approved two-color identity on the front silhouette.

## Geometry tiers

| Tier | Triangles | File size | Use |
| --- | ---: | ---: | --- |
| Desktop | 31,998 | 152,880 bytes | Full hero with desktop particles/bloom |
| Tablet | 17,998 | 97,048 bytes | Reduced field and post-processing |
| Mobile | 8,999 | 58,120 bytes | No pointer reaction; reduced points |
| Low | 3,999 | 33,776 bytes | Low-power / constrained WebGL |

These are deliberately below the original range guidance. The later requirement to behave like the Ithaca hero and the mandatory full web compression make lower counts preferable, and all four tiers passed bounds and visual silhouette validation.

## Compression

- KHR Draco mesh compression at level 10.
- Position quantization: 14 bits.
- Normal quantization: 8 bits.
- No UV attributes or texture payload in public tiers.
- No animation, cameras, lights, hidden duplicates, preview geometry, or unused materials in public tiers.

## Motion ownership

Blender owns:

- Editable A/V pivots and hierarchy.
- State guides and assembled-transform references.
- Storyboard and fallback renders.

GSAP / ScrollTrigger owns:

- Hero progress, root scale, root Z recession, root position, and rotation.
- A/V separation and exact reassembly.
- HTML typography and section timing.

Three.js / React Three Fiber owns:

- Runtime point field and stars.
- Bloom, wireframe, scan, point, dissolve, and selective lime activation.
- Responsive camera and device-tier behavior.

## Hero reference contract

- Root scale: `1 → 0` during the hero exit.
- Root Z: `0 → -1 normalized scene unit`.
- Logo alpha: `pow(1 - progress, 5)`.
- Desktop pointer damping: approximately `0.1`, clamped to a restrained Ascend tilt.
- Mobile pointer response: disabled.
- Desktop point budget: approximately 24k–32k.
- Mobile point budget: approximately 6k–8k.

The point field must follow the A/V diagonals and negative spaces. It must not form an Ithaca-like spherical emblem.

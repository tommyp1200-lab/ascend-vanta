# AVFINALLOGO Validation

Validation date: 2026-07-13  
Blender: 5.1.2

## Result

All four public GLBs pass Blender re-import, hierarchy, material, compression, bounds, and visual silhouette checks.

Palette validation also passes: both presentation faces use the compressed source-authored detail maps, with runtime `#CFFF04` tint on `A_Primary` and pearl-white tint on `V_Primary`. Rear and extended sidewall faces use `MAT_AV_Graphite`.

## Automated checks

| Check | Desktop | Tablet | Mobile | Low |
| --- | --- | --- | --- | --- |
| Draco decode | Pass | Pass | Pass | Pass |
| Mesh count = 2 | Pass | Pass | Pass | Pass |
| Material count = 2 | Pass | Pass | Pass | Pass |
| Stable seven-node hierarchy | Pass | Pass | Pass | Pass |
| Animation clips = 0 | Pass | Pass | Pass | Pass |
| Embedded tiered WebP maps | 1024 px | 768 px | 512 px | 256 px |
| Expected draw calls = 4 | Pass | Pass | Pass | Pass |

## Bounds comparison

Original dimensions: `1.000000 × 0.038472 × 0.613672`. Production geometry targets `1.000000 × 0.155000 × 0.613672`, increasing physical depth from 3.85% to 15.5% of width to align with Ithaca's approximately 15.7% proportion.

| Tier | Dimensions after re-import |
| --- | --- |
| Desktop | `0.999752 × 0.154992 × 0.613476` |
| Tablet | `1.000344 × 0.154941 × 0.613717` |
| Mobile | `1.000372 × 0.154808 × 0.613838` |
| Low | `1.001353 × 0.155007 × 0.612712` |

The re-imported tiers retain approximately 15.47%–15.50% depth after decimation and Draco quantization. Front silhouette deviations remain below approximately 0.2% of overall width/height.

## Visual review

Validation renders are in `docs/assets/av-logo-validation-renders/`.

- Front silhouette: pass on all tiers.
- A/V gap and relationship: pass on all tiers.
- Raised perimeter trim, recessed face, and original-scale etched relief: retained.
- Rear/side thickness: rebuilt as a clean 15.5% body; progressively more faceted on mobile and low.
- Three-quarter reflective read: pass.
- Logo recognition: immediate on all tiers.
- Low tier limitation: visible broad faceting under close, hard reflections. Use it at smaller screen coverage or as a constrained-device fallback.
- Source-authored face maps are tiered and embedded as WebP; runtime physical materials add restrained clearcoat and smooth reconstructed normals.

Non-manifold edges remain after decimation because the source is a fragmented scan/conversion mesh. The GLBs render and decode correctly, but they should not be used for solid modeling, booleans, or physics collision.

## Browser status

The detailed desktop GLB was verified in the live WebGL hero at center, cardinal, and diagonal cursor positions. The rotation crosses both axes, the graphite extrusion stays visible, the lime/pearl palette remains stable, and no secondary text or UI is rendered in the hero.

Machine-readable validation data: `docs/assets/AVFINALLOGO_VALIDATION_DATA.json`.

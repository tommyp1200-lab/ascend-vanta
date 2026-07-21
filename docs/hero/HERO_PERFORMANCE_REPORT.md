# Hero Performance Report

## Asset budgets

| GLB tier | Size |
| --- | ---: |
| Desktop | 238,248 bytes |
| Tablet | 151,416 bytes |
| Mobile | 91,712 bytes |
| Low | 53,676 bytes |

The logo assets use simplified geometry, Draco compression, quantized normals/positions, and tier-specific embedded WebP maps. This retains the raised trim and etched face character while keeping every delivered tier below 240 KB. Procedural points replace large particle textures. The former square-grid plane and shader have been removed entirely.

## Runtime policy

- One Canvas and one R3F frame loop.
- The orb uses three procedural point passes: the structural shell, the sparse outer halo, and one lightweight signal-node pass. The added node budget is explicitly tiered from 120 to 2,200 points and allocates no textures.
- The rock layer uses three shared faceted geometries and a maximum of three instanced draw calls; sparser tier counts range from 4 to 18 rocks.
- The supplied background particle effect is folded into the existing Canvas as one shader-driven draw call, with deterministic tier counts from 2,500 to 25,000 and no sprite texture allocation.
- Visibility-aware `frameloop`; rendering stops when the narrative is well outside the viewport or the document is hidden.
- DPR and effects are capped per device tier.
- Full-frame bloom is omitted; atmosphere is disabled on mobile and low.
- Shared mutable refs prevent React rerenders on pointer, scroll, and shader-time updates.

Final verification passed type checking, linting, production compilation, desktop/mobile overflow checks, single-Canvas checks, reduced-motion mode, and static fallback checks.

## Dependency audit

`npm audit` reports no high or critical issues. It reports two moderate entries for Next.js's transitive PostCSS version (`GHSA-qx2v-qp2m-jg93`). npm's proposed remedy incorrectly downgrades Next.js to 9.3.3, so no forced or breaking audit fix was applied.

# DESIGN.md: Ithaca Hero Motion Reference for Ascend Vanta

## Source

- URL: https://www.ithacaprotocol.io/
- Capture date: 2026-07-13
- Evidence: live desktop/mobile browser inspection, public JS/CSS bundles, public glTF manifest, runtime asset inventory, and scroll-state screenshots
- Local evidence: [desktop hero](./.firecrawl/ithaca-hero-browser.png), [full page](./.firecrawl/ithaca-full-page-browser.png), [mobile hero](./.firecrawl/ithaca-mobile-hero-browser.png), [mobile transition](./.firecrawl/ithaca-mobile-transition-browser.png)

## Reference Screenshot

![Ithaca desktop hero](./.firecrawl/ithaca-hero-browser.png)

Use this reference for motion layering and spatial hierarchy only. Do not copy Ithaca's logo, name, text, spherical emblem, or exact visual identity.

## Design Summary

The hero is a full-viewport, layered WebGL composition. A lightweight metallic logo sits in front of a deforming point-cloud field, a technical grid, and a star field. Scroll does not rely on a large animated model: it drives a small set of normalized state values that shrink, recede, and rapidly fade the logo while the surrounding point systems dissolve and reform into the next section's visual.

For Ascend Vanta, keep the A/V monogram as the unmistakable focal object. Use a non-spherical, asymmetric lime particle field behind and around it so the experience has equivalent depth and transition energy without resembling Ithaca's spherical emblem.

## Observed Motion System

- React Three Fiber / Three.js scene with a glTF logo.
- GSAP ScrollTrigger, ScrollSmoother, SplitText, and a smooth-scroll layer.
- Full-screen WebGL canvas with bloom post-processing.
- The logo group responds subtly to the pointer on desktop and does not react on mobile.
- The logo disappears through three synchronized channels: scale `1 → 0`, Z recession `0 → -1 scene unit`, and shader alpha `(1 - progress)^5`.
- The particle field is a separate GPU point system. It is not part of the logo model.
- Desktop point field: approximately 32,400 points, radius 5.5, point size 6, pointer response enabled.
- Mobile point field: approximately 8,100 points, radius 2.75, point size 4, pointer response disabled.
- Bloom settings observed in the public scene bundle: intensity 3.5, very-large kernel, luminance threshold 0.2, smoothing 0.001.
- Hero copy exits per character using opacity, scale, X rotation, and Z translation while the 3D scene recedes.
- The first transition turns the hero field into a sparse stream, then a new particle loop becomes the visual bridge into Mission.

## Reference Logo Payload

The public Ithaca logo manifest describes:

- 2,896 vertices
- 2,720 triangles
- One mesh
- One material
- One WebP texture
- 108,992-byte geometry buffer

This is the key performance lesson: visual richness comes from runtime shaders and particles, not logo triangle density.

## Ascend Vanta Application

### Required logo hierarchy

```text
AV_Logo_Root
├── A_Root
│   └── A_Primary
├── V_Root
│   └── V_Primary
├── AV_ParticleField_Anchor
└── AV_Portfolio_Frame_Anchor
```

- `AV_Logo_Root`: pointer tilt, hero scale, Z recession, and global visibility.
- `A_Root` / `V_Root`: restrained separation and reassembly only.
- `A_Primary` / `V_Primary`: lime/white front primitives plus graphite rear/sidewall primitives, four draw calls total, with a shared fade-uniform contract.
- `AV_ParticleField_Anchor`: runtime-only point field origin; never exported with baked points.
- `AV_Portfolio_Frame_Anchor`: reference for later project-media transitions.

### Runtime uniforms

- `uLogoOut`: scale and Z recession progress.
- `uLogoAlphaOut`: alpha curve using `pow(1.0 - progress, 5.0)`.
- `uActivation`: selective Ascend Lime edge/rear pulse.
- `uDataState`: material-to-wireframe/point transition.
- `uReassembly`: guarantees exact return to the approved assembled transforms.

### Desktop behavior

- Pointer target: about `±0.67 rad` maximum input mapping, heavily damped; use a safer visible clamp of `±0.12 rad` for Ascend.
- Damping/lerp: approximately 0.1 per frame.
- 24k–32k surrounding points is sufficient at desktop scale.
- Cap device pixel ratio at 2.
- Keep the model itself near 24k–32k triangles unless silhouette validation proves a lower tier is acceptable.

### Mobile behavior

- Disable pointer response.
- Use 6k–8k surrounding points.
- Use the mobile GLB at approximately 8k–10k triangles.
- Reduce bloom and particle point size to prevent overexposure.
- Preserve the centered A/V read before copy; do not let the particle field obscure the logo gap.

## Design Tokens

### Colors

- Background: near-black navy, approximately `#010512` (observed in CSS).
- Primary text: off-white, approximately `#F9F9F9`.
- Ascend accent: `#CFFF04` (project identity; replaces Ithaca green).
- Logo: Ascend Lime A (`#CFFF04`) and pearl-white V with restrained reflective highlights.
- Grid: low-alpha slate with sparse lime activations.

### Typography

The reference uses Aeonik family files and large, tight display type. For Ascend, retain the site's own type identity while adopting the same hierarchy: compact neon wordmark, large two- or three-line hero statement, and individually animated character spans.

### Spacing And Layout

- Hero: exactly `100vh`.
- WebGL layer: full viewport and visually behind HTML content.
- Copy: lower third on desktop; below the logo field on mobile.
- Navigation: floating translucent capsule with subtle border and blur.
- Bottom mask: fixed dark gradient/blur to merge the WebGL field into page content.

## Agent Build Instructions

1. Load the appropriate Ascend GLB tier and attach both A/V materials to the same shader-uniform controller.
2. Place the particle field at `AV_ParticleField_Anchor`; do not add the field to the GLB.
3. Drive hero progress through normalized scroll state. Keep Blender animation out of the primary hero exit.
4. On exit, ease `uLogoOut 0 → 1`, set root scale `1 → 0`, move the root backward one normalized scene unit, and set alpha with the fifth-power curve.
5. Simultaneously dissolve the particle field into the next section's particle topology.
6. Use GSAP SplitText for HTML copy; never bake hero typography into Blender renders.
7. Respect `prefers-reduced-motion`, device memory, and WebGL capability. Serve the prepared fallback renders when necessary.
8. Keep the A/V monogram recognizable at every intermediate state and return A/V transforms exactly to their recorded assembled values.

## Rerun Inputs

```yaml
workflow: firecrawl-website-design-clone
source_url: https://www.ithacaprotocol.io/
target_stack: React Three Fiber + GSAP ScrollTrigger
output: DESIGN.md
```

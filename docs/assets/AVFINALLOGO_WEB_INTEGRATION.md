# AVFINALLOGO Web Integration

## Asset selection

Select before loading:

| Condition | Asset |
| --- | --- |
| Desktop, capable GPU | `/assets/models/av-logo-desktop.glb` |
| Tablet / medium capability | `/assets/models/av-logo-tablet.glb` |
| Mobile | `/assets/models/av-logo-mobile.glb` |
| Low device memory / low power | `/assets/models/av-logo-low.glb` |
| Reduced motion / no WebGL | `/assets/images/av-logo-fallbacks/hero-*.webp` |

The GLBs use `KHR_draco_mesh_compression`; configure a local Draco decoder before loading. Do not fetch all tiers and choose afterward.

## Stable runtime nodes

- `AV_Logo_Root`: all global hero transforms and visibility.
- `A_Root`: A-only separation/depth offsets.
- `V_Root`: V-only separation/depth offsets.
- `A_Primary`: `MAT_AV_AscendLime` (`#CFFF04`) front plus `MAT_AV_Graphite` rear/sidewalls.
- `V_Primary`: `MAT_AV_PearlWhite` front plus `MAT_AV_Graphite` rear/sidewalls.
- `AV_ParticleField_Anchor`: origin for runtime point geometry.
- `AV_Portfolio_Frame_Anchor`: later project-media framing reference.

## Shader contract

Apply the same uniform controller to both logo materials:

```glsl
uniform float uLogoAlphaOut;
uniform float uActivation;
uniform float uDataState;

float logoAlpha = pow(max(1.0 - uLogoAlphaOut, 0.0), 5.0);
gl_FragColor.a *= logoAlpha;
```

Runtime material setup should enable transparency only while the fade is active. The reference site disables depth test/write for its foreground logo; Ascend should test that approach against portfolio media and retain depth testing when correct occlusion is required.

## Scroll choreography

Use one normalized hero progress value and derive all channels from it:

```text
0.00  Logo assembled, particle field active, copy visible
0.10  Copy begins per-character 3D exit
0.18  Pointer response damps back to neutral
0.20  Root begins Z recession and scale reduction
0.35  Shader alpha enters fifth-power falloff
0.55  Logo is no longer visually dominant
0.75  Particle field becomes the transition carrier
1.00  Next section particle topology is established
```

Do not bake this into the GLB. GSAP controls transforms and HTML; the render loop reads normalized state into shader uniforms.

## Pointer behavior

- Desktop only.
- Clamp final visible X/Y tilt to approximately ±0.12 radians.
- Lerp/damp around 0.08–0.12 per frame.
- Return to zero before the logo fades.
- Disable on touch/mobile and under reduced motion.

## Particle field

- Generate as `THREE.Points` or an equivalent GPU buffer system.
- Cap DPR at 2.
- Desktop: 24k–32k points.
- Mobile: 6k–8k points.
- Prefer circular point sprites with soft alpha and bloom.
- Shape the field along the A/V diagonals; keep the central gap readable.
- Never include particle geometry in the GLB.

## Performance and fallback

- Four logo draw calls are expected: one front and one graphite primitive per A/V mesh.
- Particle field should remain one draw call; stars should remain one draw call.
- Bloom is the highest-cost hero pass. Reduce or remove it on mobile/low tiers.
- Pause animation when the canvas is not visible.
- Respect `prefers-reduced-motion` and swap to the supplied WebP renders.
- Release geometries, materials, and decoder resources when the route unmounts.
- Preload only the selected tier; the desktop GLB is approximately 149 KiB.

## Exact reassembly

Record A/V assembled position, rotation, and scale immediately after load. All separated states must tween back to those stored values rather than assumed zeroes. The master includes assembled-transform metadata as object extras.

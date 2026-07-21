# Ithaca Hero Technical Reference

Captured 2026-07-13 from the public site at https://www.ithacaprotocol.io/.

## Collection status

Firecrawl was attempted first as requested. Direct scrape was blocked by the site and the crawl job was rate-limited before it returned a page. The research therefore continued with a live rendered browser inspection and read-only downloads of the site's public hero assets. The local `.firecrawl/` folder contains the resulting evidence.

## Confirmed implementation details

- The hero uses Three.js through React Three Fiber.
- The scene loads `logo_Ithaca/3D_logo_Ithaca.gltf` and a single WebP texture.
- The logo model is 2,896 vertices / 2,720 triangles.
- The runtime changes the logo material to transparent, disables depth test/write, sets roughness to 0.6 and metalness to 0.8, and injects a `logoOut` alpha uniform.
- The root logo group scales down and moves backward as the scroll state exits the hero.
- Logo alpha uses a fifth-power falloff, which makes the visual disappear quickly and cleanly.
- Desktop pointer movement is damped into X/Y rotation; mobile disables this response.
- A separate custom-shader point field supplies the green perimeter, distortion, and dissolve behavior.
- A separate universe/star particle system carries continuity between sections.
- Bloom is applied as post-processing rather than baked into the logo texture.
- Smooth scrolling is synchronized to ScrollTrigger; text is split into characters/words for 3D exits and reveals.

## Captured state vector

The public main bundle maps cumulative section progress from 0 through 8 into a state object containing:

`blobOut`, `logoOut`, `logoAlphaOut`, `blobNextSection`, `blobSectionFour`, `universeIn`, `universeOut`, `universeScale`, `blobPosY`, `blobMobilePosY`, `blobPosX`, and `gridOut`.

At the first transition, the hero moves from all-zero values to:

```text
blobOut: 1
logoOut: 1
logoAlphaOut: 1
universeIn: 1
universeScale: 0.4
gridOut: 1
```

This confirms that the hero exit is a coordinated state transition, not a baked GLB animation.

## Ascend production consequence

The Ascend logo should be materially simpler than its 1.95-million-triangle source. Two mesh objects are justified only because A/V separation is an explicit project requirement. Everything else—the lime field, dissolve, stars, scanning grid, bloom, and section-to-section particle morph—belongs at runtime.

The reference sphere itself will not be copied. Ascend will use an asymmetric field that follows the A/V negative spaces and diagonal energy flow.

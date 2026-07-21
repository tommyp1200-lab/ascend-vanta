# Ascend Vanta — Performance Audit and Budget

Audit scope: loading, JavaScript/CSS, images, numbered frames, WebGL, render loops, scroll work, memory risk, and production validation. No implementation was changed.

## Performance verdict

The site is visually sophisticated but presently spends premium-device resources as if every section were the hero. The biggest issue is not one oversized file; it is overlapping systems with long lifetimes: a fixed WebGL scene, multiple continuous frame loops, Lenis and GSAP tickers, a long pinned horizontal section, a 184-frame canvas sequence, CSS keyframes, a moving gallery, and large publication/image sets.

The optimized build succeeds, but a successful build is not a performance guarantee. The immediate goal should be to make work section-scoped and demand-driven.

**Performance readiness: 4.1 / 10**

## Observed inventory

| Item | Observed value | Risk |
|---|---:|---|
| `public/` payload | ~25 MB / 268 files | A large potential lifetime payload for a one-page site |
| Optimized static chunks | ~2.2 MB uncompressed | High script parse/compile potential; verify compressed route cost |
| Largest JS chunk | ~660 KB uncompressed | Main-thread parse/evaluation concentration |
| Other large chunks | ~368 KB, 224 KB, 192 KB, 128 KB ×2 | Framework/3D/animation fragmentation adds overhead |
| Global CSS | ~92 KB build output; source CSS 4,569 lines | Broad invalidation and difficult section ownership |
| Numbered GIF frames | 184 files / ~9.2 MB | Immediate network, decode, and memory pressure |
| Prompt gallery | 35 WebPs / ~3.07 MB | Late-page cost, all images marked `unoptimized` |
| Publication pages | ~2.65 MB | Reader should load only current/adjacent spreads |
| Robot GLB | ~3.08 MB | Large hero dependency with geometry/material/texture memory cost |
| Ecosystem images | ~0.48–0.82 MB each | Five near-full-screen alpha artworks need proximity loading |
| Clean live top-level load | ~250 observed assets, ~209 images | Confirms frame loader begins before the sequence is near view |
| High WebGL particles | 52k core + 6k halo + 2.2k orb + 25k background + 10.2k stars | Fill-rate, buffer, and mobile thermal risk |
| High rock count | 18 | Additional draw calls/geometry throughout hero canvas lifetime |
| High quality DPR cap | 1.8 | Pixel cost grows rapidly on large/high-DPR screens |

The live server exposed development tooling. Asset counts above reveal behavior, not a production transfer-size claim. Bundle figures come from the successful optimized build.

## Critical findings

### P0. Sequence loading starts at page entry

`VantaFrameSequence.tsx` loads frame 0 and then begins a six-concurrent queue for every remaining image. Nearby-frame prioritization exists, but the background queue never waits for section proximity. The result is approximately 9.2 MB of frame images competing with the opening experience.

**Required design**

1. Do not mount the loader until an intersection/preload sentinel is within a bounded distance of the sequence.
2. Load the first display frame first.
3. Maintain a bounded priority window around the requested index.
4. Defer distant frames during active scrolling and important hero/image loads.
5. Cap concurrent decode work based on device memory/hardware concurrency.
6. Release object/image references that will not be revisited soon if memory profiling proves necessary.

### P0. Hero rendering persists below the hero

The hero canvas is fixed and uses an always-running frame loop when the document is visible. Component-level intersection gating enables Vanta, but the entire canvas and many `useFrame` systems remain active. This can keep particles, rocks, lighting, robot state, star layers, and scene transforms updating through a document tens of thousands of pixels long.

**Required design**

- Switch to demand rendering or fully suspend after hero exit.
- Separate a cheap persistent background from hero-only 3D systems.
- Stop individual loops when invisible, not only when the tab is hidden.
- Dispose large hero-only resources when unmounted and verify reverse re-entry.

### P0. Quality is selected once

Quality is based on initial URL, hardware, and viewport. It does not adapt when the viewport changes, DPR changes, reduced motion changes, the renderer becomes expensive, or device conditions deteriorate.

**Required design**

- Use one reactive quality governor.
- Include breakpoint, DPR, measured frame time, visibility, reduced motion, and battery/thermal-safe fallback signals where supported.
- Change tiers only at safe narrative boundaries to avoid visual popping.

### P0. Global smooth-scroll work conflicts with deterministic frames

Lenis continues to settle after wheel input, while the numbered sequence promises to freeze on the exact current frame. The observed sequence moved after input ended. This is both a UX defect and unnecessary animation work.

**Required design**

- Suspend or bypass smooth-scroll interpolation while the sequence owns the viewport.
- Keep `scrub: true`, not a numeric scrub, for direct progress.
- Render only when the rounded frame index changes.

## WebGL and GPU assessment

### Current risks

- High particle counts plus DPR 1.8 on 2560×1440 can create a very large fragment workload.
- Alpha is disabled for the hero canvas, which is good for compositing cost, but the canvas remains a full-viewport fixed layer.
- `<Preload all>` front-loads scene dependencies.
- Numerous independent `useFrame` callbacks make visibility control and frame-time attribution harder.
- Post-hero CSS/DOM animation continues while the canvas remains alive.
- Large transparent ecosystem imagery adds overdraw above animated backgrounds.

### Recommended render architecture

1. **Background layer:** one cheap star/atmosphere renderer, paused outside visible story areas if a CSS/static fallback is sufficient.
2. **Hero scene:** mounted only for hero proximity; demand/limited rendering during stable reading beats.
3. **Editorial galaxy:** section-scoped and unmounted outside its region.
4. **DOM/canvas sequence:** no simultaneous hero-quality 3D unless visually essential.
5. **Central scheduler:** each section declares `active`, `near`, or `sleeping`; only active systems get per-frame updates.

### Suggested quality tiers

| Tier | DPR cap | Particle strategy | Shadows/post | Activation |
|---|---:|---|---|---|
| Low/mobile | 1.0 | 20–30% of high buffers | No dynamic shadows; minimal effects | Default on memory-constrained/touch devices |
| Standard | 1.25 | 45–60% | Selective effects | Most laptops/tablets |
| High | 1.5 | 70–80% | Carefully budgeted | Proven sustained frame time only |
| Showcase | 1.75 max | Full authored density | Optional, user/device qualified | Never chosen by width alone |

## Image and media assessment

### Ecosystem artwork

- Keep alpha where the site background must show through.
- Provide responsive AVIF/WebP derivatives where alpha/decoder support and quality are acceptable.
- Use intrinsic dimensions and `sizes` that reflect the near-full-screen chapter stage.
- Load the next ecosystem image only as the current statement approaches exit.
- Avoid `unoptimized` unless a documented visual/format requirement makes optimization impossible.

### Numbered frames

The existing numbered GIF set is convenient but not the most decode-efficient sequence format. Preserve one-frame canvas rendering and exact index mapping. Test lossless/lossy WebP or AVIF frame files against source fidelity, decode latency, Safari behavior, and memory. Do not convert the sequence to autoplay video or introduce interpolation.

### Publications

- Initial issue cover + next page/spread only.
- Preload previous/next after idle or user intent.
- Responsive derivatives for the actual reader size.
- Retain crisp type; use quality checks on small text before lowering compression.

### Prompt gallery

- Add accurate `sizes` and optimized derivatives.
- Lazy-load by actual path proximity, not only DOM presence.
- Pause the marquee out of view.
- Consider a smaller first collection with progressive reveal of the rest.

## JavaScript and CSS assessment

### Current stack

- Next.js/React
- GSAP + ScrollTrigger + `@gsap/react`
- Lenis
- Motion
- Three.js + React Three Fiber + Drei
- CSS keyframes and transitions

All are capable tools. The cost comes from overlapping ownership. A single visual may be affected by React render state, GSAP transforms, Lenis scroll interpolation, CSS animation, and R3F frame updates.

### Recommendations

- Keep GSAP/ScrollTrigger for authored scroll timelines.
- Keep R3F for the 3D scenes.
- Use Motion only where its component lifecycle materially helps; avoid duplicating GSAP responsibilities.
- Centralize visibility and reduced-motion state.
- Remove global mutations on cleanup, including restoring GSAP ticker lag smoothing.
- Split section CSS to reduce accidental cascade and make unused-style analysis practical.
- Profile route chunks before deleting dependencies; tree-shake or dynamically import by section ownership.

## Performance budgets

These are launch targets, not measurements of the current build.

### Loading budgets

| Metric | Mobile target | Desktop target |
|---|---:|---:|
| Initial compressed JS | ≤ 250 KB | ≤ 350 KB |
| Initial compressed CSS | ≤ 60 KB | ≤ 75 KB |
| Initial media before first interaction | ≤ 1.5 MB | ≤ 2.5 MB |
| Largest initial single asset | ≤ 700 KB | ≤ 1.2 MB |
| Requests before first meaningful hero state | ≤ 45 | ≤ 60 |
| Numbered-frame images before proximity gate | 0 | 0 |

### Runtime budgets

| Metric | Target |
|---|---:|
| Frame budget at 60 Hz | ≤ 16.7 ms total; ≤ 10 ms script + render average |
| P95 active-scroll frame | ≤ 20 ms on representative mid-range hardware |
| Long tasks over 50 ms | 0 during primary scroll interactions |
| Continuous offscreen animation loops | 0 |
| Layout shifts after first paint | CLS ≤ 0.05 |
| Interaction latency | INP ≤ 200 ms, target ≤ 100 ms |
| LCP | ≤ 2.5 s mobile cold cache, target ≤ 2.0 s |
| Frame-sequence redraw | Only when rounded index changes |
| Resize rebuild | No unrelated chapter jump; complete within one frame + scheduled refresh |

### Memory budgets

- Do not retain decoded copies of all full-resolution sequence frames without measurement.
- Keep GPU texture memory below a tested device-specific ceiling; log renderer info in profiling builds.
- Dispose replaced geometries, materials, textures, render targets, and event listeners.
- Validate repeat traversal (down/up/down) for monotonic memory growth.

## Measurement plan

1. Serve the optimized build locally; do not profile the development server.
2. Record cold-cache and warm-cache traces at 375×812, 768×1024, 1440×900, and 2560×1440.
3. Test iPhone Safari, mid-range Android Chrome, integrated-GPU laptop, and discrete-GPU desktop.
4. Mark hero exit, horizontal entry/exit, sequence entry/exit, publication open, and gallery entry in performance traces.
5. Record CPU, GPU, long tasks, JS heap, GPU memory proxy data, and network waterfall.
6. Repeat with reduced motion, background tab/restore, refresh mid-sequence, resize/rotation, fast reverse, and slow scrub.
7. Fail the release if any P0 interaction cannot preserve state at 4× CPU slowdown and a throttled mobile network.

## Optimization order

1. Gate/cancel sequence loading.
2. Suspend hero and editorial 3D out of view.
3. Remove smooth-scroll momentum from deterministic sequence control.
4. Repair refresh/resize lifecycle.
5. Optimize GLB and ecosystem images.
6. Add responsive publication/gallery delivery.
7. Modularize and reduce runtime overlap.
8. Tune particles/DPR from measured frame time.
9. Re-run budgets on production build.

## Release acceptance

- No numbered-frame request occurs from the top of the page.
- Hero GPU/RAF work drops to idle after hero exit.
- Scroll stop means exact sequence-frame stop.
- Three complete down/up traversals show no progressive memory leak.
- Cold-cache mobile LCP and INP meet budget.
- No visual degradation of alpha artwork, embedded UI labels, Vanta, or publication text.

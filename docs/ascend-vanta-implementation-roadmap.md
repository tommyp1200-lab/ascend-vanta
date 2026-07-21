# Ascend Vanta — Implementation Roadmap

This roadmap converts the audit into an ordered production program. It intentionally avoids adding new spectacle before the current experience becomes deterministic, efficient, accessible, and maintainable.

## Guiding principle

**Stability before polish; lifecycle before micro-animation; proof before more content.**

The visual concept is not the problem. The roadmap preserves the art direction while replacing fragile timing and unnecessary persistent work.

## Recommended first improvement

Build the **scroll-state stabilization layer** first:

1. Represent the active experience as `{chapterId, localProgress, frameIndex?}`.
2. Capture it before refresh, resize, breakpoint rebuild, and dynamic-content measurement.
3. Rebuild all affected ScrollTriggers in one transaction.
4. Restore the equivalent logical position once.
5. Isolate the numbered sequence from Lenis momentum so scroll stop means frame stop.

This single foundation addresses the most damaging defects—refresh loss, resize jumps, frame drift, and repeated timing regressions—and makes every later optimization testable.

## Workstream overview

| Phase | Priority | Objective | Typical effort | Release gate |
|---|---|---|---:|---|
| 0. Baseline harness | P0 | Make current behavior reproducible | 1–2 days | Automated/manual matrix can identify chapter/progress |
| 1. Scroll-state stabilization | P0 | Fix refresh, resize, reverse, frame freeze | 4–7 days | All continuity acceptance tests pass |
| 2. Loading/render lifecycle | P0 | Stop early loading and offscreen work | 4–7 days | Initial/runtime budgets substantially met |
| 3. Horizontal pacing rewrite | P1 | Remove dead distance and collisions | 5–8 days | All ten chapter states pass bidirectional QA |
| 4. Responsive/reduced motion | P1 | Create intentional alternate modes | 4–6 days | Six viewports + reduced motion pass |
| 5. Semantics/SEO/controls | P1 | Repair accessible and crawlable spine | 3–5 days | Keyboard, headings, metadata, targets pass |
| 6. Architecture modularization | P2 | Lower regression cost without visual change | 5–10 days | Monolith responsibilities are separated |
| 7. Art-direction polish | P2/P3 | Tune composition, copy density, and transitions | 4–7 days | Creative review + device QA pass |
| 8. Submission validation | P0 gate | Production traces and physical devices | 3–5 days | Go/no-go criteria pass |

Effort is directional and assumes one senior front-end/motion engineer with access to design review. Do not parallelize phases that modify the same scroll lifecycle until Phase 1 is stable.

## Phase 0 — Baseline harness

### Scope

- Add development-only chapter and local-progress instrumentation.
- Define stable IDs for hero beats, principle clusters, ten horizontal panels, frame sequence, reader, gallery, and about.
- Record exact expected states at the six required viewports.
- Add deterministic tests for refresh, resize, sequence stop/reversal, skip, and reader controls.

### Candidate modules

- `src/components/hero/useHeroScrollProgress.ts`
- `src/components/editorial/EditorialScrollSections.tsx`
- `src/components/editorial/VantaFrameSequence.tsx`
- New test-only utilities, without production UI.

### Acceptance

- Test runner can report active chapter/local progress without inspecting transforms manually.
- Current P0 defects reproduce consistently.
- Instrumentation is removed or compile-gated in production.

## Phase 1 — Scroll-state stabilization

### Scope

- Create one owner for Lenis + ScrollTrigger lifecycle.
- Replace scattered delayed refreshes with one refresh coordinator.
- Capture logical progress before breakpoint/resize teardown.
- Restore after fonts, dynamic imports, and necessary media measurements settle.
- Restore GSAP global ticker settings on cleanup.
- Disable/bypass Lenis interpolation while the frame sequence is active.
- Preserve chapter/frame on reload using history/session state only if browser-native restoration cannot do so reliably.

### Non-goals

- No redesign of visuals.
- No new transitions.
- No change from canvas frames to video.

### Acceptance

- Refresh returns to the same chapter and frame index.
- Resize returns to the same chapter within 2% local progress.
- Reverse input is monotonic and stops immediately with input.
- No double pin spacers, stale triggers, or visible restoration jump.

## Phase 2 — Loading and render lifecycle

### Scope

#### Frame sequence

- Proximity-gate loader activation.
- First-frame-first and bounded nearby-frame queue.
- Cancel/defer distant work.
- Validate alternate frame formats only if exact quality is preserved.

#### WebGL

- Split cheap persistent atmosphere from hero-only scene or use a static/CSS background below hero.
- Suspend/unmount hero loops after exit.
- Suspend editorial galaxy and gallery animation when offscreen.
- Replace width-only quality inference with reactive measured tiering.
- Audit disposal of textures, geometries, materials, render targets, observers, and event listeners.

#### Media

- Correct creative-suite proximity/LCP priority.
- Add responsive optimized variants and accurate `sizes`.
- Optimize robot GLB after visual regression renders.
- Preload only current/adjacent publication spreads.

### Acceptance

- Zero sequence-frame requests from page top.
- Hero per-frame work is idle after hero exit.
- No obvious visual downgrade on high tier.
- Three down/up traversals do not show monotonic memory growth.
- Initial payload and runtime metrics approach the budgets in the performance audit.

## Phase 3 — Horizontal pacing rewrite

### Scope

- Extract chapter data and state ranges from the monolithic component.
- Implement explicit image reveal/read/exit and text entry/read/exit phases.
- Cap physical distance independently of viewport width.
- Put Vanta, answer clearing, and first-image reveal on one timeline.
- Ensure each image is fully offscreen before its statement reaches terminal center.
- Preserve exact artwork line tracing behind embedded panels.
- Keep sound and skip behavior; enlarge their hit areas without increasing visual noise.

### Candidate structure

```text
editorial/
  horizontal/
    chapterData.ts
    chapterProgress.ts
    HorizontalStory.tsx
    HorizontalControls.tsx
    EcosystemPanel.tsx
    StatementPanel.tsx
    useHorizontalTimeline.ts
```

This is a target responsibility map, not a required file count.

### Acceptance

- Zero dead scroll at normal, slow, fast, and reversed input.
- No Vanta/image or image/text collision.
- All five image→text chapters have readable stable states.
- Skip lands cleanly after the horizontal story.
- No CTA is added inside the horizontal sequence.

## Phase 4 — Responsive and reduced-motion modes

### Scope

- Recompute quality, camera, canvas size, and progress mapping on breakpoint/DPR/orientation changes.
- Add mobile and ultrawide scroll-distance caps.
- Reduce the fixed logo to a compact post-hero state.
- Recompose long about/publication layouts for mobile.
- Center bottom progress navigation against safe visual viewport.
- Implement a complete reduced-motion path: native scroll, no continuous pinning, static hero, stacked chapters, representative sequence stills, paused ambient animation.

### Acceptance

- Required six viewports pass without overflow or fixed-content overlap.
- Orientation/resize preserves logical position.
- Reduced motion exposes all content and controls with no long scrub/pin.
- 200% zoom remains readable and operable.

## Phase 5 — Accessibility, semantics, SEO, and controls

### Scope

#### Semantics

- Replace empty H1 with the actual primary proposition.
- Confirm a logical H1→H2→H3 outline.
- Add semantic navigation/project/publication paths without disrupting the cinematic composition.
- Keep canvas decorative with meaningful adjacent text.

#### Interaction

- 44×44 minimum hit areas.
- Strong `:focus-visible` states.
- Focus preservation through reader page turns and responsive rebuilds.
- Keyboard parity for skip, chapter navigation, reader, and gallery.
- Announce only meaningful state changes; avoid noisy `aria-live` updates during scrub.

#### SEO

- Specific title and description focused on Tommy Pisano and Ascend Vanta capabilities.
- Canonical URL.
- Open Graph and Twitter images/metadata.
- Person, WebSite, CreativeWork/Article structured data as applicable.
- Crawlable publication/project URLs or stateful routes with progressive enhancement.
- Sitemap/robots and production metadata validation.

### Acceptance

- One descriptive H1 appears in the accessibility tree.
- Keyboard-only traversal completes all core interactions.
- No target below minimum size.
- Reduced-motion and contrast checks pass.
- Metadata/social preview/schema validators pass.

## Phase 6 — Architecture modularization

### Current pressure points

- `EditorialScrollSections.tsx`: ~2,590 lines.
- `globals.css`: ~4,569 lines.
- Multiple systems independently listen for scroll, visibility, preferences, and resize.

### Scope

- Move chapter content into typed data.
- Separate render components from timeline construction.
- Separate controls from scene choreography.
- Define design/motion tokens once.
- Split CSS by tokens, primitives, and section modules.
- Standardize cleanup/abort semantics for images, RAFs, observers, and event listeners.
- Keep visual output unchanged during the refactor; capture regression states first.

### Suggested responsibility boundaries

| Module | Owns | Must not own |
|---|---|---|
| Scroll coordinator | Lenis, refresh, normalized chapter progress | Chapter markup/art direction |
| Quality governor | DPR/particle/scene tiers | Copy/layout |
| Horizontal story | Chapter state and shared panel timeline | Global page scroll lifecycle |
| Frame sequence | Frame loading/drawing | Smooth-scroll interpolation |
| Section components | Semantic content and local presentation | Global ticker mutation |
| Media service/hooks | Proximity loading, cancellation, decode priority | Visual timeline |

### Acceptance

- No visual/motion regression at captured states.
- Each chapter can be tested independently.
- Cleanup leaves no duplicate triggers/listeners after remount.
- Production bundle does not grow as a result of modularization.

## Phase 7 — Art-direction polish

Only begin after P0/P1 behavior is stable.

### Scope

- Tone down competing logo/hub pulses.
- Refine image aperture edges and depth separation.
- Standardize line-energy velocity and luminance.
- Tighten `CONTENT / CREATION` background typography and gear-glyph optics.
- Center terminal text states.
- Edit repeated copy in the about section.
- Tune persistent logo, progress, sound, and skip hierarchy.
- Add orientation cues only where they solve confusion; no decorative node/circle overlays.

### Acceptance

- Creative review confirms every added element serves hierarchy or comprehension.
- No effect exists solely to fill negative space.
- Foreground copy remains readable over every animated background state.

## Phase 8 — Production and submission validation

### Environments

- Optimized production server, cold and warm cache.
- iPhone Safari.
- Mid-range Android Chrome.
- iPad Safari portrait/landscape.
- Integrated-GPU laptop.
- Desktop/discrete GPU.
- 2560×1440 and ultrawide.

### Required tests

- Six target viewports plus orientation and zoom.
- Slow/fast/reverse/stop at every trigger boundary.
- Refresh and history navigation in every major chapter.
- Resize and reduced-motion preference changes.
- Offline/throttled/partial media failures.
- Keyboard, screen-reader smoke test, and touch-only traversal.
- CPU/GPU/network/memory trace.
- SEO/social/schema validation.

### Go/no-go gates

- All P0 defects closed.
- No post-input sequence drift.
- No unrelated chapter jump on resize/refresh.
- No early sequence loading or offscreen hero frame loop.
- Performance budgets met on agreed representative hardware.
- All primary content accessible without animation, pointer, or WebGL.
- No console errors in production.

## Priority backlog

### P0

- Scroll restoration and resize continuity.
- Exact frame freeze.
- Proximity-gated frame loading.
- Offscreen WebGL suspension.
- Production performance trace and memory verification.

### P1

- Horizontal chapter timing rewrite.
- Complete reduced-motion mode.
- Reactive quality tier.
- H1/navigation/control accessibility.
- Image/GLB/publication/gallery delivery optimization.
- SEO/social/structured metadata.

### P2

- Component/CSS modularization.
- Unified tokens and cleanup conventions.
- Mobile/ultrawide art-direction pass.
- Copy density reduction.

### P3

- Fine optical alignment.
- Ambient glow/line micro-tuning.
- Optional chapter orientation enhancements after usability testing.

## Change-control rules

- One behavior change per measured hypothesis.
- Capture before/after traces and chapter states.
- Do not combine scroll-lifecycle repair with visual redesign in the same review.
- Do not stage, commit, push, branch, or add dependencies without explicit approval.
- Preserve current assets and source files until each replacement is visually validated.

## Final recommendation

Approve Phase 0 and Phase 1 as the first implementation package. Do not begin with cosmetic effects or generalized cleanup. Once state continuity and deterministic scrolling are proven, the rest of the site can be optimized and polished without repeatedly destabilizing its signature moments.

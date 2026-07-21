# Ascend Vanta — Motion System Audit

Audit scope: GSAP/ScrollTrigger, Lenis, Motion, R3F frame loops, CSS animation, pinning, horizontal chapters, the numbered image sequence, reverse scroll, refresh, resize, and reduced motion.

## Motion verdict

The site has strong motion ideas but not yet one motion system. GSAP timelines, ScrollTrigger scrubs, Lenis interpolation, Motion components, CSS keyframes, and R3F `useFrame` loops all operate simultaneously. The visual result can be impressive; the behavioral result is difficult to reason about and fragile when scroll state changes.

The best path is to keep the authored choreography and replace fragmented timing ownership with one normalized narrative state and explicit lifecycle.

**Motion-system readiness: 6.1 / 10**

## Current motion architecture

| Layer | Current responsibility | Risk |
|---|---|---|
| Lenis | Global smooth wheel scrolling | Post-input drift conflicts with exact frame control |
| ScrollTrigger | Hero progress, pinned horizontal story, frame sequence, section reveals | Many refresh-sensitive ranges and mixed scrub strategies |
| GSAP timelines | Multi-panel choreography and Vanta/image/text transforms | Large monolithic timeline is hard to test chapter by chapter |
| Motion | About and gallery component animation | Additional scheduler and reduced-motion logic |
| R3F `useFrame` | Robot, particles, rocks, stars, lights, galaxy | Continuous updates can persist outside narrative relevance |
| CSS animations | Glows, pulses, ambient UI | Independent phase/lifecycle and potential reduced-motion gaps |

## Observed scroll map

At 1440×900:

| Region | Approximate position/length |
|---|---:|
| Hero narrative | `y 0–3285` |
| Mission | around `y 1479`, 972 px section box |
| Principles | around `y 2451`, 2,142 px |
| Orb evolution | around `y 4593`, 1,305 px |
| Horizontal physical section | begins around `y 4998`; pin extends the effective narrative |
| Horizontal effective exit | around `y 20,615` |
| Numbered frame sequence | around `y 20,615`, 900 px pinned viewport plus 1,464 px trigger distance |
| Editorial archive | around `y 22,979`, 2,269 px |
| Prompt gallery | around `y 25,248`, 900 px |
| About | around `y 26,148`, 4,109 px |

Horizontal configuration uses a duration basis of 4.1, a desktop multiplier of 10.22, minimum desktop distance of 8,900 px, and minimum mobile distance of 6,200 px. At 1440 px width, the horizontal act consumes roughly 15,600 px of effective document movement.

## Critical behavioral defects

### 1. Refresh does not restore narrative state

Observed inside the numbered sequence:

- Before refresh: approximately `scrollY 21040`, frame 53.
- After refresh: approximately `scrollY 8654`, frame 0.
- The location remained wrong after the page settled.

This points to an ordering problem among native scroll restoration, initial layout, dynamic imports, fonts/assets, pin spacer creation, and repeated `ScrollTrigger.refresh()` calls.

**Required model:** store logical `{chapterId, localProgress}` separately from raw `scrollY`; after layout stabilizes, map it back once and suppress competing restoration/refresh actions.

### 2. Resize jumps between unrelated chapters

Observed sequence:

- Desktop archive view around `scrollY 24158`.
- Resize to 430×932 moved the same raw position into the about section.
- Resize back to 1440×900 placed the reader in the numbered-frame sequence.

**Required model:** capture logical progress before teardown, rebuild responsive ranges, resolve the equivalent scroll position after refresh, then render.

### 3. Frame sequence continues after input stops

Observed while reversing:

- Frame 106 at one position.
- Reverse input reached frame 61.
- Without new input, Lenis continued to settle and the sequence moved to frame 53.

The frame component itself correctly rounds progress and redraws on index change. The conflict is upstream: interpolated scroll position continues changing.

**Required model:** deterministic native scroll or zero-momentum input while the sequence is pinned. Keep `scrub: true`.

### 4. Horizontal timing is width-derived, not content-derived

Each chapter has real content needs—reveal, read, exit—but a broad multiplier determines total distance. This makes pacing sensitive to viewport width and encourages manual percentage tuning.

**Required model:** sum explicit chapter ranges in viewport-independent narrative units, then convert once to physical scroll distance with sensible min/max caps.

## ScrollTrigger assessment

### Strengths

- Cleanup is generally scoped through React/GSAP context patterns.
- The frame sequence uses `scrub: true` and only redraws on frame-index change.
- Pinning enables a cohesive horizontal story without document overflow.
- The horizontal experience includes skip, sound, pointer, and keyboard intent handling.

### Risks

- Numeric scrubs vary across the site (`0.16`, `0.2`, `0.32`, `0.38` and others), creating different catch-up personalities.
- Multiple delayed refreshes, font readiness, and custom asset events can reorder geometry after restoration.
- Global `gsap.ticker.lagSmoothing(0)` is not restored on cleanup.
- Long pin distances amplify small geometry errors.
- Reduced-motion behavior is implemented section by section rather than through one contract.

### Recommendations

- Direct-manipulation sequences: `scrub: true` only.
- Editorial reveals: one shared, subtle scrub token only when catch-up is intentional.
- Avoid numeric scrub on text that must stop immediately with user input.
- Use `gsap.matchMedia()`/context ownership for breakpoint and reduced-motion rebuilds.
- Centralize refresh scheduling; one measured refresh transaction should replace scattered delayed refreshes.
- Separate measurement from mutation, and never repeatedly refresh while restoring scroll state.

## Horizontal chapter redesign

### Current chapter order

1. Creative ecosystem image
2. Creative statement
3. Front-end ecosystem image
4. Front-end statement
5. Back-end/automation image
6. Unified-system statement
7. Search/visibility image
8. Measurement statement
9. Social-platform image
10. Presence statement

### Proposed state machine

For each capability chapter:

```text
PRELOAD → IMAGE_REVEAL → IMAGE_READ → IMAGE_EXIT/TEXT_ENTRY → TEXT_READ → TEXT_EXIT
```

Each state has one owner and invariant:

- **PRELOAD:** network/decode only; no visible transform.
- **IMAGE_REVEAL:** previous content is already clear; no collision with Vanta/text.
- **IMAGE_READ:** image is stable and lines may loop slowly behind embedded panels.
- **IMAGE_EXIT/TEXT_ENTRY:** one continuous horizontal transfer.
- **TEXT_READ:** image is fully offscreen and headline is centered.
- **TEXT_EXIT:** next image may begin only after readability threshold.

### Suggested chapter units

| State | Narrative units |
|---|---:|
| Image reveal | 0.8 |
| Image read | 0.7 |
| Image exit / text entry | 0.8 |
| Text read | 0.9 |
| Text exit | 0.5 |

Units are relative, not seconds. Convert the total to physical scroll using a capped `vh` basis. This makes all five chapters comparable while still allowing per-chapter art-direction offsets.

## Vanta-to-image handoff

The exact moment Vanta clears the final answer should be the first non-zero opacity/mask progress of the creative ecosystem. Vanta must be fully out once the image reaches its stable state.

Use one timeline with labels:

```text
answers-visible
vanta-crosses
answers-cleared
creative-aperture-opens
vanta-gone
creative-stable
```

No independent triggers should control these states. A single trigger avoids the dead zone/overlap pendulum seen during iterative timing adjustments.

## Image energy-flow motion

- Trace the actual line geometry printed in each ecosystem image.
- Keep moving light behind application/dashboard panels.
- Use narrow packets or traveling gradients moving toward the center hub.
- Do not use full-image sweeps.
- Hub pulse amplitude should remain lower than route packets.
- Use staggered route periods so the loop never blinks as one synchronized layer.
- Slow movement to support reading; animation should be noticeable on a second look, not demand the first look.

## Numbered frame-sequence contract

The sequence must preserve these invariants:

```text
frameIndex = Math.round(progress * (totalFrames - 1))
```

- Scroll down increases the index.
- Scroll up decreases the index.
- No input means no progress change and no redraw.
- No autoplay, interpolation, crossfade, momentum, or delayed catch-up.
- One frame is drawn at a time.
- Canvas uses cover math while preserving source aspect ratio.
- Pin length equals the exact intentional sequence distance.
- Final frame and unpin meet without an empty hold.

The existing 8 px per-frame mapping produces 1,464 px for 184 frames. Retain or alter that density only after physical-device testing; do not hide pacing problems with numeric scrub.

## Motion tokens

Create shared tokens so the experience has one “handwriting.”

| Token | Purpose | Suggested value/behavior |
|---|---|---|
| `--motion-direct` | User-controlled scrub | Exact, no easing, no catch-up |
| `--motion-reveal` | Short authored reveal | 420–650 ms equivalent, `power3.out` |
| `--motion-transfer` | Image/text horizontal handoff | 700–1000 ms equivalent, `power2.inOut` |
| `--motion-ambient-slow` | Hubs/line packets | 5–9 s loop, low amplitude |
| `--motion-ambient-drift` | Background depth | 12–24 s loop, section-scoped |
| `--motion-exit` | Content clearing | 280–450 ms equivalent |
| `--motion-reduced` | Reduced-motion transition | 0–150 ms opacity only; no pin/scrub |

For scroll-linked motion, “duration” means the perceptual distance calibrated against a reference input, not a time-based tween overriding scroll.

## Reduced-motion audit

### What exists

- React state listens for `prefers-reduced-motion`.
- CSS disables many infinite animations.
- Horizontal CSS can fall back to vertically stacked panels.
- Some hero distances/timings are reduced.
- Motion components in the about/gallery areas have reduced behavior.

### Gaps

- Global Lenis still initializes and smooths scroll; reduced values only change interpolation.
- The numbered sequence has no dedicated reduced-motion branch.
- Shortening a large animation is not equivalent to removing vestibular motion.
- Multiple section-specific branches can disagree.

### Required reduced experience

- Native scrolling, no Lenis.
- No pinning that requires extended motion tracking.
- Hero presents a stable authored key visual.
- Horizontal chapters stack in semantic order with light opacity entry only.
- Numbered sequence becomes 2–3 representative still states or one final still with explanatory copy.
- Ambient R3F/CSS animation stops.
- All content and controls remain available.

## Input and control audit

- Skip control works and moves toward horizontal completion.
- Magazine previous/next and issue controls work; arrow-key page turning works when the reader is focused.
- Horizontal code includes Arrow, Page, touch/pointer, sound, and skip handling.
- Horizontal control bars measured at roughly 10 px high visually, below a robust touch-target standard.
- Controls need explicit focus-visible treatment and at least 44×44 CSS-pixel hit areas.

## Motion QA matrix

For every target viewport, test:

1. Slow 1-pixel/trackpad movement across every trigger boundary.
2. Fast fling from before entry to after exit.
3. Reverse during every reveal and handoff.
4. Stop input at 0%, 25%, 50%, 75%, and 100% of each direct sequence.
5. Refresh at the same progress points.
6. Resize/rotate at the same progress points.
7. Navigate away/back with browser history.
8. Hide/show tab during continuous animation.
9. Reduced motion from initial load and toggled while open.
10. Keyboard-only and touch-only control.

## Motion acceptance criteria

- Zero post-input drift in the numbered sequence.
- Refresh returns to the same chapter and within one frame index.
- Resize returns to the same chapter and within 2% local progress.
- No dead scroll or double-owned transforms.
- Image is entirely outside the viewport before its statement reaches final center.
- Vanta is entirely absent once the creative image is fully revealed.
- Offscreen animation loops are paused.
- Reduced motion contains no pinned continuous scrub.

# Ascend Vanta production performance remediation report

Date: July 20, 2026 (America/New_York)

Production origin: `https://www.ascendvanta.com`

Production SHA at sprint start and end: `5cbf6ddf31cf8c8597943cce730d5dadf856c983`

Local validation origin: `http://localhost:3006` (optimized `next start`)
Deployment status: **withheld by hard gate**

## Executive verdict

The local remediation resolves three of the four reproduced production blockers and materially improves the fourth:

- Mobile entry numbered-frame requests: `1` → `0` in every isolated run.
- Mobile entry CLS: approximately `1.0` → `0.0` in every isolated and Lighthouse run.
- Active-scroll long-task duration: `2,993 ms` → `119 ms`; P95 frame interval `175 ms` → `9.3 ms` in the best final trace.
- Cold mobile Lighthouse LCP: median `9.35 s` → `3.235 s`.

The explicit median Lighthouse LCP gate is `≤2.5 s`. The final median is `3.235 s`, so the local build **does not satisfy all deployment gates**. In accordance with the sprint instructions, no files were staged, no commit was created, `main` was not pushed, and no Vercel replacement deployment was initiated.

The live site therefore remains on the previously certified SHA and retains its confirmed production defects. It is **not ready for broad public launch** and **not ready for Awwwards submission**.

## Root-cause findings

### Entry CLS

The server rendered a one-viewport hero while GSAP later inserted pin spacing based on a runtime-selected quality profile. At the same time, `--hero-mission-overlap` changed from the server's standard profile to the mobile profile. The combined geometry mutation moved `.editorial-world` by approximately one viewport and produced CLS near `1.0`.

Remediation: reserve the complete hero narrative height in responsive server CSS, make the hero stage CSS-sticky, remove hydration-time GSAP pin spacing, and use the reserved height as the ScrollTrigger distance. Runtime graphics quality no longer controls document geometry.

### Entry frame request

The reduced/mobile static branch mounted `ffout010.gif` eagerly regardless of proximity. The frame sequence itself was far below the fold, but its fallback image was requested at entry.

Remediation: preserve the section's semantic markup and reserved dimensions while mounting the static frame only when the existing proximity observer activates.

### Cold mobile LCP

The original mobile LCP was the hero wordmark after Three.js/R3F startup and hydration work. The initial hero had no stable authored visual in the normal WebGL path.

Remediation: render a responsive authored poster in the server HTML, preload the matching mobile/desktop source, reserve its dimensions, and fade the WebGL canvas over it only after asset readiness and a hidden shader warm-up. Mobile WebGL initialization is deferred until user interaction; reduced-motion mode remains static. A 0.5% black-edge inset prevents Chrome from classifying the exact full-viewport poster as background-like, allowing it to become the LCP candidate without a perceptible design change.

The LCP candidate is now consistently `picture.hero-fallback > img`, is server-rendered, and paints in the observed trace at approximately `90–92 ms` on the local host. Lighthouse 13.4.1's simulated mobile metric nevertheless remains `3.160–3.305 s`, above the required threshold. No value below the gate is claimed.

### Active-scroll stalls

The production trace's worst stall coincided with the Vanta model becoming render-visible and five overlapping ecosystem images entering the browser's lazy-load corridor together. React state-based sequential image mounting was also rejected after tracing showed that rerendering the very large editorial component created a new long task.

Remediation: warm the hidden galaxy/Vanta shaders beneath the poster before the canvas handoff, keep the robot mounted after post-LCP WebGL startup, and activate the five system images sequentially through `data-src` DOM updates without rerendering the editorial tree. The Black Rush publication font and adjacent publication pages now activate only near the library.

## Implemented local changes

- Stable responsive hero geometry in CSS for mobile, tablet, desktop, wide desktop, and reduced motion.
- CSS-sticky hero stage with ScrollTrigger progress derived from reserved height.
- Server-rendered responsive hero poster with 480 px and 720 px mobile sources.
- Poster-to-WebGL opacity handoff with no geometry mutation or black flash.
- Mobile WebGL progressive enhancement deferred to interaction; reduced motion uses the static authored visual.
- Hidden four-frame shader warm-up before the canvas is revealed.
- Static/mobile frame fallback gated by the existing proximity observer.
- Five ecosystem images loaded sequentially without a React rerender.
- Publication font and adjacent-page preloads gated by library proximity.
- Removed the now-unnecessary hero-assets ScrollTrigger refresh.

No package dependency, content, navigation, brand copy, chapter ordering, frame-count contract, or project-wide design system was changed.

## Build gates

| Gate | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass, zero errors and zero warnings |
| `npm run build` | Pass, Next.js 16.2.10 optimized production build |
| Console errors | 0 in final active-scroll and frame/restoration sessions |
| HTTP/network failures in three final Lighthouse runs | 0 |

## Entry loading and layout stability

Three reliable isolated 390×844 entries, with clean storage and no input where required:

| Run | CLS | Numbered frame requests | Document overflow |
| ---: | ---: | ---: | ---: |
| 1 | 0.000 | 0 | 0 px |
| 2 | 0.000 | 0 | 0 px |
| 3 | 0.000 | 0 | 0 px |

The final server-reserved mobile hero measured `2,194.39 px` high and the mission handoff remained at approximately `837.25 px` from the initial viewport top. No top-of-page jump was observed.

## Final Lighthouse mobile evidence

Lighthouse 13.4.1, simulated mobile, 390×844, device scale factor 1, cold isolated runs:

| Metric | Run 1 | Run 2 | Run 3 | Median | Gate |
| --- | ---: | ---: | ---: | ---: | --- |
| Performance score | 93 | 93 | 92 | 93 | Informational |
| FCP | 0.905 s | 0.905 s | 0.903 s | 0.905 s | Pass |
| LCP | 3.160 s | 3.235 s | 3.305 s | **3.235 s** | **Fail (`≤2.5 s`)** |
| Observed trace LCP | 0.092 s | 0.090 s | 0.091 s | 0.091 s | Informational |
| CLS | 0.000 | 0.000 | 0.000 | 0.000 | Pass |
| TBT | 17.5 ms | 15.5 ms | 15.5 ms | 15.5 ms | Pass |
| Lighthouse long tasks | 3 | 3 | 3 | 3 | Informational |
| Long-task duration | 220 ms | 215 ms | 198 ms | 215 ms | Material improvement |
| Numbered frame requests | 0 | 0 | 0 | 0 | Pass |

The LCP element in all three final runs was the authored server-rendered hero poster. The audit reported no JavaScript/WebGL dependency for the candidate and no resource load failure. The remaining simulated deficit is approximately `735 ms` at the median.

## Active-scroll performance

Final optimized desktop trace used stepped wheel input from top to document bottom (`21,566 px`) after the post-LCP warm-up settled:

- Samples: `646`
- Mean frame interval: `14.07 ms`
- P95 frame interval: `9.3 ms`
- Maximum sampled interval: `733.3 ms`
- Samples above 50 ms: `20`
- Long tasks: `1`
- Long-task duration: `119 ms`
- Total long-task duration: `119 ms`
- Console errors: `0`

The isolated maximum interval was not accompanied by a corresponding PerformanceObserver long task and may include browser/automation scheduling. It is reported, not discarded. Compared with production, the P95 and long-task totals demonstrate that the sustained active-scroll blocker is materially resolved on the available host.

## Interaction, lifecycle, and responsive evidence

### Frame freeze and restoration

- Sequence position: scroll `13,530`
- Active frame: `90`
- Frame after 1.2 seconds without input: `90`
- Scroll after reload: `13,530`
- Restored frame after reload: `90`
- Restored lifecycle: `active`

### Three-cycle lifecycle

Each of three cycles produced the same state:

- Before corridor: lifecycle `sleeping`, frame canvas absent.
- In active corridor: lifecycle `active`, frame canvas present, frame `45`.
- No monotonic canvas or pin-spacer growth was observed.

### Reduced motion

- `prefers-reduced-motion: reduce` matched.
- Horizontal pin spacers: `0`.
- Total pin spacers: `0`.
- WebGL canvas: absent.
- Document overflow: `0 px`.
- The static sequence image is still proximity-gated; a restored deep-scroll session correctly loads it near its section.

### Overflow

| Viewport | Overflow |
| --- | ---: |
| 1440×900 | 0 px |
| 1024×768 | 0 px |
| 768×1024 | 0 px |
| 390×844 | 0 px |

## Visual review

Observational screenshots were reviewed for the desktop hero, mobile poster hero, Vanta/orb handoff, frame sequence, publication library, prompt gallery, and about section. The ecosystem artwork also loaded before its horizontal chapter. No blank canvas, missing artwork, broken image, unexpected document overflow, or obvious production-design regression was found.

This was not a pixel-diff because no approved baseline image set was supplied. Physical-browser and color-managed display review remains required.

## Console, network, and unavailable metrics

- Console errors in final full-scroll session: `0`
- Console errors in frame freeze/reload session: `0`
- HTTP responses at or above 400 in final Lighthouse runs: `0`
- Failed critical assets: `0`
- Hydration errors: `0`
- Unhandled promise rejections: `0`
- INP: unavailable; scripted lab input is not representative field INP.
- Physical-device thermal/battery behavior: unavailable.
- JavaScript heap, retained object, decoded image, texture, and GPU memory: not measured by a reliable profiler in this environment.

## Production deployment and live certification

The hard LCP gate failed locally. Therefore:

- Commit `fix: resolve production performance blockers`: **not created**.
- Push to `main`: **not performed**.
- Vercel replacement deployment: **not started**.
- Replacement deployment readiness wait: **not applicable**.
- Live re-certification of a replacement SHA: **not applicable**.

The current production HTTP, metadata, redirect, commit, console, interaction, and visual results remain documented in `docs/ascend-vanta-production-certification-report.md`. The live deployment is unchanged and retains the prior production performance verdict.

## Remaining physical-device and accessibility requirements

These requirements remain mandatory before broad launch or Awwwards submission:

1. Physical iPhone Safari testing on current and one older supported iOS version.
2. Physical mid-range Android Chrome testing and cold-load Core Web Vitals.
3. Physical iPad/tablet testing in portrait and landscape.
4. Current Safari, Firefox, Chrome, and Edge desktop testing at representative display densities.
5. Real 200% and 400% zoom/reflow, text enlargement, orientation, and text-spacing override checks.
6. Complete keyboard-only walkthrough of publication, horizontal-story, prompt-gallery, and sequence controls with visible focus verification.
7. VoiceOver on macOS/iOS, NVDA on Windows, and preferably JAWS checks for landmarks, headings, names, reading order, and live state.
8. Color-contrast testing for text, focus indicators, controls, and text over every animated visual state.
9. Windows forced-colors/high-contrast and increased-contrast testing.
10. Touch-target, gesture-alternative, and drag/scroll alternative validation on physical touch hardware.
11. Physical-device cold LCP/CLS and representative field INP.
12. Three-cycle JavaScript heap, retained-object, decoded-image, texture, and GPU-memory profiling.
13. Mobile thermal, battery, and sustained-animation testing.
14. Final approved-baseline pixel comparison for the named sections and browsers.

## Launch and submission decision

**Broad public launch: hold.** Three blockers are locally resolved, but the mandatory median Lighthouse LCP gate remains above `2.5 s`, and the replacement was correctly not deployed.

**Awwwards submission: hold.** The LCP gate plus the outstanding physical-device, cross-browser, assistive-technology, and pixel-baseline requirements prevent a defensible submission.

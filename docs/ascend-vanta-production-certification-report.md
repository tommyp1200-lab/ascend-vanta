# Ascend Vanta live production certification report

Date: July 20, 2026 (America/New_York)

Production origin: `https://www.ascendvanta.com`

Deployment: `dpl_Cim3MLGKiiL57UBehyf4BVapseg1` (`READY`, production)
Expected and verified Git commit: `5cbf6ddf31cf8c8597943cce730d5dadf856c983`

## Remediation sprint status update

A focused local remediation sprint was completed after this live certification. The local build resolves entry frame loading, entry CLS, and the traced active-scroll stall, and improves median simulated mobile LCP from `9.35 s` to `3.235 s`. The required deployment gate is `≤2.5 s`, so the replacement build was **not committed, pushed, or deployed**. This report therefore remains the authoritative certification of the unchanged live SHA. Full local evidence is in `docs/ascend-vanta-production-performance-remediation-report.md`.

## Final verdict

**Live functional deployment: pass with confirmed production defects.** The production routes, redirect, metadata, structured data, desktop entry behavior, interactions, responsive geometry, reduced-motion layout, lifecycle behavior, and reviewed visual states pass.

**Broad public launch: hold.** Mobile entry makes one prohibited sequence-frame request, cold-mobile LCP is consistently poor, mobile CLS is reproducibly approximately 1.0, and an active-scroll trace contains severe long tasks and frame stalls.

**Awwwards submission: hold.** The same performance and stability defects block submission. Physical-device, cross-browser, full assistive-technology, and final pixel-baseline review also remain outstanding.

No application code was changed. No commit or push was created.

## Certification matrix

| # | Requirement | Result | Live evidence |
| ---: | --- | --- | --- |
| 1 | Homepage returns HTTP 200 | **Pass** | `https://www.ascendvanta.com/` returned `200`, `text/html; charset=utf-8`. |
| 2 | `robots.txt` returns HTTP 200 | **Pass** | Returned `200`, `text/plain; charset=utf-8`. |
| 3 | `sitemap.xml` returns HTTP 200 | **Pass** | Returned `200`, `application/xml`. |
| 4 | Canonical uses the production URL | **Pass** | `https://www.ascendvanta.com` (equivalent root URL; no localhost or preview origin). |
| 5 | Open Graph and Twitter use the production origin | **Pass** | `og:url` is the production root; OG and Twitter images are absolute `https://www.ascendvanta.com/...` URLs. |
| 6 | JSON-LD contains no local/development/placeholder values | **Pass** | One JSON-LD block parsed successfully. All URL and `@id` values use the production origin; forbidden-value scan returned none. |
| 7 | Sitemap contains only HTTPS production URLs | **Pass** | One `<loc>`: `https://www.ascendvanta.com/`. |
| 8 | Robots references the production sitemap | **Pass** | `Sitemap: https://www.ascendvanta.com/sitemap.xml`. |
| 9 | Apex permanently redirects to `www` | **Pass** | `https://ascendvanta.com/` returned `308` with `Location: https://www.ascendvanta.com/`; one hop to final `200`. |
| 10 | No console/hydration/unhandled/critical-asset errors | **Pass** | Zero console errors, page errors, unhandled rejections, HTTP responses at or above 400, or non-abort request failures across desktop, tablet, mobile, reduced-motion, lifecycle, and active-scroll probes. Frame image aborts occurred only during intentional sequence disposal and are expected cache teardown. |
| 11 | Deployed Git commit is exact | **Pass** | Authenticated Vercel deployment API reports `gitSource.sha` and `meta.githubCommitSha` as `5cbf6ddf31cf8c8597943cce730d5dadf856c983`. |
| 12 | Sequence-frame requests remain zero at entry | **Fail** | Desktop entry: `0`. Mobile 390×844 entry: exactly one request for `/assets/frames/vanta-exploded/ffout010.gif` in each of three isolated cold entries. Lighthouse also recorded the same request in all three runs. |
| 13 | Frame freeze and reload restoration | **Pass** | At scroll position `13,352`, frame `68` remained unchanged for 1.4 seconds without input and restored to the same scroll position/frame after reload. |
| 14 | Reduced motion produces no horizontal pins | **Pass** | With `prefers-reduced-motion: reduce`, total pin spacers were `0`; horizontal and frame sections had no pin ancestors, the frame canvas was absent, and the static frame was present. |
| 15 | Desktop/tablet/mobile have no document overflow | **Pass** | Maximum document overflow was `0 px` at 1440×900, 768×1024, and 390×844 across top, 20%, 45%, 70%, and bottom samples. Reduced-motion samples also remained at `0 px`. |
| 16 | No visual regression in named production sections | **Pass, observational** | Vanta, hero, ecosystem artwork, frame sequence, publications, prompt gallery, and about captures showed no missing layers, broken images, blank canvases, or obvious clipping/regression. Mobile, tablet, and reduced-motion captures were also reviewed. This was not a pixel-diff because no approved production baseline was supplied. |

## HTTP and redirect results

| Request | Status | Final URL / redirect | Notes |
| --- | ---: | --- | --- |
| `https://www.ascendvanta.com/` | `200` | Same URL | Vercel cache hit; gzip HTML. |
| `https://www.ascendvanta.com/robots.txt` | `200` | Same URL | Correct production sitemap reference. |
| `https://www.ascendvanta.com/sitemap.xml` | `200` | Same URL | One HTTPS production URL. |
| `https://ascendvanta.com/` | `308` | `https://www.ascendvanta.com/` | Permanent redirect; one hop; final status `200`. |

The homepage response also included HSTS (`max-age=63072000`).

## Metadata and structured-data results

- Canonical: `https://www.ascendvanta.com`
- Open Graph URL: `https://www.ascendvanta.com`
- Open Graph image: `https://www.ascendvanta.com/assets/images/av-logo-fallbacks/hero-desktop.webp`
- Twitter card: `summary_large_image`
- Twitter image: `https://www.ascendvanta.com/assets/images/av-logo-fallbacks/hero-desktop.webp`
- JSON-LD count: `1`
- JSON-LD types: `WebSite`, `Person`, and `CollectionPage`
- JSON-LD forbidden local, loopback, development-port, example-domain, or placeholder values: `0`
- Robots production sitemap references: `1`
- Sitemap non-HTTPS or non-production URLs: `0`

## Console and network results

- Console errors: `0`
- Page/runtime errors: `0`
- Hydration errors: `0`
- Unhandled promise rejections: `0`
- HTTP responses at or above 400 during browser flows: `0`
- Non-abort failed requests: `0`
- Failed critical assets: `0`
- Desktop sequence-frame requests at entry: `0`
- Mobile sequence-frame requests at entry: `1` per cold entry, reproduced `3/3`
- Frame request aborts observed during navigation/lifecycle tests were `net::ERR_ABORTED` events caused by intentional component disposal; they were not missing assets or server failures.

## Interaction, motion, and lifecycle results

### Frame contract

- Frozen state: scroll `13,352`, rendered frame `68`, lifecycle `active`
- After 1.4 seconds without input: scroll `13,352`, frame `68`
- After reload and 2.6-second settle: scroll `13,352`, frame `68`, lifecycle `active`

### Reduced motion

- Media query matched: yes
- Horizontal-story pin: none
- Frame-sequence pin: none
- Total `.pin-spacer` elements: `0`
- Animated frame canvas: absent
- Static accessible frame image: present
- Document overflow at all sampled sections: `0 px`

### Three-cycle lifecycle

A clean isolated Chromium session used stepped wheel input from top to the frame activation corridor and back to top three times.

| State | Cycle 1 | Cycle 2 | Cycle 3 |
| --- | --- | --- | --- |
| Near sequence | 2 canvases, 3 pins, 1 frame canvas | 2 canvases, 3 pins, 1 frame canvas | 2 canvases, 3 pins, 1 frame canvas |
| Returned to top | 1 canvas, 2 pins, 0 frame canvases | 1 canvas, 2 pins, 0 frame canvases | 1 canvas, 2 pins, 0 frame canvases |

No monotonic canvas or pin-spacer growth occurred. This is a visible lifecycle proxy, not a JavaScript heap, retained-object, decoded-image, texture, or GPU-memory profile.

## Performance results

### Cold mobile page load

Three Lighthouse 13.4.1 mobile performance runs used a disabled browser cache and simulated mobile conditions.

| Metric | Run 1 | Run 2 | Run 3 | Median | Verdict |
| --- | ---: | ---: | ---: | ---: | --- |
| Performance score | 13 | 60 | 61 | 60 | **Fail** |
| FCP | 1.70 s | 2.84 s | 2.87 s | 2.84 s | Slow |
| LCP | 10.82 s | 9.22 s | 9.35 s | 9.35 s | **Fail** |
| CLS (Lighthouse) | 1.00 | 0.00 | 0.00 | 0.00 | Inconsistent; see isolated result below |
| TBT | 6,842 ms | 254 ms | 230 ms | 254 ms | Needs improvement; severe cold outlier |
| Speed Index | 7.38 s | 6.06 s | 6.12 s | 6.12 s | Slow |
| Long tasks | 12 | 10 | 10 | 10 | **Fail** |
| Long-task duration | 10,089 ms | 896 ms | 871 ms | 896 ms | **Fail** |

The isolated 390×844 browser entry test reported CLS values of `1.000`, `1.004`, and `1.000` across three cache-disabled entries, all at `scrollY = 0`. Combined with Lighthouse run 1, this makes the layout-shift defect reproducible even though two Lighthouse runs did not capture it.

### Active-scroll trace

A headed desktop Chromium trace used real stepped wheel input from the page top to the live document bottom (`21,455 px`):

- Samples: `254`
- Mean animation-frame interval: `42.9 ms`
- P95 animation-frame interval: `175 ms`
- Maximum frame interval: `1,341.6 ms`
- Frames above 50 ms: `33`
- Long tasks: `9`
- Total long-task duration: `2,993 ms`
- Console errors/page errors: `0 / 0`

This is a lab trace on the available desktop host, not a physical-device FPS or thermal test. It is still sufficient to show material active-scroll stalls in this environment.

### INP

**Unavailable.** No trustworthy field INP data or representative real-user interaction population was available. Lighthouse load testing and scripted wheel input are not substitutes for INP, so no INP value is claimed.

## Visual review artifacts

- `output/playwright/production-hero-desktop.png`
- `output/playwright/production-vanta-handoff-desktop.png`
- `output/playwright/production-ecosystem-desktop.png`
- `output/playwright/production-frame-sequence-desktop.png`
- `output/playwright/production-publications-desktop.png`
- `output/playwright/production-prompt-gallery-desktop.png`
- `output/playwright/production-about-desktop.png`
- `output/playwright/production-hero-mobile.png`
- `output/playwright/production-publications-tablet.png`
- `output/playwright/production-reduced-motion-desktop.png`

## Accessibility smoke results

Automated live-DOM and keyboard smoke checks passed for:

- `lang="en"`
- One `main` landmark
- One H1 containing the `ASCEND VANTA` image alternative
- A first-focus skip link named `Skip to portfolio content`
- Skip-link activation aligned `#mission` to the viewport top
- No unnamed interactive controls
- No images missing an `alt` attribute
- No duplicate IDs
- No visible interactive targets below 44×44 CSS pixels at the tested desktop viewport
- The hero WebGL canvas is inside an `aria-hidden="true"` container

These checks do not constitute WCAG conformance testing.

## Confirmed production defects

1. **Mobile entry violates the zero-frame-request contract.** The static mobile sequence eagerly fetches `ffout010.gif` while the sequence remains far below the fold. Reproduced in three isolated mobile entries and three Lighthouse runs.
2. **Mobile CLS is approximately 1.0.** Reproduced in three isolated cache-disabled 390×844 entries and one Lighthouse run. The layout shift occurs without user input at page entry.
3. **Cold mobile LCP is approximately 9–11 seconds.** All three Lighthouse runs fail the 2.5-second good threshold by a wide margin.
4. **Active scrolling produces severe stalls on the available lab host.** Nine long tasks totaled about 3.0 seconds, with a 175 ms P95 and 1.34-second maximum animation-frame interval.

No local fix was attempted because this task was a live certification and the requested deliverable is the production report. Any fix would require a new deployment and a complete recertification of the replacement build.

## Remaining physical-device and accessibility requirements

The following are not available from the automated desktop environment and remain mandatory before broad launch or Awwwards submission:

1. Physical iPhone Safari testing, including current and one older supported iOS version.
2. Physical Android Chrome testing on at least one mid-range device, not only a flagship.
3. Physical iPad/tablet testing in portrait and landscape.
4. Desktop cross-browser testing in current Safari, Firefox, Chrome, and Edge at representative display densities.
5. Real 200% and 400% browser zoom/reflow checks, including text enlargement and orientation changes.
6. Complete keyboard-only walkthrough of every publication control, horizontal-story control, prompt-gallery interaction, and any drag/scroll alternative, with visible focus verification.
7. VoiceOver on macOS and iOS, NVDA on Windows, and preferably JAWS smoke testing for landmarks, headings, names, reading order, and dynamic state announcements.
8. Color-contrast validation for text, controls, focus indicators, and text over animated imagery in all visual states.
9. Windows High Contrast/forced-colors and increased-contrast testing.
10. WCAG text-spacing override validation and reduced-transparency testing where supported.
11. Touch-target and gesture-alternative validation on physical touch hardware, including the prompt gallery and sequence navigation.
12. Physical-device cold-load LCP/CLS plus real-user/field INP; the current lab defects must be fixed first.
13. Three-cycle JavaScript heap, retained-object, decoded-image, texture, and GPU-memory profiling on representative devices.
14. Thermal, battery, and sustained-animation behavior on mobile hardware.
15. Final approved-baseline pixel comparison across the named sections and target browsers.

## Launch decision

The deployed SHA is correct and the production infrastructure/SEO metadata are ready, but the live experience is **not ready for broad public launch** and **not ready for Awwwards submission**. Recertify after the mobile entry frame request, CLS, LCP, and active-scroll stalls are corrected, then complete the remaining physical-device and assistive-technology gates.

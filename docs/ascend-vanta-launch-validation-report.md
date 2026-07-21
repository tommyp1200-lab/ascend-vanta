# Ascend Vanta launch validation report

Date: July 20, 2026  
Approved production origin: `https://www.ascendvanta.com`  
Validation target: the current local repository state, built with Next.js 16.2.10

## Executive verdict

| Launch gate | Verdict | Evidence-based reason |
| --- | --- | --- |
| Production deployment | **Ready to deploy, pending post-deploy verification** | The local production candidate passes typecheck, lint, build, route smoke tests, metadata checks, responsive geometry checks, deterministic sequence checks, and lifecycle proxy checks. The live domain is still serving an older build. |
| Broad public launch | **Hold** | Deploy the current candidate first, then complete real-device, cold performance, heap/GPU memory, keyboard, and screen-reader validation. |
| Awwwards submission | **Hold** | Complete the same public-launch gates plus final cross-browser visual-regression review on the deployed production build. |

This sprint did not redesign the site or remove any approved premium visual system. No files were staged, committed, pushed, deleted, or replaced.

## Focused changes made

1. Set the production URL fallback to `https://www.ascendvanta.com` so canonical, Open Graph, Twitter, sitemap, and structured-data URLs no longer fall back to localhost.
2. Added `.env.example` with the approved production origin.
3. Increased the magazine navigation button width to meet the 44-by-44-pixel target requirement.
4. Removed an accidental static Three.js dependency from the main route entry while preserving the lazy WebGL hero.
5. Added GSAP context reversion when the editorial motion mode changes. This fixes a reproducible stale horizontal pin spacer when switching to reduced motion.

## Build and local production validation

All approved build gates pass:

- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm run build`: pass
- Static routes generated: 6
- Production test port: `3006`
- `/`: HTTP 200
- `/robots.txt`: HTTP 200
- `/sitemap.xml`: HTTP 200
- Application console errors: 0
- Hydration errors: 0
- Unhandled promise rejections: 0
- Failed critical assets: 0
- Narrative diagnostic UI or development-only diagnostic attributes: 0

Local loopback HTTP timing was approximately 3.5 milliseconds total. This is only a server smoke result and is not being reported as real-user or Lighthouse performance.

## Production metadata validation

The current local production candidate contains:

- Canonical URL: `https://www.ascendvanta.com`
- Open Graph URL: `https://www.ascendvanta.com`
- Open Graph image
- Twitter card image
- Favicon
- One JSON-LD structured-data script in the browser DOM
- Valid `robots.txt`
- Valid `sitemap.xml`

## Live deployment drift

The currently deployed domain does not yet match the validated local candidate:

- `https://www.ascendvanta.com/`: HTTP 200
- `https://www.ascendvanta.com/robots.txt`: HTTP 404
- `https://www.ascendvanta.com/sitemap.xml`: HTTP 404
- The live page still exposes the older title, description, and favicon metadata.

This means the current candidate is ready to replace the stale deployment, but production cannot be certified until the new build is deployed and the live routes and metadata are rechecked.

## Bundle result

Initial-route bundle measurements use the generated Next.js route bundle statistics and per-entry-chunk compression:

| Measurement | Previous report | Current candidate | Result |
| --- | ---: | ---: | --- |
| Raw entry JavaScript | 1,040.8 KB | 690.7 KB | Reduced by 350.1 KB |
| Gzip entry JavaScript | 301.7 KB | 208.7 KB | Passes the 250 KB launch target |
| Brotli entry JavaScript | 255.9 KB | 181.8 KB | Reduced by 74.1 KB |

The reduction came from removing an unintended eager Three.js import. The WebGL experience remains lazy-loaded and visually intact.

## Approved interaction-contract validation

- Exact frame mapping: pass. A tested progress value mapped to frame 6 with the required `Math.round(progress * (totalFrames - 1))` formula, and the rendered frame was 6.
- Frame drift after input stops: pass. Scroll position and frame index remained unchanged after input stopped.
- Sequence requests at page entry: 0.
- Reload restoration inside the sequence: pass. Scroll position, progress, expected frame, and rendered frame restored exactly.
- Horizontal forward behavior: pass.
- Horizontal reverse behavior: pass.
- Mobile static sequence behavior: pass.
- Reduced-motion native vertical flow: pass, with zero horizontal pins.
- Meaningful H1 count: exactly 1.
- Interactive targets below 44 by 44 pixels: 0 across the tested viewport matrix.
- Duplicate pin-spacer growth: not observed.

## Responsive validation

The following 16 CSS viewport sizes were tested against the optimized production build:

`320×568`, `375×812`, `390×844`, `430×932`, `640×360`, `768×1024`, `844×390`, `1024×768`, `1280×720`, `1366×768`, `1440×900`, `1600×900`, `1920×1080`, `2560×1080`, `2560×1440`, and `3440×1440`.

At every tested viewport:

- Horizontal document overflow: 0
- H1 count: 1
- Interactive targets below 44 by 44 pixels: 0
- Production console errors: 0

The `640×360` test is a CSS reflow equivalent of a `1280×720` viewport at 200 percent. It is not a substitute for a real browser-zoom and assistive-technology test, which remains a launch action.

## Accessibility validation

Confirmed in the rendered production DOM:

- Document language is English.
- One `main` landmark is present.
- A native, focusable skip link targets `#mission`.
- The skip-link destination works and aligns at the top when activated.
- One H1 has the accessible name “ASCEND VANTA.”
- Section headings and region labels are present.
- All evaluated controls have accessible names.
- No duplicate IDs were found.
- Decorative canvas content is hidden from assistive technology.
- All tested interactive targets meet the minimum target size.

A complete physical-keyboard walkthrough and VoiceOver/NVDA pass could not be performed in the available automated browser environment. They remain required before broad public launch. No screen-reader pass is claimed.

## Lifecycle and memory validation

A three-cycle top-to-sequence-to-top lifecycle proxy produced stable counts:

- At the top of every cycle: 1 canvas and 2 pin spacers.
- Near the sequence in every cycle: 2 canvases and 3 pin spacers.
- Returning to the top consistently disposed the sequence canvas and its pin spacer.

No monotonic canvas or pin-spacer growth was observed. This validates the visible lifecycle contract, but it is not a heap or GPU-memory profile. Real JavaScript heap, retained-object, texture, and GPU-memory measurement remains required.

## Remaining launch gates

The following measurements were not available in the current environment and are not being estimated:

1. Cold mobile LCP, CLS, and INP.
2. CPU/main-thread trace, long tasks, active-scroll P95, and hero-idle renderer cost.
3. Three-cycle JavaScript heap and GPU-memory profile.
4. Physical iPhone/Safari, Android/Chrome, tablet, and desktop-browser validation.
5. Real 200-percent browser-zoom validation.
6. Complete keyboard-only and VoiceOver/NVDA validation.
7. Final deployed visual-regression review.

## Required launch sequence

1. Deploy the current candidate with `NEXT_PUBLIC_SITE_URL=https://www.ascendvanta.com`.
2. Verify the live homepage, `robots.txt`, `sitemap.xml`, canonical URL, Open Graph data, Twitter data, favicon, and JSON-LD.
3. Run cold mobile performance tests for LCP, CLS, and INP, plus an active-scroll CPU/main-thread trace.
4. Run a three-cycle heap and GPU-memory profile.
5. Test physical iPhone/Safari, Android/Chrome, tablet, and major desktop browsers, including real 200-percent zoom.
6. Complete keyboard-only, VoiceOver, and NVDA checks.
7. Perform the final visual-regression review on the deployed candidate without changing the approved art direction.

After those checks pass, the same build can be certified for broad public launch and Awwwards submission.

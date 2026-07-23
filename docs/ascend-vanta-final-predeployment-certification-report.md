# Ascend Vanta Final Pre-Deployment Certification

Date: 2026-07-23  
Certification branch: `qa/predeployment-live-certification`  
Responsive baseline: `86501b000fbb7d1a23d18a3ef48b7a5219c9351d`  
QA remediation commit: `758ab4335351cf909d32c0225911bdf04b3c0960`  
Production baseline: `3f59f315dc952f61805d89fe79ad125ad1dad650`  
Production changed: **No**

## Executive verdict

The responsive candidate passes the available Chromium-based local-production and
protected-preview checks for layout, typography, accessibility, core interaction,
GSAP lifecycle stability, visual integrity, metadata, analytics delivery, and
representative performance.

The candidate is **not yet unconditionally certified for production deployment**.
The release remains on hold for two reasons:

1. Firefox, Playwright WebKit, desktop Safari automation, Edge, and physical
   iOS/iPadOS/Android checks were unavailable in this environment and were not
   fabricated.
2. The completed security work is intentionally isolated on
   `security/production-hardening` and is not part of this responsive QA commit.
   The final combined release candidate must be assembled with approval and
   recertified. `npm ci` also reports three dependency advisories: one moderate
   and two high.

No push, merge, production deployment, force operation, stash, reset, or cleanup
of user work was performed.

## Repository safety and source integrity

- The primary checkout remained on `main` at
  `3f59f315dc952f61805d89fe79ad125ad1dad650`.
- Existing modified and untracked files in the primary checkout were preserved
  without alteration.
- The responsive source worktree remained clean on
  `responsive/mobile-typography` at
  `86501b000fbb7d1a23d18a3ef48b7a5219c9351d`.
- The security worktree remained clean and separate on
  `security/production-hardening` at
  `fa47c3caca934495bea520a72aabf477ee8d7154`.
- QA was performed in an isolated worktree and branch based on the completed
  responsive commit.
- Browser traces, screenshots, Lighthouse output, test scripts, caches, Vercel
  credentials, and local environment files were not added to the repository.

## Build validation

The committed lockfile was used. The real Next.js production bundle was built and
served locally; no development server was used for certification.

| Check | Result |
| --- | --- |
| `npm ci` | Pass; reported 1 moderate and 2 high dependency advisories |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm run build` | Pass |
| Local production server | Pass at `http://127.0.0.1:3011` |
| Hydration errors | 0 observed |
| Console errors | 0 observed |
| Unhandled promise rejections | 0 observed |
| Unresolved critical asset failures | 0 observed |

## Defects confirmed and remediated

The following reproducible defects were fixed at their source in
`758ab4335351cf909d32c0225911bdf04b3c0960`:

1. Landmark sections referenced headings with `aria-labelledby` without a valid
   landmark role. The affected hero sections now use `role="region"`.
2. A definition list used an invalid wrapper between the `dl` and its `dt`/`dd`
   children. The definition-list structure and grid selectors were corrected.
3. A decorative creative-stack paragraph used a prohibited `aria-label`. The
   accessible phrase is now supplied with screen-reader-only text while its
   decorative typography remains hidden from assistive technology.
4. Page-rail accessible names did not contain their visible numeric labels. The
   accessible names now include the visible page number.
5. A fresh reduced-motion load could jump near the bottom of the page because an
   offscreen frame-sequence effect registered narrative state on mount. State is
   now registered only when the sequence is near the viewport.

The corrections preserve approved copy, desktop art direction, animation systems,
image quality, Three.js, GSAP, ScrollTrigger, Lenis, and Framer Motion.

## Route and section inventory

| Surface | Result | Notes |
| --- | --- | --- |
| Global navigation and anchors | Pass | Anchors resolve; no broken in-page targets |
| Hero, AV wordmark, 3D artwork | Pass | No observed visual regression |
| Scroll cue | Pass | Typography and layout remain intact |
| Frame sequence and Skip Sequence | Pass | Skip lands at expected sequence destination |
| Mission and principles | Pass | No readable clipping or mid-word splitting |
| Marketing operating system | Pass | Composition retained |
| Horizontal pinned sections | Pass | Stable pin lifecycle; no duplicate stage growth |
| Skills and capability sections | Pass | Intentional entry/exit transforms distinguished from clipping |
| Visual systems and website showcase | Pass | Assets load; no production-bundle errors |
| Publications and reader controls | Pass | Touch and keyboard selection verified |
| Prompt gallery | Pass | No observed production visual regression |
| About, statistics, contact, footer | Pass | Actual hash navigation to Contact verified |
| Custom 404 | Pass | Correct 404 response and visual treatment |
| Metadata, sitemap, robots, favicon | Pass | Production-origin values verified |
| Downloadable PDFs | Not applicable | No PDF asset exists in this candidate |
| Video/HLS | Not applicable | No video or HLS asset exists in this candidate |

## Viewport certification

All 39 required viewport sizes were loaded at the top and scanned through the
complete page at multiple scroll positions in the system Chrome engine. Checks
included readable-element geometry, document width, forced horizontal scroll,
word integrity, console errors, page errors, and failed requests.

| Group | Viewports | Result |
| --- | --- | --- |
| Small mobile | 320×568, 360×640, 360×800, 375×667, 375×812 | Pass |
| Modern iPhone-sized | 390×844, 393×852, 402×874, 414×896, 430×932, 440×956 | Pass |
| Android-sized | 360×780, 384×854, 412×915, 412×892, 480×1040 | Pass |
| Tablet | 768×1024, 810×1080, 820×1180, 834×1194, 1024×1366 | Pass |
| Laptop/desktop | 1024×768, 1280×720, 1280×800, 1366×768, 1440×900, 1512×982, 1728×1117, 1920×1080, 2560×1440, 3440×1440 | Pass |
| Landscape mobile | 568×320, 667×375, 812×375, 844×390, 852×393, 874×402, 932×430, 956×440 | Pass |

Automated flags seen while horizontal panels were entering or leaving the pinned
stage were reviewed against screenshots and computed geometry. They were caused
by intentional transform/opacity choreography outside the active reading state,
not by clipped readable content. The document itself remained horizontally
contained.

Representative visual review covered mobile hero, mobile publication reader,
mobile About, actual Contact hash entry, desktop horizontal creative content,
desktop frame-sequence artwork, and the custom 404.

## Typography, zoom, and text enlargement

- No readable tested word split mid-word.
- No button, navigation, or publication-control label wrapped incorrectly.
- No persistent clipped glyphs, cropped headings, or hidden readable copy was
  found.
- Production fonts loaded successfully on the protected preview.
- Browser-equivalent zoom layouts at 125%, 150%, and 200% had zero document
  overflow and zero forced horizontal scrolling.
- Mobile root-text enlargement at 125% and 150% had zero document overflow.
- At 200% root-text enlargement, no readable element overflowed and forced
  horizontal scrolling remained zero. One coarse sample briefly measured 56 px
  of document width while transformed animation geometry was updating; a denser
  25-point trace found no persistent overflow. This is classified as contained
  animation geometry, not inaccessible readable content.

Actual browser UI zoom controls and mobile browser chrome/safe-area behavior still
require physical-browser confirmation.

## Interaction and lifecycle results

| Check | Result |
| --- | --- |
| Entry sequence-frame requests | 0 |
| Touch publication selection | Pass, publication 01 → 02 |
| Keyboard publication selection | Pass, publication 02 → 03 |
| Skip Sequence | Pass; landed within approximately 2 px of expected target |
| Frame freeze | Pass; frame remained 95 after 1.2 seconds |
| Mid-sequence reload restoration | Pass; scroll and frame 95 restored exactly |
| Background/return simulation | Pass; frame, scroll, pins, and canvases stable |
| Orientation resize | Pass; no overflow or pin growth |
| Active-animation resize | Pass; no overflow or duplicate stage |
| Reduced-motion entry | Pass; `scrollY=0`, zero pins, zero horizontal pins |
| Three lifecycle scroll cycles | Pass; stable 2 pins, 2 canvases, 1 horizontal stage |
| Broken anchors | 0 |
| Unnamed interactive controls | 0 |

Reload restoration was certified inside the frame-sequence state, the state for
which exact restoration is implemented. An About-section reload can restore to a
registered narrative chapter rather than an arbitrary pixel; it is not represented
as exact arbitrary-position restoration.

## Accessibility results

| Check | Result |
| --- | --- |
| Lighthouse accessibility | 100 |
| Skip link first in keyboard order | Pass |
| Visible focus treatment | Pass |
| Named interactive controls | Pass |
| Keyboard publication operation | Pass |
| Definition-list semantics | Pass after remediation |
| Landmark naming | Pass after remediation |
| Reduced-motion fresh entry | Pass after remediation |

A 35-step keyboard traversal found named controls and visible `:focus-visible`
treatment. A second-cycle skip-link position after focus wrapped back to the
document start was a traversal artifact, not a missing first-focus skip link.

Screen-reader behavior with VoiceOver, NVDA, JAWS, and TalkBack remains a manual
gate. Keyboard-only review in system Safari and Firefox also remains unverified.

## Scroll and runtime performance

The local active-scroll trace sampled 360 animation frames across the horizontal
and frame-sequence experiences:

| Metric | Result |
| --- | --- |
| Median frame interval | 8.4 ms |
| P95 frame interval | 13.3 ms |
| P99 frame interval | 20.5 ms |
| Maximum frame interval | 33.7 ms |
| Samples above 50 ms | 0 |
| `PerformanceObserver` long tasks | 0 |
| Entry frame requests | 0 |
| Sequence requests during deliberate full sweep | 184 |
| Resident sequence frame | 183 |
| End-state pins / canvases | 2 / 2 |
| Document overflow | 0 |
| Runtime errors | 0 |

This is a lab trace in system Chrome, not physical-device field evidence and not
an INP measurement.

## Local production HTTP and metadata

| Request/check | Result |
| --- | --- |
| `/` | 200 |
| `/robots.txt` | 200 |
| `/sitemap.xml` | 200 |
| `/icon.jpg` | 200 |
| Google verification file | 200 |
| Custom missing route | 404 |
| `/about`, `/work`, `/capabilities`, `/publications`, `/contact` | 308 to approved root hashes |
| Canonical URL | `https://www.ascendvanta.com` origin |
| Open Graph URL/assets | Production origin |
| Twitter metadata/assets | Production origin |
| JSON-LD | Parses with production URLs; no localhost values |
| Stable Person ID | `https://www.ascendvanta.com/about/#person` |
| Robots sitemap reference | Production sitemap |
| Sitemap entries | HTTPS production URLs only |

Representative frame, GLB, font, hero image, publication image, favicon, and
verification assets returned successful responses.

Approved external profile URLs were present and exact. GitHub, Instagram,
Facebook, and TikTok returned successful automated HTTP responses. LinkedIn
returned its anti-bot status `999`; its URL was verified for exactness, but the
profile page was not falsely marked as automated end-to-end validated.

## Protected Vercel Preview

- Deployment ID: `dpl_F2FkcRRokANu6oQnG62yG5ursxrf`
- Deployment:
  `https://ascend-vanta-g63r5z5ga-ascend-vanta.vercel.app`
- Inspector:
  `https://vercel.com/ascend-vanta/ascend-vanta/F2FkcRRokANu6oQnG62yG5ursxrf`
- State: **READY**
- Target: Preview
- Region: `iad1`
- Source state: clean QA commit
  `758ab4335351cf909d32c0225911bdf04b3c0960`

The direct CLI deployment metadata does not expose a Git SHA field. The source
commit above is the exact clean worktree state supplied to the deployment; it is
not represented as a Vercel-reported Git SHA.

The preview is protected by Vercel authentication. Anonymous requests redirect to
Vercel SSO and receive `X-Robots-Tag: noindex`, as expected for a protected
preview.

Preview validation confirmed:

- Root, robots, sitemap, favicon, verification, font, hero image, GLB, sequence
  frame, and publication image responses succeeded when authenticated.
- Redirect routes returned 308.
- No unresolved console, page, hydration, or critical network errors occurred.
- Canonical, Open Graph, Twitter, structured data, sitemap, and robots values
  continue to use the production origin.
- Image, model, font, and frame requests demonstrated Vercel CDN cache hits.
- Google Tag Manager loaded successfully and the analytics collection request
  returned 204.
- Three representative widths—390, 768, and 1440—had no document overflow or
  readable layout defect.

## Protected-preview Lighthouse

Three isolated mobile Lighthouse runs were retained, including the least favorable
valid result:

| Run | Performance | FCP | LCP | CLS | TBT | Lighthouse long tasks |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 95 | 1.024 s | 2.886 s | 0.000 | 13 ms | 2 |
| 2 | 95 | 1.235 s | 2.896 s | 0.000 | 13 ms | 2 |
| 3 | 96 | 1.148 s | 2.806 s | 0.000 | 13.5 ms | 2 |
| Median | 95 | 1.148 s | 2.886 s | 0.000 | 13 ms | 2 |

Accessibility and Best Practices scored 100 in all three runs. SEO scored 69
solely because the protected preview correctly sends `noindex`; the only failed
SEO audit was crawlability. These numbers include preview authentication
overhead and are not production field Core Web Vitals.

INP was not reliably measurable in the available lab session and is not
fabricated.

## Browser coverage

| Browser/platform | Availability | Result |
| --- | --- | --- |
| System desktop Chrome / Chromium engine | Available | Automated suite and visual review pass |
| Playwright Chromium | Available through system Chrome | Pass |
| Playwright Firefox | Browser binary unavailable | Not tested |
| Playwright WebKit | Browser binary unavailable | Not tested |
| Desktop Safari | Installed; remote automation unavailable | Not tested |
| Desktop Firefox | Not installed | Not tested |
| Microsoft Edge | Not installed | Not tested |
| Physical iOS Safari | Unavailable | Manual gate |
| Physical iPadOS Safari | Unavailable | Manual gate |
| Physical Android Chrome | Unavailable | Manual gate |

Attempts to acquire isolated Playwright Firefox and WebKit binaries outside the
repository did not complete extraction and were terminated. Safari WebDriver
diagnostics did not become available. System settings were not changed and no
paid real-device service was purchased.

## Remaining release gates

Before production deployment approval:

1. Integrate the reviewed responsive and security branches into one approved
   release candidate without modifying or discarding the existing worktrees.
2. Re-run typecheck, lint, build, dependency/security validation, core interaction
   tests, and a protected preview smoke test on that exact combined commit.
3. Complete real Firefox and WebKit checks, plus desktop Safari if automation or a
   manual session becomes available.
4. Complete physical-device checks on at least:
   - a small iPhone,
   - a current large iPhone,
   - an iPad in portrait and landscape,
   - a representative Android phone.
5. On physical devices, verify safe areas, browser chrome changes, touch scrolling,
   orientation changes, sequence freeze/restoration, Skip Sequence, publication
   controls, background/return behavior, long-session pin/canvas stability, and
   thermal/memory behavior.
6. Complete screen-reader checks with VoiceOver and TalkBack at minimum; include
   NVDA or JAWS when a Windows environment is available.
7. Review and disposition the three dependency advisories on the combined release
   candidate.

## Approval recommendation

- **Visual and responsive candidate:** Pass in the tested Chrome matrix.
- **Accessibility automation:** Pass at 100, with manual assistive-technology
  checks outstanding.
- **Protected preview:** Ready and functionally clean.
- **Broad public production deployment:** **Hold pending combined security
  integration and unavailable cross-browser/physical-device gates.**
- **Awwwards submission:** **Not yet recommended.** Complete the same physical
  device, Safari/WebKit, Firefox, assistive-technology, and combined-release
  checks before paying or submitting.

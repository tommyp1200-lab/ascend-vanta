# Ascend Vanta responsive typography quality report

Date: 2026-07-23  
Scope: local production build based on `3f59f315dc952f61805d89fe79ad125ad1dad650`  
Branch: `responsive/mobile-typography`  
Production deployment: not changed

## Verdict

The responsive typography remediation passes the rendered viewport and browser-zoom matrix. No readable word is split mid-word, no tested viewport exposes horizontal page scrolling, and no visible heading, paragraph, label, button, statistic, caption, or publication control is clipped in the final checks.

The desktop composition, copy, color system, motion timelines, sequence-frame loading behavior, and page architecture remain intact. The implementation is ready for review and physical-device validation. It has not been pushed or deployed.

## Root-cause inventory

| Area | Root cause | Resolution |
| --- | --- | --- |
| Mission and principle headings | Every character, including spaces, was an independent `inline-block`, allowing the browser to wrap inside words | Preserved every animated character but grouped characters into atomic, non-wrapping word wrappers |
| Hero wordmark and scroll cue | Negative bottom positioning and a tight line mask could crop the wordmark or script-font glyphs | Moved the wordmark inside the safe area and expanded the cue's line box and reveal mask |
| Mobile horizontal chapters | Intrinsic grid/flex sizing and overly wide content shells pushed headings and proof copy beyond narrow viewports | Added `min-width: 0`, reduced only the affected content widths, and constrained the creative proof line to its center column |
| Short landscape | Desktop-scale headings and fixed minimum heights exceeded the short visual viewport | Added a short-landscape recomposition using responsive type, spacing, and `100svh` stage constraints |
| Publication reader | Grid max-content sizing and fixed page-control sizing could exceed the available width at large text sizes | Constrained the grid track, allowed the page rail to wrap, and retained 44 px control targets |
| About and prompt content | Grid children retained intrinsic minimum widths | Added explicit zero minimums and bounded widths; statistics reflow when text is enlarged |
| Authority links and horizontal labels | `overflow-wrap: anywhere`, ellipsis, and nowrap behavior could split or hide approved labels | Restored normal word boundaries and allowed balanced multi-line labels |
| Page overflow | Transformed decorative artwork can extend beyond its visual composition at extreme text scaling | Clipped only root-level horizontal paint overflow; vertical scrolling and sticky behavior remain intact |

## Implementation notes

- `VisualCharacters` still emits the same source-character count and the same GSAP target classes.
- Original character indices, the mission color split, timeline selectors, and animation timing are preserved.
- The accessible headings retain their existing `aria-label`; the visual character layer remains `aria-hidden`.
- No copy, routes, assets, dependencies, SEO metadata, or animation sequence logic changed.
- Default motion remains enabled. The reduced-motion check only verifies the existing user-preference path.

## Viewport certification

The page was sampled at 25 vertical positions per viewport. The audit checked rendered text geometry, word ranges, clipping ancestors, viewport boundaries, and document overflow.

| Viewport | Result |
| --- | --- |
| 320 × 568 | Pass |
| 360 × 800 | Pass |
| 375 × 667 | Pass |
| 390 × 844 | Pass |
| 393 × 852 | Pass |
| 402 × 874 | Pass |
| 430 × 932 | Pass |
| 768 × 1024 | Pass after targeted creative-proof containment retest |
| 820 × 1180 | Pass after the same containment correction |
| 1024 × 1366 | Pass |
| 1280 × 800 | Pass |
| 1440 × 900 | Pass |
| 1728 × 1117 | Pass |
| 1920 × 1080 | Pass |
| 844 × 390 landscape | Pass |

Final findings:

- Mid-word wraps: 0
- Readable text overflow findings: 0
- User-accessible horizontal scrolling: 0
- Mobile entry sequence-frame requests: 0
- Mobile horizontal pins: 0
- Reduced-motion horizontal pins: 0
- Console errors: 0
- Page errors or unhandled promise rejections: 0
- Failed local critical assets: 0

## Zoom and text resizing

Browser zoom was represented with the equivalent CSS viewport widths:

| Test | Result |
| --- | --- |
| 125% (`1024 px` equivalent) | Pass; no text or document overflow |
| 150% (`853 px` equivalent) | Pass; no text or document overflow |
| 200% (`640 px` equivalent) | Pass; no text or document overflow |

Supplemental root-text-size tests at 125%, 150%, and 200% found no overflowing readable text. At the deliberately extreme 200% mobile text-size injection, transformed decorative art can temporarily increase its pre-clipping geometry, but root clipping prevents horizontal navigation and all semantic text remains contained.

## Interaction and motion regression checks

| Check | Result |
| --- | --- |
| Skip Sequence | Pass; moved from `6725.5 px` to `11912 px`, within `2.3 px` of the calculated sequence end |
| Publication next-page control | Pass; page indicator changed from `01` to `02` |
| Animated character counts | Pass; mission 10 characters, all seven principle headings match their source-string lengths |
| Desktop ScrollTrigger pin | Pass; one active horizontal pin at entry |
| Mobile/reduced-motion pins | Pass; zero |
| Short-landscape wordmark containment | Pass; bottom at `386.8 px` inside a `390 px` viewport |
| Tablet creative proof line | Pass; bounds `106.7–676.6 px` inside a `0–768 px` panel |

## Local Lighthouse measurements

Three valid local production-build mobile runs were retained. These are local simulated results, not field data and not production-domain certification.

| Run | Performance | FCP | LCP | CLS | TBT | Long tasks |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 76 | 0.907 s | 7.478 s | 0 | 44 ms | 3 |
| 2 | 90 | 0.905 s | 3.614 s | 0 | 20.5 ms | 3 |
| 3 | 90 | 0.903 s | 3.610 s | 0 | 22.5 ms | 3 |
| Median | 90 | 0.905 s | 3.614 s | 0 | 22.5 ms | 3 |

The large cold-run variance is disclosed and no production claim is inferred from it. Best Practices and SEO scored 100 in all three runs. Accessibility scored 89 and reported existing semantic audit findings involving prohibited ARIA use, definition-list structure, and visible-label/accessibility-name mismatch; those are outside this typography remediation and should be handled in a dedicated accessibility pass.

## Build validation

- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm run build`: pass
- `git diff --check`: pass
- Static routes generated: `/`, `/_not-found`, `/icon.jpg`, `/robots.txt`, `/sitemap.xml`

## Remaining physical-device and accessibility gates

Automated emulation cannot certify:

- iPhone SE, iPhone 16 Pro, and iPhone 16 Pro Max in Safari, including Dynamic Island and browser-chrome transitions
- A representative 360 px Android device in Chrome
- iPad portrait and landscape touch behavior
- OS-level large text and display zoom on real iOS and Android devices
- VoiceOver, TalkBack, and keyboard-only reading/order checks
- Pinch zoom and orientation changes during an active GSAP sequence
- Long-session memory, thermal throttling, and repeated background/foreground lifecycle behavior
- Real-device font rasterization and safe-area behavior

These checks should be completed before an Awwwards submission or an unconditional physical-device certification.

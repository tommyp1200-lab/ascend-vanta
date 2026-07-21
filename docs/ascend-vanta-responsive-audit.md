# Ascend Vanta — Responsive Audit

Audit scope: six required viewports, document overflow, page length, fixed UI, hero scale, horizontal/pinned behavior, long-form sections, resize continuity, ultrawide behavior, and responsive architecture.

## Responsive verdict

The site successfully avoids document-level horizontal overflow at all six required sizes. That is a meaningful strength for an experience with pinned panels, transformed imagery, canvas, and WebGL. The greater issue is temporal responsiveness: page length and scroll effort grow with viewport dimensions, and a live resize can move the reader into a completely different chapter.

Responsive readiness is therefore more than “it fits.” The composition must preserve hierarchy, progress, performance tier, and narrative meaning when width, height, orientation, DPR, or preferences change.

**Responsive readiness: 5.9 / 10**

## Tested viewport matrix

| Viewport | Mode | Total scroll height | Approx. viewport heights | Document overflow | Notable observation |
|---|---|---:|---:|---|---|
| 375×812 | Mobile | 20,752 px | 25.6 | None | Logo ~325×58 px, about section ~4,342 px |
| 430×932 | Mobile | 22,361 px | 24.0 | None | Logo ~380×68 px; editorial progress sits right-heavy |
| 768×1024 | Tablet | 24,310 px | 23.7 | None | About ~3,292 px; fixed logo remains large |
| 1440×900 | Desktop | 30,257 px | 33.6 | None | Horizontal act consumes ~15,600 px effective distance |
| 1920×1080 | Desktop | 38,083 px | 35.3 | None | About ~5,004 px; hero title ~576×238 px |
| 2560×1440 | Ultrawide | 47,750 px | 33.2 | None | Width inflates both scale and narrative distance |

The page is not physically broken at any target width, but the amount of interaction required is inconsistent. A reader on 1440×900 travels roughly ten more viewport heights than a tablet reader.

## High-priority findings

### P0. Resize does not preserve logical position

Observed during live resize:

1. At 1440×900, the reader was in the editorial archive around `scrollY 24158`.
2. At 430×932, the same session moved to the about section.
3. Resizing back to 1440×900 placed the reader in the frame sequence.

This is the highest responsive defect because it breaks orientation, not just composition.

**Required pattern**

- Before rebuild: capture `{chapterId, localProgress}`.
- Recompute breakpoint-specific measurements and quality tier.
- Refresh triggers once.
- Resolve new scroll position from logical state.
- Render after restoration, without visible jumping.

### P1. Quality tier is not reactive

Initial width/hardware determines quality once. Resizing a large desktop window to mobile dimensions does not rebuild the quality profile. Device rotation, browser zoom/DPR changes, and reduced-motion changes can therefore leave inappropriate WebGL work active.

### P1. Mobile brand mark dominates

- 375 px viewport: fixed logo about 325 px wide (87%).
- 430 px viewport: fixed logo about 380 px wide (88%).

The mark is legible but occupies too much of the mobile header plane and competes with the hero and later reading sections.

**Target:** 62–76% width during initial reveal, then a compact 38–52% settled state or mark-only variant, with safe-area-aware margins.

### P1. Page length is tied too strongly to viewport width

The horizontal `innerWidth * 10.22` formula makes wider screens require more physical scroll. Ultrawide should create richer composition, not longer labor.

**Target:** use chapter-derived narrative units converted through clamped `vh`/input calibration, with separate ultrawide max distance.

### P1. Mobile reading sections are too tall

The about section is approximately 4,342–4,352 px on phones. The publication area exceeds 2,100 px. Combined with the long opening, horizontal fallback/pinning, sequence, and gallery, this increases fatigue.

### P2. Fixed navigation/progress is not optically centered

The bottom progress/navigation cluster remains visually right-biased at the tested widths. Center the track relative to the safe visual viewport, not remaining space between unrelated controls.

### P2. Control targets are undersized

The horizontal sound/skip/progress UI appears around 10 px high at desktop. Visual minimalism is valid; the invisible hit area still needs to meet a 44×44 CSS-pixel target, remain separated, and show focus.

## Breakpoint recommendations

Do not make breakpoints mirror arbitrary devices. Use the content and render system:

| Range | Layout strategy | Motion strategy | 3D strategy |
|---|---|---|---|
| `< 480px` | Compact mark, single-column copy, edge-safe controls | Native vertical reduced chapter spacing; no large lateral overlap | Low tier, DPR ≤1, aggressive suspension |
| `480–767px` | Single-column with wider reader/gallery | Short pinned moments only if stable; otherwise stacked | Low/standard by measured frame time |
| `768–1023px` | Tablet editorial grid, touch-first controls | Horizontal may be preserved only with deterministic distances | Standard tier, DPR ≤1.25 |
| `1024–1439px` | Laptop composition, reduced headline clamps | Full chapter choreography with capped distance | Standard/high if sustained |
| `1440–1919px` | Desktop art direction | Full choreography; same narrative effort as laptop | High only after measured eligibility |
| `≥1920px` | Ultrawide max-width stages and negative space | Do not increase scroll distance linearly | Cap DPR and fill-rate; do not infer power from width |

## Section-by-section responsive notes

### Fixed brand/header

- Respect `env(safe-area-inset-*)`.
- Use a compact settled state after hero activation.
- Ensure it never overlays the primary title, reader controls, or publication page text.
- Include a semantic home link when navigation architecture is approved.

### Hero

- Current heading scales strongly: roughly 32 px at 375 to 112 px at 2560.
- Preserve drama but set a max line measure and cap ultrawide height.
- Use aspect-aware framing; 768×1024 and 1440×900 should not share camera assumptions.
- Quality and camera composition must rebuild on orientation change.

### Mission/principles

- Replace repeated `svh` stacks with content-driven minimums and clamped gaps.
- Keep at least 16–20 px side gutters on 375 px; use larger editorial margins as width allows.
- Avoid line breaks that isolate one highlighted word without semantic intent.

### Horizontal capability act

- Desktop/tablet: preserve the horizontal film-strip concept with capped chapter distances.
- Mobile: choose one of two intentional modes, not a partial hybrid:
  - compact pinned image→text chapters with deterministic native scroll, or
  - vertically stacked image/text pairs with the same reveal hierarchy.
- Keep near-full-screen landscape artwork inside the visual viewport; do not crop the hub or edge labels unintentionally.
- Ensure the completed text state is truly centered and the previous image fully cleared.

### Numbered frame sequence

- Canvas cover behavior should adapt to portrait and landscape without hiding essential Vanta anatomy.
- Recalculate canvas backing resolution on resize/DPR change, but preserve frame index.
- Mobile pin distance should derive from frames/input testing, not an unrelated minimum height.
- Reduced motion uses representative stills.

### Magazine reader

- On phone, use one page at a time with a clear page count and 44×44 controls.
- On tablet/desktop, use a spread only if text remains readable without pinch zoom.
- Preserve issue/page focus and current page through orientation change.
- `sizes` must reflect actual reader width.

### Prompt gallery

- Keep draggable behavior on capable pointers; avoid hover-only affordances.
- Use pointer coarse/fine media queries for velocity and drag tolerance.
- Limit simultaneous decoded images on phones.

### About

- Desktop: two-column editorial layout with the systems map supporting the prose.
- Mobile: shorter paragraphs, meaningful subheads, and domain map chunks.
- Avoid a 4,000+ px wall of text after an already long experience.

## Typography system recommendations

- Define fluid tokens with `clamp()` for display, section heading, body lead, body, label, and utility text.
- Pair size caps with max line lengths; scaling font alone does not preserve composition.
- Target 45–75 characters for body copy and 8–14 words per display line.
- Maintain minimum 16 px body text on phones and a comfortable 1.45–1.65 line height.
- Test the actual loaded custom font for cap-height and optical icon alignment.

## Touch and pointer recommendations

- Minimum target: 44×44 CSS px; 48×48 preferred for primary page/issue controls.
- At least 8 px separation between adjacent targets.
- Do not require drag; every gallery/reader action needs a button/keyboard equivalent.
- Prevent horizontal chapter swipes from stealing vertical page intent below an activation threshold.
- Respect overscroll/back-swipe gestures on iOS.

## Viewport and safe-area recommendations

- Continue using `svh` for stable viewport units where appropriate; compare with `dvh` for pinned stages that should follow browser chrome.
- Include top/bottom safe areas for fixed logo, progress, sound, and skip controls.
- Test keyboard-open states if any contact/form experience is later added.
- Treat desktop browser zoom at 200% as a responsive state, not an edge case.

## Responsive QA matrix

In addition to the six required sizes:

- 320×568 legacy-small phone
- 390×844 common iPhone portrait
- 844×390 phone landscape
- 1024×768 tablet landscape
- 1280×720 small laptop
- 1366×768 common laptop
- 1600×900 desktop
- 2560×1080 ultrawide
- 3440×1440 ultrawide
- 200% zoom at 1280×720

For each, validate:

1. Cold load at top.
2. Refresh in hero, horizontal image, horizontal text, frame sequence, reader, and about.
3. Resize/rotation at the same states.
4. Fast and slow reversal.
5. Coarse pointer and fine pointer.
6. Reduced motion.
7. Safe-area insets and browser chrome changes.

## Responsive acceptance criteria

- Zero document-level horizontal overflow.
- Resize/rotation preserves chapter ID and local progress within 2%.
- Current sequence frame survives resize exactly.
- Quality tier updates safely without remount flashes or leaks.
- No fixed UI covers content at any target viewport.
- All controls meet touch and keyboard requirements.
- Ultrawide scroll effort is capped and does not scale linearly with width.
- Mobile total story length is intentionally edited, not merely compressed.

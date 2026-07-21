# Ascend Vanta — Section-by-Section Experience Blueprint

This document turns the audit into a redesign blueprint. It does not authorize implementation and does not replace the current visual language.

## Experience thesis

Ascend Vanta should feel like one machine coming online: identity establishes the operator, capabilities connect into a system, proof demonstrates command, and the closing biography explains the mind behind it. Every section should either reveal a new layer or deepen an existing one. Repeated animation without new meaning should be removed.

## Global rules

- One primary narrative progress model owns vertical, pinned, horizontal, and frame-sequence states.
- Each section has a defined entry, comprehension hold, and exit—never an arbitrary spacer.
- The fixed brand mark reduces visual weight after the opening and never competes with the main heading.
- Background continuity remains, but the most expensive background effects pause when occluded.
- Text remains selectable, semantic, and accessible even when animated.
- No CTA is added inside the horizontal capability sequence.
- Reduced motion preserves hierarchy, content, and sequence meaning with simple cuts/dissolves rather than compressed choreography.

## Recommended story map

| Act | Current content | Recommended function |
|---|---|---|
| 1. Activate | Hero, logo, Vanta, mission | Establish identity and the “systems behind growth” premise quickly |
| 2. Decode | Principles and Vanta answer transition | Define the operating model and hand off to proof |
| 3. Connect | Five ecosystem image/text chapters | Demonstrate breadth as one connected machine |
| 4. Transform | Vanta numbered-frame sequence | Create one memorable transformation, technically exact |
| 5. Prove | Publications and prompt gallery | Show thinking and creative range, not just claims |
| 6. Own | About/systems map | Explain the operator and close with clarity |

## 1. Hero activation

**Role:** Brand imprint and promise.

**Keep**

- The AV identity, starfield, dimensional logo/Vanta world, and cinematic reveal.
- The sense that the environment is assembling rather than merely fading in.

**Problems**

- The accessible H1 is empty even though the visual hero carries a headline.
- The high-tier fixed WebGL canvas can remain active through the entire document.
- Mobile logo width is approximately 87–88% of the viewport and competes with the hero.
- `<Preload all>` and high particle counts spend budget before later content needs it.

**Blueprint**

- Make the primary promise a real H1 in the DOM and pair it with one concise supporting line.
- Treat the opening as a 3-beat sequence: signal → assembly → authored statement.
- At hero exit, settle the logo into a quieter 44–56% mobile width or a compact mark state.
- Freeze or unmount hero-only simulation after the final hero beat.

**Motion**

- 0–20%: background signal and controlled depth.
- 20–70%: identity/character assembly.
- 70–100%: typography resolves; continuous noise calms before the next section.

**Acceptance criteria**

- Meaningful H1 in accessibility tree.
- No long tasks or obvious frame loss on a mid-range phone.
- Hero renderer suspends after exit and resumes correctly on reverse navigation.

## 2. Mission statement

**Role:** State the belief that connects creativity, technology, and infrastructure.

**Keep**

- High-impact editorial typography and the “whole machine” language.

**Problems**

- Mission height is 108svh even before surrounding transitions are counted.
- The message competes with persistent environmental motion.

**Blueprint**

- Use one dominant sentence and one supporting clause.
- Introduce the system thesis here; do not repeat it verbatim in later headings.
- Reduce background velocity and particle contrast during reading.

**Motion**

- One decisive typographic reveal tied to actual scroll, followed by a still reading window.
- Exit begins immediately after comprehension; no empty hold.

## 3. Operating principles

**Role:** Explain how Tommy thinks before showing tool ecosystems.

**Keep**

- The seven concepts and Vanta’s relationship to the answers.

**Problems**

- Seven repeated 34–38svh beats produce length without proportional new visual information.
- The transition from answer erasure to the first image has historically been timing-sensitive.

**Blueprint**

- Group the seven ideas into three meaningful clusters: direction, infrastructure, and measurement.
- Preserve all ideas as supporting labels, but avoid seven identical scroll mechanics.
- Make Vanta’s pass the explicit transition trigger; the first ecosystem begins as soon as the final cluster clears.

**Motion**

- Cluster reveal, short read, Vanta crosses and removes it, first ecosystem mask opens in the same scroll range.
- No gap between “answers gone” and “image visible.”

## 4. Vanta handoff and question/answers

**Role:** Humanize the systems thesis and transform exposition into proof.

**Keep**

- Vanta physically interacting with the content.
- The concept of a character-led wipe rather than an arbitrary transition.

**Problems**

- Entry currently consumes a substantial part of the pinned horizontal distance before a capability image becomes active.
- Blur/opacity layers can create sharp rectangular edges when multiple planes overlap.

**Blueprint**

- Vanta’s position, answer opacity, and first-image reveal share one timeline and one normalized progress range.
- Use edge-aware masks/feathering rather than blurred rectangular layers.
- Exit Vanta completely once the first image owns the screen.

## 5. Creative stack image

**Role:** Establish creative breadth and the “connected hub” visual grammar.

**Keep**

- Adobe ecosystem artwork, exact green line paths, and hub-directed energy flow.
- Transparent background relationship.

**Problems**

- LCP warning indicates the loader does not correctly anticipate when this image becomes visually critical.
- Glow/logo pulse can overpower content; line animation and image must remain depth-separated.

**Blueprint**

- Reveal from Vanta’s cleared space with a soft horizontal aperture and subtle perspective settle.
- Trace only existing printed paths behind the panels, moving from tools toward the central hub.
- Use a quiet hub heartbeat and localized line packets, not a full-image flash.
- Once fully shown, move the entire chapter left while its text partner enters from the right.

## 6. Creative stack statement

**Role:** Translate tool breadth into a business/production proposition.

**Keep**

- “The full creative stack. Mastered.” and the concept-to-creation lockup.
- Oversized low-opacity `CONTENT / CREATION` background treatment.

**Problems**

- Background word spacing and gear/O alignment have needed repeated manual corrections.
- Layout is tightly coupled to viewport-specific CSS.

**Blueprint**

- Build the foreground lockup as a reusable editorial title component with measured cap-height alignment.
- Treat gear icons as glyph replacements with explicit optical baseline/size tokens.
- Position `CONTENT` above and `CREATION` below as independent, clamped background lines.

## 7. Front-end ecosystem image

**Role:** Show that design intent becomes a working interface system.

**Keep**

- Connected front-end stack artwork and central engine.

**Blueprint**

- Reuse the creative chapter's reveal grammar, not its exact timing.
- Animate existing routes toward the hub; pulse individual panels in a controlled sequence.
- Keep image at near-full-screen landscape scale, then move it fully offscreen before the text settles.

## 8. Front-end statement

**Role:** Position engineering as experience design.

**Keep**

- “I engineer the experience.” and integrated production-system message.

**Blueprint**

- Center the completed statement, with a maximum readable line length for the paragraph.
- Use type-scale clamps so the headline does not clip at narrow laptop widths.
- Give the statement a short stable reading plateau before the next image begins.

## 9. Back-end and automation image

**Role:** Reveal infrastructure behind the visible interface.

**Keep**

- Python/Flask/Node/API/SQL/automation ecosystem and central processing hub.

**Blueprint**

- Shift the energy language from “creative signal” to “orchestration”: packets move through routes into the core, then fan to automations.
- Do not add decorative paths beyond those in the asset.
- Preload only as the previous text approaches exit.

## 10. Unified-system statement

**Role:** Express the central differentiator: disconnected workflows become one system.

**Keep**

- Large two-tone headline and the reduced-manual-work proof point.

**Blueprint**

- Use a three-line lockup that stays centered at all supported widths.
- Reveal white clauses first and connect green clauses as the semantic payoff.
- Keep the body copy to 3–4 comfortable lines at desktop, 5–7 on mobile.

## 11. Search/visibility image

**Role:** Show that the system measures and improves itself.

**Keep**

- Analytics/search ecosystem and hub visualization.

**Blueprint**

- Existing paths light from data sources toward the center; a restrained outward confirmation follows.
- Use data-point pulses rather than image-wide blinking.
- Keep legibility of embedded dashboards above atmospheric effects.

## 12. Search statement

**Role:** Convert measurement into the value proposition “Measured. Refined. Improved.”

**Keep**

- The concise headline and highlighted outcome sentence.

**Problems**

- Current statement has appeared left-biased at completion.

**Blueprint**

- Center the headline block and paragraph as one compositional unit at the terminal state.
- Constrain paragraph width to 66–74 characters and center the final green payoff line.

## 13. Social platform image

**Role:** Demonstrate distribution as a connected presence system.

**Keep**

- Platform ring, central AV hub, and radial connections.

**Blueprint**

- Activate platforms in a deliberate orbit, with radial energy returning to the AV hub.
- Avoid simultaneous pulsing of all icons.
- The entire image must be fully outside the viewport before the statement reaches its final centered state.

## 14. Social presence statement

**Role:** End the capability act with audience presence and momentum.

**Keep**

- “I turn platforms into presence.”

**Blueprint**

- Center both axes at final progress.
- Stop background chapter motion while the user reads.
- Use this as the clean exit from horizontal to vertical; the next vertical section should begin immediately.

## 15. Vanta numbered-frame transformation

**Role:** Deliver the signature interactive moment.

**Keep**

- Canvas rendering, exact frame mapping, reverse playback, no video, no interpolation.

**Problems**

- Global smooth-scroll inertia changes frames after input stops.
- Refresh and resize lose state.
- All 184 GIFs begin loading from page entry.
- No dedicated reduced-motion mode.

**Blueprint**

- Mount/loading gate activates shortly before the section enters.
- Load frame 0 immediately only when the gate opens; maintain a small priority window around the target frame.
- Map `Math.round(progress * (totalFrames - 1))` directly and draw only on index change.
- While pinned, use deterministic native progress or an isolated input bridge with zero momentum.
- On reduced motion, show a representative assembled frame, one mid-state, and the final frame as discrete content states.
- Unpin exactly at final frame with no blank spacer.

## 16. Editorial magazine library

**Role:** Prove strategic thinking through authored long-form work.

**Keep**

- On-page reader, issue selector, page controls, keyboard navigation, and page-turn feel.

**Problems**

- Reader assets are explicitly unoptimized.
- The section is more than 2,100–2,700 px tall depending on viewport.

**Blueprint**

- Introduce the three publications with one strong editorial statement and short descriptors.
- Retain the reader, but size its stage around the current spread rather than a generic tall container.
- Preload cover + next spread only; release old full-resolution spreads where practical.
- Provide page count and clear focus indication.

## 17. Prompt worlds gallery

**Role:** Show range, experimentation, and image-making personality.

**Keep**

- Curated marquee, descriptive alt text, and motion-path character.

**Problems**

- Thirty-five unoptimized Next Images and continuous movement add cost after a heavy sequence and reader.

**Blueprint**

- Use responsive `sizes` and optimized derivatives.
- Pause motion out of view and when the reader has not reached the gallery.
- Prioritize composition over volume: show a smaller lead set, with the remaining work available on demand or by continued controlled scroll.

## 18. About / systems map

**Role:** Reveal the operator behind the machine and close the narrative.

**Keep**

- “I build the systems behind growth,” the whole-machine idea, domain map, and long-form credibility.

**Problems**

- Approximately 3,300–5,000 px tall across tested viewports.
- The copy repeats several capability claims already demonstrated.

**Blueprint**

- Structure as: identity statement → three proof paragraphs → systems map → concise closing principle.
- Cut repeated tool/category lists from prose when the systems map already carries them.
- Use a two-column desktop editorial composition and a paced single-column mobile story.
- If a contact or project path is later approved, place it after this section—not inside the horizontal experience.

## Cross-section pacing targets

| Section type | Entry | Read/hold | Exit | Rule |
|---|---:|---:|---:|---|
| Editorial statement | 20–30% | 45–60% | 15–25% | At least half the range should be stable/readable |
| Ecosystem image | 25–35% | 35–50% | 20–30% | Never overlap the next text at its terminal state |
| Character transition | 35–50% | 0–15% | 35–50% | Character action and reveal share the same range |
| Frame sequence | Exact 0–100% | None | Immediate unpin | No easing, catch-up, or post-input drift |
| Reader/gallery/about | Native vertical flow | Content-driven | Native flow | Avoid pinning long-form reading |

## Definition of an award-ready pass

- Every chapter is identifiable when entering in either scroll direction.
- No visible or input-only dead scroll at slow, fast, reversed, or interrupted movement.
- Refresh and resize preserve the same logical chapter and normalized progress.
- Horizontal imagery is fully offscreen before the associated statement reaches final center.
- No critical media begins loading before its proximity gate.
- Reduced motion communicates all content without pinning or continuous simulation.
- The final proof/person acts receive at least as much perceived attention as the capability act.

"use client";

import { useRef } from "react";
import type { MutableRefObject, RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HERO_PHASES, HERO_SCROLL } from "./heroTimelineConfig";
import type { HeroQualityProfile } from "./heroTypes";
import { useNarrativeCoordinator } from "@/components/narrative/NarrativeCoordinator";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface HeroScrollElements {
  root: RefObject<HTMLElement | null>;
  stage: RefObject<HTMLElement | null>;
  heroWordmark: RefObject<HTMLElement | null>;
  heroContent: RefObject<HTMLElement | null>;
  heroVignette: RefObject<HTMLElement | null>;
}

export function useHeroScrollProgress(
  elements: HeroScrollElements,
  quality: HeroQualityProfile,
  reducedMotion: boolean,
): MutableRefObject<number> {
  const progress = useRef(0);
  const { registerChapter, updateNarrativeState } = useNarrativeCoordinator();

  useGSAP(
    () => {
      const { root, stage, heroWordmark, heroContent, heroVignette } = elements;
      if (
        !root.current ||
        !stage.current ||
        !heroWordmark.current ||
        !heroContent.current ||
        !heroVignette.current
      ) {
        return;
      }

      const viewportDistance =
        quality.narrativeViewports * (reducedMotion ? HERO_SCROLL.reducedMotionScale : 1);

      if (reducedMotion) {
        progress.current = 1;
        gsap.set([heroContent.current, heroWordmark.current, heroVignette.current], {
          clearProps: "all",
          autoAlpha: 1,
        });
        updateNarrativeState({ chapterId: "hero-statement", localProgress: 1 });
        return;
      }

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          id: "ascend-hero-narrative",
          trigger: root.current,
          start: "top top",
          end: () => `+=${window.innerHeight * viewportDistance}`,
          scrub: true,
          pin: stage.current,
          pinSpacing: true,
          refreshPriority: 10,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            progress.current = self.progress;
            if (!self.isActive) return;
            const chapter =
              self.progress < 0.16
                ? { chapterId: "hero-signal", start: 0, end: 0.16 }
                : self.progress < HERO_PHASES.particleDissolveStart
                  ? {
                      chapterId: "hero-assembly",
                      start: 0.16,
                      end: HERO_PHASES.particleDissolveStart,
                    }
                  : {
                      chapterId: "hero-statement",
                      start: HERO_PHASES.particleDissolveStart,
                      end: 1,
                    };
            updateNarrativeState({
              chapterId: chapter.chapterId,
              localProgress: (self.progress - chapter.start) / (chapter.end - chapter.start),
            });
          },
        },
      });

      const trigger = timeline.scrollTrigger;
      if (!trigger) return;
      const chapterRanges = [
        { id: "hero-signal", order: 0, start: 0, end: 0.16 },
        {
          id: "hero-assembly",
          order: 1,
          start: 0.16,
          end: HERO_PHASES.particleDissolveStart,
        },
        {
          id: "hero-statement",
          order: 2,
          start: HERO_PHASES.particleDissolveStart,
          end: 1,
        },
      ];
      const unregister = chapterRanges.map((chapter) =>
        registerChapter({
          id: chapter.id,
          order: chapter.order,
          getRange: () => ({
            start: trigger.start + (trigger.end - trigger.start) * chapter.start,
            end: trigger.start + (trigger.end - trigger.start) * chapter.end,
          }),
        }),
      );

      timeline.addLabel("established", 0);
      const leftCopyLines = heroContent.current.querySelectorAll<HTMLElement>(
        ".hero-message--left .hero-message-title > span",
      );
      const rightCopyLines = heroContent.current.querySelectorAll<HTMLElement>(
        ".hero-message--right .hero-message-title > span",
      );
      const valueLead = heroContent.current.querySelector<HTMLElement>(".hero-value-lead");
      const valueRule = heroContent.current.querySelector<HTMLElement>(".hero-value-rule");
      const valueDetail = heroContent.current.querySelector<HTMLElement>(".hero-value-detail");
      const copyRevealTargets = [
        ...Array.from(leftCopyLines),
        ...Array.from(rightCopyLines),
        valueLead,
        valueDetail,
      ].filter((target): target is HTMLElement => Boolean(target));
      const signalPaths = heroWordmark.current.querySelectorAll<SVGPathElement>(
        ".hero-wordmark-signal-path",
      );
      const signalNode = heroWordmark.current.querySelector<SVGCircleElement>(
        ".hero-wordmark-signal-node",
      );
      gsap.set(heroContent.current, { autoAlpha: 1, yPercent: 0, scale: 1 });
      gsap.set(copyRevealTargets, {
        autoAlpha: 0,
        yPercent: reducedMotion ? 0 : 24,
        clipPath: "none",
      });
      if (valueRule) {
        gsap.set(valueRule, {
          autoAlpha: 0,
          scaleX: 0,
          transformOrigin: "left center",
        });
      }
      gsap.set(signalPaths, { strokeDashoffset: 1, autoAlpha: 0 });
      gsap.set(heroVignette.current, { autoAlpha: 1 });
      if (signalNode) gsap.set(signalNode, { scale: 0, transformOrigin: "center" });

      timeline.addLabel("copyReveal", 0.015);
      timeline.to(
        leftCopyLines,
        {
          autoAlpha: 1,
          yPercent: 0,
          duration: reducedMotion ? 0.025 : 0.045,
          stagger: reducedMotion ? 0 : 0.008,
        },
        "copyReveal",
      );
      timeline.to(
        rightCopyLines,
        {
          autoAlpha: 1,
          yPercent: 0,
          duration: reducedMotion ? 0.025 : 0.045,
          stagger: reducedMotion ? 0 : 0.008,
        },
        0.035,
      );
      if (valueLead) {
        timeline.to(
          valueLead,
          {
            autoAlpha: 1,
            yPercent: 0,
            duration: reducedMotion ? 0.025 : 0.04,
          },
          0.065,
        );
      }
      if (valueRule) {
        timeline.to(
          valueRule,
          { autoAlpha: 1, scaleX: 1, duration: reducedMotion ? 0.02 : 0.035 },
          0.082,
        );
      }
      if (valueDetail) {
        timeline.to(
          valueDetail,
          {
            autoAlpha: 1,
            yPercent: 0,
            duration: reducedMotion ? 0.025 : 0.045,
          },
          0.092,
        );
      }

      timeline.addLabel("signal", 0.08);
      timeline.to(signalPaths, { autoAlpha: 1, duration: 0.02 }, "signal");
      timeline.to(
        signalPaths,
        { strokeDashoffset: 0, duration: reducedMotion ? 0.1 : 0.2 },
        "signal",
      );
      if (signalNode) {
        timeline.to(
          signalNode,
          { scale: 1, autoAlpha: 1, duration: 0.08, ease: "power2.out" },
          0.25,
        );
      }
      timeline.to(signalPaths, { autoAlpha: 0, duration: 0.1 }, 0.31);

      timeline.addLabel("pullback", 0.32);
      timeline.to(
        heroContent.current,
        { autoAlpha: 0, yPercent: -3, scale: 0.985, duration: 0.14 },
        0.26,
      );
      timeline.to(
        heroWordmark.current,
        { autoAlpha: 0, yPercent: 14, scale: 0.965, duration: 0.18 },
        "pullback",
      );
      timeline.to(
        heroVignette.current,
        { autoAlpha: 0, duration: 0.14 },
        HERO_PHASES.particleDissolveStart - 0.05,
      );
      timeline.to({}, { duration: 1 }, 0);

      return () => {
        unregister.forEach((cleanup) => cleanup());
      };
    },
    {
      scope: elements.root,
      dependencies: [quality.name, reducedMotion, registerChapter, updateNarrativeState],
      revertOnUpdate: true,
    },
  );

  return progress;
}

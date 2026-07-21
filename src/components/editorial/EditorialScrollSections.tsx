"use client";

/* eslint-disable @next/next/no-img-element -- Sequential data-src activation prevents five overlapping system panels from decoding in one scroll frame. */

import { useEffect, useRef } from "react";
import type { CSSProperties, MutableRefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNarrativeCoordinator } from "@/components/narrative/NarrativeCoordinator";
import {
  HORIZONTAL_CHAPTERS,
  HORIZONTAL_SCROLL_MAX,
  HORIZONTAL_SCROLL_MIN,
  HORIZONTAL_SCROLL_MULTIPLIER,
  HORIZONTAL_TIMELINE_DURATION,
  PRINCIPLES,
  SYSTEM_LAYERS,
  type SystemLayerIconName,
} from "./editorialStoryData";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

function SystemLayerIcon({
  name,
  index,
}: {
  name: SystemLayerIconName;
  index: number;
}) {
  const glyph = (() => {
    switch (name) {
      case "strategy":
        return (
          <>
            <path d="M32 13 42 32 32 51 22 32Z" />
            <path d="M32 13v38M22 32h20" />
            <circle cx="32" cy="32" r="3.2" />
          </>
        );
      case "crm":
        return (
          <>
            <path d="m22 23 20 1M23.5 25.5 31 42m11-15-9 15" />
            <circle cx="20" cy="22" r="5" />
            <circle cx="44" cy="23" r="5" />
            <circle cx="32" cy="44" r="5" />
          </>
        );
      case "website":
        return (
          <>
            <rect x="14" y="16" width="36" height="32" rx="4" />
            <path d="M14 25h36M22 20h.1M28 20h.1M22 32h20M22 39h13" />
          </>
        );
      case "automation":
        return (
          <>
            <path d="M19 27a14 14 0 0 1 24-5l3 4" />
            <path d="m46 18 .5 8-8-.5M45 37a14 14 0 0 1-24 5l-3-4" />
            <path d="m18 46-.5-8 8 .5" />
            <rect x="27" y="27" width="10" height="10" rx="2" />
          </>
        );
      case "content":
        return (
          <>
            <path d="M19 24h26v25H19zM23 19h26v25M28 14h21v19" />
            <path d="m29 31 8 5-8 5Z" />
            <path d="M17 15v6M14 18h6" />
          </>
        );
      case "leads":
        return (
          <>
            <circle cx="31" cy="33" r="16" />
            <circle cx="31" cy="33" r="9" />
            <circle cx="31" cy="33" r="2.5" />
            <path d="m34 30 14-14M41 16h7v7" />
          </>
        );
      case "analytics":
        return (
          <>
            <path d="M16 48h34M20 44V33h7v11M30 44V25h7v19M40 44V17h7v27" />
            <path d="m19 27 9-8 8 4 12-10" />
          </>
        );
      case "reporting":
        return (
          <>
            <path d="M20 13h18l8 8v30H20zM38 13v9h8" />
            <path d="M26 31h14M26 38h14M26 45h8" />
            <path d="m36 46 3 3 7-8" />
          </>
        );
    }
  })();

  return (
    <span
      className="system-layer-icon"
      style={{ "--icon-index": index } as CSSProperties}
      aria-hidden="true"
    >
      <span className="system-layer-icon__aura" />
      <span className="system-layer-icon__scan" />
      <svg className="system-layer-icon__svg" viewBox="0 0 64 64" fill="none">
        <g className="system-layer-icon__orbit-group">
          <circle className="system-layer-icon__orbit" cx="32" cy="32" r="27" />
          <circle className="system-layer-icon__satellite" cx="59" cy="32" r="2.4" />
        </g>
        <g className="system-layer-icon__glyph">{glyph}</g>
      </svg>
    </span>
  );
}

function HorizontalQuestion() {
  return (
    <span className="horizontal-question-type">
      <span className="horizontal-question-line horizontal-question-line--white">WHAT</span>
      <span className="horizontal-question-line horizontal-question-line--lime">POWERS</span>
      <span className="horizontal-question-line horizontal-question-line--white">SCALABLE</span>
      <span className="horizontal-question-line horizontal-question-line--lime">EXECUTION?</span>
    </span>
  );
}

function VisualCharacters({
  text,
  className,
  whiteCharacterCount = 0,
}: {
  text: string;
  className: string;
  whiteCharacterCount?: number;
}) {
  return (
    <span aria-hidden="true">
      {Array.from(text).map((character, index) => (
        <span
          key={`${character}-${index}`}
          className={`${className}${index < whiteCharacterCount ? " mission-title-char--white" : ""}`}
        >
          {character === " " ? "\u00a0" : character}
        </span>
      ))}
    </span>
  );
}

function headlineFit(text: string): "default" | "long" | "extra-long" {
  if (text.length >= 25) return "extra-long";
  if (text.length >= 21) return "long";
  return "default";
}

export function EditorialScrollSections({
  galaxyProgressRef,
  shapeProgressRef,
  horizontalProgressRef,
}: {
  galaxyProgressRef: MutableRefObject<number>;
  shapeProgressRef: MutableRefObject<number>;
  horizontalProgressRef: MutableRefObject<number>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLElement>(null);
  const principlesRef = useRef<HTMLElement>(null);
  const orbEvolutionRef = useRef<HTMLElement>(null);
  const horizontalRef = useRef<HTMLElement>(null);
  const {
    reducedMotion,
    registerChapter,
    requestRefresh,
    updateNarrativeState,
  } = useNarrativeCoordinator();

  useEffect(() => {
    const horizontal = horizontalRef.current;
    if (!horizontal) return;
    const images = Array.from(
      horizontal.querySelectorAll<HTMLImageElement>("img[data-system-src]"),
    );
    let cancelled = false;
    let activeImage: HTMLImageElement | null = null;
    const loadImage = (index: number) => {
      if (cancelled || index >= images.length) return;
      const image = images[index];
      const source = image.dataset.systemSrc;
      if (!source) return;
      activeImage = image;
      const advance = () => {
        image.onload = null;
        image.onerror = null;
        if (!cancelled) window.requestAnimationFrame(() => loadImage(index + 1));
      };
      image.onload = advance;
      image.onerror = advance;
      image.src = source;
    };
    const activate = () => loadImage(0);
    if (!("IntersectionObserver" in window)) {
      const fallbackFrame = globalThis.requestAnimationFrame(activate);
      return () => globalThis.cancelAnimationFrame(fallbackFrame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        activate();
        observer.disconnect();
      },
      { rootMargin: "600% 0px" },
    );
    observer.observe(horizontal);
    return () => {
      cancelled = true;
      observer.disconnect();
      if (activeImage) {
        activeImage.onload = null;
        activeImage.onerror = null;
      }
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !("IntersectionObserver" in window)) return;
    const sections = Array.from(
      root.querySelectorAll<HTMLElement>(
        ".mission-sequence, .principle-line, .orb-evolution-sequence, .vanta-horizontal-sequence",
      ),
    );
    sections.forEach((section) => {
      section.dataset.lifecycle = "sleeping";
    });
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const section = entry.target as HTMLElement;
          section.dataset.lifecycle = entry.isIntersecting ? "near" : "sleeping";
        });
      },
      { rootMargin: "80% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useGSAP(
    () => {
      if (
        !missionRef.current ||
        !principlesRef.current ||
        !orbEvolutionRef.current ||
        !horizontalRef.current
      ) return;

      const staticEditorial =
        reducedMotion || window.matchMedia("(max-width: 767px)").matches;
      const missionCharacters = gsap.utils.toArray<HTMLElement>(".mission-title-char");
      const principleLines = gsap.utils.toArray<HTMLElement>(".principle-line");
      const horizontalQuestionPanel = horizontalRef.current.querySelector<HTMLElement>(
        ".horizontal-question-panel",
      );
      const horizontalQuestionReveal = horizontalRef.current.querySelector<HTMLElement>(
        ".horizontal-question-reveal",
      );
      const horizontalQuestionSummary = horizontalRef.current.querySelector<HTMLElement>(
        ".horizontal-question-summary",
      );
      const horizontalAnswerPanel = horizontalRef.current.querySelector<HTMLElement>(
        ".horizontal-answer-panel",
      );
      const horizontalAnswerItems = gsap.utils.toArray<HTMLElement>(
        ".horizontal-answer-item",
        horizontalRef.current,
      );
      const horizontalCreativePanel = horizontalRef.current.querySelector<HTMLElement>(
        ".horizontal-creative-suite-panel",
      );
      const horizontalCreativeFrame = horizontalRef.current.querySelector<HTMLElement>(
        ".creative-suite-frame",
      );
      const horizontalCreativeGlow = horizontalRef.current.querySelector<HTMLElement>(
        ".creative-suite-flow",
      );
      const horizontalCreativeCurrent = horizontalRef.current.querySelector<HTMLElement>(
        ".creative-suite-current",
      );
      const horizontalCreativeHub = horizontalRef.current.querySelector<HTMLElement>(
        ".creative-suite-hub-energy",
      );
      const creativeStackPanel = horizontalRef.current.querySelector<HTMLElement>(
        ".creative-stack-panel",
      );
      const creativeStackBraces = gsap.utils.toArray<HTMLElement>(
        ".creative-stack-brace",
        horizontalRef.current,
      );
      const creativeStackHeadline = horizontalRef.current.querySelector<HTMLElement>(
        ".creative-stack-headline",
      );
      const creativeStackDivider = horizontalRef.current.querySelector<HTMLElement>(
        ".creative-stack-divider",
      );
      const creativeStackKicker = horizontalRef.current.querySelector<HTMLElement>(
        ".creative-stack-kicker",
      );
      const creativeStackBody = horizontalRef.current.querySelector<HTMLElement>(
        ".creative-stack-body",
      );
      const creativeStackWatermark = horizontalRef.current.querySelector<HTMLElement>(
        ".creative-stack-watermark",
      );
      const frontendStackPanel = horizontalRef.current.querySelector<HTMLElement>(
        ".horizontal-frontend-stack-panel",
      );
      const frontendStackFrame = horizontalRef.current.querySelector<HTMLElement>(
        ".frontend-stack-frame",
      );
      const frontendStackGlow = horizontalRef.current.querySelector<HTMLElement>(
        ".frontend-stack-flow",
      );
      const frontendStackCurrent = horizontalRef.current.querySelector<HTMLElement>(
        ".frontend-stack-current",
      );
      const frontendStackHub = horizontalRef.current.querySelector<HTMLElement>(
        ".frontend-stack-hub-energy",
      );
      const engineerPanel = horizontalRef.current.querySelector<HTMLElement>(
        ".engineer-experience-panel",
      );
      const engineerTitleLines = gsap.utils.toArray<HTMLElement>(
        ".engineer-experience-title__line",
        horizontalRef.current,
      );
      const engineerBody = horizontalRef.current.querySelector<HTMLElement>(
        ".engineer-experience-body",
      );
      const backendAutomationPanel = horizontalRef.current.querySelector<HTMLElement>(
        ".horizontal-backend-automation-panel",
      );
      const backendAutomationFrame = horizontalRef.current.querySelector<HTMLElement>(
        ".backend-automation-frame",
      );
      const backendAutomationGlow = horizontalRef.current.querySelector<HTMLElement>(
        ".backend-automation-flow",
      );
      const backendAutomationCurrent = horizontalRef.current.querySelector<HTMLElement>(
        ".backend-automation-current",
      );
      const backendAutomationHub = horizontalRef.current.querySelector<HTMLElement>(
        ".backend-automation-hub-energy",
      );
      const unifiedSystemPanel = horizontalRef.current.querySelector<HTMLElement>(
        ".unified-system-panel",
      );
      const unifiedSystemTitleLines = gsap.utils.toArray<HTMLElement>(
        ".unified-system-title__line",
        horizontalRef.current,
      );
      const unifiedSystemBody = horizontalRef.current.querySelector<HTMLElement>(
        ".unified-system-body",
      );
      const searchVisibilityPanel = horizontalRef.current.querySelector<HTMLElement>(
        ".horizontal-search-visibility-panel",
      );
      const searchVisibilityFrame = horizontalRef.current.querySelector<HTMLElement>(
        ".search-visibility-frame",
      );
      const searchVisibilityGlow = horizontalRef.current.querySelector<HTMLElement>(
        ".search-visibility-flow",
      );
      const searchVisibilityCurrent = horizontalRef.current.querySelector<HTMLElement>(
        ".search-visibility-current",
      );
      const searchVisibilityHub = horizontalRef.current.querySelector<HTMLElement>(
        ".search-visibility-hub-energy",
      );
      const measuredPanel = horizontalRef.current.querySelector<HTMLElement>(
        ".measured-improved-panel",
      );
      const measuredTitleLines = gsap.utils.toArray<HTMLElement>(
        ".measured-improved-title__line",
        horizontalRef.current,
      );
      const measuredBody = horizontalRef.current.querySelector<HTMLElement>(
        ".measured-improved-body",
      );
      const socialMediaPanel = horizontalRef.current.querySelector<HTMLElement>(
        ".horizontal-social-media-panel",
      );
      const socialMediaFrame = horizontalRef.current.querySelector<HTMLElement>(
        ".social-media-frame",
      );
      const socialMediaGlow = horizontalRef.current.querySelector<HTMLElement>(
        ".social-media-flow",
      );
      const socialMediaCurrent = horizontalRef.current.querySelector<HTMLElement>(
        ".social-media-current",
      );
      const socialMediaHub = horizontalRef.current.querySelector<HTMLElement>(
        ".social-media-hub-energy",
      );
      const platformPresencePanel = horizontalRef.current.querySelector<HTMLElement>(
        ".platform-presence-panel",
      );
      const platformPresenceTitleLines = gsap.utils.toArray<HTMLElement>(
        ".platform-presence-title__line",
        horizontalRef.current,
      );
      const platformPresenceBody = horizontalRef.current.querySelector<HTMLElement>(
        ".platform-presence-body",
      );
      const horizontalProofLines = gsap.utils.toArray<HTMLElement>(
        ".horizontal-proof-line",
        horizontalRef.current,
      );
      const horizontalExperienceUi = horizontalRef.current.querySelector<HTMLElement>(
        ".horizontal-experience-ui",
      );
      const horizontalChapterIndex = horizontalRef.current.querySelector<HTMLElement>(
        ".horizontal-experience-index__current",
      );
      const horizontalChapterLabel = horizontalRef.current.querySelector<HTMLElement>(
        ".horizontal-experience-label",
      );
      const horizontalProgressRail = horizontalRef.current.querySelector<HTMLElement>(
        ".horizontal-experience-rail",
      );
      const horizontalSoundButton = horizontalRef.current.querySelector<HTMLButtonElement>(
        ".horizontal-sound-toggle",
      );
      const horizontalSkipButton = horizontalRef.current.querySelector<HTMLButtonElement>(
        ".horizontal-skip-sequence",
      );
      const horizontalImagePanels = [
        horizontalCreativePanel,
        frontendStackPanel,
        backendAutomationPanel,
        searchVisibilityPanel,
        socialMediaPanel,
      ].filter((panel): panel is HTMLElement => Boolean(panel));
      const horizontalSystemPanels = gsap.utils.toArray<HTMLElement>(
        "[data-horizontal-chapter]",
        horizontalRef.current,
      );

      galaxyProgressRef.current = 0;
      ScrollTrigger.create({
        id: "editorial-galaxy-progress",
        trigger: principlesRef.current,
        start: "top bottom",
        end: "bottom bottom",
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          galaxyProgressRef.current = self.progress;
        },
        onLeave: () => {
          galaxyProgressRef.current = 1;
        },
        onLeaveBack: () => {
          galaxyProgressRef.current = 0;
        },
      });

      shapeProgressRef.current = 0;
      const orbShapeTrigger = ScrollTrigger.create({
        id: "editorial-orb-shape-progress",
        trigger: orbEvolutionRef.current,
        start: "top bottom",
        end: "bottom bottom",
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          shapeProgressRef.current = self.progress;
          if (!self.isActive) return;
          updateNarrativeState({ chapterId: "vanta-handoff", localProgress: self.progress });
        },
        onLeave: () => {
          shapeProgressRef.current = 1;
        },
        onLeaveBack: () => {
          shapeProgressRef.current = 0;
        },
      });

      if (staticEditorial) {
        horizontalProgressRef.current = 1;
        gsap.set(missionCharacters, { clearProps: "all" });
        gsap.set(".principle-line h3, .principle-summary, .principle-char", {
          clearProps: "all",
          autoAlpha: 1,
        });
        gsap.set(
          [
            horizontalQuestionPanel,
            horizontalQuestionReveal,
            horizontalQuestionSummary,
            horizontalAnswerPanel,
            ...horizontalAnswerItems,
            horizontalCreativePanel,
            horizontalCreativeFrame,
            horizontalCreativeGlow,
            horizontalCreativeCurrent,
            horizontalCreativeHub,
            creativeStackPanel,
            ...creativeStackBraces,
            creativeStackHeadline,
            creativeStackDivider,
            creativeStackKicker,
            creativeStackBody,
            creativeStackWatermark,
            frontendStackPanel,
            frontendStackFrame,
            frontendStackGlow,
            frontendStackCurrent,
            frontendStackHub,
            engineerPanel,
            ...engineerTitleLines,
            engineerBody,
            backendAutomationPanel,
            backendAutomationFrame,
            backendAutomationGlow,
            backendAutomationCurrent,
            backendAutomationHub,
            unifiedSystemPanel,
            ...unifiedSystemTitleLines,
            unifiedSystemBody,
            searchVisibilityPanel,
            searchVisibilityFrame,
            searchVisibilityGlow,
            searchVisibilityCurrent,
            searchVisibilityHub,
            measuredPanel,
            ...measuredTitleLines,
            measuredBody,
            socialMediaPanel,
            socialMediaFrame,
            socialMediaGlow,
            socialMediaCurrent,
            socialMediaHub,
            platformPresencePanel,
            ...platformPresenceTitleLines,
            platformPresenceBody,
            ...horizontalProofLines,
          ].filter(Boolean),
          { clearProps: "all", autoAlpha: 1 },
        );
        horizontalSystemPanels.forEach((panel) => {
          panel.dataset.state = "TEXT_READ";
        });
        const staticEntries = [
          { element: missionRef.current, id: "mission", order: 3 },
          ...principleLines.map((element, index) => ({
            element,
            id: `principle-${index + 1}`,
            order: 4 + index,
          })),
          { element: orbEvolutionRef.current, id: "vanta-handoff", order: 11 },
          ...horizontalSystemPanels.map((element, index) => ({
            element,
            id: element.dataset.horizontalChapter ?? `horizontal-panel-${index + 1}`,
            order: 12 + index,
          })),
        ];
        const staticUnregister = staticEntries.map(({ element, id, order }) =>
          registerChapter({
            id,
            order,
            getRange: () => {
              const bounds = element.getBoundingClientRect();
              const start = bounds.top + window.scrollY;
              return { start, end: start + Math.max(1, bounds.height) };
            },
          }),
        );
        const staticObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const match = staticEntries.find(({ element }) => element === entry.target);
              if (!match) return;
              (entry.target as HTMLElement).dataset.lifecycle = "active";
              updateNarrativeState({ chapterId: match.id, localProgress: 0 });
            });
          },
          { rootMargin: "-38% 0px -56%", threshold: 0 },
        );
        staticEntries.forEach(({ element }) => staticObserver.observe(element));
        requestRefresh("editorial-static-ready");
        return () => {
          staticObserver.disconnect();
          staticUnregister.forEach((cleanup) => cleanup());
        };
      }

      horizontalProgressRef.current = 0;
      if (horizontalQuestionPanel) {
        gsap.set(horizontalQuestionPanel, { autoAlpha: 0 });
      }
      if (horizontalQuestionReveal) {
        gsap.set(horizontalQuestionReveal, {
          y: 28,
          autoAlpha: 0,
          filter: "blur(12px)",
        });
      }
      if (horizontalQuestionSummary) {
        gsap.set(horizontalQuestionSummary, {
          y: 36,
          autoAlpha: 0,
          filter: "blur(10px)",
        });
      }
      if (horizontalAnswerPanel) {
        gsap.set(horizontalAnswerPanel, {
          autoAlpha: 0,
          clipPath: "inset(0% 0% 0% 0%)",
        });
      }
      gsap.set(horizontalAnswerItems, {
        x: 96,
        autoAlpha: 0,
        filter: "blur(10px)",
      });
      if (horizontalCreativePanel) {
        gsap.set(horizontalCreativePanel, { autoAlpha: 0 });
      }
      if (horizontalCreativeFrame) {
        gsap.set(horizontalCreativeFrame, {
          xPercent: -8,
          yPercent: 1.5,
          scale: 0.89,
          rotateX: 2,
          rotateY: -8,
          transformPerspective: 1400,
          transformOrigin: "34% 45%",
          autoAlpha: 0,
          filter: "blur(18px) brightness(1.45) saturate(0.55)",
          "--creative-reveal-edge": "-10%",
        });
      }
      if (horizontalCreativeGlow) {
        gsap.set(horizontalCreativeGlow, { autoAlpha: 0 });
      }
      if (horizontalCreativeCurrent) {
        gsap.set(horizontalCreativeCurrent, { autoAlpha: 0 });
      }
      if (horizontalCreativeHub) {
        gsap.set(horizontalCreativeHub, { scale: 0.72, autoAlpha: 0 });
      }
      if (creativeStackPanel) {
        gsap.set(creativeStackPanel, { xPercent: 76, autoAlpha: 1 });
      }
      gsap.set(creativeStackBraces, {
        x: (index) => (index === 0 ? -88 : 88),
        scaleY: 0.58,
        autoAlpha: 0,
        filter: "blur(16px)",
      });
      if (creativeStackHeadline) {
        gsap.set(creativeStackHeadline, {
          x: 42,
          y: 18,
          scale: 0.975,
          autoAlpha: 0,
          filter: "blur(14px)",
        });
      }
      if (creativeStackDivider) {
        gsap.set(creativeStackDivider, {
          scaleX: 0,
          autoAlpha: 0,
          transformOrigin: "50% 50%",
        });
      }
      if (creativeStackKicker) {
        gsap.set(creativeStackKicker, {
          y: 22,
          autoAlpha: 0,
          filter: "blur(10px)",
        });
      }
      if (creativeStackBody) {
        gsap.set(creativeStackBody, {
          y: 30,
          autoAlpha: 0,
          filter: "blur(12px)",
        });
      }
      if (creativeStackWatermark) {
        gsap.set(creativeStackWatermark, {
          scale: 1.08,
          autoAlpha: 0,
          filter: "blur(18px)",
        });
      }
      if (frontendStackPanel) {
        gsap.set(frontendStackPanel, { xPercent: 76, autoAlpha: 0 });
      }
      if (frontendStackFrame) {
        gsap.set(frontendStackFrame, {
          xPercent: 2,
          yPercent: -1.25,
          scale: 0.965,
          rotateX: -2.5,
          rotateY: 5.5,
          transformPerspective: 1600,
          transformOrigin: "50% 47%",
          autoAlpha: 1,
          filter: "blur(12px) brightness(1.22) saturate(0.72)",
          "--creative-reveal-edge": "8%",
        });
      }
      if (frontendStackGlow) {
        gsap.set(frontendStackGlow, { autoAlpha: 0 });
      }
      if (frontendStackCurrent) {
        gsap.set(frontendStackCurrent, { autoAlpha: 0 });
      }
      if (frontendStackHub) {
        gsap.set(frontendStackHub, { scale: 0.72, autoAlpha: 0 });
      }
      if (engineerPanel) {
        gsap.set(engineerPanel, { xPercent: 76, autoAlpha: 0 });
      }
      gsap.set(engineerTitleLines, {
        x: 54,
        autoAlpha: 0,
        filter: "blur(14px)",
      });
      if (engineerBody) {
        gsap.set(engineerBody, {
          x: 64,
          autoAlpha: 0,
          filter: "blur(12px)",
        });
      }
      if (backendAutomationPanel) {
        gsap.set(backendAutomationPanel, { xPercent: 76, autoAlpha: 0 });
      }
      if (backendAutomationFrame) {
        gsap.set(backendAutomationFrame, {
          xPercent: 2,
          yPercent: 1.25,
          scale: 0.965,
          rotateX: 2.5,
          rotateY: -5.5,
          transformPerspective: 1600,
          transformOrigin: "50% 48%",
          autoAlpha: 1,
          filter: "blur(12px) brightness(1.22) saturate(0.72)",
          "--creative-reveal-edge": "8%",
        });
      }
      if (backendAutomationGlow) {
        gsap.set(backendAutomationGlow, { autoAlpha: 0 });
      }
      if (backendAutomationCurrent) {
        gsap.set(backendAutomationCurrent, { autoAlpha: 0 });
      }
      if (backendAutomationHub) {
        gsap.set(backendAutomationHub, { scale: 0.72, autoAlpha: 0 });
      }
      if (unifiedSystemPanel) {
        gsap.set(unifiedSystemPanel, { xPercent: 76, autoAlpha: 0 });
      }
      gsap.set(unifiedSystemTitleLines, {
        x: 54,
        autoAlpha: 0,
        filter: "blur(14px)",
      });
      if (unifiedSystemBody) {
        gsap.set(unifiedSystemBody, {
          x: 64,
          autoAlpha: 0,
          filter: "blur(12px)",
        });
      }
      if (searchVisibilityPanel) {
        gsap.set(searchVisibilityPanel, { xPercent: 76, autoAlpha: 0 });
      }
      if (searchVisibilityFrame) {
        gsap.set(searchVisibilityFrame, {
          xPercent: 2,
          yPercent: -1.35,
          scale: 0.965,
          rotateX: -2.25,
          rotateY: 4.75,
          transformPerspective: 1600,
          transformOrigin: "50% 48%",
          autoAlpha: 1,
          filter: "blur(12px) brightness(1.22) saturate(0.72)",
          "--creative-reveal-edge": "8%",
        });
      }
      if (searchVisibilityGlow) {
        gsap.set(searchVisibilityGlow, { autoAlpha: 0 });
      }
      if (searchVisibilityCurrent) {
        gsap.set(searchVisibilityCurrent, { autoAlpha: 0 });
      }
      if (searchVisibilityHub) {
        gsap.set(searchVisibilityHub, { scale: 0.72, autoAlpha: 0 });
      }
      if (measuredPanel) {
        gsap.set(measuredPanel, { xPercent: 76, autoAlpha: 0 });
      }
      gsap.set(measuredTitleLines, {
        x: 54,
        autoAlpha: 0,
        filter: "blur(14px)",
      });
      if (measuredBody) {
        gsap.set(measuredBody, {
          x: 64,
          autoAlpha: 0,
          filter: "blur(12px)",
        });
      }
      if (socialMediaPanel) {
        gsap.set(socialMediaPanel, { xPercent: 76, autoAlpha: 0 });
      }
      if (socialMediaFrame) {
        gsap.set(socialMediaFrame, {
          xPercent: 2,
          yPercent: 1.1,
          scale: 0.965,
          rotateX: 2.25,
          rotateY: -4.75,
          transformPerspective: 1600,
          transformOrigin: "50% 46%",
          autoAlpha: 1,
          filter: "blur(12px) brightness(1.22) saturate(0.72)",
          "--creative-reveal-edge": "8%",
        });
      }
      if (socialMediaGlow) {
        gsap.set(socialMediaGlow, { autoAlpha: 0 });
      }
      if (socialMediaCurrent) {
        gsap.set(socialMediaCurrent, { autoAlpha: 0 });
      }
      if (socialMediaHub) {
        gsap.set(socialMediaHub, { scale: 0.72, autoAlpha: 0 });
      }
      if (platformPresencePanel) {
        gsap.set(platformPresencePanel, { xPercent: 76, autoAlpha: 0 });
      }
      gsap.set(platformPresenceTitleLines, {
        x: 54,
        autoAlpha: 0,
        filter: "blur(14px)",
      });
      if (platformPresenceBody) {
        gsap.set(platformPresenceBody, {
          x: 64,
          autoAlpha: 0,
          filter: "blur(12px)",
        });
      }
      gsap.set(horizontalProofLines, {
        y: 18,
        autoAlpha: 0,
        filter: "blur(9px)",
      });
      if (horizontalExperienceUi) {
        gsap.set(horizontalExperienceUi, { autoAlpha: 0, y: 16 });
      }

      let soundEnabled = false;
      let audioContext: AudioContext | null = null;
      let lastSoundChapter = -1;
      let renderedChapter = -1;

      const playChapterTone = (chapterIndex: number, direction: number) => {
        if (!soundEnabled || !audioContext || audioContext.state !== "running") return;

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const now = audioContext.currentTime;
        const frequencies = [164.81, 196, 246.94, 329.63, 392];
        oscillator.type = chapterIndex % 2 === 0 ? "sine" : "triangle";
        oscillator.frequency.setValueAtTime(
          frequencies[chapterIndex] * (direction < 0 ? 0.75 : 1),
          now,
        );
        oscillator.frequency.exponentialRampToValueAtTime(
          frequencies[chapterIndex] * (direction < 0 ? 0.86 : 1.18),
          now + 0.16,
        );
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.025, now + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
      };

      const updateHorizontalExperience = (
        progress: number,
        direction: number,
        reportNarrativeState = true,
      ) => {
        const timelineTime = progress * HORIZONTAL_TIMELINE_DURATION;
        const systemProgress = gsap.utils.clamp(
          0,
          1,
          (timelineTime - HORIZONTAL_CHAPTERS[0].start) /
            (HORIZONTAL_CHAPTERS[HORIZONTAL_CHAPTERS.length - 1].imageEnd -
              HORIZONTAL_CHAPTERS[0].start),
        );
        let chapterIndex = 0;

        HORIZONTAL_CHAPTERS.forEach((chapter, index) => {
          if (timelineTime >= chapter.start - 0.02) chapterIndex = index;
        });

        const activeChapter = HORIZONTAL_CHAPTERS[chapterIndex];
        const nextChapterStart =
          HORIZONTAL_CHAPTERS[chapterIndex + 1]?.start ?? HORIZONTAL_TIMELINE_DURATION;
        const imagePhase = timelineTime < activeChapter.imageEnd;
        const phaseStart = imagePhase ? activeChapter.start : activeChapter.imageEnd;
        const phaseEnd = imagePhase ? activeChapter.imageEnd : nextChapterStart;
        const phaseProgress = gsap.utils.clamp(
          0,
          1,
          (timelineTime - phaseStart) / Math.max(0.001, phaseEnd - phaseStart),
        );
        const chapterId = `${activeChapter.id}-${imagePhase ? "image" : "text"}`;
        const storyState = imagePhase
          ? phaseProgress < 0.24
            ? "IMAGE_REVEAL"
            : "IMAGE_READ"
          : phaseProgress < 0.24
            ? "IMAGE_EXIT_TEXT_ENTRY"
            : phaseProgress > 0.84
              ? "TEXT_EXIT"
              : "TEXT_READ";
        horizontalRef.current!.dataset.storyState = storyState;
        if (reportNarrativeState) {
          updateNarrativeState({ chapterId, localProgress: phaseProgress });
        }

        horizontalSystemPanels.forEach((panel) => {
          const panelId = panel.dataset.horizontalChapter;
          const panelChapterIndex = HORIZONTAL_CHAPTERS.findIndex(
            (chapter) => panelId?.startsWith(chapter.id),
          );
          if (panelId === chapterId) panel.dataset.state = storyState;
          else if (panelChapterIndex > chapterIndex) panel.dataset.state = "PRELOAD";
          else panel.dataset.state = "TEXT_EXIT";
        });

        horizontalRef.current?.style.setProperty(
          "--horizontal-system-progress",
          systemProgress.toFixed(4),
        );
        horizontalProgressRail?.style.setProperty(
          "--horizontal-system-progress",
          systemProgress.toFixed(4),
        );

        if (horizontalExperienceUi) {
          horizontalExperienceUi.dataset.visible =
            timelineTime >= 0.74 && timelineTime < HORIZONTAL_TIMELINE_DURATION - 0.08
              ? "true"
              : "false";
        }

        if (renderedChapter !== chapterIndex) {
          renderedChapter = chapterIndex;
          if (horizontalChapterIndex) {
            horizontalChapterIndex.textContent = String(chapterIndex + 1).padStart(2, "0");
          }
          if (horizontalChapterLabel) {
            horizontalChapterLabel.textContent = HORIZONTAL_CHAPTERS[chapterIndex].label;
          }
          if (lastSoundChapter !== chapterIndex) {
            playChapterTone(chapterIndex, direction);
            lastSoundChapter = chapterIndex;
          }
        }

        horizontalImagePanels.forEach((panel, index) => {
          const chapter = HORIZONTAL_CHAPTERS[index];
          panel.classList.toggle(
            "is-active",
            timelineTime >= chapter.start - 0.02 && timelineTime < chapter.imageEnd + 0.035,
          );
        });
      };

      const horizontalTimeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          id: "vanta-horizontal-transition",
          trigger: horizontalRef.current,
          start: "top top",
          end: () =>
            `+=${Math.min(
              HORIZONTAL_SCROLL_MAX,
              Math.max(
                window.innerWidth * HORIZONTAL_SCROLL_MULTIPLIER,
                HORIZONTAL_SCROLL_MIN,
              ),
            )}`,
          pin: horizontalRef.current,
          pinSpacing: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            horizontalProgressRef.current = Math.min(
              self.progress * HORIZONTAL_TIMELINE_DURATION,
              1,
            );
            updateHorizontalExperience(self.progress, self.direction, self.isActive);
          },
          onLeave: () => {
            horizontalProgressRef.current = 1;
            horizontalImagePanels.forEach((panel) => panel.classList.remove("is-active"));
          },
          onLeaveBack: () => {
            horizontalProgressRef.current = 0;
            horizontalImagePanels.forEach((panel) => panel.classList.remove("is-active"));
          },
        },
      });

      const horizontalTrigger = horizontalTimeline.scrollTrigger;
      const horizontalUnregister = HORIZONTAL_CHAPTERS.flatMap((chapter, index) => {
        const nextStart = HORIZONTAL_CHAPTERS[index + 1]?.start ?? HORIZONTAL_TIMELINE_DURATION;
        return [
          { id: `${chapter.id}-image`, start: chapter.start, end: chapter.imageEnd },
          { id: `${chapter.id}-text`, start: chapter.imageEnd, end: nextStart },
        ].map((panel, panelIndex) =>
          registerChapter({
            id: panel.id,
            order: 12 + index * 2 + panelIndex,
            getRange: () =>
              horizontalTrigger
                ? {
                    start:
                      horizontalTrigger.start +
                      (horizontalTrigger.end - horizontalTrigger.start) *
                        (panel.start / HORIZONTAL_TIMELINE_DURATION),
                    end:
                      horizontalTrigger.start +
                      (horizontalTrigger.end - horizontalTrigger.start) *
                        (panel.end / HORIZONTAL_TIMELINE_DURATION),
                  }
                : null,
          }),
        );
      });

      // Keep the hand-off compact: the question begins while the last edge of
      // the orb is clearing camera-left, so motion continues without an empty
      // screen between the character turn and the editorial reveal.
      if (horizontalQuestionPanel) {
        horizontalTimeline.set(horizontalQuestionPanel, { autoAlpha: 1 }, 0.2);
      }
      if (horizontalQuestionReveal) {
        horizontalTimeline.to(
          horizontalQuestionReveal,
          {
            y: 0,
            autoAlpha: 1,
            filter: "blur(0px)",
            duration: 0.12,
            ease: "power3.out",
          },
          0.21,
        );
      }
      if (horizontalQuestionSummary) {
        horizontalTimeline.to(
          horizontalQuestionSummary,
          {
            y: 0,
            autoAlpha: 1,
            filter: "blur(0px)",
            duration: 0.1,
            ease: "power3.out",
          },
          0.28,
        );
      }
      if (horizontalQuestionPanel) {
        horizontalTimeline.to(
          horizontalQuestionPanel,
          {
            x: "-9vw",
            autoAlpha: 0,
            filter: "blur(12px)",
            duration: 0.14,
            ease: "power2.in",
          },
          0.5,
        );
      }
      if (horizontalAnswerPanel) {
        horizontalTimeline.to(
          horizontalAnswerPanel,
          { autoAlpha: 1, duration: 0.015, ease: "none" },
          0.585,
        );
      }
      horizontalTimeline.to(
        horizontalAnswerItems,
        {
          x: 0,
          autoAlpha: 1,
          filter: "blur(0px)",
          duration: 0.08,
          stagger: 0.005,
          ease: "power3.out",
        },
        0.6,
      );
      if (horizontalAnswerPanel) {
        horizontalTimeline.to(
          horizontalAnswerPanel,
          {
            clipPath: "inset(0% 0% 0% 100%)",
            autoAlpha: 0,
            filter: "blur(7px)",
            duration: 0.105,
            ease: "power2.inOut",
          },
          0.75,
        );
      }
      horizontalTimeline.addLabel("creativeReveal", 0.788);
      if (horizontalExperienceUi) {
        horizontalTimeline.to(
          horizontalExperienceUi,
          { y: 0, autoAlpha: 1, duration: 0.12, ease: "power3.out" },
          "creativeReveal-=0.04",
        );
      }
      if (horizontalCreativePanel) {
        horizontalTimeline.to(
          horizontalCreativePanel,
          { autoAlpha: 1, duration: 0.02, ease: "none" },
          "creativeReveal-=0.004",
        );
      }
      if (horizontalCreativeFrame) {
        horizontalTimeline.fromTo(
          horizontalCreativeFrame,
          { "--creative-reveal-edge": "-10%" },
          {
            "--creative-reveal-edge": "100%",
            duration: 0.11,
            ease: "power2.out",
            immediateRender: false,
          },
          "creativeReveal",
        );
        horizontalTimeline.to(
          horizontalCreativeFrame,
          {
            xPercent: -1.25,
            yPercent: 0,
            scale: 1.025,
            rotateX: 0,
            rotateY: 0,
            autoAlpha: 1,
            filter: "blur(0px) brightness(1.08) saturate(1.08)",
            duration: 0.11,
            ease: "power2.out",
          },
          "creativeReveal",
        );
        horizontalTimeline.to(
          horizontalCreativeFrame,
          {
            xPercent: -2,
            scale: 1,
            filter: "blur(0px) brightness(1) saturate(1)",
            duration: 0.075,
            ease: "power2.out",
          },
          "creativeReveal+=0.11",
        );
      }
      if (horizontalCreativeGlow) {
        horizontalTimeline.to(
          horizontalCreativeGlow,
          { autoAlpha: 0.98, duration: 0.1, ease: "power2.out" },
          "creativeReveal+=0.005",
        );
      }
      if (horizontalCreativeCurrent) {
        horizontalTimeline.to(
          horizontalCreativeCurrent,
          { autoAlpha: 0.88, duration: 0.12, ease: "power2.out" },
          "creativeReveal+=0.018",
        );
      }
      if (horizontalCreativeHub) {
        horizontalTimeline.to(
          horizontalCreativeHub,
          { scale: 1, autoAlpha: 1, duration: 0.11, ease: "back.out(1.45)" },
          "creativeReveal+=0.03",
        );
      }
      horizontalTimeline.addLabel("creativeStackReveal", 0.98);
      if (horizontalCreativeFrame) {
        horizontalTimeline.to(
          horizontalCreativeFrame,
          {
            xPercent: -112,
            scale: 1,
            autoAlpha: 1,
            filter: "blur(0px) brightness(1) saturate(1)",
            duration: 0.24,
            ease: "power2.inOut",
          },
          "creativeStackReveal",
        );
      }
      if (creativeStackPanel) {
        horizontalTimeline.to(
          creativeStackPanel,
          {
            xPercent: 0,
            duration: 0.24,
            ease: "power2.inOut",
          },
          "creativeStackReveal",
        );
      }
      if (creativeStackWatermark) {
        horizontalTimeline.to(
          creativeStackWatermark,
          {
            scale: 1,
            autoAlpha: 0.07,
            filter: "blur(4px)",
            duration: 0.2,
            ease: "power2.out",
          },
          "creativeStackReveal",
        );
      }
      horizontalTimeline.to(
        creativeStackBraces,
        {
          x: 0,
          scaleY: 1,
          autoAlpha: 1,
          filter: "blur(0px)",
          duration: 0.18,
          stagger: 0.015,
          ease: "power3.out",
        },
        "creativeStackReveal+=0.005",
      );
      if (creativeStackHeadline) {
        horizontalTimeline.to(
          creativeStackHeadline,
          {
            x: 0,
            y: 0,
            scale: 1,
            autoAlpha: 1,
            filter: "blur(0px)",
            duration: 0.15,
            ease: "power3.out",
          },
          "creativeStackReveal+=0.015",
        );
      }
      if (creativeStackDivider) {
        horizontalTimeline.to(
          creativeStackDivider,
          {
            scaleX: 1,
            autoAlpha: 1,
            duration: 0.13,
            ease: "power3.inOut",
          },
          "creativeStackReveal+=0.075",
        );
      }
      if (creativeStackKicker) {
        horizontalTimeline.to(
          creativeStackKicker,
          {
            y: 0,
            autoAlpha: 1,
            filter: "blur(0px)",
            duration: 0.13,
            ease: "power3.out",
          },
          "creativeStackReveal+=0.095",
        );
      }
      if (creativeStackBody) {
        horizontalTimeline.to(
          creativeStackBody,
          {
            y: 0,
            autoAlpha: 1,
            filter: "blur(0px)",
            duration: 0.15,
            ease: "power3.out",
          },
          "creativeStackReveal+=0.125",
        );
      }
      if (horizontalProofLines[0]) {
        horizontalTimeline.to(
          horizontalProofLines[0],
          { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.13, ease: "power3.out" },
          "creativeStackReveal+=0.16",
        );
      }
      horizontalTimeline.addLabel("frontendStackReveal", 1.34);
      if (creativeStackPanel) {
        horizontalTimeline.to(
          creativeStackPanel,
          {
            xPercent: -100,
            duration: 0.24,
            ease: "power2.inOut",
          },
          "frontendStackReveal",
        );
      }
      if (frontendStackPanel) {
        horizontalTimeline.set(
          frontendStackPanel,
          { autoAlpha: 1 },
          "frontendStackReveal",
        );
        horizontalTimeline.to(
          frontendStackPanel,
          {
            xPercent: 0,
            duration: 0.24,
            ease: "power2.inOut",
          },
          "frontendStackReveal",
        );
      }
      if (frontendStackFrame) {
        horizontalTimeline.to(
          frontendStackFrame,
          {
            xPercent: 0,
            yPercent: 0,
            scale: 1,
            rotateX: 0,
            rotateY: 0,
            filter: "blur(0px) brightness(1) saturate(1)",
            "--creative-reveal-edge": "100%",
            duration: 0.22,
            ease: "power2.out",
          },
          "frontendStackReveal",
        );
      }
      if (frontendStackGlow) {
        horizontalTimeline.to(
          frontendStackGlow,
          { autoAlpha: 0.98, duration: 0.14, ease: "power2.out" },
          "frontendStackReveal+=0.035",
        );
      }
      if (frontendStackCurrent) {
        horizontalTimeline.to(
          frontendStackCurrent,
          { autoAlpha: 0.88, duration: 0.15, ease: "power2.out" },
          "frontendStackReveal+=0.05",
        );
      }
      if (frontendStackHub) {
        horizontalTimeline.to(
          frontendStackHub,
          { scale: 1, autoAlpha: 1, duration: 0.14, ease: "back.out(1.35)" },
          "frontendStackReveal+=0.065",
        );
      }
      if (frontendStackFrame) {
        horizontalTimeline.to(
          frontendStackFrame,
          { yPercent: -0.35, rotateY: -1.1, scale: 1.012, duration: 0.14, ease: "sine.inOut" },
          "frontendStackReveal+=0.17",
        );
      }
      horizontalTimeline.addLabel("engineerExperienceReveal", 1.69);
      if (frontendStackFrame) {
        horizontalTimeline.to(
          frontendStackFrame,
          {
            xPercent: -112,
            scale: 1,
            autoAlpha: 1,
            filter: "blur(0px) brightness(1) saturate(1)",
            duration: 0.24,
            ease: "power2.inOut",
          },
          "engineerExperienceReveal",
        );
      }
      if (engineerPanel) {
        horizontalTimeline.set(
          engineerPanel,
          { autoAlpha: 1 },
          "engineerExperienceReveal",
        );
        horizontalTimeline.to(
          engineerPanel,
          {
            xPercent: 0,
            duration: 0.24,
            ease: "power2.inOut",
          },
          "engineerExperienceReveal",
        );
      }
      horizontalTimeline.to(
        engineerTitleLines,
        {
          x: 0,
          autoAlpha: 1,
          filter: "blur(0px)",
          duration: 0.17,
          stagger: 0.022,
          ease: "power3.out",
        },
        "engineerExperienceReveal+=0.02",
      );
      if (engineerBody) {
        horizontalTimeline.to(
          engineerBody,
          {
            x: 0,
            autoAlpha: 1,
            filter: "blur(0px)",
            duration: 0.17,
            ease: "power3.out",
          },
          "engineerExperienceReveal+=0.11",
        );
      }
      if (horizontalProofLines[1]) {
        horizontalTimeline.to(
          horizontalProofLines[1],
          { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.13, ease: "power3.out" },
          "engineerExperienceReveal+=0.15",
        );
      }
      horizontalTimeline.addLabel("backendAutomationReveal", 2.08);
      if (engineerPanel) {
        horizontalTimeline.to(
          engineerPanel,
          {
            xPercent: -100,
            duration: 0.24,
            ease: "power2.inOut",
          },
          "backendAutomationReveal",
        );
      }
      if (backendAutomationPanel) {
        horizontalTimeline.set(
          backendAutomationPanel,
          { autoAlpha: 1 },
          "backendAutomationReveal",
        );
        horizontalTimeline.to(
          backendAutomationPanel,
          {
            xPercent: 0,
            duration: 0.24,
            ease: "power2.inOut",
          },
          "backendAutomationReveal",
        );
      }
      if (backendAutomationFrame) {
        horizontalTimeline.to(
          backendAutomationFrame,
          {
            xPercent: 0,
            yPercent: 0,
            scale: 1,
            rotateX: 0,
            rotateY: 0,
            filter: "blur(0px) brightness(1) saturate(1)",
            "--creative-reveal-edge": "100%",
            duration: 0.22,
            ease: "power2.out",
          },
          "backendAutomationReveal",
        );
      }
      if (backendAutomationGlow) {
        horizontalTimeline.to(
          backendAutomationGlow,
          { autoAlpha: 0.98, duration: 0.14, ease: "power2.out" },
          "backendAutomationReveal+=0.035",
        );
      }
      if (backendAutomationCurrent) {
        horizontalTimeline.to(
          backendAutomationCurrent,
          { autoAlpha: 0.88, duration: 0.15, ease: "power2.out" },
          "backendAutomationReveal+=0.05",
        );
      }
      if (backendAutomationHub) {
        horizontalTimeline.to(
          backendAutomationHub,
          { scale: 1, autoAlpha: 1, duration: 0.14, ease: "back.out(1.35)" },
          "backendAutomationReveal+=0.065",
        );
      }
      if (backendAutomationFrame) {
        horizontalTimeline.to(
          backendAutomationFrame,
          { yPercent: 0.35, rotateY: 1.1, scale: 1.012, duration: 0.14, ease: "sine.inOut" },
          "backendAutomationReveal+=0.17",
        );
      }
      horizontalTimeline.addLabel("unifiedSystemReveal", 2.43);
      if (backendAutomationFrame) {
        horizontalTimeline.to(
          backendAutomationFrame,
          {
            xPercent: -112,
            scale: 1,
            autoAlpha: 1,
            filter: "blur(0px) brightness(1) saturate(1)",
            duration: 0.24,
            ease: "power2.inOut",
          },
          "unifiedSystemReveal",
        );
      }
      if (unifiedSystemPanel) {
        horizontalTimeline.set(
          unifiedSystemPanel,
          { autoAlpha: 1 },
          "unifiedSystemReveal",
        );
        horizontalTimeline.to(
          unifiedSystemPanel,
          {
            xPercent: 0,
            duration: 0.24,
            ease: "power2.inOut",
          },
          "unifiedSystemReveal",
        );
      }
      horizontalTimeline.to(
        unifiedSystemTitleLines,
        {
          x: 0,
          autoAlpha: 1,
          filter: "blur(0px)",
          duration: 0.17,
          stagger: 0.022,
          ease: "power3.out",
        },
        "unifiedSystemReveal+=0.02",
      );
      if (unifiedSystemBody) {
        horizontalTimeline.to(
          unifiedSystemBody,
          {
            x: 0,
            autoAlpha: 1,
            filter: "blur(0px)",
            duration: 0.17,
            ease: "power3.out",
          },
          "unifiedSystemReveal+=0.11",
        );
      }
      if (horizontalProofLines[2]) {
        horizontalTimeline.to(
          horizontalProofLines[2],
          { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.13, ease: "power3.out" },
          "unifiedSystemReveal+=0.15",
        );
      }
      horizontalTimeline.addLabel("searchVisibilityReveal", 2.82);
      if (unifiedSystemPanel) {
        horizontalTimeline.to(
          unifiedSystemPanel,
          {
            xPercent: -100,
            duration: 0.24,
            ease: "power2.inOut",
          },
          "searchVisibilityReveal",
        );
      }
      if (searchVisibilityPanel) {
        horizontalTimeline.set(
          searchVisibilityPanel,
          { autoAlpha: 1 },
          "searchVisibilityReveal",
        );
        horizontalTimeline.to(
          searchVisibilityPanel,
          {
            xPercent: 0,
            duration: 0.24,
            ease: "power2.inOut",
          },
          "searchVisibilityReveal",
        );
      }
      if (searchVisibilityFrame) {
        horizontalTimeline.to(
          searchVisibilityFrame,
          {
            xPercent: 0,
            yPercent: 0,
            scale: 1,
            rotateX: 0,
            rotateY: 0,
            filter: "blur(0px) brightness(1) saturate(1)",
            "--creative-reveal-edge": "100%",
            duration: 0.22,
            ease: "power2.out",
          },
          "searchVisibilityReveal",
        );
      }
      if (searchVisibilityGlow) {
        horizontalTimeline.to(
          searchVisibilityGlow,
          { autoAlpha: 0.98, duration: 0.14, ease: "power2.out" },
          "searchVisibilityReveal+=0.035",
        );
      }
      if (searchVisibilityCurrent) {
        horizontalTimeline.to(
          searchVisibilityCurrent,
          { autoAlpha: 0.88, duration: 0.15, ease: "power2.out" },
          "searchVisibilityReveal+=0.05",
        );
      }
      if (searchVisibilityHub) {
        horizontalTimeline.to(
          searchVisibilityHub,
          { scale: 1, autoAlpha: 1, duration: 0.14, ease: "back.out(1.35)" },
          "searchVisibilityReveal+=0.065",
        );
      }
      if (searchVisibilityFrame) {
        horizontalTimeline.to(
          searchVisibilityFrame,
          { yPercent: -0.3, rotateY: -0.9, scale: 1.01, duration: 0.14, ease: "sine.inOut" },
          "searchVisibilityReveal+=0.17",
        );
      }
      horizontalTimeline.addLabel("measuredImprovedReveal", 3.17);
      if (searchVisibilityFrame) {
        horizontalTimeline.to(
          searchVisibilityFrame,
          {
            xPercent: -112,
            scale: 1,
            autoAlpha: 1,
            filter: "blur(0px) brightness(1) saturate(1)",
            duration: 0.24,
            ease: "power2.inOut",
          },
          "measuredImprovedReveal",
        );
      }
      if (measuredPanel) {
        horizontalTimeline.set(
          measuredPanel,
          { autoAlpha: 1 },
          "measuredImprovedReveal",
        );
        horizontalTimeline.to(
          measuredPanel,
          {
            xPercent: 0,
            duration: 0.24,
            ease: "power2.inOut",
          },
          "measuredImprovedReveal",
        );
      }
      horizontalTimeline.to(
        measuredTitleLines,
        {
          x: 0,
          autoAlpha: 1,
          filter: "blur(0px)",
          duration: 0.17,
          stagger: 0.022,
          ease: "power3.out",
        },
        "measuredImprovedReveal+=0.02",
      );
      if (measuredBody) {
        horizontalTimeline.to(
          measuredBody,
          {
            x: 0,
            autoAlpha: 1,
            filter: "blur(0px)",
            duration: 0.17,
            ease: "power3.out",
          },
          "measuredImprovedReveal+=0.11",
        );
      }
      if (horizontalProofLines[3]) {
        horizontalTimeline.to(
          horizontalProofLines[3],
          { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.13, ease: "power3.out" },
          "measuredImprovedReveal+=0.15",
        );
      }
      horizontalTimeline.addLabel("socialMediaReveal", 3.52);
      if (measuredPanel) {
        horizontalTimeline.to(
          measuredPanel,
          {
            xPercent: -100,
            duration: 0.24,
            ease: "power2.inOut",
          },
          "socialMediaReveal",
        );
      }
      if (socialMediaPanel) {
        horizontalTimeline.set(
          socialMediaPanel,
          { autoAlpha: 1 },
          "socialMediaReveal",
        );
        horizontalTimeline.to(
          socialMediaPanel,
          {
            xPercent: 0,
            duration: 0.24,
            ease: "power2.inOut",
          },
          "socialMediaReveal",
        );
      }
      if (socialMediaFrame) {
        horizontalTimeline.to(
          socialMediaFrame,
          {
            xPercent: 0,
            yPercent: 0,
            scale: 1,
            rotateX: 0,
            rotateY: 0,
            filter: "blur(0px) brightness(1) saturate(1)",
            "--creative-reveal-edge": "100%",
            duration: 0.22,
            ease: "power2.out",
          },
          "socialMediaReveal",
        );
      }
      if (socialMediaGlow) {
        horizontalTimeline.to(
          socialMediaGlow,
          { autoAlpha: 0.94, duration: 0.14, ease: "power2.out" },
          "socialMediaReveal+=0.035",
        );
      }
      if (socialMediaCurrent) {
        horizontalTimeline.to(
          socialMediaCurrent,
          { autoAlpha: 0.84, duration: 0.15, ease: "power2.out" },
          "socialMediaReveal+=0.05",
        );
      }
      if (socialMediaHub) {
        horizontalTimeline.to(
          socialMediaHub,
          { scale: 1, autoAlpha: 0.82, duration: 0.14, ease: "back.out(1.35)" },
          "socialMediaReveal+=0.065",
        );
      }
      if (socialMediaFrame) {
        horizontalTimeline.to(
          socialMediaFrame,
          { yPercent: 0.3, rotateY: 0.9, scale: 1.01, duration: 0.12, ease: "sine.inOut" },
          "socialMediaReveal+=0.16",
        );
      }
      horizontalTimeline.addLabel("platformPresenceReveal", 3.82);
      if (socialMediaPanel) {
        horizontalTimeline.to(
          socialMediaPanel,
          {
            xPercent: -108,
            autoAlpha: 0,
            duration: 0.2,
            ease: "power2.inOut",
          },
          "platformPresenceReveal",
        );
      }
      if (platformPresencePanel) {
        horizontalTimeline.set(
          platformPresencePanel,
          { autoAlpha: 1 },
          "platformPresenceReveal",
        );
        horizontalTimeline.to(
          platformPresencePanel,
          {
            xPercent: 0,
            duration: 0.2,
            ease: "power2.inOut",
          },
          "platformPresenceReveal",
        );
        horizontalTimeline.set(
          platformPresencePanel,
          { xPercent: 0 },
          "platformPresenceReveal+=0.2",
        );
      }
      if (socialMediaPanel) {
        horizontalTimeline.set(
          socialMediaPanel,
          { xPercent: -108, autoAlpha: 0 },
          "platformPresenceReveal+=0.2",
        );
      }
      horizontalTimeline.to(
        platformPresenceTitleLines,
        {
          x: 0,
          autoAlpha: 1,
          filter: "blur(0px)",
          duration: 0.17,
          stagger: 0.022,
          ease: "power3.out",
        },
        "platformPresenceReveal+=0.04",
      );
      if (platformPresenceBody) {
        horizontalTimeline.to(
          platformPresenceBody,
          {
            x: 0,
            autoAlpha: 1,
            filter: "blur(0px)",
            duration: 0.17,
            ease: "power3.out",
          },
          "platformPresenceReveal+=0.12",
        );
      }
      if (horizontalProofLines[4]) {
        horizontalTimeline.to(
          horizontalProofLines[4],
          { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.13, ease: "power3.out" },
          "platformPresenceReveal+=0.16",
        );
      }

      horizontalTimeline.to({}, { duration: HORIZONTAL_TIMELINE_DURATION }, 0);

      const scrollToTimelineTime = (timelineTime: number, skipMotion = false) => {
        const scrollTrigger = horizontalTimeline.scrollTrigger;
        if (!scrollTrigger) return;
        const progress = gsap.utils.clamp(0, 1, timelineTime / HORIZONTAL_TIMELINE_DURATION);
        window.scrollTo({
          top: scrollTrigger.start + (scrollTrigger.end - scrollTrigger.start) * progress,
          behavior: skipMotion ? "auto" : "smooth",
        });
      };

      const navigateChapter = (direction: -1 | 1) => {
        const scrollTrigger = horizontalTimeline.scrollTrigger;
        if (!scrollTrigger?.isActive) return;
        const timelineTime = scrollTrigger.progress * HORIZONTAL_TIMELINE_DURATION;
        const chapterStops = HORIZONTAL_CHAPTERS.map((chapter) => chapter.start);
        const target =
          direction > 0
            ? chapterStops.find((stop) => stop > timelineTime + 0.055) ??
              HORIZONTAL_TIMELINE_DURATION
            : [...chapterStops].reverse().find((stop) => stop < timelineTime - 0.055) ?? 0;
        scrollToTimelineTime(target);
      };

      const handleSoundToggle = async () => {
        if (!audioContext) audioContext = new AudioContext();
        if (audioContext.state === "suspended") await audioContext.resume();
        soundEnabled = !soundEnabled;
        horizontalSoundButton?.setAttribute("aria-pressed", String(soundEnabled));
        const soundState = horizontalSoundButton?.querySelector<HTMLElement>(
          ".horizontal-sound-toggle__state",
        );
        if (soundState) soundState.textContent = soundEnabled ? "ON" : "OFF";
        if (soundEnabled) {
          const currentChapter = Math.max(renderedChapter, 0);
          lastSoundChapter = -1;
          playChapterTone(currentChapter, 1);
          lastSoundChapter = currentChapter;
        }
      };

      const handleSkipSequence = () => {
        const scrollTrigger = horizontalTimeline.scrollTrigger;
        if (!scrollTrigger) return;
        window.scrollTo({ top: scrollTrigger.end + 2, behavior: "auto" });
      };

      const handleHorizontalKeydown = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
        if (target?.matches("input, textarea, select, button, [contenteditable='true']")) return;
        if (!horizontalTimeline.scrollTrigger?.isActive) return;

        if (event.key === "ArrowRight" || event.key === "PageDown") {
          event.preventDefault();
          navigateChapter(1);
        } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
          event.preventDefault();
          navigateChapter(-1);
        }
      };

      let touchStartX = 0;
      let touchStartY = 0;
      const handleTouchStart = (event: PointerEvent) => {
        if (event.pointerType !== "touch" || !horizontalTimeline.scrollTrigger?.isActive) return;
        touchStartX = event.clientX;
        touchStartY = event.clientY;
      };
      const handleTouchEnd = (event: PointerEvent) => {
        if (event.pointerType !== "touch" || !horizontalTimeline.scrollTrigger?.isActive) return;
        const deltaX = event.clientX - touchStartX;
        const deltaY = event.clientY - touchStartY;
        if (Math.abs(deltaX) < 64 || Math.abs(deltaX) < Math.abs(deltaY) * 1.35) return;
        navigateChapter(deltaX < 0 ? 1 : -1);
      };

      horizontalSoundButton?.addEventListener("click", handleSoundToggle);
      horizontalSkipButton?.addEventListener("click", handleSkipSequence);
      window.addEventListener("keydown", handleHorizontalKeydown);
      window.addEventListener("pointerdown", handleTouchStart, { passive: true });
      window.addEventListener("pointerup", handleTouchEnd, { passive: true });

      gsap.set(missionCharacters, { yPercent: 135, rotateX: -86, opacity: 0 });
      gsap.set(".mission-signal-line", { scaleX: 0 });

      const missionTimeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          id: "mission-build-sequence",
          trigger: missionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
          refreshPriority: 0,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (!self.isActive) return;
            updateNarrativeState({ chapterId: "mission", localProgress: self.progress });
          },
        },
      });
      const missionTrigger = missionTimeline.scrollTrigger;
      const unregisterMission = registerChapter({
        id: "mission",
        order: 3,
        getRange: () =>
          missionTrigger ? { start: missionTrigger.start, end: missionTrigger.end } : null,
      });

      missionTimeline.to(
        missionCharacters,
        {
          yPercent: 0,
          rotateX: 0,
          opacity: 1,
          duration: 0.18,
          stagger: { amount: 0.1, from: "center" },
        },
        0,
      );
      missionTimeline.to(
        ".mission-signal-line",
        { scaleX: 1, duration: 0.18, ease: "power2.inOut" },
        0.09,
      );
      missionTimeline.to(
        missionCharacters,
        {
          yPercent: -125,
          rotateX: 78,
          opacity: 0,
          duration: 0.18,
          stagger: { amount: 0.1, from: "edges" },
        },
        0.78,
      );
      missionTimeline.to({}, { duration: 1 }, 0);

      const unregisterPrinciples: Array<() => void> = [];
      principleLines.forEach((line, index) => {
        const text = line.querySelector<HTMLElement>("h3");
        const summary = line.querySelector<HTMLElement>(".principle-summary");
        const characters = gsap.utils.toArray<HTMLElement>(".principle-char", line);
        const characterCenter = (characters.length - 1) / 2;
        const characterRadius = Math.max(characterCenter, 1);
        const characterPosition = (characterIndex: number) =>
          (characterIndex - characterCenter) / characterRadius;
        const characterEdge = (characterIndex: number) =>
          Math.abs(characterPosition(characterIndex));

        if (text) {
          gsap.set(text, {
            y: "18vh",
            z: 200,
            rotateX: -34,
            scale: 0.86,
            autoAlpha: 0,
            filter: "blur(18px)",
            transformOrigin: "50% 100%",
          });
        }
        if (characters.length > 0) {
          gsap.set(characters, {
            yPercent: (characterIndex) => 132 + characterEdge(characterIndex) * 20,
            z: (characterIndex) => -characterEdge(characterIndex) * 170,
            rotateX: -88,
            rotateY: (characterIndex) => characterPosition(characterIndex) * -20,
            autoAlpha: 0,
            transformOrigin: "50% 100%",
          });
        }
        if (summary) {
          gsap.set(summary, {
            y: 54,
            z: 120,
            rotateX: -14,
            scale: 0.94,
            autoAlpha: 0,
            filter: "blur(12px)",
            transformOrigin: "50% 100%",
          });
        }

        const lineTimeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            id: `principle-${index + 1}`,
            trigger: line,
            start: "top 90%",
            end: "bottom 10%",
            scrub: true,
            refreshPriority: 0,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (!self.isActive) return;
              updateNarrativeState({
                chapterId: `principle-${index + 1}`,
                localProgress: self.progress,
              });
            },
          },
        });
        const principleTrigger = lineTimeline.scrollTrigger;
        const unregisterPrinciple = registerChapter({
          id: `principle-${index + 1}`,
          order: 4 + index,
          getRange: () =>
            principleTrigger
              ? { start: principleTrigger.start, end: principleTrigger.end }
              : null,
        });
        unregisterPrinciples.push(unregisterPrinciple);

        if (text) {
          lineTimeline.to(
            text,
            {
              y: 0,
              z: 0,
              rotateX: 0,
              scale: 1,
              autoAlpha: 1,
              filter: "blur(0px)",
              duration: 0.28,
              ease: "power2.out",
            },
            0,
          );
        }
        if (characters.length > 0) {
          lineTimeline.to(
            characters,
            {
              yPercent: 0,
              z: 0,
              rotateX: 0,
              rotateY: 0,
              autoAlpha: 1,
              duration: 0.24,
              stagger: { amount: 0.1, from: "center" },
              ease: "power2.out",
            },
            0.015,
          );
        }
        if (summary) {
          lineTimeline.to(
            summary,
            {
              y: 0,
              z: 0,
              rotateX: 0,
              scale: 1,
              autoAlpha: 1,
              filter: "blur(0px)",
              duration: 0.2,
              ease: "power2.out",
            },
            0.16,
          );
        }
        if (text) {
          lineTimeline.to(
            text,
            {
              y: "-36vh",
              z: -860,
              rotateX: 38,
              scale: 0.36,
              autoAlpha: 0,
              filter: "blur(12px)",
              duration: 0.3,
              ease: "power2.in",
            },
            0.66,
          );
        }
        if (characters.length > 0) {
          lineTimeline.to(
            characters,
            {
              yPercent: (characterIndex) => -20 - characterEdge(characterIndex) * 24,
              z: (characterIndex) => -80 - characterEdge(characterIndex) * 300,
              rotateX: (characterIndex) => 24 + characterEdge(characterIndex) * 16,
              rotateY: (characterIndex) => characterPosition(characterIndex) * 26,
              autoAlpha: 0,
              duration: 0.3,
              stagger: { amount: 0.08, from: "center" },
              ease: "power2.in",
            },
            0.64,
          );
        }
        if (summary) {
          lineTimeline.to(
            summary,
            {
              y: "-16vh",
              z: -560,
              rotateX: 26,
              scale: 0.62,
              autoAlpha: 0,
              filter: "blur(8px)",
              duration: 0.26,
              ease: "power2.in",
            },
            0.66,
          );
        }
        lineTimeline.to({}, { duration: 1 }, 0);
      });

      const unregisterHandoff = registerChapter({
        id: "vanta-handoff",
        order: 11,
        getRange: () => ({ start: orbShapeTrigger.start, end: orbShapeTrigger.end }),
      });
      requestRefresh("editorial-ready");

      return () => {
        galaxyProgressRef.current = 0;
        shapeProgressRef.current = 0;
        horizontalProgressRef.current = 0;
        unregisterMission();
        unregisterPrinciples.forEach((cleanup) => cleanup());
        unregisterHandoff();
        horizontalUnregister.forEach((cleanup) => cleanup());
        horizontalSoundButton?.removeEventListener("click", handleSoundToggle);
        horizontalSkipButton?.removeEventListener("click", handleSkipSequence);
        window.removeEventListener("keydown", handleHorizontalKeydown);
        window.removeEventListener("pointerdown", handleTouchStart);
        window.removeEventListener("pointerup", handleTouchEnd);
        horizontalImagePanels.forEach((panel) => panel.classList.remove("is-active"));
        void audioContext?.close();
      };
    },
    {
      scope: rootRef,
      dependencies: [
        galaxyProgressRef,
        shapeProgressRef,
        horizontalProgressRef,
        reducedMotion,
        registerChapter,
        requestRefresh,
        updateNarrativeState,
      ],
      revertOnUpdate: true,
    },
  );

  return (
    <div ref={rootRef} className="editorial-world">
      <section
        ref={missionRef}
        id="mission"
        className="mission-sequence"
        aria-labelledby="mission-title"
      >
        <div className="mission-stage">
          <h2 id="mission-title" className="mission-title" aria-label="My Mission">
            <VisualCharacters
              text="MY MISSION"
              className="mission-title-char"
              whiteCharacterCount={2}
            />
          </h2>
          <span className="mission-signal-line" aria-hidden="true" />
        </div>
      </section>

      <section
        ref={principlesRef}
        id="principles"
        className="principles-sequence"
        aria-label="Ascend Vanta principles"
      >
        <div className="principles-stage">
          {PRINCIPLES.map(({ headline, subheadline }, index) => (
            <article
              key={headline}
              id={`principle-${index + 1}`}
              className="principle-line"
            >
              <div className="principle-line-stage">
                <div className="principle-copy">
                  <h3 aria-label={headline} data-fit={headlineFit(headline)}>
                    <VisualCharacters text={headline} className="principle-char" />
                  </h3>
                  <p className="principle-summary">{subheadline}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        ref={orbEvolutionRef}
        id="vanta-handoff"
        className="orb-evolution-sequence"
        aria-label="Introducing Vanta, the Ascend Vanta digital guide"
      >
        <div className="orb-evolution-stage">
          <span className="sr-only">
            Vanta materializes inside the Ascend energy sphere, walks through its surface,
            and approaches the camera as the page scrolls.
          </span>
        </div>
      </section>

      <div className="vanta-horizontal-handoff">
        <section
          ref={horizontalRef}
          id="systems-horizontal-story"
          className="vanta-horizontal-sequence"
          aria-labelledby="horizontal-question-title"
        >
        <div className="vanta-horizontal-stage">
          <aside
            className="horizontal-experience-ui"
            data-visible="false"
            aria-label="Horizontal story navigation"
          >
            <div className="horizontal-experience-meta" aria-live="polite">
              <span className="horizontal-experience-index" aria-hidden="true">
                <span className="horizontal-experience-index__current">01</span>
                <span className="horizontal-experience-index__divider">/</span>
                <span>05</span>
              </span>
              <span className="horizontal-experience-label">CREATIVE SYSTEMS</span>
            </div>
            <div className="horizontal-experience-utilities">
              <button
                type="button"
                className="horizontal-sound-toggle"
                aria-label="Toggle ambient chapter sound"
                aria-pressed="false"
              >
                <span className="horizontal-sound-toggle__pulse" aria-hidden="true" />
                SOUND <span className="horizontal-sound-toggle__state">OFF</span>
              </button>
              <button type="button" className="horizontal-skip-sequence">
                SKIP SEQUENCE
              </button>
            </div>
            <div className="horizontal-experience-rail" aria-hidden="true">
              <span className="horizontal-experience-rail__base" />
              <span className="horizontal-experience-rail__fill" />
              <span className="horizontal-experience-rail__node" />
              <span className="horizontal-experience-rail__marks">
                {HORIZONTAL_CHAPTERS.map((chapter) => (
                  <span key={chapter.label} />
                ))}
              </span>
            </div>
          </aside>
          <div className="vanta-horizontal-track">
            <article className="vanta-horizontal-panel horizontal-question-panel">
              <div className="horizontal-question-copy">
                <h2
                  id="horizontal-question-title"
                  className="horizontal-question-reveal"
                  aria-label="What powers scalable execution?"
                >
                  <HorizontalQuestion />
                </h2>
                <p className="horizontal-question-summary">
                  CRM architecture, pipeline structure, lead tracking, workflows, SOPs,
                  reporting, and sales visibility connected into one, clean, operating
                  layer.
                </p>
              </div>
            </article>

            <article className="vanta-horizontal-panel horizontal-answer-panel">
              <dl
                className="horizontal-answer-list"
                aria-label="Systems that power scalable execution"
              >
                {SYSTEM_LAYERS.map(({ icon, title, description }, index) => (
                  <div key={title} className="horizontal-answer-item">
                    <SystemLayerIcon name={icon} index={index} />
                    <div className="horizontal-answer-copy">
                      <dt>{title}</dt>
                      <dd>{description}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </article>

            <article
              className="vanta-horizontal-panel horizontal-creative-suite-panel"
              data-system="creative"
              data-horizontal-chapter="creative-systems-image"
              aria-label="Adobe Creative Suite connected workflow"
            >
              <figure className="creative-suite-frame">
                <img
                  className="creative-suite-image"
                  data-system-src="/assets/images/creative-suite/ascend-vanta-adobe-creative-suite.webp"
                  alt="Adobe Creative Suite applications connected to a central Creative Cloud hub"
                  width={1672}
                  height={941}
                  decoding="async"
                />
                <span className="creative-suite-flow" aria-hidden="true">
                  <span className="creative-suite-line-bed" />
                </span>
                <span className="creative-suite-current" aria-hidden="true">
                  <span className="creative-suite-trace creative-suite-trace--north" />
                  <span className="creative-suite-trace creative-suite-trace--east" />
                  <span className="creative-suite-trace creative-suite-trace--south" />
                  <span className="creative-suite-trace creative-suite-trace--west" />
                </span>
                <span className="creative-suite-hub-energy" aria-hidden="true" />
              </figure>
            </article>

            <article
              className="vanta-horizontal-panel creative-stack-panel"
              data-horizontal-chapter="creative-systems-text"
              aria-labelledby="creative-stack-title"
            >
              <span className="creative-stack-watermark" aria-hidden="true">
                <span>CONTENT</span>
                <span>CREATION</span>
              </span>
              <div className="creative-stack-shell">
                <span
                  className="creative-stack-brace creative-stack-brace--left"
                  aria-hidden="true"
                >
                  {"{"}
                </span>
                <div className="creative-stack-content">
                  <h2 id="creative-stack-title" className="creative-stack-headline">
                    <span>THE FULL </span>
                    <strong>CREATIVE</strong>
                    <span> STACK. </span>
                    <strong>MASTERED.</strong>
                  </h2>
                  <span className="creative-stack-divider" aria-hidden="true" />
                  <p
                    className="creative-stack-kicker"
                    aria-label="Concept to creation"
                  >
                    <span className="creative-stack-kicker__lime" aria-hidden="true">
                      C<span className="creative-stack-gear">⚙</span>NCEPT
                    </span>
                    <span className="creative-stack-kicker__dot" aria-hidden="true">
                      •
                    </span>
                    <span className="creative-stack-kicker__white" aria-hidden="true">
                      T<span className="creative-stack-gear">⚙</span>
                    </span>
                    <span className="creative-stack-kicker__dot" aria-hidden="true">
                      •
                    </span>
                    <span className="creative-stack-kicker__lime" aria-hidden="true">
                      CREATI<span className="creative-stack-gear">⚙</span>N
                    </span>
                  </p>
                  <p className="creative-stack-body">
                    From brand design and photography to video, motion, publishing,
                    audio, web, AI, and 3D, I bring master-level command of the
                    platforms and production disciplines required to move an idea
                    <strong> from render to reality.</strong>
                  </p>
                  <p className="horizontal-proof-line">{HORIZONTAL_CHAPTERS[0].proof}</p>
                </div>
                <span
                  className="creative-stack-brace creative-stack-brace--right"
                  aria-hidden="true"
                >
                  {"}"}
                </span>
              </div>
            </article>

            <article
              className="vanta-horizontal-panel horizontal-creative-suite-panel horizontal-frontend-stack-panel"
              data-system="frontend"
              data-horizontal-chapter="frontend-engineering-image"
              aria-label="Connected frontend engineering stack"
            >
              <figure className="creative-suite-frame frontend-stack-frame">
                <img
                  className="creative-suite-image frontend-stack-image"
                  data-system-src="/assets/images/frontend-stack/ascend-vanta-frontend-stack.webp"
                  alt="HTML, CSS, JavaScript, TypeScript, React, Next.js, Tailwind CSS, GSAP, Lenis, and Three.js connected to a central frontend engineering hub"
                  width={1672}
                  height={941}
                  decoding="async"
                />
                <span
                  className="creative-suite-flow frontend-stack-flow"
                  aria-hidden="true"
                >
                  <span className="creative-suite-line-bed frontend-stack-line-bed" />
                </span>
                <span
                  className="creative-suite-current frontend-stack-current"
                  aria-hidden="true"
                >
                  <span className="creative-suite-trace creative-suite-trace--north frontend-stack-trace frontend-stack-trace--north" />
                  <span className="creative-suite-trace creative-suite-trace--east frontend-stack-trace frontend-stack-trace--east" />
                  <span className="creative-suite-trace creative-suite-trace--south frontend-stack-trace frontend-stack-trace--south" />
                  <span className="creative-suite-trace creative-suite-trace--west frontend-stack-trace frontend-stack-trace--west" />
                </span>
                <span
                  className="creative-suite-hub-energy frontend-stack-hub-energy"
                  aria-hidden="true"
                />
              </figure>
            </article>

            <article
              className="vanta-horizontal-panel engineer-experience-panel"
              data-horizontal-chapter="frontend-engineering-text"
              aria-labelledby="engineer-experience-title"
            >
              <div className="engineer-experience-content">
                <h2 id="engineer-experience-title" className="engineer-experience-title">
                  <span className="engineer-experience-title__line engineer-experience-title__line--primary">
                    <span>I </span>
                    <strong>ENGINEER</strong>
                  </span>
                  <span className="engineer-experience-title__line engineer-experience-title__line--secondary">
                    <span>THE </span>
                    <strong>EXPERIENCE.</strong>
                  </span>
                </h2>
                <p className="engineer-experience-body">
                  HTML, CSS, JavaScript, TypeScript, React, Next.js, Tailwind CSS,
                  GSAP, Lenis, and Three.js are not disconnected tools in my workflow.
                  Together, they form <strong>one integrated production system,</strong>
                  allowing me to move seamlessly from creative direction and interface
                  design through animation, interaction, performance optimization, and
                  deployment.
                </p>
                <p className="horizontal-proof-line">{HORIZONTAL_CHAPTERS[1].proof}</p>
              </div>
            </article>

            <article
              className="vanta-horizontal-panel horizontal-creative-suite-panel horizontal-backend-automation-panel"
              data-system="backend"
              data-horizontal-chapter="automation-systems-image"
              aria-label="Connected backend and automation stack"
            >
              <figure className="creative-suite-frame backend-automation-frame">
                <img
                  className="creative-suite-image backend-automation-image"
                  data-system-src="/assets/images/backend-automation/ascend-vanta-backend-automation.webp"
                  alt="Python, Flask, Node.js, APIs, SQL, Supabase, Firebase, Zapier, Make, and n8n connected to a central backend automation hub"
                  width={1672}
                  height={941}
                  decoding="async"
                />
                <span
                  className="creative-suite-flow backend-automation-flow"
                  aria-hidden="true"
                >
                  <span className="creative-suite-line-bed backend-automation-line-bed" />
                </span>
                <span
                  className="creative-suite-current backend-automation-current"
                  aria-hidden="true"
                >
                  <span className="creative-suite-trace creative-suite-trace--north backend-automation-trace backend-automation-trace--north" />
                  <span className="creative-suite-trace creative-suite-trace--east backend-automation-trace backend-automation-trace--east" />
                  <span className="creative-suite-trace creative-suite-trace--south backend-automation-trace backend-automation-trace--south" />
                  <span className="creative-suite-trace creative-suite-trace--west backend-automation-trace backend-automation-trace--west" />
                </span>
                <span
                  className="creative-suite-hub-energy backend-automation-hub-energy"
                  aria-hidden="true"
                />
              </figure>
            </article>

            <article
              className="vanta-horizontal-panel unified-system-panel"
              data-horizontal-chapter="automation-systems-text"
              aria-labelledby="unified-system-title"
            >
              <div className="unified-system-content">
                <h2 id="unified-system-title" className="unified-system-title">
                  <span className="unified-system-title__line unified-system-title__line--one">
                    I TURN DISCONNECTED
                  </span>
                  <span className="unified-system-title__line unified-system-title__line--two">
                    <strong>WORKFLOWS</strong>
                    <span> INTO ONE</span>
                  </span>
                  <span className="unified-system-title__line unified-system-title__line--three">
                    <strong>UNIFIED SYSTEM.</strong>
                  </span>
                </h2>
                <p className="unified-system-body">
                  Using Python, Flask, Node.js, APIs, SQL, Supabase, Firebase, Zapier,
                  and N8n, I connect fragmented tools, data, and processes into
                  intelligent systems that <strong>reduce manual work,</strong> improve
                  visibility, and scale with the business.
                </p>
                <p className="horizontal-proof-line">{HORIZONTAL_CHAPTERS[2].proof}</p>
              </div>
            </article>

            <article
              className="vanta-horizontal-panel horizontal-creative-suite-panel horizontal-search-visibility-panel"
              data-system="visibility"
              data-horizontal-chapter="search-intelligence-image"
              aria-label="Connected search visibility and analytics ecosystem"
            >
              <figure className="creative-suite-frame search-visibility-frame">
                <img
                  className="creative-suite-image search-visibility-image"
                  data-system-src="/assets/images/search-visibility/ascend-vanta-search-visibility.webp"
                  alt="Rank Math SEO, Google Analytics, Google Search Console, Tag Manager, Local SEO, Looker Studio, AEO, Microsoft Clarity, Hotjar, Schema Markup, and GEO connected to a central search visibility hub"
                  width={1672}
                  height={941}
                  decoding="async"
                />
                <span
                  className="creative-suite-flow search-visibility-flow"
                  aria-hidden="true"
                >
                  <span className="creative-suite-line-bed search-visibility-line-bed" />
                </span>
                <span
                  className="creative-suite-current search-visibility-current"
                  aria-hidden="true"
                >
                  <span className="creative-suite-trace creative-suite-trace--north search-visibility-trace search-visibility-trace--north" />
                  <span className="creative-suite-trace creative-suite-trace--east search-visibility-trace search-visibility-trace--east" />
                  <span className="creative-suite-trace creative-suite-trace--south search-visibility-trace search-visibility-trace--south" />
                  <span className="creative-suite-trace creative-suite-trace--west search-visibility-trace search-visibility-trace--west" />
                </span>
                <span
                  className="creative-suite-hub-energy search-visibility-hub-energy"
                  aria-hidden="true"
                />
              </figure>
            </article>

            <article
              className="vanta-horizontal-panel measured-improved-panel"
              data-horizontal-chapter="search-intelligence-text"
              aria-labelledby="measured-improved-title"
            >
              <div className="measured-improved-content">
                <h2 id="measured-improved-title" className="measured-improved-title">
                  <span className="measured-improved-title__line measured-improved-title__line--primary">
                    MEASURED. REFINED.
                  </span>
                  <span className="measured-improved-title__line measured-improved-title__line--accent">
                    IMPROVED.
                  </span>
                </h2>
                <p className="measured-improved-body">
                  Through SEO, AEO, GEO, analytics, behavioral intelligence, schema,
                  attribution, and KPI performance reporting, I connect the signals
                  that reveal how people discover, experience, and engage with a
                  brand—then turn those insights into <strong>greater visibility,
                  stronger conversion, and measurable growth.</strong>
                </p>
                <p className="horizontal-proof-line">{HORIZONTAL_CHAPTERS[3].proof}</p>
              </div>
            </article>

            <article
              className="vanta-horizontal-panel horizontal-creative-suite-panel horizontal-social-media-panel"
              data-system="presence"
              data-horizontal-chapter="platform-presence-image"
              aria-label="Major social media platforms connected to the Ascend Vanta presence hub"
            >
              <figure className="creative-suite-frame social-media-frame">
                <img
                  className="creative-suite-image social-media-image"
                  data-system-src="/assets/images/social-media/ascend-vanta-social-media-platforms.webp"
                  alt="Facebook, Instagram, TikTok, YouTube, LinkedIn, Pinterest, Threads, Discord, X, Reddit, Snapchat, Telegram, and WhatsApp connected to the Ascend Vanta social presence hub"
                  width={1536}
                  height={1024}
                  decoding="async"
                />
                <span
                  className="creative-suite-flow social-media-flow"
                  aria-hidden="true"
                >
                  <span className="creative-suite-line-bed social-media-line-bed" />
                </span>
                <span
                  className="creative-suite-current social-media-current"
                  aria-hidden="true"
                >
                  <span className="creative-suite-trace creative-suite-trace--north social-media-trace social-media-trace--north" />
                  <span className="creative-suite-trace creative-suite-trace--east social-media-trace social-media-trace--east" />
                  <span className="creative-suite-trace creative-suite-trace--south social-media-trace social-media-trace--south" />
                  <span className="creative-suite-trace creative-suite-trace--west social-media-trace social-media-trace--west" />
                </span>
                <span
                  className="creative-suite-hub-energy social-media-hub-energy"
                  aria-hidden="true"
                />
              </figure>
            </article>

            <article
              className="vanta-horizontal-panel platform-presence-panel"
              data-horizontal-chapter="platform-presence-text"
              aria-labelledby="platform-presence-title"
            >
              <div className="platform-presence-content">
                <h2 id="platform-presence-title" className="platform-presence-title">
                  <span className="platform-presence-title__line">
                    <span>I TURN </span>
                    <strong>PLATFORMS</strong>
                  </span>
                  <span className="platform-presence-title__line">
                    <span>INTO </span>
                    <strong>PRESENCE.</strong>
                  </span>
                </h2>
                <p className="platform-presence-body">
                  Across the major social platforms, I build content systems that
                  help brands stay visible, earn attention, engage audiences, and
                  create consistent momentum online.
                </p>
                <p className="horizontal-proof-line">{HORIZONTAL_CHAPTERS[4].proof}</p>
              </div>
            </article>

          </div>
        </div>
        </section>
      </div>
    </div>
  );
}

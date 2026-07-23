"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { AscendHeroWordmark } from "./AscendHeroWordmark";
import { HeroContent } from "./HeroContent";
import { HeroScrollCue } from "./HeroScrollCue";
import type { HeroRuntimeRefs } from "./heroTypes";
import { useHeroPointer } from "./useHeroPointer";
import { useHeroScrollProgress } from "./useHeroScrollProgress";
import { VantaFrameSequence } from "@/components/editorial/VantaFrameSequence";
import { useNarrativeCoordinator } from "@/components/narrative/NarrativeCoordinator";
import { HomepageAuthorityLinks } from "@/components/authority/HomepageAuthorityLinks";

const DynamicHeroCanvas = dynamic(
  () => import("./AscendHeroCanvas").then((module) => module.AscendHeroCanvas),
  { ssr: false },
);

const DynamicEditorialScrollSections = dynamic(() =>
  import("@/components/editorial/EditorialScrollSections").then(
    (module) => module.EditorialScrollSections,
  ),
);

const DynamicEditorialMagazineLibrary = dynamic(() =>
  import("@/components/editorial/EditorialMagazineLibrary").then(
    (module) => module.EditorialMagazineLibrary,
  ),
);

const DynamicPromptWorldsGallery = dynamic(() =>
  import("@/components/editorial/PromptWorldsGallery").then(
    (module) => module.PromptWorldsGallery,
  ),
);

const DynamicAboutSystemsSection = dynamic(() =>
  import("@/components/editorial/AboutSystemsSection").then(
    (module) => module.AboutSystemsSection,
  ),
);

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function AscendHero() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const heroWordmarkRef = useRef<HTMLHeadingElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const heroVignetteRef = useRef<HTMLDivElement>(null);
  const galaxyProgress = useRef(0);
  const shapeProgress = useRef(0);
  const horizontalProgress = useRef(0);
  const frameSequenceProgress = useRef(-1);
  const vantaGreetingComplete = useRef(false);
  const reducedMotionRef = useRef(false);
  const [webGL, setWebGL] = useState<boolean | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const { pointer, handlers } = useHeroPointer();
  const { quality, reducedMotion, documentVisible, activeChapterId } =
    useNarrativeCoordinator();
  const canvasIsActive =
    documentVisible &&
    !reducedMotion &&
    !["editorial-library", "prompt-worlds", "about-systems", "final-statement"].includes(
      activeChapterId,
    );
  const visible = useRef(documentVisible);

  useEffect(() => {
    visible.current = documentVisible;
  }, [documentVisible]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forcedFallback = process.env.NODE_ENV !== "production" && params.get("webgl") === "0";
    if (forcedFallback || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const fallbackFrame = window.requestAnimationFrame(() => setWebGL(false));
      return () => window.cancelAnimationFrame(fallbackFrame);
    }

    const initialize = () => setWebGL(supportsWebGL());
    if (window.matchMedia("(max-width: 767px)").matches) {
      const interactionEvents = ["pointerdown", "touchstart", "wheel", "keydown"] as const;
      const initializeOnInteraction = () => {
        interactionEvents.forEach((event) =>
          window.removeEventListener(event, initializeOnInteraction),
        );
        initialize();
      };
      interactionEvents.forEach((event) =>
        window.addEventListener(event, initializeOnInteraction, { passive: true, once: true }),
      );
      return () =>
        interactionEvents.forEach((event) =>
          window.removeEventListener(event, initializeOnInteraction),
        );
    }

    let idleCallback = 0;
    const initializationDelay = window.setTimeout(() => {
      if ("requestIdleCallback" in window) {
        idleCallback = window.requestIdleCallback(initialize, { timeout: 900 });
      } else {
        initialize();
      }
    }, 700);
    return () => {
      window.clearTimeout(initializationDelay);
      if (idleCallback) window.cancelIdleCallback(idleCallback);
    };
  }, []);

  useEffect(() => {
    let warmupTimer = 0;
    let warmupFrame = 0;
    const markCanvasReady = () => {
      warmupTimer = window.setTimeout(() => {
        galaxyProgress.current = 0.002;
        shapeProgress.current = 0.05;
        let remainingFrames = 4;
        const finishWarmup = () => {
          remainingFrames -= 1;
          if (remainingFrames > 0) {
            warmupFrame = window.requestAnimationFrame(finishWarmup);
            return;
          }
          galaxyProgress.current = 0;
          shapeProgress.current = 0;
          setCanvasReady(true);
        };
        warmupFrame = window.requestAnimationFrame(finishWarmup);
      }, 900);
    };
    window.addEventListener("hero-assets-ready", markCanvasReady);
    return () => {
      window.removeEventListener("hero-assets-ready", markCanvasReady);
      window.clearTimeout(warmupTimer);
      window.cancelAnimationFrame(warmupFrame);
      galaxyProgress.current = 0;
      shapeProgress.current = 0;
    };
  }, []);

  const scrollProgress = useHeroScrollProgress(
    {
      root: rootRef,
      stage: stageRef,
      heroWordmark: heroWordmarkRef,
      heroContent: heroContentRef,
      heroVignette: heroVignetteRef,
    },
    quality,
    reducedMotion,
  );
  const runtime = useMemo<HeroRuntimeRefs>(
    () => ({
      pointer,
      scrollProgress,
      galaxyProgress,
      shapeProgress,
      horizontalProgress,
      frameSequenceProgress,
      vantaGreetingComplete,
      reducedMotion: reducedMotionRef,
      visible,
    }),
    [pointer, scrollProgress, visible],
  );
  return (
    <main className="site-shell" {...handlers}>
      <a className="skip-link" href="#mission">
        Skip to portfolio content
      </a>
      <Image
        className="hero-corner-logo"
        src="/assets/brand/ascend-vanta-corner-logo.png"
        alt="Ascend Vanta Portfolio"
        width={414}
        height={74}
        unoptimized
        sizes="(max-width: 463px) calc(100vw - 50px), 414px"
      />
      {webGL ? (
        <DynamicHeroCanvas
          quality={quality}
          runtime={runtime}
          active={canvasIsActive}
          ready={canvasReady}
        />
      ) : null}
      <section
        ref={rootRef}
        className="hero-narrative"
        data-quality={quality.name}
        data-reduced-motion={reducedMotion ? "true" : "false"}
      >
        <div ref={stageRef} className="hero-stage">
          <picture
            className={`hero-fallback${canvasReady ? " is-superseded" : ""}`}
          >
            <source
              media="(max-width: 767px)"
              srcSet="/assets/images/av-logo-fallbacks/hero-mobile-entry-480.webp 480w, /assets/images/av-logo-fallbacks/hero-mobile-entry.webp 720w"
              sizes="99vw"
              width={480}
              height={640}
            />
            <img
              src="/assets/images/av-logo-fallbacks/hero-desktop.webp"
              alt=""
              width={2400}
              height={1600}
              decoding="async"
              fetchPriority="high"
            />
          </picture>
          <div ref={heroVignetteRef} className="hero-vignette" aria-hidden="true" />
          <HeroContent ref={heroContentRef} />
          <AscendHeroWordmark wordmarkRef={heroWordmarkRef} />
          <HeroScrollCue />
        </div>
      </section>
      <DynamicEditorialScrollSections
        galaxyProgressRef={galaxyProgress}
        shapeProgressRef={shapeProgress}
        horizontalProgressRef={horizontalProgress}
      />
      <VantaFrameSequence progressRef={frameSequenceProgress} />
      <DynamicEditorialMagazineLibrary />
      <DynamicPromptWorldsGallery />
      <DynamicAboutSystemsSection />
      <HomepageAuthorityLinks />
    </main>
  );
}

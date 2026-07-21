"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AscendHeroWordmark } from "./AscendHeroWordmark";
import { HeroContent } from "./HeroContent";
import { HeroScrollCue } from "./HeroScrollCue";
import { HERO_PHASES, HERO_SCROLL } from "./heroTimelineConfig";
import type { HeroRuntimeRefs } from "./heroTypes";
import { useHeroPointer } from "./useHeroPointer";
import { useHeroScrollProgress } from "./useHeroScrollProgress";
import { VantaFrameSequence } from "@/components/editorial/VantaFrameSequence";
import { useNarrativeCoordinator } from "@/components/narrative/NarrativeCoordinator";

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
  const [vantaEnabled, setVantaEnabled] = useState(false);
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
    const initializationFrame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const forcedFallback = process.env.NODE_ENV !== "production" && params.get("webgl") === "0";
      setWebGL(forcedFallback ? false : supportsWebGL());
    });
    return () => window.cancelAnimationFrame(initializationFrame);
  }, []);

  useEffect(() => {
    const target = document.querySelector<HTMLElement>(".orb-evolution-sequence");
    if (!target || !("IntersectionObserver" in window)) {
      const fallbackFrame = window.requestAnimationFrame(() => setVantaEnabled(true));
      return () => window.cancelAnimationFrame(fallbackFrame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setVantaEnabled(true);
        observer.disconnect();
      },
      { rootMargin: "180% 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
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
  const siteStyle = useMemo(
    () => {
      const narrativeDistance =
        quality.narrativeViewports * (reducedMotion ? HERO_SCROLL.reducedMotionScale : 1);
      const missionOverlap =
        1 + narrativeDistance * (1 - HERO_PHASES.particleDissolveStart);

      return {
        "--hero-mission-overlap": `${missionOverlap * -100}svh`,
      } as CSSProperties;
    },
    [quality.narrativeViewports, reducedMotion],
  );

  return (
    <main className="site-shell" style={siteStyle} {...handlers}>
      <a className="skip-link" href="#mission">
        Skip to portfolio content
      </a>
      <Image
        className="hero-corner-logo"
        src="/assets/brand/ascend-vanta-corner-logo.png"
        alt="Ascend Vanta Portfolio"
        width={414}
        height={74}
        priority
        unoptimized
        sizes="(max-width: 463px) calc(100vw - 50px), 414px"
      />
      {webGL ? (
        <DynamicHeroCanvas
          quality={quality}
          runtime={runtime}
          active={canvasIsActive}
          vantaEnabled={vantaEnabled}
        />
      ) : null}
      <section
        ref={rootRef}
        className="hero-narrative"
        data-quality={quality.name}
        data-reduced-motion={reducedMotion ? "true" : "false"}
      >
        <div ref={stageRef} className="hero-stage">
          {webGL === false ? (
            <Image
              className="hero-fallback"
              src="/assets/images/av-logo-fallbacks/hero-desktop.webp"
              alt=""
              fill
              priority
              sizes="100vw"
            />
          ) : null}
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
    </main>
  );
}

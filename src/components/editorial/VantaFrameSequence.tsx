"use client";

import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import NextImage from "next/image";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";
import { useNarrativeCoordinator } from "@/components/narrative/NarrativeCoordinator";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, useGSAP);

const FIRST_FRAME_NUMBER = 10;
const TOTAL_FRAMES = 184;
const FRAME_SCROLL_DISTANCE = 8;
const PRELOAD_CONCURRENCY = 4;
const NEARBY_PRELOAD_RADIUS = 16;
const MAX_RESIDENT_FRAMES = 48;

function frameSource(index: number) {
  const frameNumber = String(index + FIRST_FRAME_NUMBER).padStart(3, "0");
  return `/assets/frames/vanta-exploded/ffout${frameNumber}.gif`;
}

function drawCover(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  maximumDpr: number,
) {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, maximumDpr);
  const width = Math.max(1, Math.round(bounds.width * pixelRatio));
  const height = Math.max(1, Math.round(bounds.height * pixelRatio));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.clearRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    (width - drawWidth) * 0.5,
    (height - drawHeight) * 0.5,
    drawWidth,
    drawHeight,
  );
}

function ActiveFrameSequence({
  sectionRef,
  progressRef,
}: {
  sectionRef: MutableRefObject<HTMLElement | null>;
  progressRef: MutableRefObject<number>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [firstFrameFailed, setFirstFrameFailed] = useState(false);
  const {
    quality,
    registerChapter,
    setDirectScroll,
    updateNarrativeState,
    requestRefresh,
  } = useNarrativeCoordinator();

  useGSAP(
    () => {
      const section = sectionRef.current;
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d", { alpha: true });
      if (!section || !canvas || !context) return;

      const frames = new Map<number, HTMLImageElement>();
      const pendingImages = new Set<HTMLImageElement>();
      const loading = new Set<number>();
      const failed = new Set<number>();
      let loadQueue: number[] = [];
      let activeLoads = 0;
      let calculatedFrame = 0;
      let reportedFrame = -1;
      let renderedFrame = -1;
      let direction: 1 | -1 = 1;
      let disposed = false;
      let trigger: ScrollTrigger | null = null;

      const renderFrame = (index: number) => {
        const image = frames.get(index);
        if (!image || disposed || renderedFrame === index) return;
        drawCover(canvas, context, image, quality.dpr);
        renderedFrame = index;
        canvas.dataset.frame = String(index);
      };

      const pruneCache = () => {
        if (frames.size <= MAX_RESIDENT_FRAMES) return;
        const removable = Array.from(frames.keys())
          .filter((index) => index !== 0 && Math.abs(index - calculatedFrame) > 22)
          .sort((a, b) => Math.abs(b - calculatedFrame) - Math.abs(a - calculatedFrame));
        while (frames.size > MAX_RESIDENT_FRAMES && removable.length > 0) {
          const index = removable.shift();
          if (index === undefined) break;
          const image = frames.get(index);
          frames.delete(index);
          image?.removeAttribute("src");
        }
      };

      const finishLoad = (index: number, image?: HTMLImageElement) => {
        if (image) pendingImages.delete(image);
        loading.delete(index);
        activeLoads = Math.max(0, activeLoads - 1);
        if (image && !disposed) {
          frames.set(index, image);
          if (index === calculatedFrame) renderFrame(index);
        } else if (!disposed) {
          failed.add(index);
          if (index === 0) setFirstFrameFailed(true);
        }
        pruneCache();
        pumpQueue();
      };

      const loadFrame = (index: number) => {
        if (
          disposed ||
          index < 0 ||
          index >= TOTAL_FRAMES ||
          frames.has(index) ||
          loading.has(index) ||
          failed.has(index)
        ) {
          return;
        }
        loading.add(index);
        activeLoads += 1;
        const image = new Image();
        pendingImages.add(image);
        image.decoding = "async";
        image.fetchPriority = index === calculatedFrame || index === 0 ? "high" : "low";
        image.onload = () => finishLoad(index, image);
        image.onerror = () => finishLoad(index);
        image.src = frameSource(index);
      };

      function pumpQueue() {
        while (!disposed && activeLoads < PRELOAD_CONCURRENCY && loadQueue.length > 0) {
          const index = loadQueue.shift();
          if (index === undefined) break;
          loadFrame(index);
        }
      }

      const requestWindow = (center: number) => {
        const candidates = [center];
        for (let distance = 1; distance <= NEARBY_PRELOAD_RADIUS; distance += 1) {
          const leading = center + distance * direction;
          const trailing = center - distance * direction;
          if (leading >= 0 && leading < TOTAL_FRAMES) candidates.push(leading);
          if (trailing >= 0 && trailing < TOTAL_FRAMES) candidates.push(trailing);
        }
        if (!candidates.includes(0)) candidates.push(0);
        const unique = candidates.filter(
          (index, position) =>
            candidates.indexOf(index) === position &&
            !frames.has(index) &&
            !loading.has(index) &&
            !failed.has(index),
        );
        loadQueue = [
          ...unique,
          ...loadQueue.filter((index) => !unique.includes(index) && Math.abs(index - center) <= 24),
        ];
        pumpQueue();
      };

      const setFrameFromProgress = (progress: number) => {
        const nextFrame = Math.round(progress * (TOTAL_FRAMES - 1));
        if (nextFrame === calculatedFrame && nextFrame === reportedFrame) return;
        direction = nextFrame > calculatedFrame ? 1 : -1;
        calculatedFrame = nextFrame;
        reportedFrame = nextFrame;
        progressRef.current = progress;
        updateNarrativeState({
          chapterId: "vanta-frame-sequence",
          localProgress: progress,
          frameIndex: nextFrame,
        });
        requestWindow(nextFrame);
        renderFrame(nextFrame);
      };

      // Loading begins only after the proximity sentinel activates this component.
      loadQueue = [0];
      pumpQueue();
      requestWindow(0);

      trigger = ScrollTrigger.create({
        id: "vanta-canvas-frame-sequence",
        trigger: section,
        start: "top top",
        end: () => `+=${(TOTAL_FRAMES - 1) * FRAME_SCROLL_DISTANCE}`,
        pin: true,
        pinSpacing: true,
        scrub: true,
        invalidateOnRefresh: true,
        onEnter: (self) => {
          section.dataset.lifecycle = "active";
          setDirectScroll(true);
          setFrameFromProgress(self.progress);
        },
        onUpdate: (self) => {
          if (self.isActive) setFrameFromProgress(self.progress);
        },
        onLeave: () => {
          setFrameFromProgress(1);
          section.dataset.lifecycle = "near";
          progressRef.current = 1;
          setDirectScroll(false);
        },
        onEnterBack: (self) => {
          section.dataset.lifecycle = "active";
          setDirectScroll(true);
          setFrameFromProgress(self.progress);
        },
        onLeaveBack: () => {
          setFrameFromProgress(0);
          section.dataset.lifecycle = "near";
          progressRef.current = -1;
          setDirectScroll(false);
        },
        onRefresh: (self) => {
          const scrollPosition = self.scroll();
          const isActive = scrollPosition >= self.start && scrollPosition <= self.end;
          progressRef.current = scrollPosition < self.start ? -1 : self.progress;
          renderedFrame = -1;
          if (isActive) {
            setFrameFromProgress(self.progress);
          } else {
            calculatedFrame = scrollPosition < self.start ? 0 : TOTAL_FRAMES - 1;
            requestWindow(calculatedFrame);
          }
          renderFrame(calculatedFrame);
        },
      });

      const unregister = registerChapter({
        id: "vanta-frame-sequence",
        order: 32,
        getRange: () => (trigger ? { start: trigger.start, end: trigger.end } : null),
        restore: (state) => {
          if (typeof state.frameIndex === "number") {
            calculatedFrame = Math.min(TOTAL_FRAMES - 1, Math.max(0, state.frameIndex));
            requestWindow(calculatedFrame);
            renderedFrame = -1;
            renderFrame(calculatedFrame);
          }
        },
      });

      const resizeObserver = new ResizeObserver(() => {
        renderedFrame = -1;
        renderFrame(calculatedFrame);
      });
      resizeObserver.observe(canvas);
      requestRefresh("frame-sequence-ready");

      return () => {
        disposed = true;
        progressRef.current = -1;
        setDirectScroll(false);
        trigger?.kill();
        unregister();
        resizeObserver.disconnect();
        loadQueue = [];
        frames.forEach((image) => {
          image.onload = null;
          image.onerror = null;
        });
        pendingImages.forEach((image) => {
          image.onload = null;
          image.onerror = null;
          image.removeAttribute("src");
        });
        pendingImages.clear();
        frames.clear();
        loading.clear();
      };
    },
    {
      scope: sectionRef,
      dependencies: [
        quality.dpr,
        registerChapter,
        requestRefresh,
        setDirectScroll,
        updateNarrativeState,
      ],
      revertOnUpdate: true,
    },
  );

  return (
    <>
      <canvas ref={canvasRef} className="vanta-frame-sequence__canvas" aria-hidden="true" />
      {firstFrameFailed ? (
        <p className="vanta-frame-sequence__fallback" role="status">
          Vanta&apos;s transformation is temporarily unavailable.
        </p>
      ) : null}
    </>
  );
}

export function VantaFrameSequence({
  progressRef,
}: {
  progressRef: MutableRefObject<number>;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);
  const [mobileStatic, setMobileStatic] = useState(false);
  const { reducedMotion, registerChapter, updateNarrativeState } = useNarrativeCoordinator();

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setMobileStatic(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    section.dataset.lifecycle = "sleeping";
    if (!("IntersectionObserver" in window)) {
      const fallbackActivation = requestAnimationFrame(() => setNear(true));
      section.dataset.lifecycle = "near";
      return () => cancelAnimationFrame(fallbackActivation);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setNear(true);
          section.dataset.lifecycle = "near";
        } else {
          // Before the sequence enters its activation corridor, tear down the
          // canvas, ScrollTrigger, and decoded-frame cache completely. After
          // the sequence has passed, retain its spacing so downstream content
          // never shifts when the observer exits behind the viewport.
          if (entry.boundingClientRect.top > window.innerHeight) setNear(false);
          section.dataset.lifecycle = "sleeping";
        }
      },
      { rootMargin: "125% 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () =>
      registerChapter({
        id: "vanta-frame-sequence",
        order: 32,
        getRange: () => {
          const section = sectionRef.current;
          if (!section) return null;
          const parent = section.parentElement;
          const anchor = parent?.classList.contains("pin-spacer") ? parent : section;
          const start = anchor.getBoundingClientRect().top + window.scrollY;
          const isStatic =
            reducedMotion || window.matchMedia("(max-width: 767px)").matches;
          const distance = isStatic
            ? Math.max(1, section.getBoundingClientRect().height)
            : (TOTAL_FRAMES - 1) * FRAME_SCROLL_DISTANCE;
          return { start, end: start + distance };
        },
        restore: (state) => {
          progressRef.current = state.localProgress;
          setNear(true);
          if (sectionRef.current) sectionRef.current.dataset.lifecycle = "near";
        },
      }),
    [progressRef, reducedMotion, registerChapter],
  );

  useEffect(() => {
    if (!reducedMotion && !mobileStatic) return;
    progressRef.current = 0;
    updateNarrativeState({ chapterId: "vanta-frame-sequence", localProgress: 0, frameIndex: 0 });
  }, [mobileStatic, progressRef, reducedMotion, updateNarrativeState]);

  const staticPresentation = reducedMotion || mobileStatic;

  return (
    <section
      ref={sectionRef}
      id="work"
      className="vanta-frame-sequence"
      aria-labelledby="vanta-frame-sequence-title"
    >
      <h2 id="vanta-frame-sequence-title" className="sr-only">
        Selected work: Vanta mechanical transformation
      </h2>
      {staticPresentation && near ? (
        <NextImage
          className="vanta-frame-sequence__reduced"
          src={frameSource(0)}
          alt="Vanta shown in the opening frame of a mechanical transformation"
          fill
          unoptimized
          loading="eager"
          sizes="100vw"
        />
      ) : near ? (
        <ActiveFrameSequence sectionRef={sectionRef} progressRef={progressRef} />
      ) : null}
      <p className="sr-only">
        Scroll to advance or reverse Vanta&apos;s mechanical transformation frame by frame.
      </p>
    </section>
  );
}

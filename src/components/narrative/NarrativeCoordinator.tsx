"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  chooseHeroQuality,
  HERO_QUALITY_PROFILES,
} from "@/components/hero/heroQualityProfiles";
import type { HeroQualityProfile } from "@/components/hero/heroTypes";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export interface NarrativeState {
  chapterId: string;
  localProgress: number;
  frameIndex?: number;
}

interface ChapterRegistration {
  id: string;
  order: number;
  getRange: () => { start: number; end: number } | null;
  restore?: (state: NarrativeState) => void;
}

interface NarrativeCoordinatorValue {
  reducedMotion: boolean;
  documentVisible: boolean;
  quality: HeroQualityProfile;
  activeChapterId: string;
  updateNarrativeState: (state: NarrativeState) => void;
  registerChapter: (registration: ChapterRegistration) => () => void;
  requestRefresh: (reason?: string) => void;
  scrollToPosition: (target: number, onComplete?: () => void) => void;
  setDirectScroll: (active: boolean) => void;
}

declare global {
  interface Window {
    __ASCEND_NARRATIVE__?: {
      state: NarrativeState;
      refresh: (reason?: string) => void;
      chapters: () => string[];
    };
  }
}

const STORAGE_KEY = "ascend-vanta:narrative-state:v1";
const DEFAULT_STATE: NarrativeState = { chapterId: "hero-signal", localProgress: 0 };
const NarrativeCoordinatorContext = createContext<NarrativeCoordinatorValue | null>(null);

function clamp01(value: number) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function readStoredState(): NarrativeState | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null") as
      | NarrativeState
      | null;
    if (!parsed?.chapterId || !Number.isFinite(parsed.localProgress)) return null;
    return { ...parsed, localProgress: clamp01(parsed.localProgress) };
  } catch {
    return null;
  }
}

function lowerQuality(profile: HeroQualityProfile) {
  const order = ["low", "mobile", "tablet", "standard", "high"] as const;
  const index = order.indexOf(profile.name);
  return HERO_QUALITY_PROFILES[order[Math.max(0, index - 1)]];
}

export function NarrativeCoordinator({ children }: { children: ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [quality, setQuality] = useState<HeroQualityProfile>(HERO_QUALITY_PROFILES.standard);
  const [activeChapterId, setActiveChapterId] = useState(DEFAULT_STATE.chapterId);
  const lenisRef = useRef<Lenis | null>(null);
  const directScrollRef = useRef(false);
  const stateRef = useRef<NarrativeState>(DEFAULT_STATE);
  const pendingRestoreStateRef = useRef<NarrativeState | null>(null);
  const registrationsRef = useRef(new Map<string, ChapterRegistration>());
  const refreshFrameRef = useRef<number | null>(null);
  const restoreFrameRef = useRef<number | null>(null);
  const restoreSettleTimerRef = useRef<number | null>(null);
  const resizeTimerRef = useRef<number | null>(null);
  const storageTimerRef = useRef<number | null>(null);
  const pendingRefreshReasonRef = useRef("initial");
  const scrollingRef = useRef(false);
  const scrollIdleTimerRef = useRef<number | null>(null);

  const writeState = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateRef.current));
      if (process.env.NODE_ENV !== "production") {
        document.documentElement.dataset.storedNarrativeChapter = stateRef.current.chapterId;
        document.documentElement.dataset.storedNarrativeProgress =
          stateRef.current.localProgress.toFixed(5);
        document.documentElement.dataset.storedNarrativeFrame = String(
          stateRef.current.frameIndex ?? "",
        );
      }
    } catch {
      // Session persistence is an enhancement; scrolling must never depend on storage.
    }
  }, []);

  const updateNarrativeState = useCallback(
    (nextState: NarrativeState) => {
      // A reload can briefly expose the browser's retained pixel position before
      // every pinned chapter has rebuilt its final range. Ignore those transient
      // trigger callbacks until the saved logical chapter has been restored.
      if (pendingRestoreStateRef.current) return;
      const normalized = { ...nextState, localProgress: clamp01(nextState.localProgress) };
      stateRef.current = normalized;
      setActiveChapterId((current) =>
        current === normalized.chapterId ? current : normalized.chapterId,
      );
      if (process.env.NODE_ENV !== "production" && window.__ASCEND_NARRATIVE__) {
        window.__ASCEND_NARRATIVE__.state = normalized;
      }
      if (process.env.NODE_ENV !== "production") {
        document.documentElement.dataset.narrativeProgress =
          normalized.localProgress.toFixed(5);
        document.documentElement.dataset.narrativeFrame = String(normalized.frameIndex ?? "");
      }
      if (storageTimerRef.current !== null) window.clearTimeout(storageTimerRef.current);
      storageTimerRef.current = window.setTimeout(writeState, 120);
    },
    [writeState],
  );

  const registerChapter = useCallback((registration: ChapterRegistration) => {
    const previous = registrationsRef.current.get(registration.id);
    registrationsRef.current.set(registration.id, registration);
    return () => {
      if (registrationsRef.current.get(registration.id) !== registration) return;
      if (previous) registrationsRef.current.set(registration.id, previous);
      else registrationsRef.current.delete(registration.id);
    };
  }, []);

  const restoreState = useCallback(
    (state: NarrativeState) => {
      const pendingState = pendingRestoreStateRef.current;
      if (pendingState && pendingState.chapterId !== state.chapterId) return false;
      const registration = registrationsRef.current.get(state.chapterId);
      const range = registration?.getRange();
      if (!registration || !range) return false;

      const applyRestore = (
        currentRegistration: ChapterRegistration,
        currentRange: { start: number; end: number },
      ) => {
        const target =
          currentRange.start +
          clamp01(state.localProgress) * Math.max(0, currentRange.end - currentRange.start);
        const boundedTarget = Math.min(
          Math.max(0, target),
          Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
        );
        lenisRef.current?.scrollTo(boundedTarget, { immediate: true, force: true });
        if (!lenisRef.current) window.scrollTo({ top: boundedTarget, behavior: "instant" });
        currentRegistration.restore?.(state);
        return boundedTarget;
      };
      const boundedTarget = applyRestore(registration, range);
      if (process.env.NODE_ENV !== "production") {
        document.documentElement.dataset.restoreNarrativeChapter = state.chapterId;
        document.documentElement.dataset.restoreNarrativeProgress =
          state.localProgress.toFixed(5);
        document.documentElement.dataset.restoreNarrativeTarget = boundedTarget.toFixed(2);
        document.documentElement.dataset.restoreNarrativeRange = `${range.start.toFixed(2)}:${range.end.toFixed(2)}`;
      }
      if (pendingState?.chapterId === state.chapterId) {
        if (restoreSettleTimerRef.current !== null) {
          window.clearTimeout(restoreSettleTimerRef.current);
        }
        restoreSettleTimerRef.current = window.setTimeout(() => {
          restoreSettleTimerRef.current = null;
          const latestState = pendingRestoreStateRef.current;
          const latestRegistration = registrationsRef.current.get(state.chapterId);
          const latestRange = latestRegistration?.getRange();
          if (!latestState || latestState.chapterId !== state.chapterId) return;
          if (!latestRegistration || !latestRange) return;
          applyRestore(latestRegistration, latestRange);
          pendingRestoreStateRef.current = null;
          updateNarrativeState(latestState);
          ScrollTrigger.update();
        }, 700);
        return true;
      }
      updateNarrativeState(state);
      return true;
    },
    [updateNarrativeState],
  );

  const requestRefresh = useCallback(
    (reason = "layout") => {
      pendingRefreshReasonRef.current = reason;
      if (refreshFrameRef.current !== null) return;

      refreshFrameRef.current = window.requestAnimationFrame(() => {
        refreshFrameRef.current = null;
        // Coalesced child effects can request a refresh before the coordinator
        // has read the saved session state. Capture at execution time so the
        // newest chapter/frame is the one preserved across the refresh.
        const captured = {
          ...(pendingRestoreStateRef.current ?? stateRef.current),
        };
        ScrollTrigger.refresh();
        if (restoreFrameRef.current !== null) window.cancelAnimationFrame(restoreFrameRef.current);
        restoreFrameRef.current = window.requestAnimationFrame(() => {
          restoreFrameRef.current = null;
          restoreState(captured);
          if (process.env.NODE_ENV !== "production") {
            document.documentElement.dataset.lastNarrativeRefresh =
              pendingRefreshReasonRef.current;
          }
        });
      });
    },
    [restoreState],
  );

  const scrollToPosition = useCallback((target: number, onComplete?: () => void) => {
    const boundedTarget = Math.min(
      Math.max(0, target),
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
    );
    const lenis = lenisRef.current;
    if (!lenis) {
      window.scrollTo({ top: boundedTarget, behavior: "auto" });
      ScrollTrigger.update();
      onComplete?.();
      return;
    }
    lenis.scrollTo(boundedTarget, {
      duration: 0.45,
      easing: (progress) => 1 - Math.pow(1 - progress, 4),
      force: true,
      lock: true,
      onComplete: () => {
        ScrollTrigger.update();
        onComplete?.();
      },
    });
  }, []);

  const setDirectScroll = useCallback((active: boolean) => {
    directScrollRef.current = active;
    const lenis = lenisRef.current;
    if (!lenis) return;
    lenis.options.lerp = active ? 1 : 0.115;
    if (active) lenis.scrollTo(window.scrollY, { immediate: true, force: true });
  }, []);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const forcedReduced =
      process.env.NODE_ENV !== "production" &&
      new URLSearchParams(window.location.search).get("reduced") === "1";
    const updateMotion = () => setReducedMotion(forcedReduced || motionQuery.matches);
    const updateVisibility = () => setDocumentVisible(document.visibilityState !== "hidden");
    const updateQuality = () => {
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("quality");
      const forced =
        process.env.NODE_ENV !== "production" &&
        requested &&
        requested in HERO_QUALITY_PROFILES
          ? HERO_QUALITY_PROFILES[requested as keyof typeof HERO_QUALITY_PROFILES]
          : null;
      setQuality(forced ?? chooseHeroQuality());
    };

    updateMotion();
    updateVisibility();
    updateQuality();
    motionQuery.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    window.addEventListener("orientationchange", updateQuality);
    return () => {
      motionQuery.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
      window.removeEventListener("orientationchange", updateQuality);
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    document.documentElement.dataset.reducedMotion = reducedMotion ? "true" : "false";
    document.documentElement.dataset.narrativeQuality = quality.name;
    document.documentElement.dataset.documentVisible = documentVisible ? "true" : "false";
    document.documentElement.dataset.activeChapter = activeChapterId;
    return () => {
      delete document.documentElement.dataset.reducedMotion;
      delete document.documentElement.dataset.narrativeQuality;
      delete document.documentElement.dataset.documentVisible;
      delete document.documentElement.dataset.activeChapter;
    };
  }, [activeChapterId, documentVisible, quality.name, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({
      autoRaf: false,
      lerp: directScrollRef.current ? 1 : 0.115,
      smoothWheel: true,
      syncTouch: false,
      anchors: false,
    });
    lenisRef.current = lenis;
    const tick = (time: number) => lenis.raf(time * 1_000);
    const onScroll = () => {
      scrollingRef.current = true;
      if (scrollIdleTimerRef.current !== null) window.clearTimeout(scrollIdleTimerRef.current);
      scrollIdleTimerRef.current = window.setTimeout(() => {
        scrollingRef.current = false;
      }, 90);
      ScrollTrigger.update();
    };
    lenis.on("scroll", onScroll);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.off("scroll", onScroll);
      lenis.destroy();
      if (lenisRef.current === lenis) lenisRef.current = null;
    };
  }, [reducedMotion]);

  useEffect(() => {
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    let storedChapterFrame: number | null = null;
    const stored = readStoredState();
    if (stored) {
      stateRef.current = stored;
      pendingRestoreStateRef.current = stored;
      storedChapterFrame = requestAnimationFrame(() => setActiveChapterId(stored.chapterId));
    }

    const onResize = () => {
      if (resizeTimerRef.current !== null) window.clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = window.setTimeout(() => {
        setQuality((current) => {
          const next = chooseHeroQuality();
          return current.name === next.name ? current : next;
        });
        requestRefresh("viewport");
      }, 140);
    };
    const onPageShow = () => requestRefresh("pageshow");
    const onPageHide = () => writeState();
    const onVisibility = () => {
      if (document.visibilityState === "visible") requestRefresh("visibility");
      else writeState();
    };

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize, { passive: true });
    window.visualViewport?.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibility);

    document.fonts.ready.then(() => requestRefresh("fonts"));
    requestRefresh("mount");

    if (process.env.NODE_ENV !== "production") {
      window.__ASCEND_NARRATIVE__ = {
        state: stateRef.current,
        refresh: requestRefresh,
        chapters: () =>
          Array.from(registrationsRef.current.values())
            .sort((a, b) => a.order - b.order)
            .map(({ id }) => id),
      };
    }

    return () => {
      history.scrollRestoration = previousRestoration;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
      if (refreshFrameRef.current !== null) window.cancelAnimationFrame(refreshFrameRef.current);
      if (restoreFrameRef.current !== null) window.cancelAnimationFrame(restoreFrameRef.current);
      if (restoreSettleTimerRef.current !== null) window.clearTimeout(restoreSettleTimerRef.current);
      if (resizeTimerRef.current !== null) window.clearTimeout(resizeTimerRef.current);
      if (storageTimerRef.current !== null) window.clearTimeout(storageTimerRef.current);
      if (scrollIdleTimerRef.current !== null) window.clearTimeout(scrollIdleTimerRef.current);
      if (storedChapterFrame !== null) cancelAnimationFrame(storedChapterFrame);
      delete window.__ASCEND_NARRATIVE__;
    };
  }, [requestRefresh, writeState]);

  useEffect(() => {
    if (reducedMotion || !documentVisible || scrollingRef.current) return;
    let frame = 0;
    let sampleCount = 0;
    let totalDelta = 0;
    let previous = performance.now();
    let cancelled = false;
    const sample = (now: number) => {
      if (cancelled) return;
      totalDelta += Math.min(80, now - previous);
      previous = now;
      sampleCount += 1;
      if (sampleCount < 36) {
        frame = window.requestAnimationFrame(sample);
        return;
      }
      if (totalDelta / sampleCount > 23) setQuality((current) => lowerQuality(current));
    };
    frame = window.requestAnimationFrame(sample);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [documentVisible, reducedMotion, quality.name]);

  const value = useMemo<NarrativeCoordinatorValue>(
    () => ({
      reducedMotion,
      documentVisible,
      quality,
      activeChapterId,
      updateNarrativeState,
      registerChapter,
      requestRefresh,
      scrollToPosition,
      setDirectScroll,
    }),
    [
      reducedMotion,
      documentVisible,
      quality,
      activeChapterId,
      updateNarrativeState,
      registerChapter,
      requestRefresh,
      scrollToPosition,
      setDirectScroll,
    ],
  );

  return (
    <NarrativeCoordinatorContext.Provider value={value}>
      {children}
    </NarrativeCoordinatorContext.Provider>
  );
}

export function useNarrativeCoordinator() {
  const context = useContext(NarrativeCoordinatorContext);
  if (!context) throw new Error("useNarrativeCoordinator must be used inside NarrativeCoordinator");
  return context;
}

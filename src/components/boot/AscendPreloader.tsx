"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const SESSION_KEY = "ascend-vanta:core-ignition:v1";
const HERO_MOTION_EVENT = "ascend:hero-motion-ready";
const BOOT_COMPLETE_EVENT = "ascend:boot-complete";
const FULL_MINIMUM_MS = 620;
const WARM_MINIMUM_MS = 220;
const REDUCED_MINIMUM_MS = 100;
const CRITICAL_SHELL_CEILING_MS = 1_250;
const EMERGENCY_MAXIMUM_MS = 1_750;

type IgnitionMode = "full" | "warm" | "reduced";

declare global {
  interface WindowEventMap {
    "ascend:hero-motion-ready": CustomEvent<{ source: string }>;
    "ascend:boot-complete": CustomEvent<{ reason: string }>;
    "ascend:boot-emergency": CustomEvent<{ reason: string }>;
  }
}

function bounded<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(null), timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      () => {
        window.clearTimeout(timer);
        resolve(null);
      },
    );
  });
}

function waitForPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

function waitForHeroMotion() {
  if (document.documentElement.dataset.ascendHeroMotionReady === "true") {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const onReady = () => {
      window.removeEventListener(HERO_MOTION_EVENT, onReady);
      resolve();
    };
    window.addEventListener(HERO_MOTION_EVENT, onReady, { once: true });
  });
}

function readIgnitionMode(): IgnitionMode {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "reduced";
  try {
    return sessionStorage.getItem(SESSION_KEY) === "complete" ? "warm" : "full";
  } catch {
    return "full";
  }
}

export function AscendPreloader() {
  const loaderRef = useRef<HTMLDivElement>(null);
  const releasedRef = useRef(false);
  const [mounted, setMounted] = useState(true);

  useGSAP(
    (context, contextSafe) => {
      const loader = loaderRef.current;
      const shell = loader?.closest<HTMLElement>("[data-ascend-app]") ?? null;
      const fallback = shell?.querySelector<HTMLElement>(".hero-fallback") ?? null;
      const cornerLogo = shell?.querySelector<HTMLImageElement>(".hero-corner-logo") ?? null;
      const wordmark = shell?.querySelector<HTMLHeadingElement>(".hero-wordmark-lockup") ?? null;
      const vignette = shell?.querySelector<HTMLDivElement>(".hero-vignette") ?? null;
      if (!loader || !shell || !fallback || !cornerLogo || !wordmark || !vignette) return;
      const safe = <Arguments extends unknown[], Result>(
        callback: (...arguments_: Arguments) => Result,
      ) => (contextSafe ? contextSafe(callback) : callback);

      const root = document.documentElement;
      const mode = readIgnitionMode();
      const minimumMs =
        mode === "reduced"
          ? REDUCED_MINIMUM_MS
          : mode === "warm"
            ? WARM_MINIMUM_MS
            : FULL_MINIMUM_MS;
      const startedAt = performance.now();
      let cinematicReady = false;
      let resourcesReady = false;
      let cancelled = false;
      let emergencyTimer = 0;
      let criticalShellTimer = 0;
      let minimumTimer = 0;

      loader.dataset.mode = mode;
      loader.dataset.state = "igniting";
      root.dataset.ascendBoot = "loading";
      root.dataset.ascendIgnitionMode = mode;
      shell.setAttribute("aria-busy", "true");

      gsap.set([wordmark, vignette], {
        autoAlpha: 0,
      });
      gsap.set(wordmark, { yPercent: 8, scale: 0.98, transformOrigin: "center bottom" });

      const trace = loader.querySelector(".av-core-energy-trace");
      const paths = loader.querySelectorAll(".av-core-path");
      const segments = loader.querySelectorAll(".av-core-segment");
      const core = loader.querySelector(".av-core-light");
      const rings = loader.querySelectorAll(".av-core-ring");
      const status = loader.querySelector(".av-core-status");

      gsap.set(trace, { autoAlpha: 0, scaleX: 0, transformOrigin: "left center" });
      gsap.set(paths, { autoAlpha: 0.22, strokeDashoffset: 0.82 });
      gsap.set(segments, { autoAlpha: 0, scale: 0.72, transformOrigin: "center" });
      gsap.set(core, { autoAlpha: 0, scale: 0.15, transformOrigin: "center" });
      gsap.set(rings, { autoAlpha: 0, scale: 0.55, transformOrigin: "center" });
      gsap.set(status, { autoAlpha: 0, y: 6 });

      const markCinematicReady = safe(() => {
        cinematicReady = true;
        loader.dataset.state = "energized";
        maybeRelease();
      });

      const ignition = gsap.timeline({
        defaults: { overwrite: "auto" },
        onComplete: markCinematicReady,
      });

      if (mode === "reduced") {
        ignition
          .to(paths, { autoAlpha: 0.62, strokeDashoffset: 0, duration: 0.08 })
          .to(core, { autoAlpha: 0.58, scale: 0.72, duration: 0.08 }, 0.02);
      } else if (mode === "warm") {
        ignition
          .to(trace, { autoAlpha: 0.72, scaleX: 1, duration: 0.1, ease: "power2.out" })
          .to(paths, {
            autoAlpha: 0.78,
            strokeDashoffset: 0,
            duration: 0.16,
            stagger: 0.015,
            ease: "power2.inOut",
          }, 0.03)
          .to(core, { autoAlpha: 0.86, scale: 1, duration: 0.12, ease: "power2.out" }, 0.14)
          .to(rings, {
            autoAlpha: 0.32,
            scale: 1,
            duration: 0.12,
            stagger: 0.02,
            ease: "power2.out",
          }, 0.16);
      } else {
        ignition
          .to(status, { autoAlpha: 0.62, y: 0, duration: 0.12, ease: "power2.out" })
          .to(trace, {
            autoAlpha: 0.82,
            scaleX: 1,
            duration: 0.18,
            ease: "power3.inOut",
          }, 0.02)
          .to(paths, {
            autoAlpha: 0.86,
            strokeDashoffset: 0,
            duration: 0.3,
            stagger: 0.035,
            ease: "power2.inOut",
          }, 0.08)
          .to(segments, {
            autoAlpha: 0.78,
            scale: 1,
            duration: 0.16,
            stagger: 0.025,
            ease: "power2.out",
          }, 0.2)
          .to(core, {
            autoAlpha: 0.95,
            scale: 1,
            duration: 0.18,
            ease: "power3.out",
          }, 0.3)
          .to(paths, { autoAlpha: 0.18, duration: 0.15 }, 0.44)
          .to(rings, {
            autoAlpha: 0.38,
            scale: 1,
            duration: 0.2,
            stagger: 0.03,
            ease: "power3.out",
          }, 0.36)
          .to(trace, { autoAlpha: 0, duration: 0.14 }, 0.5)
          .to(status, { autoAlpha: 0.78, duration: 0.1 }, 0.48);
      }
      if (mode === "warm") ignition.timeScale(2.5);
      if (mode === "reduced") ignition.timeScale(4);

      const finishRelease = safe((reason: string) => {
        if (cancelled) return;
        root.dataset.ascendBoot = "complete";
        root.dataset.ascendBootReason = reason;
        delete root.dataset.ascendHeroMotionReady;
        shell.setAttribute("aria-busy", "false");
        loader.dataset.state = "complete";
        loader.setAttribute("aria-hidden", "true");
        gsap.set([wordmark, vignette], {
          clearProps: "opacity,visibility,transform,filter",
        });
        try {
          sessionStorage.setItem(SESSION_KEY, "complete");
        } catch {
          // Session-aware timing is an enhancement, never a release dependency.
        }
        window.dispatchEvent(new CustomEvent(BOOT_COMPLETE_EVENT, { detail: { reason } }));
        setMounted(false);
      });

      const release = safe((reason: string) => {
        if (releasedRef.current || cancelled) return;
        releasedRef.current = true;
        window.clearTimeout(emergencyTimer);
        window.clearTimeout(criticalShellTimer);
        window.clearTimeout(minimumTimer);
        loader.dataset.state = "releasing";

        gsap.set([wordmark, vignette], { autoAlpha: 0 });
        gsap.set(wordmark, { yPercent: 8, scale: 0.98 });
        root.dataset.ascendBoot = "ready";

        window.requestAnimationFrame(() => {
          if (cancelled) return;
          window.dispatchEvent(new CustomEvent("ascend:hero-entering"));
          const veilDuration =
            mode === "reduced" ? 0.05 : mode === "warm" ? 0.1 : 0.26;
          const wordmarkDuration =
            mode === "reduced" ? 0.06 : mode === "warm" ? 0.1 : 0.26;
          const loaderFadeAt =
            mode === "reduced" ? 0.01 : mode === "warm" ? 0.03 : 0.12;
          const loaderFadeDuration =
            mode === "reduced" ? 0.04 : mode === "warm" ? 0.08 : 0.16;
          const releaseTimeline = gsap.timeline({
            defaults: { overwrite: "auto" },
            onComplete: () => finishRelease(reason),
          });
          releaseTimeline
            .to(vignette, {
              autoAlpha: 1,
              duration: mode === "reduced" ? 0.05 : mode === "warm" ? 0.1 : 0.24,
              ease: "power2.out",
            }, 0)
            .to(wordmark, {
              autoAlpha: 1,
              yPercent: 0,
              scale: 1,
              duration: wordmarkDuration,
              ease: "power3.out",
            }, mode === "reduced" ? 0 : mode === "warm" ? 0.02 : 0.04)
            .to(".av-core-veil--northwest", {
              xPercent: -8,
              yPercent: -12,
              autoAlpha: 0,
              duration: veilDuration,
              ease: "power4.inOut",
            }, 0.04)
            .to(".av-core-veil--southeast", {
              xPercent: 8,
              yPercent: 12,
              autoAlpha: 0,
              duration: veilDuration,
              ease: "power4.inOut",
            }, 0.04)
            .to(".av-core-assembly", {
              scale: mode === "reduced" ? 1 : 1.14,
              autoAlpha: 0,
              duration: mode === "reduced" ? 0.05 : mode === "warm" ? 0.09 : 0.22,
              ease: "power3.in",
            }, 0)
            .to(loader, {
              autoAlpha: 0,
              duration: loaderFadeDuration,
              ease: "power2.out",
            }, loaderFadeAt);
        });
      });

      function maybeRelease() {
        if (!cinematicReady || !resourcesReady || releasedRef.current || cancelled) return;
        const remaining = Math.max(0, minimumMs - (performance.now() - startedAt));
        minimumTimer = window.setTimeout(() => release("ready"), remaining);
      }

      Promise.allSettled([
        bounded(waitForHeroMotion(), 1_100),
        bounded(waitForPaint(), 180),
      ]).then(
        safe(() => {
          if (cancelled) return;
          resourcesReady = true;
          root.dataset.ascendCriticalReady = "true";
          maybeRelease();
        }),
      );

      criticalShellTimer = window.setTimeout(() => {
        if (cancelled || resourcesReady) return;
        resourcesReady = true;
        root.dataset.ascendCriticalReady = "fallback";
        maybeRelease();
      }, CRITICAL_SHELL_CEILING_MS);

      const onBootstrapEmergency = safe(() => {
        resourcesReady = true;
        cinematicReady = true;
        release("bootstrap-timeout");
      });
      window.addEventListener("ascend:boot-emergency", onBootstrapEmergency, { once: true });

      emergencyTimer = window.setTimeout(() => {
        resourcesReady = true;
        cinematicReady = true;
        release("timeout");
      }, EMERGENCY_MAXIMUM_MS);

      return () => {
        cancelled = true;
        window.clearTimeout(emergencyTimer);
        window.clearTimeout(criticalShellTimer);
        window.clearTimeout(minimumTimer);
        window.removeEventListener("ascend:boot-emergency", onBootstrapEmergency);
        ignition.kill();
      };
    },
    { scope: loaderRef },
  );

  if (!mounted) return null;

  return (
    <div
      ref={loaderRef}
      className="ascend-preloader"
      data-ascend-preloader
      data-state="loading"
      role="status"
      aria-live="polite"
      aria-label="Preparing Ascend Vanta"
    >
      <div className="av-core-veil av-core-veil--northwest" aria-hidden="true" />
      <div className="av-core-veil av-core-veil--southeast" aria-hidden="true" />
      <div className="av-core-field" aria-hidden="true">
        <span className="av-core-energy-trace" />
        <span className="av-core-ring av-core-ring--outer" />
        <span className="av-core-ring av-core-ring--inner" />
        <div className="av-core-assembly">
          <svg
            className="av-core-glyph"
            viewBox="0 0 104 74"
            role="presentation"
            focusable="false"
          >
            <path
              className="av-core-path av-core-path--lime"
              pathLength="1"
              d="M7 64L45 7L78 64M25 52H65M31 40H59"
            />
            <path
              className="av-core-path av-core-path--pearl"
              pathLength="1"
              d="M58 19L76 54L101 9"
            />
            <path className="av-core-segment av-core-segment--one" d="M8 64L20 64L45 26L39 14Z" />
            <path className="av-core-segment av-core-segment--two" d="M25 52H65L72 64H18Z" />
            <path className="av-core-segment av-core-segment--three" d="M59 19L76 54L84 43L71 19Z" />
            <path className="av-core-segment av-core-segment--four" d="M76 54L101 9H88L70 42Z" />
          </svg>
          <span className="av-core-light" />
        </div>
      </div>
      <p className="av-core-status">
        <span aria-hidden="true">AV / CORE</span>
        <span className="sr-only">Preparing Ascend Vanta</span>
      </p>
    </div>
  );
}

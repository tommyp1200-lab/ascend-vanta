"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const SESSION_KEY = "ascend-vanta:core-ignition:v1";
const HERO_MOTION_EVENT = "ascend:hero-motion-ready";
const BOOT_COMPLETE_EVENT = "ascend:boot-complete";
const FULL_MINIMUM_MS = 1_400;
const WARM_MINIMUM_MS = 450;
const REDUCED_MINIMUM_MS = 220;
const EMERGENCY_MAXIMUM_MS = 4_000;

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

function waitForPoster(picture: HTMLElement | null) {
  const image = picture?.querySelector("img");
  if (!image) return Promise.resolve();
  if (image.complete && image.naturalWidth > 0) {
    return image.decode?.().catch(() => undefined) ?? Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const finish = () => {
      image.removeEventListener("load", finish);
      image.removeEventListener("error", finish);
      const decode = image.decode?.();
      if (decode) decode.catch(() => undefined).finally(resolve);
      else resolve();
    };
    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
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
      let minimumTimer = 0;

      loader.dataset.mode = mode;
      loader.dataset.state = "igniting";
      root.dataset.ascendBoot = "loading";
      root.dataset.ascendIgnitionMode = mode;
      shell.setAttribute("aria-busy", "true");

      gsap.set([fallback, cornerLogo, wordmark, vignette], {
        autoAlpha: 0,
      });
      gsap.set(fallback, {
        scale: 1.035,
        filter: "brightness(0.4) saturate(0.72) blur(6px)",
        transformOrigin: "center center",
      });
      gsap.set(cornerLogo, { y: -12 });
      gsap.set(wordmark, { yPercent: 8, scale: 0.98, transformOrigin: "center bottom" });

      const trace = loader.querySelector(".av-core-energy-trace");
      const paths = loader.querySelectorAll(".av-core-path");
      const segments = loader.querySelectorAll(".av-core-segment");
      const authenticMark = loader.querySelector(".av-core-authentic-mark");
      const core = loader.querySelector(".av-core-light");
      const rings = loader.querySelectorAll(".av-core-ring");
      const particles = loader.querySelectorAll(".av-core-particle");
      const status = loader.querySelector(".av-core-status");

      gsap.set(trace, { autoAlpha: 0, scaleX: 0, transformOrigin: "left center" });
      gsap.set(paths, { autoAlpha: 0, strokeDashoffset: 1 });
      gsap.set(segments, { autoAlpha: 0, scale: 0.72, transformOrigin: "center" });
      gsap.set(authenticMark, { autoAlpha: 0, scale: 0.985, filter: "blur(7px)" });
      gsap.set(core, { autoAlpha: 0, scale: 0.15, transformOrigin: "center" });
      gsap.set(rings, { autoAlpha: 0, scale: 0.55, transformOrigin: "center" });
      gsap.set(particles, { autoAlpha: 0, scale: 0, x: 0, y: 0 });
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
          .to(authenticMark, {
            autoAlpha: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.16,
            ease: "power1.out",
          })
          .to(core, { autoAlpha: 0.72, scale: 0.78, duration: 0.12 }, 0.04);
      } else if (mode === "warm") {
        ignition
          .to(trace, { autoAlpha: 0.72, scaleX: 1, duration: 0.16, ease: "power2.out" })
          .to(paths, {
            autoAlpha: 0.78,
            strokeDashoffset: 0,
            duration: 0.28,
            stagger: 0.025,
            ease: "power2.inOut",
          }, 0.07)
          .to(authenticMark, {
            autoAlpha: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.24,
            ease: "power2.out",
          }, 0.24)
          .to(core, { autoAlpha: 0.9, scale: 1, duration: 0.22, ease: "back.out(1.4)" }, 0.27)
          .to(rings, {
            autoAlpha: 0.42,
            scale: 1,
            duration: 0.24,
            stagger: 0.035,
            ease: "power2.out",
          }, 0.3);
      } else {
        ignition
          .to(status, { autoAlpha: 0.62, y: 0, duration: 0.24, ease: "power2.out" })
          .to(trace, {
            autoAlpha: 0.82,
            scaleX: 1,
            duration: 0.34,
            ease: "power3.inOut",
          }, 0.04)
          .to(paths, {
            autoAlpha: 0.86,
            strokeDashoffset: 0,
            duration: 0.58,
            stagger: 0.075,
            ease: "power2.inOut",
          }, 0.18)
          .to(segments, {
            autoAlpha: 0.78,
            scale: 1,
            duration: 0.3,
            stagger: 0.055,
            ease: "back.out(1.45)",
          }, 0.48)
          .to(core, {
            autoAlpha: 0.95,
            scale: 1,
            duration: 0.34,
            ease: "back.out(1.65)",
          }, 0.72)
          .to(authenticMark, {
            autoAlpha: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.48,
            ease: "power3.out",
          }, 0.78)
          .to(paths, { autoAlpha: 0.2, duration: 0.28 }, 1.02)
          .to(rings, {
            autoAlpha: 0.46,
            scale: 1,
            duration: 0.5,
            stagger: 0.06,
            ease: "power3.out",
          }, 0.84)
          .to(particles, {
            autoAlpha: 0.72,
            scale: 1,
            x: (index) => Math.cos((index / Math.max(1, particles.length)) * Math.PI * 2) * 22,
            y: (index) => Math.sin((index / Math.max(1, particles.length)) * Math.PI * 2) * 18,
            duration: 0.44,
            stagger: 0.025,
            ease: "power2.out",
          }, 0.9)
          .to(trace, { autoAlpha: 0, duration: 0.26 }, 1.12)
          .to(status, { autoAlpha: 0.86, duration: 0.22 }, 1.18);
      }
      if (mode === "full") ignition.timeScale(1.35);
      if (mode === "warm") ignition.timeScale(3);

      const finishRelease = safe((reason: string) => {
        if (cancelled) return;
        root.dataset.ascendBoot = "complete";
        root.dataset.ascendBootReason = reason;
        delete root.dataset.ascendHeroMotionReady;
        shell.setAttribute("aria-busy", "false");
        loader.dataset.state = "complete";
        loader.setAttribute("aria-hidden", "true");
        gsap.set([fallback, cornerLogo, wordmark, vignette], {
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
        window.clearTimeout(minimumTimer);
        loader.dataset.state = "releasing";

        gsap.set([fallback, cornerLogo, wordmark, vignette], { autoAlpha: 0 });
        gsap.set(fallback, {
          scale: 1.035,
          filter: "brightness(0.4) saturate(0.72) blur(6px)",
        });
        gsap.set(cornerLogo, { y: -12 });
        gsap.set(wordmark, { yPercent: 8, scale: 0.98 });
        gsap.set(loader, { background: "transparent" });
        root.dataset.ascendBoot = "ready";

        window.requestAnimationFrame(() => {
          if (cancelled) return;
          window.dispatchEvent(new CustomEvent("ascend:hero-entering"));
          const fallbackDuration =
            mode === "reduced" ? 0.18 : mode === "warm" ? 0.22 : 0.5;
          const veilDuration =
            mode === "reduced" ? 0.16 : mode === "warm" ? 0.22 : 0.5;
          const logoDuration =
            mode === "reduced" ? 0.16 : mode === "warm" ? 0.18 : 0.42;
          const wordmarkDuration =
            mode === "reduced" ? 0.18 : mode === "warm" ? 0.2 : 0.46;
          const loaderFadeAt =
            mode === "reduced" ? 0.1 : mode === "warm" ? 0.12 : 0.3;
          const loaderFadeDuration =
            mode === "reduced" ? 0.12 : mode === "warm" ? 0.1 : 0.2;
          const releaseTimeline = gsap.timeline({
            defaults: { overwrite: "auto" },
            onComplete: () => finishRelease(reason),
          });
          releaseTimeline
            .to(fallback, {
              autoAlpha: 1,
              scale: 1,
              filter: "brightness(1) saturate(1) blur(0px)",
              duration: fallbackDuration,
              ease: "power3.out",
            }, 0)
            .to(vignette, {
              autoAlpha: 1,
              duration: mode === "reduced" ? 0.14 : mode === "warm" ? 0.22 : 0.48,
              ease: "power2.out",
            }, 0)
            .to(cornerLogo, {
              autoAlpha: 1,
              y: 0,
              duration: logoDuration,
              ease: "power3.out",
            }, mode === "reduced" ? 0 : mode === "warm" ? 0.02 : 0.06)
            .to(wordmark, {
              autoAlpha: 1,
              yPercent: 0,
              scale: 1,
              duration: wordmarkDuration,
              ease: "power3.out",
            }, mode === "reduced" ? 0 : mode === "warm" ? 0.03 : 0.08)
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
              filter: "blur(5px)",
              duration: mode === "reduced" ? 0.14 : mode === "warm" ? 0.2 : 0.4,
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
        bounded(document.fonts.ready, 1_200),
        bounded(waitForPoster(fallback), 1_500),
        bounded(waitForHeroMotion(), 2_400),
        bounded(waitForPaint(), 600),
      ]).then(
        safe(() => {
          if (cancelled) return;
          resourcesReady = true;
          root.dataset.ascendCriticalReady = "true";
          maybeRelease();
        }),
      );

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
            <defs>
              <filter id="av-core-glow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="1.25" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <clipPath id="av-core-authentic-crop">
                <rect x="0" y="0" width="104" height="74" rx="2" />
              </clipPath>
            </defs>
            <image
              className="av-core-authentic-mark"
              href="/assets/brand/ascend-vanta-corner-logo.png"
              x="0"
              y="0"
              width="414"
              height="74"
              preserveAspectRatio="xMinYMid meet"
              clipPath="url(#av-core-authentic-crop)"
            />
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
          {Array.from({ length: 12 }, (_, index) => (
            <span
              className="av-core-particle"
              style={{ "--particle-index": index } as React.CSSProperties}
              key={index}
            />
          ))}
        </div>
      </div>
      <p className="av-core-status">
        <span aria-hidden="true">AV / CORE</span>
        <span className="sr-only">Preparing Ascend Vanta</span>
      </p>
    </div>
  );
}

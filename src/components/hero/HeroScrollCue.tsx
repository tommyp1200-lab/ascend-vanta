"use client";

import { useEffect, useState } from "react";

const IDLE_DELAY_MS = 4_000;
const SCROLL_KEYS = new Set([
  "ArrowDown",
  "ArrowUp",
  "End",
  "Home",
  "PageDown",
  "PageUp",
  " ",
]);

export function HeroScrollCue() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let idleTimer: number | null = null;

    const clearIdleTimer = () => {
      if (idleTimer !== null) {
        window.clearTimeout(idleTimer);
        idleTimer = null;
      }
    };

    const isInsideHero = () => window.scrollY <= window.innerHeight * 0.18;

    const scheduleReveal = () => {
      clearIdleTimer();
      setVisible(false);

      if (!isInsideHero()) return;

      idleTimer = window.setTimeout(() => {
        if (isInsideHero()) setVisible(true);
      }, IDLE_DELAY_MS);
    };

    const handleScrollIntent = () => scheduleReveal();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (SCROLL_KEYS.has(event.key)) scheduleReveal();
    };

    scheduleReveal();
    window.addEventListener("scroll", handleScrollIntent, { passive: true });
    window.addEventListener("wheel", handleScrollIntent, { passive: true });
    window.addEventListener("touchmove", handleScrollIntent, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearIdleTimer();
      window.removeEventListener("scroll", handleScrollIntent);
      window.removeEventListener("wheel", handleScrollIntent);
      window.removeEventListener("touchmove", handleScrollIntent);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="hero-scroll-cue" data-visible={visible ? "true" : "false"} aria-hidden="true">
      <span className="hero-scroll-cue-copy">scroll down</span>
      <span className="hero-scroll-cue-motion">
        <span className="hero-scroll-cue-trace" />
        <span className="hero-scroll-cue-chevron" />
        <span className="hero-scroll-cue-chevron" />
        <span className="hero-scroll-cue-chevron" />
      </span>
    </div>
  );
}

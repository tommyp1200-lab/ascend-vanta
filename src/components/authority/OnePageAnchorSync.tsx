"use client";

import { useEffect } from "react";

const HOMEPAGE_ANCHORS = new Set([
  "about",
  "work",
  "capabilities",
  "marketing-systems",
  "web-experience-ux-ui",
  "ai-automation",
  "seo-aeo-geo",
  "analytics-attribution",
  "publications",
  "seo-geo-ai-search-survival-guide",
  "content-is-not-the-strategy",
  "linkedin-featured-framework",
  "contact",
]);

export function OnePageAnchorSync() {
  useEffect(() => {
    let timers: number[] = [];

    const alignToHash = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [];
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!HOMEPAGE_ANCHORS.has(id)) return;

      const align = () => {
        document.getElementById(id)?.scrollIntoView({ behavior: "auto", block: "start" });
      };

      align();
      timers = [80, 320, 900, 1600].map((delay) => window.setTimeout(align, delay));
    };

    const cancelPendingAlignment = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [];
    };

    const interactionEvents = ["wheel", "touchstart", "pointerdown", "keydown"] as const;

    alignToHash();
    window.addEventListener("hashchange", alignToHash);
    interactionEvents.forEach((event) => window.addEventListener(event, cancelPendingAlignment, { passive: true }));
    return () => {
      window.removeEventListener("hashchange", alignToHash);
      interactionEvents.forEach((event) => window.removeEventListener(event, cancelPendingAlignment));
      cancelPendingAlignment();
    };
  }, []);

  return null;
}

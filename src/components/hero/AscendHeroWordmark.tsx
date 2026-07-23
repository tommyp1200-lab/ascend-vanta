"use client";

import type { RefObject } from "react";

export function AscendHeroWordmark({
  wordmarkRef,
}: {
  wordmarkRef: RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <h1 ref={wordmarkRef} className="hero-wordmark-lockup" data-hero-animated>
      <span className="sr-only">Ascend Vanta — Tommy Pisano’s creative technology and growth systems portfolio</span>
      <svg
        className="hero-wordmark-image"
        viewBox="0 0 2400 520"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        focusable="false"
      >
        <use href="/assets/wordmark/ascend-vanta-wordmark.svg#ascend-vanta-wordmark" />
      </svg>
      <svg
        className="hero-wordmark-signal"
        viewBox="0 0 2400 520"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <path
          className="hero-wordmark-signal-path hero-wordmark-signal-path--left"
          pathLength="1"
          d="M206.5 212V318L162.1 330H1207.2L1312.2 394"
        />
        <path
          className="hero-wordmark-signal-path hero-wordmark-signal-path--right"
          pathLength="1"
          d="M2193.5 212V318L2237.9 330H1365.2L1312.2 394"
        />
        <circle className="hero-wordmark-signal-node" cx="1312.2" cy="394" r="8" />
      </svg>
    </h1>
  );
}

"use client";

import { forwardRef } from "react";

export const HeroContent = forwardRef<HTMLDivElement>(function HeroContent(_, ref) {
  return (
    <div ref={ref} className="hero-content" data-hero-animated>
      <section
        className="hero-message hero-message--left"
        role="region"
        aria-labelledby="hero-marketing-title"
      >
        <h2 id="hero-marketing-title" className="hero-message-title">
          <span className="hero-message-accent">Marketing</span>
          <span className="hero-message-metal">is the</span>
          <span className="hero-message-metal">surface.</span>
        </h2>
      </section>

      <section
        className="hero-message hero-message--right"
        role="region"
        aria-labelledby="hero-systems-title"
      >
        <h2 id="hero-systems-title" className="hero-message-title">
          <span className="hero-message-accent">Systems</span>
          <span className="hero-message-metal">are the</span>
          <span className="hero-message-metal">engine.</span>
        </h2>
      </section>

      <p className="hero-value-statement">
        <span className="hero-value-lead">
          I turn <strong>vision</strong> into <strong>value:</strong>
        </span>
        <span className="hero-value-rule" aria-hidden="true" />
        <span className="hero-value-detail">
          with systems businesses can actually see, use, and measure.
        </span>
      </p>
    </div>
  );
});

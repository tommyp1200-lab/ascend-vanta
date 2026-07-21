"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { AscendHeroScene } from "./AscendHeroScene";
import { ASCEND_COLORS } from "./heroPalette";
import type { HeroQualityProfile, HeroRuntimeRefs } from "./heroTypes";

export function AscendHeroCanvas({
  quality,
  runtime,
  active,
  ready,
}: {
  quality: HeroQualityProfile;
  runtime: HeroRuntimeRefs;
  active: boolean;
  ready: boolean;
}) {
  return (
    <Canvas
      aria-hidden="true"
      className={`hero-canvas${ready ? " is-ready" : ""}`}
      dpr={[1, quality.dpr]}
      frameloop={active ? "always" : "demand"}
      camera={{ fov: 42, near: 0.1, far: 40, position: [0, 0, 6.65] }}
      gl={{
        antialias: quality.name !== "low",
        alpha: false,
        depth: true,
        powerPreference: quality.name === "low" ? "default" : "high-performance",
      }}
      performance={{ min: 0.55, max: 1, debounce: 250 }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = SRGBColorSpace;
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.72;
        gl.setClearColor(ASCEND_COLORS.vanta, 1);
        if (process.env.NODE_ENV !== "production") {
          (window as Window & { __ASCEND_RENDERER__?: typeof gl }).__ASCEND_RENDERER__ = gl;
        }
      }}
    >
      <Suspense fallback={null}>
        <AscendHeroScene
          key={quality.name}
          quality={quality}
          runtime={runtime}
        />
      </Suspense>
    </Canvas>
  );
}

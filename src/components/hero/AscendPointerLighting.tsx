"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, PointLight } from "three";
import { HERO_INTERACTION } from "./heroInteractionConfig";
import { ASCEND_COLORS } from "./heroPalette";
import { phaseProgress } from "./heroTimelineConfig";
import type { HeroRuntimeRefs } from "./heroTypes";

export function AscendPointerLighting({ runtime }: { runtime: HeroRuntimeRefs }) {
  const light = useRef<PointLight>(null);

  useFrame((_, delta) => {
    if (!light.current) return;
    const pointer = runtime.pointer.current.current;
    const progress = runtime.scrollProgress.current;
    const interaction = 1 - phaseProgress(progress, 0.35, 0.75);
    const reduced = runtime.reducedMotion.current ? 0 : 1;
    light.current.position.x = MathUtils.damp(
      light.current.position.x,
      pointer.x * 3.2 * interaction * reduced,
      HERO_INTERACTION.lightDamping,
      delta,
    );
    light.current.position.y = MathUtils.damp(
      light.current.position.y,
      0.4 + pointer.y * 2.4 * interaction * reduced,
      HERO_INTERACTION.lightDamping,
      delta,
    );
    light.current.intensity = MathUtils.damp(
      light.current.intensity,
      0.92 - progress * 0.38,
      3,
      delta,
    );
  });

  return (
    <pointLight
      ref={light}
      color={ASCEND_COLORS.pearl}
      intensity={0.92}
      distance={9}
      decay={2}
      position={[0, 0.4, 5.2]}
    />
  );
}

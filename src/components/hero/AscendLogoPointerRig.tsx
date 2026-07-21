"use client";

import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, MathUtils } from "three";
import { AscendLogo } from "./AscendLogo";
import { HERO_INTERACTION } from "./heroInteractionConfig";
import { HERO_SCROLL, phaseProgress } from "./heroTimelineConfig";
import type { HeroQualityProfile, HeroRuntimeRefs } from "./heroTypes";

export function AscendLogoPointerRig({
  quality,
  runtime,
}: {
  quality: HeroQualityProfile;
  runtime: HeroRuntimeRefs;
}) {
  const scrollRig = useRef<Group>(null);
  const pointerRig = useRef<Group>(null);
  const idleRig = useRef<Group>(null);

  useFrame(({ clock }, delta) => {
    if (!scrollRig.current || !pointerRig.current || !idleRig.current) return;
    const progress = runtime.scrollProgress.current;
    const pointer = runtime.pointer.current.current;
    const compression = phaseProgress(progress, 0.32, 0.52);
    const transit = phaseProgress(progress, 0.52, 0.72);
    const pointerInfluence = 1 - phaseProgress(
      progress,
      HERO_INTERACTION.pointerFadeStart,
      HERO_INTERACTION.pointerFadeEnd,
    );
    const touchOrReduced = runtime.reducedMotion.current || quality.name === "mobile" || quality.name === "low";
    const influence = touchOrReduced ? 0 : pointerInfluence;
    const verticalMagnitude = Math.pow(Math.abs(pointer.y), 0.84);
    const cursorPitch = pointer.y >= 0
      ? verticalMagnitude * HERO_INTERACTION.maxPitchUp
      : -verticalMagnitude * HERO_INTERACTION.maxPitchDown;
    const verticalDamping = pointer.y < 0
      ? HERO_INTERACTION.downwardDamping
      : HERO_INTERACTION.pointerDamping;
    const verticalTranslation = pointer.y >= 0
      ? pointer.y * HERO_INTERACTION.maxYUp
      : pointer.y * HERO_INTERACTION.maxYDown;

    const compressedScale = MathUtils.lerp(HERO_SCROLL.logoStartScale, 1.38, compression);
    const scale = MathUtils.lerp(compressedScale, 0.018, transit);
    scrollRig.current.scale.setScalar(scale);
    scrollRig.current.position.y = MathUtils.lerp(0.04, 0.18, transit);
    scrollRig.current.position.z = MathUtils.lerp(2.25, touchOrReduced ? 2.1 : 0.34, transit);
    scrollRig.current.rotation.y = MathUtils.lerp(0, touchOrReduced ? 0.08 : Math.PI * 0.5, transit);
    scrollRig.current.rotation.z = MathUtils.lerp(-0.025, 0.08, transit);

    pointerRig.current.rotation.y = MathUtils.damp(
      pointerRig.current.rotation.y,
      0.035 + pointer.x * HERO_INTERACTION.maxYaw * influence,
      HERO_INTERACTION.pointerDamping,
      delta,
    );
    pointerRig.current.rotation.x = MathUtils.damp(
      pointerRig.current.rotation.x,
      -0.012 + cursorPitch * influence,
      verticalDamping,
      delta,
    );
    pointerRig.current.position.x = MathUtils.damp(
      pointerRig.current.position.x,
      pointer.x * HERO_INTERACTION.maxX * influence,
      HERO_INTERACTION.pointerDamping,
      delta,
    );
    pointerRig.current.position.y = MathUtils.damp(
      pointerRig.current.position.y,
      verticalTranslation * influence,
      verticalDamping,
      delta,
    );
    pointerRig.current.rotation.z = MathUtils.damp(
      pointerRig.current.rotation.z,
      pointer.x * pointer.y * 0.024 * influence,
      HERO_INTERACTION.pointerDamping,
      delta,
    );

    const idleScale = runtime.reducedMotion.current ? 0.24 : 1;
    idleRig.current.position.y = Math.sin(clock.elapsedTime * 0.62) * HERO_INTERACTION.idleFloat * idleScale;
    idleRig.current.rotation.z = Math.sin(clock.elapsedTime * 0.23) * HERO_INTERACTION.idleRotation * idleScale;
    idleRig.current.rotation.x = Math.cos(clock.elapsedTime * 0.19) * HERO_INTERACTION.idleRotation * 0.45 * idleScale;
  });

  return (
    <group ref={scrollRig} position={[0, 0.04, 2.25]}>
      <group ref={pointerRig}>
        <group ref={idleRig}>
          <Suspense fallback={null}>
            <AscendLogo model={quality.model} />
          </Suspense>
        </group>
      </group>
    </group>
  );
}

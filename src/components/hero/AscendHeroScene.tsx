"use client";

import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";
import type { PerspectiveCamera } from "three";
import { AscendAtmosphere } from "./AscendAtmosphere";
import { AscendBackgroundParticles } from "./AscendBackgroundParticles";
import { AscendEditorialGalaxy } from "./AscendEditorialGalaxy";
import { AscendLogoPointerRig } from "./AscendLogoPointerRig";
import { AscendOuterHalo } from "./AscendOuterHalo";
import { AscendParticleOrb } from "./AscendParticleOrb";
import { AscendPointerLighting } from "./AscendPointerLighting";
import { AscendRockField } from "./AscendRockField";
import { AscendShootingStars } from "./AscendShootingStars";
import { AscendStarfield } from "./AscendStarfield";
import { AscendStudioEnvironment } from "./AscendStudioEnvironment";
import { HERO_INTERACTION } from "./heroInteractionConfig";
import { ASCEND_COLORS } from "./heroPalette";
import { HERO_SCROLL } from "./heroTimelineConfig";
import type { HeroQualityProfile, HeroRuntimeRefs } from "./heroTypes";

export function AscendHeroScene({
  quality,
  runtime,
}: {
  quality: HeroQualityProfile;
  runtime: HeroRuntimeRefs;
}) {
  useFrame(({ camera }, delta) => {
    const pointer = runtime.pointer.current;
    const damping = 1 - Math.exp(-HERO_INTERACTION.pointerDamping * delta);
    pointer.current.lerp(pointer.target, damping);

    const progress = runtime.scrollProgress.current;
    const portraitScale = Math.max(1, 0.86 / (camera as PerspectiveCamera).aspect);
    const startZ = HERO_SCROLL.cameraStartZ * portraitScale;
    if (runtime.reducedMotion.current) {
      camera.position.z = MathUtils.lerp(startZ, startZ * 0.94, progress);
      camera.position.y = MathUtils.lerp(0, 0.12, progress);
      return;
    }
    const approach = MathUtils.smoothstep(progress, 0.32, 0.54);
    const transit = MathUtils.smoothstep(progress, 0.54, 0.82);
    const approachZ = MathUtils.lerp(startZ, 4.72 * Math.min(portraitScale, 1.35), approach);
    camera.position.z = MathUtils.lerp(approachZ, -0.34, transit);
    camera.position.y = MathUtils.lerp(0, 0.56, MathUtils.smoothstep(progress, 0.64, 0.92));
  });

  return (
    <>
      <color attach="background" args={[ASCEND_COLORS.vanta]} />
      <fog attach="fog" args={[ASCEND_COLORS.vanta, 8, 24]} />
      <AscendStudioEnvironment />
      <AscendBackgroundParticles count={quality.backgroundParticleCount} runtime={runtime} />
      <AscendStarfield quality={quality} runtime={runtime} />
      <AscendShootingStars quality={quality} runtime={runtime} />
      <AscendEditorialGalaxy
        quality={quality}
        runtime={runtime}
      />
      <AscendRockField count={quality.rockCount} runtime={runtime} />
      <group position={[0, 0.06, 0]}>
        <AscendOuterHalo count={quality.haloCount} runtime={runtime} />
        <AscendParticleOrb count={quality.particleCount} runtime={runtime} />
        <AscendParticleOrb count={quality.orbDetailCount} runtime={runtime} layer="detail" />
        {quality.atmosphere ? <AscendAtmosphere runtime={runtime} /> : null}
      </group>
      <ambientLight color={ASCEND_COLORS.silver} intensity={0.1} />
      <directionalLight color={ASCEND_COLORS.pearl} intensity={1} position={[-3.4, 3.2, 4.8]} />
      <directionalLight color={ASCEND_COLORS.silver} intensity={0.8} position={[3.6, -1.8, 3.2]} />
      <directionalLight color={ASCEND_COLORS.graphiteRaised} intensity={0.65} position={[0.5, -3.4, -0.5]} />
      <pointLight color={ASCEND_COLORS.lime} intensity={1.15} distance={7} decay={2} position={[-2.6, -1.4, 1.15]} />
      <AscendPointerLighting runtime={runtime} />
      <AscendLogoPointerRig quality={quality} runtime={runtime} />
    </>
  );
}

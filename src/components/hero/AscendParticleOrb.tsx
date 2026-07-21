"use client";

/* eslint-disable react-hooks/immutability -- WebGL uniforms are intentionally mutated in R3F's frame loop. */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Points,
  ShaderMaterial,
} from "three";
import { createParticleGeometry } from "./createParticleGeometry";
import { HERO_ORB } from "./heroInteractionConfig";
import { ASCEND_COLORS } from "./heroPalette";
import { particleFragmentShader, particleVertexShader } from "./particleShaders";
import type { HeroRuntimeRefs } from "./heroTypes";

interface AscendParticleOrbProps {
  count: number;
  runtime: HeroRuntimeRefs;
  layer?: "shell" | "halo" | "detail";
}

export function AscendParticleOrb({
  count,
  runtime,
  layer = "shell",
}: AscendParticleOrbProps) {
  const pointsRef = useRef<Points>(null);
  const halo = layer === "halo";
  const detail = layer === "detail";
  const geometry = useMemo(() => {
    const data = createParticleGeometry(
      count,
      HERO_ORB.radius * (halo ? 1.12 : detail ? 1.018 : 1),
      halo ? 0x48414c4f : detail ? 0x5349474e : 0x41564345,
    );
    const next = new BufferGeometry();
    next.setAttribute("position", new BufferAttribute(data.sphere, 3));
    next.setAttribute("aFieldPosition", new BufferAttribute(data.field, 3));
    next.setAttribute("aSeed", new BufferAttribute(data.seed, 1));
    next.setAttribute("aPhase", new BufferAttribute(data.phase, 1));
    next.setAttribute("aSize", new BufferAttribute(data.size, 1));
    next.setAttribute("aIntensity", new BufferAttribute(data.intensity, 1));
    next.setAttribute("aSurvivor", new BufferAttribute(data.survivor, 1));
    next.computeBoundingSphere();
    return next;
  }, [count, detail, halo]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: AdditiveBlending,
        toneMapped: false,
        uniforms: {
          uTime: { value: 0 },
          uScrollProgress: { value: 0 },
          uGalaxyProgress: { value: 0 },
          uPixelRatio: { value: 1 },
          uRimPower: { value: HERO_ORB.rimPower },
          uWaveStrength: { value: HERO_ORB.waveStrength * (halo ? 0.88 : 1) },
          uReducedMotion: { value: 0 },
          uHalo: { value: halo ? 1 : 0 },
          uDetail: { value: detail ? 1 : 0 },
          uDarkColor: {
            value: new Color(
              halo
                ? ASCEND_COLORS.shadowGreenRaised
                : detail
                  ? ASCEND_COLORS.shadowGreenDetail
                  : ASCEND_COLORS.shadowGreen,
            ),
          },
          uLimeColor: { value: new Color(ASCEND_COLORS.lime) },
          uRimBrightness: {
            value: HERO_ORB.rimBrightness * (halo ? 0.45 : detail ? 1.48 : 1),
          },
          uCenterOpacity: {
            value: HERO_ORB.centerOpacity * (halo ? 0.18 : detail ? 14 : 1),
          },
          uEdgeOpacity: {
            value: HERO_ORB.edgeOpacity * (halo ? 0.42 : detail ? 1.18 : 1),
          },
        },
      }),
    [detail, halo],
  );

  useFrame(({ clock, gl }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
    material.uniforms.uScrollProgress.value = runtime.scrollProgress.current;
    material.uniforms.uGalaxyProgress.value = runtime.galaxyProgress.current;
    material.uniforms.uPixelRatio.value = gl.getPixelRatio();
    material.uniforms.uReducedMotion.value = runtime.reducedMotion.current ? 1 : 0;
    if (pointsRef.current) {
      pointsRef.current.visible = runtime.galaxyProgress.current < 0.105;
    }
  });

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={halo ? 3 : detail ? 5 : 4}
    />
  );
}

"use client";

/* eslint-disable react-hooks/immutability, react-hooks/preserve-manual-memoization -- Stable shader objects own mutable GPU uniforms. */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  ShaderMaterial,
} from "three";
import { createStarGeometry } from "./createStarGeometry";
import { starFragmentShader, starVertexShader } from "./starfieldShaders";
import type { HeroRuntimeRefs } from "./heroTypes";

interface AscendStarLayerProps {
  count: number;
  layer: number;
  parallax: number;
  runtime: HeroRuntimeRefs;
}

const STAR_BASE_TRAVEL_RATE = 0.58;
const STAR_RUSH_TRAVEL_BOOST = 1.8;

export function AscendStarLayer({ count, layer, parallax, runtime }: AscendStarLayerProps) {
  const travelTime = useRef(0);
  const geometry = useMemo(() => {
    const data = createStarGeometry(count, layer);
    const next = new BufferGeometry();
    next.setAttribute("position", new BufferAttribute(data.position, 3));
    next.setAttribute("aSize", new BufferAttribute(data.size, 1));
    next.setAttribute("aBrightness", new BufferAttribute(data.brightness, 1));
    next.setAttribute("aPhase", new BufferAttribute(data.phase, 1));
    next.setAttribute("aSpeed", new BufferAttribute(data.speed, 1));
    next.setAttribute("aColorMix", new BufferAttribute(data.colorMix, 1));
    return next;
  }, [count, layer]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: starVertexShader,
        fragmentShader: starFragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: AdditiveBlending,
        toneMapped: false,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uPointer: { value: runtime.pointer.current.current },
          uParallax: { value: parallax },
          uInteraction: { value: 1 },
          uReducedMotion: { value: 0 },
          uTravelTime: { value: 0 },
          uScrollProgress: { value: 0 },
        },
      }),
    [parallax, runtime.pointer],
  );

  useFrame(({ clock, gl }, delta) => {
    const progress = runtime.scrollProgress.current;
    const rushIn = Math.min(1, Math.max(0, (progress - 0.46) / 0.2));
    const rushOut = 1 - Math.min(1, Math.max(0, (progress - 0.8) / 0.14));
    const rush = rushIn * rushOut;
    travelTime.current +=
      delta *
      (STAR_BASE_TRAVEL_RATE +
        rush * (runtime.reducedMotion.current ? 0 : STAR_RUSH_TRAVEL_BOOST));
    material.uniforms.uTime.value = clock.elapsedTime;
    material.uniforms.uTravelTime.value = travelTime.current;
    material.uniforms.uScrollProgress.value = progress;
    material.uniforms.uPixelRatio.value = gl.getPixelRatio();
    material.uniforms.uInteraction.value = 1;
    material.uniforms.uReducedMotion.value = runtime.reducedMotion.current ? 1 : 0;
  });

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={layer} />;
}

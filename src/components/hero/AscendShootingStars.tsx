"use client";

/* eslint-disable react-hooks/immutability -- WebGL uniforms are intentionally mutated in R3F's frame loop. */

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  ShaderMaterial,
} from "three";
import type { HeroQualityProfile, HeroRuntimeRefs } from "./heroTypes";
import { ASCEND_COLORS } from "./heroPalette";

const vertexShader = /* glsl */ `
  attribute vec3 aStart;
  attribute vec3 aDirection;
  attribute float aTrail;
  attribute float aPhase;
  attribute float aSpeed;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uInteraction;
  uniform float uReducedMotion;

  varying float vAlpha;
  varying float vHeat;

  void main() {
    float timeScale = mix(1.0, 0.16, uReducedMotion);
    float cycle = fract(uTime * aSpeed * timeScale + aPhase);
    float activeWindow = 0.24;
    float headProgress = cycle / activeWindow;
    float pathProgress = headProgress - aTrail * 0.2;
    float activation = smoothstep(0.0, 0.018, cycle) * (1.0 - smoothstep(0.205, activeWindow, cycle));
    float entered = smoothstep(-0.02, 0.035, pathProgress);
    vec3 animated = aStart + aDirection * pathProgress;

    vec4 viewPosition = modelViewMatrix * vec4(animated, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    float perspective = clamp(7.0 / max(-viewPosition.z, 0.1), 0.55, 1.65);
    gl_PointSize = mix(4.2, 1.05, aTrail) * uPixelRatio * perspective;

    float tail = pow(1.0 - aTrail, 1.65);
    vAlpha = activation * entered * tail * uInteraction * mix(1.0, 0.28, uReducedMotion);
    vHeat = tail;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  varying float vHeat;

  void main() {
    vec2 centered = gl_PointCoord - 0.5;
    float point = 1.0 - smoothstep(0.12, 0.5, length(centered));
    if (point * vAlpha <= 0.001) discard;
    vec3 hotCore = mix(uColor, vec3(1.0), vHeat * 0.72);
    gl_FragColor = vec4(hotCore * (1.0 + vHeat * 1.4), point * vAlpha);
  }
`;

const PATHS = [
  { start: [-5.8, 3.25, -1.7], direction: [8.4, -4.1, 0], phase: 0.03, speed: 0.082 },
  { start: [5.7, 2.55, -2.1], direction: [-8.1, -3.7, 0], phase: 0.29, speed: 0.074 },
  { start: [-5.2, 1.55, -2.5], direction: [8.6, -4.2, 0], phase: 0.56, speed: 0.091 },
  { start: [4.9, 3.65, -2.8], direction: [-7.2, -3.35, 0], phase: 0.8, speed: 0.078 },
] as const;

function pathCount(quality: HeroQualityProfile): number {
  if (quality.name === "low") return 1;
  if (quality.name === "mobile") return 2;
  if (quality.name === "tablet") return 3;
  return 4;
}

export function AscendShootingStars({
  quality,
  runtime,
}: {
  quality: HeroQualityProfile;
  runtime: HeroRuntimeRefs;
}) {
  const geometry = useMemo(() => {
    const paths = PATHS.slice(0, pathCount(quality));
    const trailPoints = quality.name === "mobile" || quality.name === "low" ? 26 : 44;
    const total = paths.length * trailPoints;
    const position = new Float32Array(total * 3);
    const start = new Float32Array(total * 3);
    const direction = new Float32Array(total * 3);
    const trail = new Float32Array(total);
    const phase = new Float32Array(total);
    const speed = new Float32Array(total);

    paths.forEach((path, pathIndex) => {
      for (let pointIndex = 0; pointIndex < trailPoints; pointIndex += 1) {
        const index = pathIndex * trailPoints + pointIndex;
        const offset = index * 3;
        start.set(path.start, offset);
        direction.set(path.direction, offset);
        trail[index] = pointIndex / Math.max(trailPoints - 1, 1);
        phase[index] = path.phase;
        speed[index] = path.speed;
      }
    });

    const next = new BufferGeometry();
    next.setAttribute("position", new BufferAttribute(position, 3));
    next.setAttribute("aStart", new BufferAttribute(start, 3));
    next.setAttribute("aDirection", new BufferAttribute(direction, 3));
    next.setAttribute("aTrail", new BufferAttribute(trail, 1));
    next.setAttribute("aPhase", new BufferAttribute(phase, 1));
    next.setAttribute("aSpeed", new BufferAttribute(speed, 1));
    return next;
  }, [quality]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: AdditiveBlending,
        toneMapped: false,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uInteraction: { value: 1 },
          uReducedMotion: { value: 0 },
          uColor: { value: new Color(ASCEND_COLORS.pearl) },
        },
      }),
    [],
  );

  useFrame(({ clock, gl }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
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

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={2} />;
}

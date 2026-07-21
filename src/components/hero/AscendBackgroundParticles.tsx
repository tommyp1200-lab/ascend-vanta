"use client";

/* eslint-disable react-hooks/immutability -- Stable shader uniforms and R3F transforms update inside the frame loop. */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  MathUtils,
  ShaderMaterial,
} from "three";
import type { HeroRuntimeRefs } from "./heroTypes";

const backgroundParticleVertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aBrightness;

  uniform float uPixelRatio;
  uniform float uOpacity;

  varying float vAlpha;
  varying float vCore;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;

    float perspective = clamp(11.0 / max(-viewPosition.z, 0.1), 0.42, 1.5);
    gl_PointSize = aSize * 1.08 * uPixelRatio * perspective;

    float depthPresence = mix(0.56, 1.0, smoothstep(-22.0, -4.0, position.z));
    vAlpha = aBrightness * depthPresence * uOpacity;
    vCore = smoothstep(2.8, 4.8, aSize);
  }
`;

const backgroundParticleFragmentShader = /* glsl */ `
  varying float vAlpha;
  varying float vCore;

  void main() {
    vec2 centered = gl_PointCoord - 0.5;
    float radius = length(centered);
    float softDisc = 1.0 - smoothstep(0.08, 0.5, radius);
    if (softDisc <= 0.001) discard;
    float core = 1.0 - smoothstep(0.0, 0.13, radius);
    vec3 pearlWhite = mix(vec3(0.62, 0.66, 0.62), vec3(0.957, 0.969, 0.949), core);
    float alpha = softDisc * vAlpha * mix(0.44, 0.68, vCore);
    gl_FragColor = vec4(pearlWhite * (0.82 + core * 0.76), alpha);
  }
`;

function hash(index: number, salt: number): number {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43_758.5453;
  return value - Math.floor(value);
}

function dampToStill(current: number, target: number, delta: number): number {
  const next = MathUtils.damp(current, target, 6.8, delta);
  return Math.abs(next - target) < 0.00001 ? target : next;
}

export function AscendBackgroundParticles({
  count,
  runtime,
}: {
  count: number;
  runtime: HeroRuntimeRefs;
}) {
  const group = useRef<Group>(null);
  const geometry = useMemo(() => {
    const position = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const brightness = new Float32Array(count);

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const depthSeed = hash(index, 3);
      const sizeSeed = hash(index, 4);
      const brightSeed = hash(index, 5);
      position[offset] = (hash(index, 1) - 0.5) * (20 + depthSeed * 5);
      position[offset + 1] = (hash(index, 2) - 0.5) * (13 + depthSeed * 4);
      position[offset + 2] = -4 - depthSeed * 18;
      size[index] = 1.35 + sizeSeed * 2.4 + (sizeSeed > 0.986 ? 2.8 : 0);
      brightness[index] = 0.5 + Math.pow(brightSeed, 2.05) * 1.02;
    }

    const next = new BufferGeometry();
    next.setAttribute("position", new BufferAttribute(position, 3));
    next.setAttribute("aSize", new BufferAttribute(size, 1));
    next.setAttribute("aBrightness", new BufferAttribute(brightness, 1));
    return next;
  }, [count]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: backgroundParticleVertexShader,
        fragmentShader: backgroundParticleFragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: AdditiveBlending,
        toneMapped: false,
        uniforms: {
          uPixelRatio: { value: 1 },
          uOpacity: { value: 1 },
        },
      }),
    [],
  );

  useFrame(({ gl }, delta) => {
    if (!group.current) return;

    const pointer = runtime.pointer.current.current;
    const interaction = 1;
    const motionScale = runtime.reducedMotion.current ? 0.24 : 1;

    // This layer has no autonomous rotation. It only eases toward the current
    // pointer perspective, matching the source component's camera-look motion.
    group.current.rotation.x = dampToStill(
      group.current.rotation.x,
      -pointer.y * 0.15 * interaction * motionScale,
      delta,
    );
    group.current.rotation.y = dampToStill(
      group.current.rotation.y,
      pointer.x * 0.22 * interaction * motionScale,
      delta,
    );
    group.current.position.x = dampToStill(
      group.current.position.x,
      -pointer.x * 0.7 * interaction * motionScale,
      delta,
    );
    group.current.position.y = dampToStill(
      group.current.position.y,
      -pointer.y * 0.46 * interaction * motionScale,
      delta,
    );

    material.uniforms.uPixelRatio.value = gl.getPixelRatio();
    material.uniforms.uOpacity.value = interaction;
  });

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return (
    <group ref={group}>
      <points geometry={geometry} material={material} frustumCulled={false} renderOrder={-1} />
    </group>
  );
}

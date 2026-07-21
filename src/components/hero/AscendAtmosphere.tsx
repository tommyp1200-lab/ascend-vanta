"use client";

/* eslint-disable react-hooks/immutability -- WebGL uniforms are intentionally mutated in R3F's frame loop. */

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BackSide, Color, ShaderMaterial } from "three";
import type { HeroRuntimeRefs } from "./heroTypes";
import { ASCEND_COLORS } from "./heroPalette";

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPosition;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-viewPosition.xyz);
    vPosition = position;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uScrollProgress;
  uniform float uReducedMotion;
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPosition;
  void main() {
    float fresnel = pow(1.0 - abs(dot(vNormal, vView)), 2.7);
    float noise = sin(vPosition.y * 7.0 + uTime * 0.16) * sin(vPosition.x * 5.0 - uTime * 0.11);
    float motion = mix(noise, 0.0, uReducedMotion);
    float fade = 1.0 - smoothstep(0.5, 0.88, uScrollProgress);
    float alpha = fresnel * (0.014 + motion * 0.004) * fade;
    gl_FragColor = vec4(uColor * (0.45 + fresnel * 0.7), alpha);
  }
`;

export function AscendAtmosphere({ runtime }: { runtime: HeroRuntimeRefs }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: BackSide,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
        uniforms: {
          uTime: { value: 0 },
          uScrollProgress: { value: 0 },
          uReducedMotion: { value: 0 },
          uColor: { value: new Color(ASCEND_COLORS.limeDepth) },
        },
      }),
    [],
  );

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
    material.uniforms.uScrollProgress.value = runtime.scrollProgress.current;
    material.uniforms.uReducedMotion.value = runtime.reducedMotion.current ? 1 : 0;
  });

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh material={material} renderOrder={2}>
      <sphereGeometry args={[2.22, 48, 32]} />
    </mesh>
  );
}

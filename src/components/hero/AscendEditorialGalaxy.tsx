"use client";

/* eslint-disable react-hooks/immutability -- WebGL uniforms and object transforms are intentionally mutated in R3F's frame loop. */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  MathUtils,
  Mesh,
  Points,
  ShaderMaterial,
} from "three";
import { createParticleGeometry } from "./createParticleGeometry";
import {
  editorialGalaxyFragmentShader,
  editorialGalaxyVertexShader,
} from "./editorialGalaxyShaders";
import { HERO_ORB } from "./heroInteractionConfig";
import { ASCEND_COLORS } from "./heroPalette";
import { HERO_SCROLL } from "./heroTimelineConfig";
import type { HeroQualityProfile, HeroRuntimeRefs } from "./heroTypes";
import { AscendVantaRobot } from "./AscendVantaRobot";

const EDITORIAL_GALAXY_POSITION = [0, 0.56, -5.1] as const;
const FINAL_ORB_MATCH_START = 0.82;
const FINAL_ORB_MATCH_END = 0.92;

type EditorialGalaxyLayerKind =
  | "base"
  | "detail"
  | "interior"
  | "lattice"
  | "filament"
  | "glow";

function createSphericalLatticePositions(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const planes = MathUtils.clamp(Math.round(Math.sqrt(count * 0.22)), 12, 30);
  const spokes = Math.ceil(count / planes);

  for (let index = 0; index < count; index += 1) {
    const plane = Math.floor(index / spokes);
    const spoke = index % spokes;
    const planeAngle = (plane / planes) * Math.PI;
    const spokeOffset = (plane % 2) * 0.5;
    const spokeAngle = ((spoke + spokeOffset) / spokes) * Math.PI * 2;
    const ringX = Math.cos(spokeAngle) * radius;
    const ringY = Math.sin(spokeAngle) * radius;
    const offset = index * 3;

    positions[offset] = ringX * Math.cos(planeAngle);
    positions[offset + 1] = ringY;
    positions[offset + 2] = -ringX * Math.sin(planeAngle);
  }

  return positions;
}

const orbLightWellVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const orbLightWellFragmentShader = /* glsl */ `
  uniform float uIntensity;
  uniform float uTime;
  uniform vec3 uColor;

  varying vec2 vUv;

  void main() {
    vec2 centered = vec2((vUv.x - 0.5) * 2.0, (vUv.y - 0.64) * 2.0);
    float radial = exp(-(centered.x * centered.x * 2.5 + centered.y * centered.y * 3.4));
    float verticalFade = smoothstep(0.02, 0.36, vUv.y) * smoothstep(1.0, 0.42, vUv.y);
    float pulse = 0.92 + 0.08 * sin(uTime * 0.72);
    float energy = radial * verticalFade * pulse * uIntensity;
    gl_FragColor = vec4(uColor * energy * 0.72, energy * 0.19);
  }
`;

function EditorialGalaxyLayer({
  count,
  runtime,
  layer = "base",
}: {
  count: number;
  runtime: HeroRuntimeRefs;
  layer?: EditorialGalaxyLayerKind;
}) {
  const smoothedProgress = useRef(0);
  const smoothedShapeProgress = useRef(0);
  const pointsRef = useRef<Points>(null);
  const detail = layer === "detail";
  const interior = layer === "interior";
  const lattice = layer === "lattice";
  const filament = layer === "filament";
  const glow = layer === "glow";
  const geometry = useMemo(() => {
    const particleRadius =
      HERO_ORB.radius *
      (detail ? 1.018 : lattice ? 1.012 : filament ? 1.026 : glow ? 1.042 : 1);
    const data = createParticleGeometry(
      count,
      particleRadius,
      detail
        ? 0x474c5844
        : interior
          ? 0x494e5452
          : lattice
            ? 0x4c415454
            : filament
              ? 0x46494c41
              : glow
                ? 0x474c4f57
                : 0x47414c58,
    );
    const positions = lattice
      ? createSphericalLatticePositions(count, particleRadius)
      : data.sphere.slice();
    if (interior) {
      for (let index = 0; index < count; index += 1) {
        const radius = 0.14 + Math.pow(data.seed[index], 0.58) * 0.82;
        const offset = index * 3;
        positions[offset] *= radius;
        positions[offset + 1] *= radius;
        positions[offset + 2] *= radius;
      }
    }
    const next = new BufferGeometry();
    next.setAttribute("position", new BufferAttribute(positions, 3));
    next.setAttribute("aSeed", new BufferAttribute(data.seed, 1));
    next.setAttribute("aPhase", new BufferAttribute(data.phase, 1));
    next.setAttribute("aSize", new BufferAttribute(data.size, 1));
    next.setAttribute("aIntensity", new BufferAttribute(data.intensity, 1));
    next.computeBoundingSphere();
    return next;
  }, [count, detail, filament, glow, interior, lattice]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: editorialGalaxyVertexShader,
        fragmentShader: editorialGalaxyFragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: AdditiveBlending,
        toneMapped: false,
        uniforms: {
          uTime: { value: 0 },
          uGalaxyProgress: { value: 0 },
          uShapeProgress: { value: 0 },
          uPixelRatio: { value: 1 },
          uReducedMotion: { value: 0 },
          uDetail: { value: detail ? 1 : 0 },
          uInteriorLayer: { value: interior ? 1 : 0 },
          uLatticeLayer: { value: lattice ? 1 : 0 },
          uFilamentLayer: { value: filament ? 1 : 0 },
          uGlowLayer: { value: glow ? 1 : 0 },
          uDeepColor: {
            value: new Color(
              interior
                ? ASCEND_COLORS.shadowGreenDetail
                : lattice
                  ? ASCEND_COLORS.shadowGreenRaised
                  : filament
                    ? ASCEND_COLORS.shadowGreenRaised
                    : detail
                      ? ASCEND_COLORS.shadowGreenRaised
                      : ASCEND_COLORS.shadowGreen,
            ),
          },
          uDepthColor: { value: new Color(ASCEND_COLORS.limeDepth) },
          uLimeColor: { value: new Color(ASCEND_COLORS.lime) },
          uHighlightColor: { value: new Color(ASCEND_COLORS.limeHighlight) },
          uPearlColor: { value: new Color(ASCEND_COLORS.pearl) },
        },
      }),
    [detail, filament, glow, interior, lattice],
  );

  useFrame(({ clock, gl }, delta) => {
    const target = runtime.galaxyProgress.current;
    const shapeTarget = runtime.shapeProgress.current;
    const damping = runtime.reducedMotion.current ? 18 : 9.5;
    smoothedProgress.current = MathUtils.damp(smoothedProgress.current, target, damping, delta);
    smoothedShapeProgress.current = MathUtils.damp(
      smoothedShapeProgress.current,
      shapeTarget,
      runtime.reducedMotion.current ? 20 : 10.5,
      delta,
    );
    if (target === 0 && smoothedProgress.current < 0.0005) smoothedProgress.current = 0;
    if (target === 1 && smoothedProgress.current > 0.9995) smoothedProgress.current = 1;
    if (shapeTarget === 0 && smoothedShapeProgress.current < 0.0005) {
      smoothedShapeProgress.current = 0;
    }
    if (shapeTarget === 1 && smoothedShapeProgress.current > 0.9995) {
      smoothedShapeProgress.current = 1;
    }

    material.uniforms.uTime.value = clock.elapsedTime;
    material.uniforms.uGalaxyProgress.value = smoothedProgress.current;
    material.uniforms.uShapeProgress.value = smoothedShapeProgress.current;
    material.uniforms.uPixelRatio.value = gl.getPixelRatio();
    material.uniforms.uReducedMotion.value = runtime.reducedMotion.current ? 1 : 0;
    if (pointsRef.current && (interior || lattice || filament || glow)) {
      pointsRef.current.visible =
        shapeTarget > 0.001 || smoothedShapeProgress.current > 0.001;
    }
    if (pointsRef.current && lattice) {
      const motion = runtime.reducedMotion.current ? 0 : 1;
      pointsRef.current.rotation.y = clock.elapsedTime * 0.035 * motion;
      pointsRef.current.rotation.x =
        Math.sin(clock.elapsedTime * 0.09) * 0.024 * motion;
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
      visible={!interior && !lattice && !filament && !glow}
      renderOrder={interior ? 6 : lattice ? 8 : filament ? 9 : glow ? 11 : detail ? 10 : 7}
    />
  );
}

function OrbLightWell({ runtime }: { runtime: HeroRuntimeRefs }) {
  const meshRef = useRef<Mesh>(null);
  const smoothedIntensity = useRef(0);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: orbLightWellVertexShader,
        fragmentShader: orbLightWellFragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: AdditiveBlending,
        toneMapped: false,
        uniforms: {
          uIntensity: { value: 0 },
          uTime: { value: 0 },
          uColor: { value: new Color(ASCEND_COLORS.limeHighlight) },
        },
      }),
    [],
  );

  useFrame(({ clock }, delta) => {
    const target = MathUtils.smoothstep(runtime.shapeProgress.current, 0.08, 0.42);
    smoothedIntensity.current = MathUtils.damp(
      smoothedIntensity.current,
      target,
      runtime.reducedMotion.current ? 18 : 8,
      delta,
    );
    material.uniforms.uIntensity.value = smoothedIntensity.current;
    material.uniforms.uTime.value = clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.visible = target > 0.001 || smoothedIntensity.current > 0.001;
    }
  });

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh ref={meshRef} position={[0, -2.18, -0.28]} renderOrder={5} visible={false}>
      <planeGeometry args={[5.8, 2.75]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

export function AscendEditorialGalaxy({
  quality,
  runtime,
  vantaEnabled,
}: {
  quality: HeroQualityProfile;
  runtime: HeroRuntimeRefs;
  vantaEnabled: boolean;
}) {
  const groupRef = useRef<Group>(null);
  const orbGroupRef = useRef<Group>(null);

  useFrame(({ camera, size }, delta) => {
    const group = groupRef.current;
    const orbGroup = orbGroupRef.current;
    if (!group || !orbGroup) return;

    const progress = runtime.galaxyProgress.current;
    const shapeProgress = runtime.shapeProgress.current;
    const horizontalProgress = runtime.horizontalProgress.current;
    // The final horizontal chapter outlives the galaxy ScrollTrigger. Keep the
    // shared stage mounted while any of its three narrative timelines is
    // active; otherwise the departing orb also drops Vanta from the scene.
    group.visible =
      progress > 0.0002 ||
      shapeProgress > 0.0002 ||
      horizontalProgress > 0.0002;
    if (!group.visible) return;

    const pointer = runtime.pointer.current.current;
    const motion = runtime.reducedMotion.current ? 0 : 1;
    const aspect = size.width / Math.max(size.height, 1);
    const horizontalDeparture = MathUtils.smootherstep(
      horizontalProgress,
      0.015,
      0.22,
    );
    const departureDistance = aspect < 0.7 ? 4.7 : aspect < 1 ? 6.4 : 8.4;
    const portraitScale = MathUtils.clamp(aspect * 0.94, 0.54, 1);
    const heroPortraitScale = Math.max(1, 0.86 / Math.max(aspect, 0.01));
    const heroOrbCameraDistance = HERO_SCROLL.cameraStartZ * heroPortraitScale;
    // Match the hero orb from its centered editorial position. Using the live
    // group position here made the entire hierarchy scale up as the orb moved
    // left, which also caused Vanta to grow during the horizontal chapter.
    const editorialOrbCameraDistance = Math.hypot(
      camera.position.x - EDITORIAL_GALAXY_POSITION[0],
      camera.position.y - EDITORIAL_GALAXY_POSITION[1],
      camera.position.z - EDITORIAL_GALAXY_POSITION[2],
    );
    const heroMatchedScale = editorialOrbCameraDistance / heroOrbCameraDistance;
    const orbReformation = MathUtils.smoothstep(
      progress,
      FINAL_ORB_MATCH_START,
      FINAL_ORB_MATCH_END,
    );
    const targetScale = MathUtils.lerp(portraitScale, heroMatchedScale, orbReformation);
    const shapeArc = Math.sin(shapeProgress * Math.PI);
    // Keep the shared stage stable so Vanta retains one world-space size and
    // position throughout the horizontal chapter. Only the orb exits left.
    // Moving the parent group carried Vanta off-screen at the terminal frame
    // and forced the robot rig to continuously compensate for its parent.
    group.position.x = MathUtils.damp(
      group.position.x,
      EDITORIAL_GALAXY_POSITION[0],
      8.5,
      delta,
    );
    orbGroup.position.x = MathUtils.damp(
      orbGroup.position.x,
      -departureDistance * horizontalDeparture,
      8.5,
      delta,
    );
    group.scale.setScalar(MathUtils.damp(group.scale.x, targetScale, 8.5, delta));
    group.rotation.x = MathUtils.damp(
      group.rotation.x,
      pointer.y * 0.045 * motion - shapeArc * 0.035 * motion,
      5.2,
      delta,
    );
    group.rotation.y = MathUtils.damp(
      group.rotation.y,
      pointer.x * 0.075 * motion + shapeProgress * 0.16 * motion,
      5.2,
      delta,
    );
    group.rotation.z = MathUtils.damp(
      group.rotation.z,
      pointer.x * -0.012 * motion + shapeArc * 0.025 * motion,
      5.2,
      delta,
    );
  });

  return (
    <group ref={groupRef} position={EDITORIAL_GALAXY_POSITION} visible={false}>
      {vantaEnabled ? <AscendVantaRobot runtime={runtime} /> : null}
      <group ref={orbGroupRef}>
        <OrbLightWell runtime={runtime} />
        <EditorialGalaxyLayer
          count={Math.min(Math.round(quality.particleCount * 0.17), 8_000)}
          runtime={runtime}
          layer="interior"
        />
        <EditorialGalaxyLayer count={quality.particleCount} runtime={runtime} />
        <EditorialGalaxyLayer
          count={Math.min(Math.round(quality.particleCount * 0.085), 4_200)}
          runtime={runtime}
          layer="lattice"
        />
        <EditorialGalaxyLayer
          count={Math.min(Math.round(quality.particleCount * 0.34), 14_000)}
          runtime={runtime}
          layer="filament"
        />
        <EditorialGalaxyLayer count={quality.orbDetailCount} runtime={runtime} layer="detail" />
        <EditorialGalaxyLayer
          count={Math.min(Math.round(quality.particleCount * 0.11), 5_500)}
          runtime={runtime}
          layer="glow"
        />
      </group>
    </group>
  );
}

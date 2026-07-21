"use client";

/* eslint-disable react-hooks/immutability -- Three.js materials are intentionally mutated inside the render loop. */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  Color,
  DodecahedronGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  MathUtils,
  MeshPhysicalMaterial,
  Object3D,
  Vector3,
} from "three";
import type { HeroRuntimeRefs } from "./heroTypes";
import { ASCEND_COLORS } from "./heroPalette";
import { phaseProgress } from "./heroTimelineConfig";

const ROCK_VARIANTS = 3;
const ROCK_SIZE_SCALE = 0.5;
const FORMATION_ORBIT_SPEED = Math.PI * 2 / 42;
const FORMATION_TILT_X = -0.34;
const FORMATION_TILT_Z = 0.16;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

interface RockInstance {
  position: readonly [number, number, number];
  scale: number;
  stretch: readonly [number, number, number];
  rotation: readonly [number, number, number];
  tone: number;
  variant: number;
}

function seededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function createRockGeometry(variant: number): BufferGeometry {
  const geometry = variant === 2
    ? new DodecahedronGeometry(1, 0)
    : new IcosahedronGeometry(1, 1);
  const position = geometry.getAttribute("position");
  const direction = new Vector3();
  const axisScale = variant === 0
    ? [1.08, 0.82, 0.94]
    : variant === 1
      ? [0.9, 1.08, 0.82]
      : [1.18, 0.76, 0.9];

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    direction.set(x, y, z).normalize();

    const ridge =
      Math.sin(x * (5.3 + variant) + y * 2.1) * 0.075
      + Math.sin(y * 7.7 - z * (3.4 + variant)) * 0.055
      + Math.cos(z * 6.1 + x * 2.8) * 0.04;
    const radius = 0.94 + ridge;

    position.setXYZ(
      index,
      direction.x * radius * axisScale[0],
      direction.y * radius * axisScale[1],
      direction.z * radius * axisScale[2],
    );
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function createRockInstances(count: number): RockInstance[][] {
  const random = seededRandom(0xa5ce_2026);
  const variants = Array.from({ length: ROCK_VARIANTS }, () => [] as RockInstance[]);
  const heroInterval = Math.max(4, Math.floor(count / 4));

  for (let index = 0; index < count; index += 1) {
    const heroRock = index % heroInterval === 0;
    const angle = index * GOLDEN_ANGLE + (random() - 0.5) * 0.18;
    const variant = index % ROCK_VARIANTS;
    const radius = MathUtils.lerp(2.58, 3.18, random()) + (heroRock ? 0.12 : 0);
    const depth = MathUtils.lerp(-0.38, 0.58, random());
    const inclination = MathUtils.lerp(0.28, 0.5, random()) + variant * 0.035;
    const ascendingNode =
      variant * (Math.PI * 2 / ROCK_VARIANTS) + MathUtils.lerp(-0.24, 0.24, random());
    const orbitRatio = MathUtils.lerp(0.86, 0.98, random());
    const eccentricity = MathUtils.lerp(0.035, 0.12, random());
    const phase = random() * Math.PI * 2;
    const orbitalRadius = radius * (1 - eccentricity * Math.cos(angle + phase));
    const orbitX = Math.cos(angle) * orbitalRadius;
    const orbitY = Math.sin(angle) * orbitalRadius * orbitRatio;
    const cosNode = Math.cos(ascendingNode);
    const sinNode = Math.sin(ascendingNode);
    const cosInclination = Math.cos(inclination);
    const sinInclination = Math.sin(inclination);
    const baseScale = heroRock
      ? MathUtils.lerp(0.54, 0.76, random())
      : MathUtils.lerp(0.3, 0.52, random());

    variants[variant].push({
      position: [
        cosNode * orbitX + sinNode * orbitY * sinInclination,
        orbitY * cosInclination,
        depth - sinNode * orbitX + cosNode * orbitY * sinInclination,
      ],
      scale: baseScale,
      stretch: [
        MathUtils.lerp(0.78, 1.34, random()),
        MathUtils.lerp(0.74, 1.28, random()),
        MathUtils.lerp(0.72, 1.2, random()),
      ],
      rotation: [random() * Math.PI, random() * Math.PI, random() * Math.PI],
      tone: random(),
      variant,
    });
  }

  return variants;
}

export function AscendRockField({
  count,
  runtime,
}: {
  count: number;
  runtime: HeroRuntimeRefs;
}) {
  const group = useRef<Group>(null);
  const orbitGroup = useRef<Group>(null);
  const orbitAngle = useRef(0);
  const returnReveal = useRef(0);
  const frameSceneReveal = useRef(0);
  const meshes = useRef<Array<InstancedMesh | null>>([null, null, null]);
  const dummy = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(), []);
  const rockGroups = useMemo(() => createRockInstances(count), [count]);
  const geometries = useMemo(
    () => Array.from({ length: ROCK_VARIANTS }, (_, variant) => createRockGeometry(variant)),
    [],
  );
  const material = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: ASCEND_COLORS.silver,
        emissive: ASCEND_COLORS.shadowGreenRaised,
        emissiveIntensity: 0.22,
        vertexColors: true,
        flatShading: true,
        roughness: 0.68,
        metalness: 0.24,
        clearcoat: 0.16,
        clearcoatRoughness: 0.72,
        envMapIntensity: 1.04,
        transparent: true,
        opacity: 1,
        depthWrite: false,
      }),
    [],
  );

  useEffect(() => {
    meshes.current.forEach((mesh, variant) => {
      if (!mesh) return;

      rockGroups[variant].forEach((rock, index) => {
        const hue = MathUtils.lerp(0.185, 0.205, rock.tone);
        const saturation = MathUtils.lerp(0.04, 0.14, rock.tone);
        const lightness = MathUtils.lerp(0.165, 0.36, rock.tone);
        color.setHSL(hue, saturation, lightness);
        mesh.setColorAt(index, color);

        dummy.position.set(...rock.position);
        dummy.rotation.set(...rock.rotation);
        dummy.scale.set(
          rock.scale * rock.stretch[0] * ROCK_SIZE_SCALE,
          rock.scale * rock.stretch[1] * ROCK_SIZE_SCALE,
          rock.scale * rock.stretch[2] * ROCK_SIZE_SCALE,
        );
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
      });

      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [color, dummy, rockGroups]);

  useFrame(({ size }, delta) => {
    if (!group.current || !orbitGroup.current) return;

    const progress = runtime.scrollProgress.current;
    const pointer = runtime.pointer.current.current;
    const reducedMotion = runtime.reducedMotion.current;
    const motionScale = reducedMotion ? 0.14 : 1;
    const pointerInfluence = 1 - MathUtils.smoothstep(progress, 0.42, 0.82);
    const charge = phaseProgress(progress, 0.28, 0.5);
    const transit = phaseProgress(progress, 0.5, 0.78);
    const exit = phaseProgress(progress, 0.64, 0.84);
    const aspect = size.width / Math.max(size.height, 1);
    const horizontalDeparture = MathUtils.smootherstep(
      runtime.horizontalProgress.current,
      0.015,
      0.22,
    );
    const departureDistance = aspect < 0.7 ? 4.2 : aspect < 1 ? 5.7 : 7.7;
    const frameSceneTarget = runtime.frameSequenceProgress.current >= 0 ? 1 : 0;
    frameSceneReveal.current = MathUtils.damp(
      frameSceneReveal.current,
      frameSceneTarget,
      reducedMotion ? 18 : 3.2,
      delta,
    );
    if (frameSceneTarget === 0 && frameSceneReveal.current < 0.0005) {
      frameSceneReveal.current = 0;
    }
    if (frameSceneTarget === 1 && frameSceneReveal.current > 0.9995) {
      frameSceneReveal.current = 1;
    }
    const frameSceneEase = MathUtils.smootherstep(frameSceneReveal.current, 0, 1);
    const returnTarget = runtime.vantaGreetingComplete.current ? 1 : 0;
    returnReveal.current = MathUtils.damp(
      returnReveal.current,
      returnTarget,
      reducedMotion ? 18 : 2.45,
      delta,
    );
    if (returnTarget === 0 && returnReveal.current < 0.0005) {
      returnReveal.current = 0;
    }
    if (returnTarget === 1 && returnReveal.current > 0.9995) {
      returnReveal.current = 1;
    }
    const returnEase = MathUtils.smootherstep(returnReveal.current, 0, 1);
    const velocity = reducedMotion ? 1 : 1 + charge * 1.8 + transit * 4.2;

    orbitAngle.current = (orbitAngle.current + delta * FORMATION_ORBIT_SPEED * velocity * motionScale) % (Math.PI * 2);
    orbitGroup.current.rotation.y = orbitAngle.current;

    group.current.rotation.x = MathUtils.damp(
      group.current.rotation.x,
      -pointer.y * 0.065 * pointerInfluence,
      8,
      delta,
    );
    group.current.rotation.y = MathUtils.damp(
      group.current.rotation.y,
      pointer.x * 0.095 * pointerInfluence,
      4.2,
      delta,
    );
    group.current.rotation.z = MathUtils.damp(
      group.current.rotation.z,
      pointer.x * 0.012 * pointerInfluence,
      3.4,
      delta,
    );
    group.current.position.x = MathUtils.damp(
      group.current.position.x,
      pointer.x * -0.055 * pointerInfluence -
        departureDistance * horizontalDeparture * (1 - frameSceneEase),
      4.2,
      delta,
    );
    group.current.position.y = MathUtils.damp(
      group.current.position.y,
      0.05 + pointer.y * -0.04 * pointerInfluence + transit * 0.18,
      4.2,
      delta,
    );
    group.current.position.z = MathUtils.lerp(0.24, reducedMotion ? -0.2 : -2.1, transit);
    const transitScale = MathUtils.lerp(1, reducedMotion ? 0.96 : 1.42, transit);
    const returnScale = MathUtils.lerp(0.84, 1, returnEase);
    group.current.scale.setScalar(
      transitScale * MathUtils.lerp(1, returnScale, exit),
    );
    // The original orbit fades out with the hero. It remains hidden while the
    // orb reforms and Vanta enters, then the completed greeting clip becomes
    // the single source of truth for a soft, dimensional orbital return.
    material.opacity = Math.max(1 - exit, returnEase);
  });

  useEffect(
    () => () => {
      geometries.forEach((geometry) => geometry.dispose());
      material.dispose();
    },
    [geometries, material],
  );

  return (
    <group ref={group} position={[0, 0.05, 0.24]}>
      <group rotation={[FORMATION_TILT_X, 0, FORMATION_TILT_Z]}>
        <group ref={orbitGroup}>
          {rockGroups.map((rocks, variant) => (
            <instancedMesh
              key={variant}
              ref={(mesh) => {
                meshes.current[variant] = mesh;
              }}
              args={[geometries[variant], material, rocks.length]}
              frustumCulled={false}
            />
          ))}
        </group>
      </group>
    </group>
  );
}

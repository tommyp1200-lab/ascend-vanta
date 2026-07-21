import type { MutableRefObject } from "react";

export interface HeroPointerVector {
  readonly isVector2: true;
  x: number;
  y: number;
  set(x: number, y: number): HeroPointerVector;
  lerp(target: HeroPointerVector, alpha: number): HeroPointerVector;
}

export type HeroQualityName = "high" | "standard" | "tablet" | "mobile" | "low";

export interface HeroQualityProfile {
  name: HeroQualityName;
  model: string;
  particleCount: number;
  haloCount: number;
  orbDetailCount: number;
  rockCount: number;
  backgroundParticleCount: number;
  starCounts: readonly [number, number, number];
  dpr: number;
  atmosphere: boolean;
  narrativeViewports: number;
}

export interface HeroPointerState {
  target: HeroPointerVector;
  current: HeroPointerVector;
  active: number;
}

export interface HeroRuntimeRefs {
  pointer: MutableRefObject<HeroPointerState>;
  scrollProgress: MutableRefObject<number>;
  galaxyProgress: MutableRefObject<number>;
  shapeProgress: MutableRefObject<number>;
  horizontalProgress: MutableRefObject<number>;
  frameSequenceProgress: MutableRefObject<number>;
  vantaGreetingComplete: MutableRefObject<boolean>;
  reducedMotion: MutableRefObject<boolean>;
  visible: MutableRefObject<boolean>;
}

export interface ParticleGeometryData {
  sphere: Float32Array;
  field: Float32Array;
  seed: Float32Array;
  phase: Float32Array;
  size: Float32Array;
  intensity: Float32Array;
  survivor: Float32Array;
}

export interface StarGeometryData {
  position: Float32Array;
  size: Float32Array;
  brightness: Float32Array;
  phase: Float32Array;
  speed: Float32Array;
  colorMix: Float32Array;
}

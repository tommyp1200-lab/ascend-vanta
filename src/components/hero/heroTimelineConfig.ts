export const HERO_PHASES = {
  establishedEnd: 0.08,
  activationEnd: 0.32,
  livingEnd: 0.42,
  pullbackEnd: 0.54,
  particleDissolveStart: 0.62,
  destabilizationEnd: 0.7,
  dissipationEnd: 0.9,
  handoffEnd: 1,
} as const;

export const HERO_SCROLL = {
  cameraStartZ: 6.65,
  logoStartScale: 1.85,
  reducedMotionScale: 0.52,
} as const;

export function phaseProgress(value: number, start: number, end: number): number {
  const normalized = (value - start) / Math.max(end - start, 0.0001);
  return Math.min(1, Math.max(0, normalized));
}
